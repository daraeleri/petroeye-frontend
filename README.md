# PetroTwin Frontend

Next.js dashboard for the PetroTwin digital twin of a petrol tanker truck: live map, tank volume, valve state, and alerts.

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
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Production build (must pass before any change is done) |
| `npm run typecheck` | `tsc --noEmit` |

## Deploy (Vercel)

Import this repo in Vercel, keep the Next.js defaults, and set `NEXT_PUBLIC_API_URL` (https) and `NEXT_PUBLIC_WS_URL` (wss) to the Render backend. Add the Vercel URL to the backend's `CORS_ORIGINS`.

## Docs

- `docs/ui-context.md` — design tokens and layout.
- `docs/code-standards.md` — frontend coding rules.
- `docs/progress-tracker.md` — frontend status.
