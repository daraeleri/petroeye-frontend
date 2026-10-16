# Progress Tracker (Frontend)

Update this file after every meaningful frontend change. System-wide status and the remake plan live in the backend repo's `docs/progress-tracker.md`.

## Current State (2026-10-16)

- **Rebuilt on the backend v2 API** with a new "ink on paper" design (light + dark), see `docs/ui-context.md`.
- `npm run build` passes (11 routes). Verified in the browser against a local backend + the 4-truck simulator: login, live WebSocket updates and toasts, overview KPIs/charts, live map with tracks, geofence create → deactivate, truck page (tank gauge, volume chart, route), alerts sheet, dark mode, phone layout.

## Pages

| Route | What |
| ----- | ---- |
| `/login` | Email + password; ink brand panel |
| `/` | Overview: KPI cards, live fleet map + fleet list, discharge pixel chart, alerts by type, recent alerts, activity |
| `/map` | Full-bleed live map; trucks/geofences panel; truck card with 2 h track; draw/edit/deactivate geofences (operator/admin) |
| `/trucks`, `/trucks/[id]` | Fleet table with filters; truck twin: tank gauge, valve, GPS/device, volume chart, route, discharges, alerts; admin edit + tank calibration |
| `/alerts` | Filters, critical banner, detail sheet with map pin, explanation, digest and acknowledge |
| `/discharges` | Sessions with authorized/unauthorized, litres, duration |
| `/reports` | Date range + truck, summary, activity timeline, CSV/JSON exports |
| `/users` | Admin: add users, change role, deactivate, reset password |

## 2026-10-16 — 3D twin + dev speed

- **3D twin** panel on the truck page (`components/truck/twin-3d.tsx`), code-split so other pages don't load three.js; the truck page's first-load JS stayed ~269 kB.
- **Why tab switching felt slow:** in dev, Next compiles each page on first visit (5–48 s on this machine with webpack). Production pre-builds and prefetches: measured 1–210 ms per tab switch including data (9 sidebar clicks, local backend).
- `npm run dev` now uses **Turbopack** (faster dev compiles). Restart the dev server to pick it up.
- `next.config.ts` reads `NEXT_DIST_DIR`; `npm run build:check` builds into `.next-build/` so it can't overwrite the `.next/` a running dev server uses (that is what stripped the CSS earlier). Vercel uses the normal `npm run build`.

## Architecture

- `lib/api.ts` typed REST client (bearer token from localStorage; 401 → logout), `lib/queries.ts` TanStack Query hooks, `lib/live.tsx` WebSocket → query cache + toasts, `lib/auth.tsx` session.
- App Router: `app/(app)/layout.tsx` guards auth and wraps the shell; each page is its own route.
- Env: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL` (see `.env.example`). Local dev against a non-default backend: `.env.development.local` (gitignored).

## Known Issues / Next Up

- Deploy to Vercel and add the Vercel URL to the backend's `CORS_ORIGINS` on Render.
- Map tiles come from Esri's gray canvas services; review their terms before a commercial launch.
- No pagination beyond 500–1000 rows per list yet.
