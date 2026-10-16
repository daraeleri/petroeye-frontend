import type { Activity, Severity } from "@/lib/types";

const nf0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

export const num = (v: number | null | undefined, digits: 0 | 1 | 2 = 0) =>
  v === null || v === undefined ? "—" : (digits === 0 ? nf0 : digits === 1 ? nf1 : nf2).format(v);

export const litres = (v: number | null | undefined, digits: 0 | 1 | 2 = 1) =>
  v === null || v === undefined ? "—" : `${num(v, digits)} L`;

export const pct = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${num(v, 0)}%`);

export const coord = (lat: number | null, lon: number | null) =>
  lat === null || lon === null ? "No fix" : `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

export function timeAgo(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return "never";
  const s = Math.round((now - new Date(iso).getTime()) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export const dateTime = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : "—";

export const time = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";

export const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

export function duration(fromIso: string, toIso: string | null): string {
  const s = Math.max(0, Math.round(((toIso ? new Date(toIso).getTime() : Date.now()) - new Date(fromIso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

const ALERT_LABELS: Record<string, string> = {
  valve_open_outside_geofence: "Valve opened outside geofence",
  volume_drop_valve_closed: "Volume drop, valve closed",
  gps_fix_lost: "GPS fix lost",
  level_sensor_no_echo: "Level sensor no echo",
  device_offline: "Device dropped offline",
};
export const alertLabel = (type: string) => ALERT_LABELS[type] ?? type.replaceAll("_", " ");

export const ACTIVITY_LABEL: Record<Activity, string> = {
  offline: "Offline",
  parked: "Parked",
  moving: "Moving",
  discharging: "Discharging",
};

export const SEVERITY_LABEL: Record<Severity, string> = { info: "Info", warning: "Warning", critical: "Critical" };

/** ISO timestamp for "N days ago at 00:00 local". */
export function daysAgoIso(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (days - 1));
  return d.toISOString();
}

/** Bucket ISO timestamps into the last `days` calendar days (oldest first). */
export function bucketByDay<T>(items: T[], getIso: (t: T) => string, days: number, weight: (t: T) => number = () => 1) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const buckets = Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { date: d, value: 0 };
  });
  for (const item of items) {
    const idx = Math.floor((new Date(getIso(item)).getTime() - start.getTime()) / 86_400_000);
    const bucket = buckets[idx];
    if (bucket) bucket.value += weight(item);
  }
  return buckets;
}
