# ASBL LandSight

Land discovery, 9-point feasibility analysis and project underwriting for ASBL.
Monorepo: Express API (Neon Postgres) + Vite React SPA, deployable on Render.

```
landsight/
├── render.yaml          Render Blueprint (both services)
├── backend/             Express + pg  →  Render Web Service
│   └── src/
│       ├── index.ts     API routes (graceful fallback to bundled data)
│       ├── engine.ts    Land outlay + portfolio affordability engine
│       ├── seed.ts      Creates tables + seeds Neon
│       ├── db.ts        pg Pool (Neon TLS)
│       └── data/        Parcel seed + ASBL finance snapshot (real, Jun 2026)
└── frontend/            Vite + React + Leaflet + Recharts  →  Render Static Site
    └── src/
        ├── pages/       login, discover, analyze, simulate
        ├── components/  parcel-map (satellite scan), app-shell, ui
        └── lib/         api client, client-side engine mirror, types
```

## API

| Method | Path                   | Purpose                                            |
|--------|------------------------|----------------------------------------------------|
| GET    | /api/health            | DB connectivity status                             |
| GET    | /api/parcels           | All parcels with computed finance verdicts         |
| GET    | /api/parcels/:id       | One parcel                                         |
| GET    | /api/finance/summary   | Portfolio cashflow, calibration, policy            |
| POST   | /api/finance/assess    | `{ outlayCr }` → affordability assessment + series |

If `DATABASE_URL` is missing or Neon is unreachable, the API serves the bundled
snapshot — the demo never dies on stage.

## 1 · Neon setup (one time)

1. Create a project at https://console.neon.tech (free tier is fine).
2. Dashboard → **Connect** → copy the **Pooled connection** string
   (`...-pooler...neon.tech/neondb?sslmode=require`).

## 2 · Local development

```bash
# Backend
cd backend
cp .env.example .env            # paste your Neon DATABASE_URL
npm install
npm run seed                    # creates tables, seeds parcels + finance snapshot
npm run dev                     # http://localhost:8080

# Frontend (second terminal)
cd frontend
cp .env.example .env            # VITE_API_URL=http://localhost:8080
npm install
npm run dev                     # http://localhost:5173
```

Demo login: `admin@asbl.in` / `asbl2026` (or "skip to app").

## 3 · Deploy on Render

### Option A — Blueprint (recommended)

```bash
git init && git add -A && git commit -m "LandSight"
git remote add origin https://github.com/<you>/landsight.git
git push -u origin main
```

1. Render Dashboard → **New +** → **Blueprint** → select the repo.
   Render reads `render.yaml` and creates both services.
2. When prompted for env vars:
   - `landsight-api` → `DATABASE_URL` = your Neon pooled string
   - `landsight-web` → `VITE_API_URL` = `https://landsight-api.onrender.com`
     (the API service URL Render shows; deploy API first if needed)
3. Seed Neon from your machine (one time):
   ```bash
   cd backend && DATABASE_URL='postgres://...' npm run seed
   ```

### Option B — Manual

- **Web Service**: repo root dir `backend`, build `npm install && npm run build`,
  start `npm start`, env `DATABASE_URL`. Health check path `/api/health`.
- **Static Site**: root dir `frontend`, build `npm install && npm run build`,
  publish dir `dist`, env `VITE_API_URL`, and add a rewrite rule
  `/* → /index.html` (SPA fallback).

## Data sources

- **Finance**: real snapshot of ASBL's finance-module projects-cashflow API
  (8 projects, 67 months, Jun 2026). The #9 verdict and the "company finance
  impact" chart are computed, not hardcoded. Construction cost (Rs 7,740/sft)
  and the 28.3% margin benchmark come from the Legacy project actuals.
- **Market** (price, comps, configs, buyers): structured like rezy.in locality
  snapshots + MagicBricks project pages; values are demo placeholders pending
  the data-prep pass. Swap values in `backend/src/data/parcels-data.ts` and
  re-run `npm run seed`.
- **Imagery**: Esri World Imagery tiles (license permits this use, unlike
  Google Maps tiles). FTL zone geometry is hand-traced for the demo.

## Notes

- Free Render web services sleep after idle; first request takes ~30s to wake.
  Hit the API URL once before the demo.
- Schema is pragmatic jsonb documents (`parcels`, `finance_snapshot`) — right
  for a hackathon; normalize later if this graduates.


