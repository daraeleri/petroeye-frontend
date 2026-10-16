export type TruckStatus =
  | "idle" | "loading" | "in_transit" | "delivered" | "alert" | "offline";

export type AlertSeverity = "info" | "warning" | "critical";

export interface Truck {
  truck_id: string;
  plate: string | null;
  operator: string | null;
  status: TruckStatus;
  last_seen_at: string | null;
}

export interface TelemetryReading {
  ts: string;
  fuel_level_pct: number;
  temperature_c: number;
  pressure_kpa: number;
  lat: number;
  lon: number;
  tilt_deg: number;
  flow_rate_lpm: number;
  hatch_open: boolean;
}

export interface Alert {
  id: string;
  truck_id: string;
  type: string;
  severity: AlertSeverity;
  message: string;
  triggered_by: Record<string, unknown> | null;
  created_at: string;
  resolved_at: string | null;
  onchain_tx_hash: string | null;
}

export type WsMessage =
  | { type: "telemetry"; truck_id: string; data: TelemetryReading }
  | { type: "alert"; truck_id: string; data: { id: string; alert_type: string; severity: AlertSeverity; message: string; triggered_by: Record<string, unknown> | null } }
  | { type: "status"; truck_id: string; data: { online: boolean; battery_pct: number | null; firmware_version: string | null } };
