// Typed REST client. Components never call fetch directly — they use these
// functions through TanStack Query hooks (lib/queries.ts).
import type {
  ActivityEntry,
  Alert,
  Discharge,
  Geofence,
  Health,
  ReportSummary,
  Role,
  TankCalibration,
  TankShape,
  TelemetryReading,
  TokenResponse,
  Truck,
  User,
} from "@/lib/types";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
export const WS_URL = (process.env.NEXT_PUBLIC_WS_URL ?? API_URL.replace(/^http/, "ws") + "/ws").replace(/\/$/, "");

const TOKEN_KEY = "petroeye.token";

export const tokenStore = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable: the session lasts until reload */
    }
  },
  clear() {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Fired when the backend rejects the token; the auth provider logs out. */
export const UNAUTHORIZED_EVENT = "petroeye:unauthorized";

type Query = Record<string, string | number | boolean | null | undefined>;

function buildUrl(path: string, query?: Query): string {
  const url = new URL(API_URL + path);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  return url.toString();
}

async function errorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: unknown };
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail)) {
      return body.detail
        .map((d: { msg?: string; loc?: unknown[] }) => `${(d.loc ?? []).slice(1).join(".")}: ${d.msg ?? ""}`)
        .join("; ");
    }
  } catch {
    /* not JSON */
  }
  return `${res.status} ${res.statusText}`;
}

async function request(method: string, path: string, opts: { query?: Query; body?: unknown } = {}): Promise<Response> {
  const headers: Record<string, string> = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(buildUrl(path, opts.query), {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  if (res.status === 401 && path !== "/auth/login") {
    tokenStore.clear();
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }
  if (!res.ok) throw new ApiError(res.status, await errorMessage(res));
  return res;
}

async function json<T>(method: string, path: string, opts?: { query?: Query; body?: unknown }): Promise<T> {
  const res = await request(method, path, opts);
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

// --- Auth & users -------------------------------------------------------------

export async function login(email: string, password: string): Promise<TokenResponse> {
  const res = await fetch(API_URL + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username: email, password }),
  });
  if (!res.ok) throw new ApiError(res.status, await errorMessage(res));
  return (await res.json()) as TokenResponse;
}

export const getMe = () => json<User>("GET", "/auth/me");
export const changePassword = (current_password: string, new_password: string) =>
  json<void>("POST", "/auth/me/password", { body: { current_password, new_password } });

export const listUsers = () => json<User[]>("GET", "/users");
export const createUser = (body: { email: string; full_name: string; password: string; role: Role }) =>
  json<User>("POST", "/users", { body });
export const updateUser = (
  id: string,
  body: Partial<{ full_name: string; role: Role; is_active: boolean; password: string }>,
) => json<User>("PATCH", `/users/${id}`, { body });

// --- Trucks -------------------------------------------------------------------

export const listTrucks = () => json<Truck[]>("GET", "/trucks");
export const getTruck = (id: string) => json<Truck>("GET", `/trucks/${encodeURIComponent(id)}`);
export const createTruck = (body: { truck_id: string; plate?: string; driver_name?: string; notes?: string }) =>
  json<Truck>("POST", "/trucks", { body });
export const updateTruck = (id: string, body: { plate?: string | null; driver_name?: string | null; notes?: string | null }) =>
  json<Truck>("PATCH", `/trucks/${encodeURIComponent(id)}`, { body });
export const getTelemetry = (id: string, query: { start?: string; end?: string; limit?: number; order?: "asc" | "desc" }) =>
  json<TelemetryReading[]>("GET", `/trucks/${encodeURIComponent(id)}/telemetry`, { query });
export const getTank = (id: string) => json<TankCalibration>("GET", `/trucks/${encodeURIComponent(id)}/tank`);
export const putTank = (
  id: string,
  body: {
    shape: TankShape;
    length_cm?: number | null;
    width_cm?: number | null;
    height_cm?: number | null;
    diameter_cm?: number | null;
    sensor_offset_cm: number;
  },
) => json<TankCalibration>("PUT", `/trucks/${encodeURIComponent(id)}/tank`, { body });

// --- Geofences ----------------------------------------------------------------

export const listGeofences = (query?: { truck_id?: string; include_inactive?: boolean }) =>
  json<Geofence[]>("GET", "/geofences", { query });
export const createGeofence = (body: {
  name: string;
  description?: string | null;
  lat: number;
  lon: number;
  radius_m: number;
  truck_id?: string | null;
}) => json<Geofence>("POST", "/geofences", { body });
export const updateGeofence = (id: string, body: Partial<Omit<Geofence, "id" | "created_by" | "created_at" | "updated_at">>) =>
  json<Geofence>("PATCH", `/geofences/${id}`, { body });
export const deactivateGeofence = (id: string) => json<Geofence>("DELETE", `/geofences/${id}`);

// --- Alerts & discharges ------------------------------------------------------

export interface AlertQuery {
  truck_id?: string;
  severity?: string;
  type?: string;
  acknowledged?: boolean;
  start?: string;
  end?: string;
  limit?: number;
  offset?: number;
  [key: string]: string | number | boolean | undefined;
}
export const listAlerts = (query: AlertQuery = {}) => json<Alert[]>("GET", "/alerts", { query });
export const acknowledgeAlert = (id: string, note?: string) =>
  json<Alert>("POST", `/alerts/${id}/acknowledge`, { body: { note: note || null } });

export interface DischargeQuery {
  truck_id?: string;
  authorized?: boolean;
  open_only?: boolean;
  start?: string;
  end?: string;
  limit?: number;
  offset?: number;
  [key: string]: string | number | boolean | undefined;
}
export const listDischarges = (query: DischargeQuery = {}) => json<Discharge[]>("GET", "/discharges", { query });

// --- Reports ------------------------------------------------------------------

export interface RangeQuery {
  start?: string;
  end?: string;
  truck_id?: string;
  [key: string]: string | undefined;
}
export const getSummary = (query: RangeQuery = {}) => json<ReportSummary>("GET", "/reports/summary", { query });
export const getActivity = (query: RangeQuery = {}) => json<ActivityEntry[]>("GET", "/reports/activity", { query });

export type ExportKind = "activity" | "discharges" | "alerts" | "telemetry" | "audit";

/** Downloads a report file (auth header required, so no plain <a href>). */
export async function downloadReport(kind: ExportKind, format: "csv" | "json", query: RangeQuery = {}): Promise<void> {
  const res = await request("GET", `/reports/export/${kind}`, { query: { ...query, format } });
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? `petroeye-${kind}.${format}`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const getHealth = () => json<Health>("GET", "/health");
