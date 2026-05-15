"""Allabolag.se data access.

Three layers of data are exposed by the public site:

1. **Overview page** ``/foretag/-/-/-/{companyId}`` — embeds full SSR-payload
   in a ``__NEXT_DATA__`` JSON block. Used for: legal info, addresses,
   purpose, NACE, contact person, corporate-structure aggregates.

2. **Subroute pages** ``/bokslut|/nyckeltal|/befattningshavare/-/-/-/{companyId}``
   — render HTML tables with **5 years of public data**:
   * /bokslut → RESULTATRÄKNING + BALANSRÄKNING + LÖNER & UTDELNING
   * /nyckeltal → 9 ratios (vinstmarginal, soliditet, etc.)
   * /befattningshavare → full board + auditors

3. **Search** ``/what/{query}`` (HTML) — returns ``.SimpleSearchResultCard``
   elements with ``companyId`` embedded in the href. Allabolag does not
   search on org numbers publicly — use company names.
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
YEAR_RE = re.compile(r"^\d{4}-\d{2}$")
YEAR_LOOSE_RE = re.compile(r"^\d{4}")


# ---------- helpers ----------

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


def _build_company_url(company_id: str, route: str = "foretag") -> str:
    """Allabolag redirects /{route}/-/-/-/{companyId} to the canonical slug URL."""
    return f"{BASE_URL}/{route}/-/-/-/{company_id}"


def _extract_company_id_from_href(href: str | None) -> str | None:
    if not href:
        return None
    match = COMPANY_ID_RE.search(href)
    return match.group(1) if match else None


def _cell_text(cell) -> str:
    """Robust cell-text extraction. Falls back across scrapling APIs."""
    if hasattr(cell, "get_all_text"):
        return _clean(cell.get_all_text())
    return _clean(cell.text if hasattr(cell, "text") else "")


def _table_rows(table) -> list[list[str]]:
    """Return rows as lists of non-empty cell strings, filtering Highcharts noise."""
    rows: list[list[str]] = []
    for tr in table.css("tr"):
        cells: list[str] = []
        for cell in tr.css("th, td"):
            text = _cell_text(cell)
            if text and "Highcharts" not in text and "Namn" != text:
                cells.append(text)
        if cells:
            rows.append(cells)
    return rows


def _extract_years(table) -> list[str]:
    """Extract YYYY-MM headers from a table's header row."""
    header_rows = table.css("tr")
    if not header_rows:
        return []
    cells = [_cell_text(c) for c in header_rows[0].css("th, td")]
    return [c for c in cells if YEAR_RE.match(c)]


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


def _find_tables_by_label(page, label_keyword: str):
    """Return tables whose first row contains label_keyword (case-insensitive)."""
    matches = []
    for table in page.css("table"):
        rows = table.css("tr")
        if not rows:
            continue
        header_text = " ".join(_cell_text(c) for c in rows[0].css("th, td")).lower()
        if label_keyword.lower() in header_text:
            matches.append(table)
    return matches


def _parse_year_section(page, label_keyword: str) -> tuple[list[str], dict[str, list[str]]]:
    """Parse one bokslut/nyckeltal section into (years, {fieldName: [valuesByYear]})."""
    tables = _find_tables_by_label(page, label_keyword)
    if not tables:
        return [], {}
    table = tables[0]
    years = _extract_years(table)
    fields: dict[str, list[str]] = {}
    for row in _table_rows(table):
        # First row is header (contains years); skip if matches.
        if any(YEAR_RE.match(c) for c in row):
            continue
        if len(row) < 2:
            continue
        label = row[0]
        values = row[1 : 1 + len(years)] if years else row[1:]
        fields[label] = values
    return years, fields


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

        header_text = _cell_text(card.css("h2")[0]) if card.css("h2") else ""
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
    """Five years of bookkeeping data scraped from /bokslut/-/-/-/{companyId}.

    Returns three sections — RESULTATRÄKNING (income statement),
    BALANSRÄKNING (balance sheet), LÖNER & UTDELNING (salaries & dividends) —
    plus reporting periods. Values are Swedish-formatted strings (e.g.
    "108 117 947", "−1 234") — preserve formatting so MCP clients can render
    or parse as needed.
    """
    response = _fetch(_build_company_url(companyId, "bokslut"))
    if response.status != 200:
        raise RuntimeError(f"Bokslut-sidan svarade {response.status} för {companyId}")

    # Period dates
    periods: list[dict[str, str]] = []
    period_tables = _find_tables_by_label(response, "BOKSLUTSPERIOD")
    period_years: list[str] = []
    if period_tables:
        period_years = _extract_years(period_tables[0])
        start_map: dict[str, str] = {}
        end_map: dict[str, str] = {}
        for row in _table_rows(period_tables[0]):
            if any(YEAR_RE.match(c) for c in row):
                continue
            if len(row) < 1 + len(period_years):
                continue
            label = row[0].lower()
            values = row[1 : 1 + len(period_years)]
            if "start" in label:
                for y, v in zip(period_years, values):
                    start_map[y] = v
            elif "slut" in label:
                for y, v in zip(period_years, values):
                    end_map[y] = v
        for y in period_years:
            periods.append({"year": y, "startDate": start_map.get(y, ""), "endDate": end_map.get(y, "")})

    income_years, income = _parse_year_section(response, "RESULTATRÄKNING")
    balance_years, balance = _parse_year_section(response, "BALANSRÄKNING")
    salaries_years, salaries = _parse_year_section(response, "LÖNER & UTDELNING")

    years = period_years or income_years or balance_years or salaries_years
    return {
        "companyId": companyId,
        "years": years,
        "periods": periods,
        "incomeStatement": income,
        "balanceSheet": balance,
        "salariesAndDividends": salaries,
        "source": _build_company_url(companyId, "bokslut"),
    }


def get_company_key_figures(companyId: str) -> dict[str, Any]:
    """Five years of key financial ratios from /nyckeltal/-/-/-/{companyId}.

    Vinstmarginal, kassalikviditet, soliditet, skuldsättningsgrad, avkastning
    på eget och totalt kapital, etc. Years are inferred from the matching
    bokslut page so we can attach period labels.
    """
    response = _fetch(_build_company_url(companyId, "nyckeltal"))
    if response.status != 200:
        raise RuntimeError(f"Nyckeltal-sidan svarade {response.status} för {companyId}")

    tables = list(response.css("table"))
    if not tables:
        return {"companyId": companyId, "years": [], "keyFigures": {}, "source": _build_company_url(companyId, "nyckeltal")}

    # Nyckeltal table has no explicit year header — borrow from bokslut for clarity.
    bokslut_response = _fetch(_build_company_url(companyId, "bokslut"))
    years: list[str] = []
    if bokslut_response.status == 200:
        period_tables = _find_tables_by_label(bokslut_response, "BOKSLUTSPERIOD")
        if period_tables:
            years = _extract_years(period_tables[0])

    figures: dict[str, list[str]] = {}
    for table in tables:
        for row in _table_rows(table):
            if any(YEAR_RE.match(c) for c in row):
                continue
            if len(row) < 2:
                continue
            label = row[0]
            values = row[1 : 1 + (len(years) or 5)]
            figures[label] = values

    return {
        "companyId": companyId,
        "years": years,
        "keyFigures": figures,
        "source": _build_company_url(companyId, "nyckeltal"),
    }


def get_company_officials(companyId: str) -> dict[str, Any]:
    """Board members + auditors from /befattningshavare/-/-/-/{companyId}.

    Parses both the board table (Ordförande, Ledamot, etc.) and the auditor
    table (Huvudansvarig revisor, Revisor). De-duplicates desktop+mobile rows.
    Names sometimes include birth year: "Carl Peter Christian Luiga (f 1968)".
    """
    response = _fetch(_build_company_url(companyId, "befattningshavare"))
    if response.status != 200:
        raise RuntimeError(f"Befattningshavare-sidan svarade {response.status} för {companyId}")

    seen: set[tuple[str, str]] = set()
    officials: list[dict[str, str]] = []

    for table in response.css("table"):
        for row in _table_rows(table):
            if len(row) < 2:
                continue
            role, raw_name = row[0], row[1]
            if role.lower() == "befattning":
                continue
            name, birth_year = _split_name_birthyear(raw_name)
            key = (role, name)
            if not name or key in seen:
                continue
            seen.add(key)
            entry: dict[str, str] = {"role": role, "name": name}
            if birth_year:
                entry["birthYear"] = birth_year
            officials.append(entry)

    return {
        "companyId": companyId,
        "officials": officials,
        "source": _build_company_url(companyId, "befattningshavare"),
    }


def _split_name_birthyear(raw: str) -> tuple[str, str]:
    match = re.search(r"\(f\s*(\d{4})\)", raw)
    if not match:
        return _clean(raw), ""
    birth = match.group(1)
    name = _clean(raw[: match.start()])
    return name, birth


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
