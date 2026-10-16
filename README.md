# PetroEye Frontend

Next.js dashboard for the PetroEye digital twin of petrol tanker trucks: login, live map with geofences, tank volume, valve state, alerts, discharges and exportable reports. Monochrome "ink on paper" design with light and dark modes (see `docs/ui-context.md`).

This is one of two repos:

| Repo | Contents | Hosting |
| ---- | -------- | ------- |
| **frontend** (this one) | Next.js dashboard | Vercel |
| **backend** | FastAPI + MQTT ingestion, rules, simulator, system docs | Render |

The system architecture and the device/MQTT contract live in the backend repo (`docs/architecture.md`, `docs/hardware-integration-guide.md`). This repo only consumes the backend's REST + WebSocket API.

## Setup

```bash
npm install
cp .env.example .env.local   # point at your backend
npm run dev
```

Open http://localhost:3000. You need the backend running (and the simulator publishing) to see live data.

## Scripts

| Command | What it does |
| ------- | ------------ |
| `npm run dev` | Dev server on port 3000 (Turbopack). Each page compiles on its first visit, so the first click is slow; production is not |
| `npm run build` | Production build (what Vercel runs). Don't run it while `npm run dev` is running — it rewrites `.next/` |
| `npm run build:check` | Same build into `.next-build/`, safe to run next to the dev server |
| `npm run typecheck` | `tsc --noEmit` |

## Deploy (Vercel)

Import this repo in Vercel, keep the Next.js defaults, and set:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://petroeye-backend.onrender.com` |
| `NEXT_PUBLIC_WS_URL` | `wss://petroeye-backend.onrender.com/ws` |

Then add the Vercel URL (e.g. `https://petroeye.vercel.app`) to the backend's `CORS_ORIGINS` on Render.

Local dev against a backend on another port: put the two variables in `.env.development.local` (gitignored).

## Docs

- `docs/ui-context.md` — design tokens and layout.
- `docs/code-standards.md` — frontend coding rules.
- `docs/progress-tracker.md` — frontend status.
