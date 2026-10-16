# AGENTS.md — PetroTwin Frontend

Entry point for any AI coding agent working in this repo. Read this, then every file in `docs/`.

## What this repo is

The Next.js dashboard for PetroTwin, a digital twin of a petrol tanker truck (ESP32 with NEO-6M GPS, HC-SR04 ultrasonic tank level sensor, FDP-270A solenoid valve). It is deployed on Vercel and consumes the backend's REST + WebSocket API. The backend lives in a separate repo and owns the architecture and device contract docs.

## Required reading

1. `docs/code-standards.md`
2. `docs/ui-context.md`
3. `docs/progress-tracker.md` — update after every change.
4. The backend repo's `docs/architecture.md` and API, for the data shapes this UI consumes.

## Ground rules

- Frontend only. Never add MQTT, database or blockchain code here.
- The dashboard is read-only towards the truck: show the valve state, never offer a control for it.
- Don't invent data fields. If the UI needs something the backend doesn't serve, record it as an open question in the backend repo's progress tracker.
- `components/ui/*` are generated shadcn/ui components — don't hand-edit them.
- A change is done when `npm run build` passes and it works against the backend + simulator.
