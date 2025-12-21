# AI-Powered Mobile Stock Screener (Sprint 2)

## Sprint 2 Overview
- Added NL → DSL → SQL end-to-end screener with validation, compilation, and execution against PostgreSQL.
- Introduced LLM-driven parser (with safe fallback) plus JSON Schema validation (Ajv) and SQL compiler/runner with caching.
- Seeded demo screener data to work out-of-the-box and created a demo script.
- Updated frontend screener page to call the new pipeline and show DSL/SQL debug info.

## Architecture
- **LLM Parser** (`backend/services/llmParser.js`): Converts natural language to a constrained JSON DSL. Uses OpenAI (if key provided) in strict JSON mode; falls back to deterministic parser otherwise.
- **DSL Validation** (`backend/services/dslValidator.js`): Ajv schema + field-type guards. Whitelisted fields/operators only.
- **Compiler** (`backend/services/screenerCompiler.js`): Translates validated DSL to parameterized SQL (no string interpolation) targeting `screener_metrics`.
- **Runner + Cache** (`backend/services/screenerRunner.js`): Executes compiled SQL via `pg`, with NodeCache for 5-minute TTL.
- **Storage Bootstrap** (`backend/services/screenerStorage.js`): Ensures `screener_metrics` table exists and seeds starter rows.
- **API Route** (`backend/routes/parse.js`): `/api/parse` runs NL → DSL → SQL → DB; `/api/parse/dsl` returns validated DSL only.
- **Frontend** (`frontend/screener.html`): Text box → backend parse API → renders table + DSL/SQL debug.
- **Demo Script** (`backend/demo/screener-demo.js`): Runs sample queries end-to-end from the CLI.

## Project Structure (key parts)
```
ai-mobile-stock-screener-week1
├── backend
│   ├── index.js
│   ├── db.js
│   ├── services/
│   │   ├── llmParser.js
│   │   ├── dslValidator.js
│   │   ├── screenerCompiler.js
│   │   ├── screenerRunner.js
│   │   └── screenerStorage.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── parse.js
│   │   └── stocks.js
│   └── demo/screener-demo.js
├── db/schema.sql
├── frontend
│   ├── screener.html
│   ├── login.html / register.html / dashboard.html
│   └── styles.css
└── scripts
  ├── ingest_yfinance.py (Binance market data)
  └── explore_and_clean_dataset.py
```

## Prerequisites
- Node.js 18+
- PostgreSQL (or TimescaleDB)
- (Optional) Docker + docker-compose
- (Optional) OpenAI key for higher-quality parsing; otherwise fallback parser is used

## Setup & Run
1) Backend deps
```
cd backend
npm install
```

2) Environment
- Copy `.env.example` to `.env`
- Set `DATABASE_URL` (local example): `postgres://Shivansh:pass@localhost:5432/stocks`
- Set `JWT_SECRET` to any strong string
- (Optional) `OPENAI_API_KEY` and `OPENAI_MODEL` (default: gpt-4o-mini)
- (Optional) `BINANCE_SYMBOLS` for ingestion, e.g., `BTCUSDT,ETHUSDT,BNBUSDT`

3) Database
```
psql "<DATABASE_URL>" -f ../db/schema.sql
```
The backend also bootstraps/seed `screener_metrics` on start. For Docker, the default compose user is `Shivansh`.

4) Run backend
```
npm run dev
```
Server: http://localhost:3000

5) Frontend screener
- Open http://localhost:3000/screener.html
- Enter a natural-language query (e.g., “Show me all stocks with PE < 5”).

6) Demo script (CLI)
```
npm run demo:screener
```
Runs NL → DSL → SQL → DB for sample queries.

## Example Queries
- "Show me all stocks with PE < 5"
- "banks with promoter holding above 50 and earnings positive"
- "IT stocks with pe_ratio <= 30 and market cap > 200000"

Sample DSL shape
```
{
  "version": "1.0",
  "query": "Show me all stocks with PE < 5",
  "logic": "AND",
  "limit": 50,
  "conditions": [
    { "field": "pe_ratio", "operator": "<", "value": 5 }
  ]
}
```

## Limitations & Assumptions
- Seed data is minimal and for demo; replace with real ingestion for production.
- LLM parsing quality improves with `OPENAI_API_KEY`; fallback parser is rule-based.
- Simple in-memory cache; swap to Redis for multi-instance deployments.
- Auth is not enforced on `/api/parse` currently; adjust as needed.

## Notes
- Schema includes `screener_metrics` and fundamentals columns.
- Ingestion script fetches Binance klines (daily) into `price_snapshots`; adjust credentials/hosts in env vars and set `BINANCE_SYMBOLS` to control coverage.

## License
MIT