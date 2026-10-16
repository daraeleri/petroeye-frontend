# UI Context

## Theme

"Industrial Command Center." This is an operations console for monitoring a fleet of petrol tankers — utilitarian, high-contrast, and legible at a glance, closer to SCADA/fleet-ops tooling than a consumer app. The digital twin visual is the centerpiece; UI chrome around it stays minimal and semi-transparent so live data reads clearly.

**Visual reference direction (Jul 2026 update):** HighTopo-style industrial digital twin dashboards (mine/port/energy command centers) — glowing HUD panels over a dark scene, radial gauges instead of flat numbers, corner-bracketed panel framing, a glowing hero visual as the centerpiece, and a bottom timeline scrubber for historical playback. We are borrowing the *visual language* at 2D/SVG fidelity — not attempting full 3D or their production scale. See "HUD Visual Language" below for the specific patterns to apply and what to deliberately skip.

## Colors

All UI components use these tokens — no hardcoded hex values in Tailwind classes (configure in `tailwind.config.js` / `globals.css`).

| Role             | CSS Variable        | Value       |
| ---------------- | -------------------- | ----------- |
| Page background  | `--bg-base`          | `#0B0F14`   |
| Panel surface     | `--bg-surface`       | `#141B22CC` |
| Panel glow accent | `--glow-accent`      | `#38BDF833` (info blue at low opacity, for soft under-glow on the hero visual and panel edges) |
| Primary text     | `--text-primary`     | `#E6EDF3`   |
| Muted text       | `--text-muted`       | `#8B98A5`   |
| Safe / nominal   | `--accent-safe`      | `#22C55E`   |
| Warning          | `--accent-warning`   | `#F59E0B`   |
| Critical         | `--accent-critical`  | `#EF4444`   |
| Data / info      | `--accent-info`      | `#38BDF8`   |
| Border           | `--border-default`   | `#2A333D`   |
| Border, active/focused panel | `--border-active` | `#38BDF8`  |

## Typography

| Role                | Font                | Variable      |
| ------------------- | ------------------- | ------------- |
| UI text             | Inter / sans-serif  | `--font-sans` |
| Telemetry / coords  | JetBrains Mono / Fira Code | `--font-mono` |

Panel section headers use uppercase, letter-spaced mono or sans (e.g. `tracking-wide uppercase text-sm text-muted`) with a thin glowing gradient underline — this is the single cheapest move that gives the HUD feel across every panel, borrowed directly from the reference dashboards' section headers.

## Border Radius

| Context            | Class        |
| ------------------- | ------------ |
| Inline / small UI   | `rounded-md` |
| Cards / panels      | `rounded-lg` |
| Modals / overlays   | `rounded-xl` |

## HUD Visual Language

Concrete patterns adapted from HighTopo-style reference dashboards, scoped to what a two-person team can actually ship. Build these as small reusable components in `frontend/components/hud/` so every panel gets them for free rather than hand-rolling per-screen.

**Adopt:**
- **Radial gauge dials** for fuel/temp/pressure instead of flat numbers — an arc from 0 to max with a needle or filled arc, value in the center, color shifts from `--accent-safe` → `--accent-warning` → `--accent-critical` as it approaches threshold. This is the single highest-impact visual upgrade over a plain number.
- **Corner-bracket panel framing**: thin `border-l-2 border-t-2` (or all four corners as small L-shaped SVG brackets) in `--border-active` color at each panel's corners, rest of the border faint. Gives the "targeting HUD" look cheaply.
- **Glowing hero visual**: the truck schematic sits on a soft radial-gradient "ground glow" ellipse (`--glow-accent`) beneath it, like the container/mine visuals in the references — makes the centerpiece feel like the literal focus of the screen instead of just another box.
- **Bottom timeline scrubber**: a horizontal bar with date/time ticks and a draggable playhead for historical playback — directly maps to the existing "Historical Playback" feature, styled like the `07-01 ... 07-07` scrubbers in the reference images.
- **Status counts as glowing icon+number pairs** (e.g. online/offline/alert counts) rather than a table — for the top fleet-wide HUD.
- **Click-to-expand detail panel**: clicking a truck in the list slides in a detail panel with full specifics (mirrors the reference port dashboard's ship-click interaction) rather than navigating to a separate page — keeps the operator in flow.
- **Severity donut/aggregation chart** for the alert feed's summary view (total alerts broken into info/warning/critical), alongside the plain list.

**Deliberately skip** (out of scope, don't chase these):
- Full 3D rendering as a v1 requirement — 2D/SVG is what ships and must work standalone. 3D is planned as a later, additive, optional view (see Component Library below), not a v1 dependency — don't let 2D dashboard work get blocked waiting on it.
- Dense multi-panel enterprise layouts (the references pack 8-12 panels per screen for a whole mine/port) — PetroTwin's screen has far fewer live data points per truck, so match density to actual content, don't pad with decorative panels.
- Particle/hex background animations — nice-to-have polish, not a v1 priority; revisit only after the functional dashboard is solid.
- Chinese-localization-specific layout patterns from the references (they're for a different market) — English only, per this project's scope.

## Component Library

Use shadcn/ui on top of Tailwind, plus `recharts` for time-series telemetry graphs. Components live in `frontend/components/ui/` (shadcn primitives, protected/generated) and `frontend/components/hud/` (the custom gauge/bracket/scrubber components above, hand-built for this project).

The digital twin visual is a top-down 2D SVG truck schematic with live sensor "hotspots" (fuel gauge overlay, temp badge, tilt indicator, GPS mini-map pin) — this is what ships and is relied on for v1, prioritizing legibility over fidelity. **(Hybrid, Jul 2026)** An optional 3D view is planned as a separate, additive mode (a toggle/tab next to the 2D view, e.g. "2D" / "3D"), built only once the 2D dashboard works end to end — see `architecture.md`'s `frontend/components/twin-3d/` boundary. The 3D view should reuse the same `hotspot-*` naming convention as the SVG (fuel, temp, hatch, tilt, gps) for consistency, even though the underlying positioning mechanism differs (world-space anchor + screen projection vs. flat SVG coordinates).

## Layout Patterns

- **Top HUD**: fleet-wide status counts (trucks online, active alerts by severity) as glowing icon+number pairs, centered/right-aligned.
- **Left sidebar**: truck list/selector, each row showing status color + truck ID + last-seen time. Clicking a truck slides in a detail panel rather than navigating away.
- **Center**: the digital twin — truck schematic with live sensor overlays, sitting on a soft glow-ellipse ground shadow, corner-bracketed framing on the containing panel.
- **Right panel**: live alert feed (newest first) with a small severity-breakdown donut at the top, each alert row showing severity color and an on-chain anchor status icon.
- **Bottom panel**: time-series charts (fuel level, temperature, pressure) rendered as radial gauges for current value + a line chart for trend, with a HUD-styled timeline scrubber for historical playback.
- **Modals**: centered, `backdrop-blur-sm`, used for truck detail drill-down, alert resolution, and device/auth management.

## Icons

Use `lucide-react`, stroke-based icons only. `w-4 h-4` inline in text, `w-6 h-6` for HUD buttons.

- Fuel → `Droplet`
- Temperature → `Thermometer`
- Pressure → `Gauge`
- GPS/location → `MapPin`
- Tilt / anomaly → `AlertTriangle`
- On-chain anchor → `Link`
- Truck status: online `CircleDot` (safe color), offline `CircleOff` (muted color).

