# UI Context

## Direction

**Ink on paper.** PetroEye is an operations console for a tanker fleet: calm, monochrome, legible at a glance. Black and white (ink) carry everything; colour is reserved for *status*, so a red element always means "look at this". Light and dark modes are first-class (dark is ink inverted, not a different palette).

Visual references (Oct 2026):
- The "Spark Pixel" analytics dashboard: small-caps panel labels, big mono numerals, KPI cards with thin bar sparklines, a *pixel* bar chart (stacks of small squares), quiet tables.
- Square UI layouts (square.lndevui.com): **Skyport** for the overview (KPI row → live map + list → charts), **Maps** for the full-bleed map with a floating list panel and edge controls.

## Tokens (`app/globals.css`)

All components use these through Tailwind classes. **No hex values in components.** Libraries that need literal colours (Leaflet, Recharts) read the resolved tokens via `lib/use-theme-colors.ts`.

| Role | Token / class | Light | Dark |
| ---- | ------------- | ----- | ---- |
| Page | `bg-background` | near-white `oklch(0.975 0 0)` | `oklch(0.13 0 0)` |
| Card / panel | `bg-card` | white | `oklch(0.17 0 0)` |
| Text | `text-foreground` | ink `oklch(0.16 0 0)` | `oklch(0.96 0 0)` |
| Secondary text | `text-muted-foreground` | `oklch(0.5 0 0)` | `oklch(0.66 0 0)` |
| Hairline | `border` | `oklch(0.915 0 0)` | `oklch(0.26 0 0)` |
| Ink scale (charts) | `ink`, `ink-2`, `ink-3`, `ink-4` | strongest → faintest | inverted |
| Status: OK / online | `success` | green | green |
| Status: warning | `warning` | amber | amber |
| Status: critical | `critical` | red | red |

Rules for colour:
- `critical` = unauthorized valve opening, critical alerts, unauthorized discharges, alert badges. Nothing else.
- `warning` = warning-severity alerts and degraded system status. `success` = online dots only.
- Everything else (buttons, charts, selection, discharging state) is ink.

## Typography

| Use | Font |
| --- | ---- |
| UI text | Geist Sans (`font-sans`) |
| Numbers, IDs, coordinates, panel labels | Geist Mono (`font-mono`, plus `tabular` for aligned digits) |

Panel headers use the `label-caps` utility: 11px mono, uppercase, letter-spaced, muted. Truck IDs are always mono.

## Logo

Source artwork: `public/image/logo/petroeyeLogo.png` (eye + fuel drop + signal arcs, black on transparent). Derived files — regenerate them if the artwork changes:

| File | Use |
| ---- | --- |
| `public/brand/logo-mark.png` | Trimmed, 320 px. Used as a **CSS mask** by `LogoGlyph` (`components/shell/logo.tsx`), so the glyph is painted in `currentColor` and follows the theme. |
| `app/icon.png` (512) | Favicon / PWA icon: white glyph on an ink rounded square (readable on light and dark tab bars). |
| `app/apple-icon.png` (180) | iOS home-screen icon, same design, square (iOS rounds it). |

`LogoMark` is the app-icon tile (ink square + paper glyph; inverts in dark mode) used in the sidebar, mobile login and loading screen. `LogoGlyph` alone sits on the ink login panel. Never recolour the logo with anything but ink/paper.

## Radius & elevation

`rounded-xl` for panels and floating map panels, `rounded-lg` for inner tiles/buttons, `rounded-md` for inputs, `rounded-full` for pills. Panels are flat with a hairline border; only floating elements (map panels, popovers, toasts) get a shadow.

## Layout

- **Shell** (`components/shell/app-shell.tsx`): 240px sidebar with "Main menu" (Overview, Live map, Trucks, Alerts, Discharges, Reports) and "Management" (Users — admin only), a system-status card and the account menu at the bottom; sticky top bar with breadcrumbs, live indicator (`Live · n/m online`), alerts bell and theme toggle. On < md the sidebar becomes a sheet.
- **Pages**: `max-w-[1400px]`, `p-4 md:p-6`, `gap-5` between rows; the two-column rows are `xl:grid-cols-[1fr_360px]` (main + side list).
- **Live map**: full-bleed map under the top bar; floating 340px panel top-left (collapsible, folded by default on phones); selected-truck card top-right; zoom/fit controls bottom-right.

## Components (`components/kit/`)

| Component | Use |
| --------- | --- |
| `Panel` | Every card with a `label-caps` header, optional subtitle and actions |
| `StatCard` | KPI: label, big mono value, `MiniBars` sparkline, footnote |
| `PixelBars` | Daily activity as stacked squares; series tones `ink`, `ink-3`, `critical` |
| `MiniBars` | Thin bar sparkline (last bar full ink) |
| `ActivityPill`, `SeverityPill`, `ValvePill`, `Pill`, `Dot` | Status chips; `ValvePill` is solid ink when OPEN |
| `FillBar` | Tank fill bar |
| `Segmented`, `Select`, `Field`, `Textarea`, `Table/Th/Td/Tr` | Controls and quiet tables |
| `TankGauge` (`components/truck/`) | Side view of the tank with the liquid level and valve — the twin's centrepiece |
| `VolumeChart` | Volume over time; valve-open periods shaded `critical` |
| `Twin3D` (`components/truck/twin-3d.tsx`, load via `twin-3d-lazy.tsx`) | 3D tanker on the truck page: model restyled in mid ink (`ink-2`) so it follows the theme, soft contact shadow, slow auto-rotate (off with reduced motion), subtle red pulse while the valve is open, ghosted when offline. Code-split: three.js and the 3.8 MB model load only on the truck page. Live chips (status, valve, fill %, speed) are HTML overlays, not 3D text. |
| `FleetMap` (`components/map/`) | Leaflet map: ink truck markers (filled + pulse when discharging, red ring when the truck has open alerts, grey when offline, heading arrow when moving), dashed geofence circles, track polyline, click-to-place for drawing geofences |

## Map tiles

Esri **World Light Gray / Dark Gray Canvas** basemaps (monochrome by design, switch with the theme). CARTO now requires an API key, and OSM's main tile server was unreachable from the dev network. If Esri's terms become a problem for production, swap the URL in `components/map/fleet-map.tsx`.

## Interaction principles

- Everything live: WebSocket events update the TanStack Query cache, so lists, the map and KPIs move without reloads. Critical alerts also raise a toast (15 s).
- One click to the thing that matters: alert → side sheet with map pin, plain-language "why" and the acknowledge form; truck marker/list → truck page.
- Read-only towards the truck: the UI shows the valve state but never offers a control for it.
- Role-aware: viewers see no edit buttons; operators can draw geofences and acknowledge; admins also manage users, trucks and tank calibration.
- Empty, loading (skeletons) and error (toast with the API's message) states on every page.
