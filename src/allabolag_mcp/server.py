"""MCP-server för allabolag.se. Lättviktig FastMCP-implementation med stdio-transport."""

from __future__ import annotations

from mcp.server.fastmcp import FastMCP

from . import scrapers

mcp = FastMCP("allabolag-mcp")


@mcp.tool()
def search_company(query: str) -> list[dict]:
    """Sök efter bolag på allabolag.se med företagsnamn eller liknande fritext.

    Returnerar lista med companyId — handle som används av övriga tools.
    OBS: allabolag.se söker inte på organisationsnummer publikt; använd företagsnamn.
    """
    return scrapers.search_company(query)


@mcp.tool()
def get_company_details(companyId: str) -> dict:
    """Hämta detaljerad information om ett bolag (grunddata, adresser, bransch, status, ändamål).

    companyId fås från search_company. Exempel: '2K2GXM5I5YH40'.
    """
    return scrapers.get_company_details(companyId)


@mcp.tool()
def get_company_financials(companyId: str) -> dict:
    """Hämta fem års bokslutsdata: RESULTATRÄKNING, BALANSRÄKNING, LÖNER & UTDELNING.

    Värden returneras som svensk-formaterade strängar (t.ex. "108 117 947", "−4,8").
    Inkluderar bokslutsperioder (start/slut-datum) per år.
    """
    return scrapers.get_company_financials(companyId)


@mcp.tool()
def get_company_key_figures(companyId: str) -> dict:
    """Hämta fem års nyckeltal: vinstmarginal, soliditet, kassalikviditet, skuldsättningsgrad,
    avkastning på eget och totalt kapital, m.fl.

    Värden är svensk-formaterade procenttal/kvoter som strängar.
    """
    return scrapers.get_company_key_figures(companyId)


@mcp.tool()
def get_company_officials(companyId: str) -> dict:
    """Hämta styrelse och revisorer (ordförande, ledamöter, suppleanter, revisor).

    Inkluderar födelseår där tillgängligt. De-duplicerar desktop/mobile-rader.
    """
    return scrapers.get_company_officials(companyId)


@mcp.tool()
def get_company_events(companyId: str) -> dict:
    """Hämta livscykeldatum: grundande, registrering, statusändring.

    Fullständig bolagshistorik kräver betald åtkomst.
    """
    return scrapers.get_company_events(companyId)


@mcp.tool()
def get_company_owners(companyId: str) -> dict:
    """Hämta koncernstruktur: moderbolag (om finns) och antal dotterbolag.

    Detaljerad aktieägarlista per andel kräver betald åtkomst.
    """
    return scrapers.get_company_owners(companyId)
