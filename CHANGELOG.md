# Changelog

All notable changes to allabolag-mcp will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] — 2026-05-15

### Added
- `get_company_key_figures(companyId)` — 5 års nyckeltal (vinstmarginal, soliditet, kassalikviditet, skuldsättningsgrad, avkastning EK/TK, anställda, personalkostnader per anställd, EBITDA).

### Changed
- `get_company_financials` returnerar nu **5 års bokslut** (RESULTATRÄKNING, BALANSRÄKNING, LÖNER & UTDELNING) plus bokslutsperioder — istället för bara senaste årets sammandrag.
- `get_company_officials` returnerar nu **full styrelse + revisorer + externa firmatecknare** med födelseår — istället för bara huvudkontakten.

### Discovered
Browser-utforskning via Claude in Chrome avslöjade tre publika subroute-sidor som tidigare antagits paywallade:
- `/bokslut/-/-/-/{companyId}` — 5 års resultaträkning + balansräkning
- `/nyckeltal/-/-/-/{companyId}` — 5 års nyckeltal
- `/befattningshavare/-/-/-/{companyId}` — full styrelse + revisorer

`-/-/-`-tricket triggar redirect till canonical slug-URL utan att kräva namn/stad/bransch i path.

## [0.2.0] — 2026-05-15

### Changed
Komplett rewrite från Node/TypeScript till Python + scrapling:

- **Stack**: Node + Cheerio + Docker + Cloud Run → Python 3.11+ + scrapling + uv + stdio
- **Datakälla**: CSS-scraping av presentationslagret → JSON-extraktion från `__NEXT_DATA__` SSR-payload
- **Primärnyckel**: orgnummer → `companyId` (allabolag.se accepterar inte orgnummer som söknyckel publikt sedan UI-omläggningen)
- **Flöde**: `search_company → get_company_*` (två steg)
- **Begränsade tools** (officials, events, owners) returnerar publik subset + `note`-fält som dokumenterar paywall-data

### Removed
- Docker, Cloud Run-deploy, Express-proxy, Azurite blob-cache, mcpb-bundling, alla shell-skript
- Hela `src/`-trädet från Node-versionen (TS-källkoden bevaras som `ref/scrapers.ts.ref` och `ref/utils.ts.ref` för referens)
- Cirka 30 ad-hoc `test-*.js`-skript flyttade till `ref/legacy-tests/`

### Published
- GitHub: https://github.com/Daily-Wins/allabolag-mcp-server (public)
- Installation: `uvx --from git+https://github.com/Daily-Wins/allabolag-mcp-server allabolag-mcp`

## [1.0.0] — 2024-10-01 *(pre-rewrite, Node/TypeScript)*

Initial Node/TypeScript-implementation. Bevarat som referens i `ref/`:
- `ref/scrapers.ts.ref` — CSS-selektorer för historisk allabolag.se-struktur
- `ref/utils.ts.ref` — HTTP-klient, normalisering, fallback-logik
- `ref/legacy-tests/*.js` — 25 testskript mot kända bolag (Spotify, Benify, Raion, Lovable m.fl.)

Code path är inte längre funktionell — sajten har bytt URL-struktur. Använd 0.2.0+.
