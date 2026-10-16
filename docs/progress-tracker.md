# Progress Tracker (Frontend)

Update this file after every meaningful frontend change. System-wide status and the remake plan live in the backend repo's `docs/progress-tracker.md`.

## Current State (2026-10-16)

- Split out of the original monorepo into its own repo (hosting target: Vercel).
- The UI still reads the **v1** telemetry shape (fuel %, temperature, pressure, tilt, flow, hatch), which doesn't match the real truck. It will move to v2 (GPS, tank volume, valve state) once the backend API serves it.

## Known Issues

- Two parallel UI trees: `app/page.tsx` uses `components/dashboard/`; most of `components/hud/` is unused.
- The Analytics, Energy and Alerts tabs all render the Overview page. The Energy/Analytics views (battery clusters, electricity pricing) are mock data that doesn't apply to this truck.
- `public/assets/3DModels/fuel_tanker_3d_model.glb` is 48 MB — compress it (e.g. gltf-transform + Draco) before production.

## Next Up

- Wait for backend v2 API, then: one UI tree, tank volume + valve + GPS twin, drop the unrelated mock views.
