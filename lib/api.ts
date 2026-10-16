import type { Alert, TelemetryReading, Truck } from "@/lib/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function fetchJson<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    }
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export function fetchTrucks(): Promise<Truck[]> {
  return fetchJson<Truck[]>("/trucks");
}

export function fetchTruck(id: string): Promise<Truck> {
  return fetchJson<Truck>(`/trucks/${encodeURIComponent(id)}`);
}

export function fetchTelemetry(truckId: string, limit = 200): Promise<TelemetryReading[]> {
  return fetchJson<TelemetryReading[]>(`/trucks/${encodeURIComponent(truckId)}/telemetry`, { limit });
}

export function fetchAlerts(
  truckId?: string,
  unresolvedOnly?: boolean,
  limit = 100,
): Promise<Alert[]> {
  return fetchJson<Alert[]>("/alerts", { truck_id: truckId ?? "", unresolved_only: unresolvedOnly ?? false, limit });
}
