"""Allabolag.se data access via /what/{q} (search HTML) and /foretag/-/-/-/{companyId} (detail page).

Allabolag.se no longer accepts org numbers as search input, so the public flow is:
    1. search_company(query)              -> [{name, companyId, ...}, ...]
    2. get_company_*(companyId="...")     -> full payload from __NEXT_DATA__

The detail page embeds a Next.js __NEXT_DATA__ JSON block that mirrors the
backend response. Parsing JSON is far more stable than CSS scraping of UI markup.
"""

from __future__ import annotations

import json
import re
from typing import Any
from urllib.parse import quote

from scrapling.fetchers import Fetcher

BASE_URL = "https://www.allabolag.se"
DEFAULT_TIMEOUT = 20

COMPANY_ID_RE = re.compile(r"/([A-Z0-9]{8,})/?$")
WHITESPACE_RE = re.compile(r"\s+")


def _clean(text: str | None) -> str:
    if not text:
        return ""
    return WHITESPACE_RE.sub(" ", text).strip()


def _normalize_org(value: str | None) -> str:
    return re.sub(r"\D", "", value or "")


def _format_org(value: str | None) -> str | None:
    n = _normalize_org(value)
    if len(n) != 10:
        return n or None
    return f"{n[:6]}-{n[6:]}"


def _fetch(url: str):
    return Fetcher.get(url, stealthy_headers=True, timeout=DEFAULT_TIMEOUT, follow_redirects=True)


def _build_company_url(company_id: str) -> str:
    """Allabolag redirects /foretag/-/-/-/{companyId} to the canonical slug URL."""
    return f"{BASE_URL}/foretag/-/-/-/{company_id}"


def _extract_company_id_from_href(href: str | None) -> str | None:
    if not href:
        return None
    match = COMPANY_ID_RE.search(href)
    return match.group(1) if match else None


def _fetch_company_payload(company_id: str) -> dict[str, Any]:
    if not company_id:
        raise ValueError("companyId saknas")
    response = _fetch(_build_company_url(company_id))
    if response.status != 200:
        raise RuntimeError(f"Allabolag svarade {response.status} för companyId {company_id}")
    script = response.css("script#__NEXT_DATA__::text").get()
    if not script:
        raise RuntimeError(f"__NEXT_DATA__ saknas på sidan för {company_id}")
    data = json.loads(script)
    return data.get("props", {}).get("pageProps", {})


def _flatten_address(addr: dict[str, Any] | None) -> str | None:
    if not addr:
        return None
    parts = [addr.get("addressLine") or addr.get("boxAddressLine"), addr.get("zipCode"), addr.get("postPlace")]
    cleaned = [p.strip() for p in parts if p and p.strip()]
    return ", ".join(cleaned) if cleaned else None


# ---------- public API ----------

def search_company(query: str) -> list[dict[str, Any]]:
    """Free-text company search via /what/{q}.

    NOTE: allabolag.se does not search by organisation number publicly — use a
    company name or trading style. The returned ``companyId`` is the handle used
    by every other tool in this server.
    """
    page = _fetch(f"{BASE_URL}/what/{quote(query)}")
    results: list[dict[str, Any]] = []

    cards = page.css(".SimpleSearchResultCard-card")
    if not cards:
        cards = page.css(".search-hit, .company-row, article, .company-card")

    for card in cards:
        name = _clean(card.css("h2 a::text").get() or card.css("h3 a::text").get())
        href = card.css("h2 a::attr(href)").get() or card.css("h3 a::attr(href)").get()
        company_id = _extract_company_id_from_href(href)
        if not name or not company_id:
            continue

        header_text = _clean(card.css("h2::text").get() or "")
        location = _clean(header_text.replace(name, "")).lstrip(",").strip()

        results.append({
            "name": name,
            "companyId": company_id,
            "location": location or None,
            "url": _build_company_url(company_id),
        })

    return results


def get_company_details(companyId: str) -> dict[str, Any]:
    """Full company profile: legal info, addresses, industries, purpose, status, dates."""
    payload = _fetch_company_payload(companyId)
    company = payload.get("company", {}) or {}

    visitor = company.get("visitorAddress") or {}
    postal = company.get("postalAddress") or {}
    legal_visitor = company.get("legalVisitorAddress") or {}
    location = company.get("location") or {}
    status = company.get("status") or {}
    company_type = company.get("companyType") or {}
    domicile = company.get("domicile") or {}

    return {
        "companyId": company.get("companyId") or companyId,
        "orgNumber": _format_org(company.get("orgnr")),
        "name": company.get("name"),
        "legalName": company.get("legalName"),
        "companyType": company_type.get("name"),
        "status": status.get("status"),
        "registrationDate": company.get("registrationDate"),
        "foundationDate": company.get("foundationDate"),
        "purpose": company.get("purpose"),
        "industries": [i.get("name") for i in (company.get("industries") or []) if i.get("name")],
        "naceIndustries": company.get("naceIndustries") or [],
        "visitorAddress": _flatten_address(visitor),
        "postalAddress": _flatten_address(postal),
        "legalAddress": _flatten_address(legal_visitor),
        "city": visitor.get("postPlace") or location.get("municipality"),
        "municipality": location.get("municipality") or domicile.get("municipality"),
        "county": location.get("county") or domicile.get("county"),
        "phone": company.get("phone") or company.get("legalPhone"),
        "email": company.get("email"),
        "homepage": company.get("homePage"),
        "url": _build_company_url(company.get("companyId") or companyId),
    }


def get_company_financials(companyId: str) -> dict[str, Any]:
    """Latest published key figures: revenue, profit, employees.

    Multi-year history is paywalled by allabolag.se and not exposed publicly.
    """
    payload = _fetch_company_payload(companyId)
    company = payload.get("company", {}) or {}

    last_year = company.get("companyAccountsLastUpdatedDate")
    year_data: dict[str, Any] = {"year": last_year} if last_year else {}
    if company.get("revenue") is not None:
        year_data["revenue"] = company.get("revenue")
    if company.get("profit") is not None:
        year_data["profit"] = company.get("profit")
    if company.get("employees") is not None:
        year_data["employees"] = company.get("employees")
    if company.get("currency"):
        year_data["currency"] = company.get("currency")

    return {
        "companyId": company.get("companyId") or companyId,
        "orgNumber": _format_org(company.get("orgnr")),
        "years": [year_data] if year_data else [],
        "note": "Endast senaste publicerade året exponeras publikt av allabolag.se. Historik kräver betald åtkomst.",
    }


def get_company_officials(companyId: str) -> dict[str, Any]:
    """Visible board members.

    Only the primary contact (typically the chairperson) is exposed publicly.
    Full board listings require a paid allabolag.se account.
    """
    payload = _fetch_company_payload(companyId)
    company = payload.get("company", {}) or {}

    officials: list[dict[str, Any]] = []
    contact = company.get("contactPerson")
    if contact and contact.get("name"):
        officials.append({
            "name": contact.get("name"),
            "role": contact.get("role"),
            "birthDate": contact.get("birthDate"),
            "id": contact.get("id"),
        })

    return {
        "companyId": company.get("companyId") or companyId,
        "orgNumber": _format_org(company.get("orgnr")),
        "officials": officials,
        "note": "Endast huvudkontakt exponeras publikt. Fullständig styrelse kräver betald åtkomst.",
    }


def get_company_events(companyId: str) -> dict[str, Any]:
    """Lifecycle dates available in the public payload."""
    payload = _fetch_company_payload(companyId)
    company = payload.get("company", {}) or {}

    events: list[dict[str, str]] = []
    if company.get("foundationDate"):
        events.append({"date": company["foundationDate"], "title": "Bolaget grundades"})
    if company.get("registrationDate"):
        events.append({"date": company["registrationDate"], "title": "Registrerat hos Bolagsverket"})
    status = company.get("status") or {}
    if status.get("statusDate"):
        events.append({"date": status["statusDate"], "title": f"Status: {status.get('status')}"})

    return {
        "companyId": company.get("companyId") or companyId,
        "orgNumber": _format_org(company.get("orgnr")),
        "hasMoreEvents": bool(payload.get("hasCompanyEvents")),
        "events": events,
        "note": "Endast publika livscykeldatum visas. Detaljerad bolagshistorik kräver betald åtkomst.",
    }


def get_company_owners(companyId: str) -> dict[str, Any]:
    """Corporate structure: parent and subsidiary aggregates."""
    payload = _fetch_company_payload(companyId)
    company = payload.get("company", {}) or {}
    structure = company.get("corporateStructure") or {}

    parent_name = structure.get("parentCompanyName")
    parent = None
    if parent_name:
        parent = {
            "name": parent_name,
            "orgNumber": _format_org(structure.get("parentCompanyOrganisationNumber")),
            "countryCode": structure.get("parentCompanyCountryCode"),
        }

    return {
        "companyId": company.get("companyId") or companyId,
        "orgNumber": _format_org(company.get("orgnr")),
        "parent": parent,
        "numberOfSubsidiaries": structure.get("numberOfSubsidiaries"),
        "numberOfCompaniesInGroup": structure.get("numberOfCompanies"),
        "note": "Detaljerad ägarlista (aktieägare per andel) kräver betald åtkomst.",
    }
