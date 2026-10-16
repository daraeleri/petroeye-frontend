# Code Standards (Frontend)

Backend, MQTT, AI and Web3 standards live in the backend repo's `docs/code-standards.md`.

## General

- Rely on visual, glanceable dashboard state over deep menu trees (status color, gauge position, icon) — this is an ops console, not a form-heavy admin panel.
- The dashboard is read-only towards the truck. It shows the reported valve state; it never offers a control to open or close the valve.
- The frontend talks only to the backend's REST + WebSocket API. Never connect to MQTT or a blockchain directly.

## TypeScript / Next.js

- Strict mode required. No `any`.
- Typed REST and WebSocket clients in `lib/` — components never construct fetch/WS calls inline.
- `lib/types.ts` mirrors the backend's API response shapes. When the backend API changes, update it in the same change on this side.
- Server components for static/layout content; client components only where live state (WebSocket data, charts) is required.
- Backend URLs come from `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WS_URL` — never hardcode a host.

## Styling

- Tailwind CSS for all UI; use the design tokens in `docs/ui-context.md` — no hardcoded hex values in components.
- Dashboard root containers use `w-screen h-screen overflow-hidden`; live-data overlays use `pointer-events: none` on wrappers, `pointer-events: auto` only on actual interactive controls.

## Data and State

- Truck status comes from the backend; the client never derives or manages truck phase locally.
