# CLAUDE.md

Guide för Claude Code när det arbetar i detta repo.

## Projektöversikt

MCP-server (Model Context Protocol) som hämtar bolagsinformation från allabolag.se. Implementerad i Python med scrapling som HTTP/parser-bibliotek. Kör via stdio som vanligt för MCP.

## Stack

- **Python 3.11+**
- **mcp** (FastMCP-API, stdio-transport)
- **scrapling[fetchers]** (TLS-fingerprint-spoofande HTTP-klient)
- **uv** för dependency management

Allabolag.se är en Next.js-sajt. Vi läser `__NEXT_DATA__` JSON-blocket på företagssidan istället för CSS-scrapa presentationslagret — mycket stabilare mot UI-ändringar.

## Utvecklingskommandon

```bash
# Installera deps
uv sync

# Kör servern lokalt (stdio)
uv run allabolag-mcp

# Smoketest
uv run python -c "from allabolag_mcp.scrapers import search_company; print(search_company('Spotify AB'))"
```

## Arkitektur

```
src/allabolag_mcp/
├── __init__.py
├── __main__.py       # Entrypoint: kör mcp.run()
├── server.py         # FastMCP tools-definitioner — tunn fasad
└── scrapers.py       # All datalogik: fetch, parse, projection
```

### Designval

1. **companyId istället för orgnummer som primärnyckel.** Allabolag.se accepterar inte orgnummer som söknyckel publikt sedan UI-omläggningen. Alla detail-tools kräver därför `companyId` (13-char alfanumerisk, t.ex. `2K2GXM5I5YH40`). Flödet är `search_company → get_company_*`.

2. **JSON-extraktion via `__NEXT_DATA__`.** Företagssidan inkluderar full SSR-payload i `<script id="__NEXT_DATA__">`. Vi parsar JSON istället för att CSS-scrapa. Stabilare och rikare data (orgnummer, ändamål, NACE-koder, koncernstruktur).

3. **`note`-fält på begränsade tools.** Officials/financials/events/owners returnerar bara publik subset. Tools markerar i `note` vad som kräver betald åtkomst — istället för att tysta returnera partiell data.

4. **`/foretag/-/-/-/{companyId}` redirect-trick.** Vi behöver inte konstruera slug (namn/stad/bransch); allabolag redirectar `-/-/-` till canonical URL.

## Lägg till nytt tool

1. Identifiera fält i `__NEXT_DATA__.props.pageProps.company` (eller subkeys som `corporateStructure`, `trademarks`)
2. Lägg till funktion i `scrapers.py` som tar `companyId` och returnerar projektion
3. Lägg till `@mcp.tool()`-dekorerad wrapper i `server.py`
4. Smoketest mot riktigt bolag

## Viktigt

- Respektera rate limits — scrapling har inbyggda fördröjningar men anropa inte servern i tight loop
- All text på allabolag.se är svenska — behåll svenska fältvärden, översätt inte
- Vid HTML-ändringar: kolla `__NEXT_DATA__`-strukturen först (den är stabilare än markup)
- Reference: `ref/scrapers.ts.ref` och `ref/utils.ts.ref` innehåller historiska CSS-selektorer från Node-versionen. `ref/legacy-tests/*` är 25 Node-testskript mot kända bolag (Spotify, Benify, Raion m.fl.) — användbart vid debugging av regression mot riktiga orgnummer.
