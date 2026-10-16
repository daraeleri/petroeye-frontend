"use client";

// Leaflet map (client only — import through components/map/index.ts).
import L from "leaflet";
import { Minus, Plus, Scan } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef } from "react";
import { Circle, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import type { Geofence, Truck } from "@/lib/types";
import { useThemeColors } from "@/lib/use-theme-colors";
import { cn } from "@/lib/utils";

export interface FleetMapProps {
  trucks: Truck[];
  geofences?: Geofence[];
  selectedTruckId?: string | null;
  selectedFenceId?: string | null;
  onSelectTruck?: (id: string) => void;
  onSelectFence?: (id: string) => void;
  /** Recent track of the selected truck, oldest first. */
  track?: [number, number][];
  /** Geofence being drawn/edited. */
  draft?: { lat: number; lon: number; radius_m: number } | null;
  /** When set, clicking the map calls this (used to place a geofence). */
  onMapClick?: (lat: number, lon: number) => void;
  /** Extra point markers (e.g. where an alert happened). */
  pins?: { lat: number; lon: number; label: string; tone?: "critical" | "ink" }[];
  className?: string;
  /** Fallback center when there's nothing to show. */
  center?: [number, number];
  controls?: boolean;
  interactive?: boolean;
}

const DEFAULT_CENTER: [number, number] = [3.8667, 11.5167]; // Yaoundé

function truckIcon(t: Truck, selected: boolean) {
  const state = t.activity;
  const alert = t.open_alerts > 0;
  const body =
    state === "offline"
      ? "bg-card text-muted-foreground border-ink-3"
      : state === "discharging"
        ? "bg-ink text-background border-ink"
        : "bg-card text-foreground border-ink";
  const ring = alert ? "ring-2 ring-critical ring-offset-2 ring-offset-transparent" : selected ? "ring-2 ring-ink ring-offset-2 ring-offset-transparent" : "";
  const pulse = state === "discharging" ? `<span class="absolute inset-0 rounded-lg bg-ink/40 animate-ping"></span>` : "";
  const heading = t.latest?.course_deg ?? 0;
  const arrow =
    state === "moving"
      ? `<span class="absolute -top-2 left-1/2 -translate-x-1/2" style="transform: translateX(-50%) rotate(${heading}deg); transform-origin: 50% 18px">
           <svg width="8" height="8" viewBox="0 0 8 8"><path d="M4 0 8 8H0z" class="fill-ink"/></svg></span>`
      : "";
  return L.divIcon({
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<div class="relative size-[30px]">${pulse}${arrow}
      <div class="relative grid size-[30px] place-items-center rounded-lg border-2 shadow-sm ${body} ${ring}">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/>
          <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
          <circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>
        </svg>
      </div></div>`,
  });
}

function pinIcon(tone: "critical" | "ink" = "critical") {
  const cls = tone === "critical" ? "bg-critical" : "bg-ink";
  return L.divIcon({
    className: "",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    html: `<span class="relative block size-4"><span class="absolute inset-0 animate-ping rounded-full ${cls} opacity-50"></span><span class="relative block size-4 rounded-full border-2 border-background ${cls}"></span></span>`,
  });
}

function FitOnce({ points, center }: { points: [number, number][]; center: [number, number] }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    if (points.length === 0) {
      map.setView(center, 13);
      return;
    }
    done.current = true;
    if (points.length === 1) map.setView(points[0]!, 14);
    else map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 15 });
  }, [map, points, center]);
  return null;
}

function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  const key = target ? target.join(",") : "";
  useEffect(() => {
    if (target) map.flyTo(target, Math.max(map.getZoom(), 14), { duration: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

function ClickHandler({ onClick }: { onClick?: (lat: number, lon: number) => void }) {
  const map = useMapEvents({ click: (e) => onClick?.(e.latlng.lat, e.latlng.lng) });
  useEffect(() => {
    map.getContainer().style.cursor = onClick ? "crosshair" : "";
  }, [map, onClick]);
  return null;
}

function Controls({ fitPoints }: { fitPoints: [number, number][] }) {
  const map = useMap();
  const btn = "grid size-8 place-items-center text-foreground transition-colors hover:bg-muted";
  return (
    <div className="absolute right-3 bottom-8 z-[500] flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
      <button className={btn} onClick={() => map.zoomIn()} aria-label="Zoom in">
        <Plus className="size-4" />
      </button>
      <button className={cn(btn, "border-y")} onClick={() => map.zoomOut()} aria-label="Zoom out">
        <Minus className="size-4" />
      </button>
      <button
        className={btn}
        aria-label="Fit fleet"
        onClick={() =>
          fitPoints.length > 1 ? map.fitBounds(L.latLngBounds(fitPoints), { padding: [48, 48], maxZoom: 15 }) : fitPoints[0] && map.setView(fitPoints[0], 14)
        }
      >
        <Scan className="size-4" />
      </button>
    </div>
  );
}

export default function FleetMap({
  trucks,
  geofences = [],
  selectedTruckId,
  selectedFenceId,
  onSelectTruck,
  onSelectFence,
  track,
  draft,
  onMapClick,
  pins = [],
  className,
  center = DEFAULT_CENTER,
  controls = true,
  interactive = true,
}: FleetMapProps) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  const positioned = trucks.filter((t) => t.latest?.lat != null && t.latest?.lon != null);
  const fitPoints = useMemo<[number, number][]>(
    () => [
      ...positioned.map((t) => [t.latest!.lat!, t.latest!.lon!] as [number, number]),
      ...geofences.map((g) => [g.lat, g.lon] as [number, number]),
      ...pins.map((p) => [p.lat, p.lon] as [number, number]),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [positioned.length, geofences.length, pins.length],
  );

  const selected = positioned.find((t) => t.truck_id === selectedTruckId);
  const fence = geofences.find((g) => g.id === selectedFenceId);
  const flyTarget: [number, number] | null = selected
    ? [selected.latest!.lat!, selected.latest!.lon!]
    : fence
      ? [fence.lat, fence.lon]
      : null; // never fly while drawing: the user just clicked where they want it

  // Leaflet draws SVG with literal colors, so use the resolved theme tokens.
  const { ink, critical } = useThemeColors();

  return (
    <div className={cn("relative isolate overflow-hidden", className)}>
      <MapContainer
        center={center}
        zoom={13}
        zoomControl={false}
        attributionControl
        dragging={interactive}
        scrollWheelZoom={interactive}
        doubleClickZoom={interactive}
        className="size-full"
      >
        {/* Esri gray canvas basemaps: monochrome by design, light/dark follow the theme. */}
        <TileLayer
          key={dark ? "dark" : "light"}
          url={`https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_${dark ? "Dark" : "Light"}_Gray_Base/MapServer/tile/{z}/{y}/{x}`}
          attribution="Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors"
          maxZoom={16}
        />
        <FitOnce points={fitPoints} center={center} />
        <FlyTo target={flyTarget} />
        <ClickHandler onClick={onMapClick} />

        {geofences.map((g) => {
          const active = g.id === selectedFenceId;
          return (
            <Circle
              key={g.id}
              center={[g.lat, g.lon]}
              radius={g.radius_m}
              pathOptions={{
                color: ink,
                weight: active ? 2 : 1.25,
                dashArray: g.is_active ? (active ? undefined : "4 4") : "1 6",
                fillColor: ink,
                fillOpacity: active ? 0.14 : 0.06,
              }}
              eventHandlers={{ click: () => onSelectFence?.(g.id) }}
            >
              <Tooltip direction="top" offset={[0, -4]} className="!rounded-md !border-border !bg-popover !text-popover-foreground !shadow-sm">
                <span className="text-xs font-medium">{g.name}</span>
                <span className="ml-1 text-xs text-muted-foreground">· {Math.round(g.radius_m)} m</span>
              </Tooltip>
            </Circle>
          );
        })}

        {draft && (
          <Circle
            center={[draft.lat, draft.lon]}
            radius={draft.radius_m}
            pathOptions={{ color: ink, weight: 2, fillColor: ink, fillOpacity: 0.12 }}
          />
        )}

        {track && track.length > 1 && (
          <Polyline positions={track} pathOptions={{ color: ink, weight: 2.5, opacity: 0.55, lineCap: "round" }} />
        )}

        {pins.map((p, i) => (
          <Marker key={i} position={[p.lat, p.lon]} icon={pinIcon(p.tone)}>
            <Tooltip direction="top" offset={[0, -8]}>
              <span className="text-xs" style={{ color: p.tone === "critical" ? critical : undefined }}>
                {p.label}
              </span>
            </Tooltip>
          </Marker>
        ))}

        {positioned.map((t) => (
          <Marker
            key={t.truck_id}
            position={[t.latest!.lat!, t.latest!.lon!]}
            icon={truckIcon(t, t.truck_id === selectedTruckId)}
            eventHandlers={{ click: () => onSelectTruck?.(t.truck_id) }}
            zIndexOffset={t.truck_id === selectedTruckId ? 1000 : 0}
          >
            <Tooltip direction="top" offset={[0, -16]}>
              <span className="font-mono text-xs font-medium">{t.truck_id}</span>
            </Tooltip>
          </Marker>
        ))}

        {controls && <Controls fitPoints={fitPoints} />}
      </MapContainer>
    </div>
  );
}
