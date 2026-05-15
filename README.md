# allabolag-mcp

Extremt lättviktig MCP-server som hämtar svensk bolagsinformation från allabolag.se. Python + [scrapling](https://github.com/D4Vinci/Scrapling), inga containrar, kör via `uvx` direkt från GitHub.

## Vad servern kan

| Tool | Vad den ger |
|---|---|
| `search_company(query)` | Sök på företagsnamn. Returnerar `companyId` som används av övriga tools. |
| `get_company_details(companyId)` | Grunddata: namn, orgnummer, adresser, bransch, NACE, ändamål, status, datum. |
| `get_company_financials(companyId)` | Senaste publicerade året: omsättning, resultat, antal anställda. |
| `get_company_officials(companyId)` | Huvudkontakt (typiskt ordförande). |
| `get_company_events(companyId)` | Livscykeldatum: grundande, registrering, statusändring. |
| `get_company_owners(companyId)` | Koncernstruktur: moderbolag och antal dotterbolag. |

### Begränsningar

Allabolag.se exponerar bara en begränsad mängd data publikt. Följande kräver betald åtkomst hos allabolag.se och returneras därför inte:

- Historiska bokslut (mer än senaste året)
- Fullständig styrelse / befattningshavare
- Detaljerad aktieägarlista per andel
- Komplett bolagshistorik

Varje tool som är begränsat returnerar ett `note`-fält som förklarar exakt vad som saknas.

### Flöde

Allabolag.se söker **inte** på organisationsnummer publikt. Flödet är därför alltid två steg:

```
search_company("Spotify AB")          →  [{companyId: "2K2GXM5I5YH40", ...}, ...]
get_company_details("2K2GXM5I5YH40")  →  { orgNumber: "556703-7485", ... }
```

## Installation

### Claude Desktop / Claude Code

Lägg till i `claude_desktop_config.json` (eller motsvarande MCP-config):

```json
{
  "mcpServers": {
    "allabolag": {
      "command": "uvx",
      "args": [
        "--from",
        "git+https://github.com/dailywins/allabolag-mcp-server",
        "allabolag-mcp"
      ]
    }
  }
}
```

Starta om Claude. Servern startar automatiskt vid första anrop, ingen prebuild behövs.

### Lokal utveckling

```bash
git clone git@github.com:dailywins/allabolag-mcp-server.git
cd allabolag-mcp-server
uv sync
uv run allabolag-mcp
```

Snabbtest utan MCP-klient:

```bash
uv run python -c "from allabolag_mcp.scrapers import search_company; print(search_company('Spotify AB'))"
```

## Exempel

```python
search_company("Spotify AB")
# → [
#     {"name": "Spotify AB", "companyId": "2K2GXM5I5YH40", "location": "Stockholm", "url": "..."},
#     ...
#   ]

get_company_details("2K2GXM5I5YH40")
# → {
#     "orgNumber": "556703-7485",
#     "name": "Spotify AB",
#     "companyType": "Aktiebolag",
#     "status": "ACTIVE",
#     "registrationDate": "2006-05-10",
#     "purpose": "Bolaget har till föremål för sin verksamhet att bedriva...",
#     "industries": ["Radio, TV-programbolag", "Medieförmedling"],
#     "naceIndustries": ["60100 Radiosändning och distribution av ljudinspelningar"],
#     "visitorAddress": "Regeringsgatan 19 5tr, 111 53, Stockholm",
#     ...
#   }
```

## Stack

- Python 3.11+
- [`mcp`](https://pypi.org/project/mcp/) — officiella MCP Python SDK (FastMCP-API, stdio-transport)
- [`scrapling[fetchers]`](https://github.com/D4Vinci/Scrapling) — TLS-fingerprint-spoofande HTTP-klient + HTML/CSS-parsning
- `uv` för dependency management

Allabolag.se kör Next.js — koden läser `__NEXT_DATA__`-blocket på företagssidan istället för att CSS-scrapa presentationslagret. Det gör servern stabil mot UI-ändringar.

## Respekt för allabolag.se

- Servern använder TLS-fingerprint-spoofing via scrapling — använd inte i tight loop
- Cacha resultat på klientsidan om du gör många anrop
- Respektera allabolag.se:s användarvillkor

## Licens

MIT
