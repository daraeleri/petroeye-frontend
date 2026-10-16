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

## Architecture

- `lib/api.ts` typed REST client (bearer token from localStorage; 401 → logout), `lib/queries.ts` TanStack Query hooks, `lib/live.tsx` WebSocket → query cache + toasts, `lib/auth.tsx` session.
- App Router: `app/(app)/layout.tsx` guards auth and wraps the shell; each page is its own route.
- Env: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL` (see `.env.example`). Local dev against a non-default backend: `.env.development.local` (gitignored).

## Known Issues / Next Up

- Deploy to Vercel and add the Vercel URL to the backend's `CORS_ORIGINS` on Render.
- The 3D tanker model (`public/assets/3DModels/fuel_tanker_3d_model.glb`) and `three`/`@react-three/*` are currently unused — decide whether to add a 3D twin card to the truck page or drop them.
- Map tiles come from Esri's gray canvas services; review their terms before a commercial launch.
- No pagination beyond 500–1000 rows per list yet.
