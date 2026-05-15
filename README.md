# allabolag-mcp

Extremt lättviktig MCP-server som hämtar svensk bolagsinformation från allabolag.se. Python + [scrapling](https://github.com/D4Vinci/Scrapling), inga containrar, kör via `uvx` direkt från GitHub.

## Vad servern kan

| Tool | Vad den ger |
|---|---|
| `search_company(query)` | Sök på företagsnamn. Returnerar `companyId` som används av övriga tools. |
| `get_company_details(companyId)` | Grunddata: namn, orgnummer, adresser, bransch, NACE, ändamål, status, datum. |
| `get_company_financials(companyId)` | **5 års bokslut**: RESULTATRÄKNING, BALANSRÄKNING, LÖNER & UTDELNING + perioder. |
| `get_company_key_figures(companyId)` | **5 års nyckeltal**: vinstmarginal, soliditet, kassalikviditet, skuldsättningsgrad, avkastning EK/TK, EBITDA m.fl. |
| `get_company_officials(companyId)` | **Full styrelse + revisorer**: ordförande, ledamöter, suppleanter, huvudansvarig revisor, revisionsfirma, externa firmatecknare. |
| `get_company_events(companyId)` | Livscykeldatum: grundande, registrering, statusändring. |
| `get_company_owners(companyId)` | Koncernstruktur: moderbolag och antal dotterbolag. |

### Begränsningar

Allabolag.se exponerar mycket publik data men följande kräver betald åtkomst (varje begränsat tool dokumenterar det i `note`-fält):

- Detaljerad aktieägarlista per andel
- Komplett bolagshistorik (utöver registrerings-/grundningsdatum)
- Bokslut äldre än 5 år

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
        "git+https://github.com/Daily-Wins/allabolag-mcp-server",
        "allabolag-mcp"
      ]
    }
  }
}
```

Starta om Claude. Servern startar automatiskt vid första anrop, ingen prebuild behövs.

### Lokal utveckling

```bash
git clone git@github.com:Daily-Wins/allabolag-mcp-server.git
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
# → [{"name": "Spotify AB", "companyId": "2K2GXM5I5YH40", "location": "Stockholm", ...}, ...]

get_company_financials("2K2GXM5I5YH40")
# → {
#     "years": ["2024-12", "2023-12", "2022-12", "2021-12", "2020-12"],
#     "periods": [{"year": "2024-12", "startDate": "2024-01-01", "endDate": "2024-12-31"}, ...],
#     "incomeStatement": {
#       "Nettoomsättning": ["108 117 947", "88 766 846", "77 992 123", "60 983 463", "49 468 447"],
#       "Årets resultat": ["10 046 736", "−1 894 831", "−4 757 506", "4 055 213", "−4 049 392"],
#       ...
#     },
#     "balanceSheet": { "Summa tillgångar": [...], ... },
#     "salariesAndDividends": { "Löner styrelse och VD": [...], ... }
#   }

get_company_key_figures("2K2GXM5I5YH40")
# → {
#     "years": ["2024-12", ..., "2020-12"],
#     "keyFigures": {
#       "Vinstmarginal i %": ["9", "−1,7", "−4,8", "7,1", "−5,3"],
#       "Soliditet i %": ["55,6", "43,5", "44", "49", "44,4"],
#       ...
#     }
#   }

get_company_officials("2K2GXM5I5YH40")
# → {
#     "officials": [
#       {"role": "Ordförande", "name": "Carl Peter Christian Luiga", "birthYear": "1968"},
#       {"role": "Ledamot", "name": "Marcus Anders Glimberg", "birthYear": "1984"},
#       {"role": "Huvudansvarig revisor", "name": "Jakob Tomas Christoffer Grunditz", "birthYear": "1987"},
#       {"role": "Revisor", "name": "Ernst & Young Aktiebolag"},
#       ...
#     ]
#   }
```

Värden i bokslut/nyckeltal levereras som **svensk-formaterade strängar** (mellanslag som tusentalsavgränsare, komma som decimaltecken, U+2212 som minustecken) så att klienter kan rendera eller parsa som de behöver.

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
