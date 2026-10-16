// Mirrors the backend v2 API (petroeye-backend: app/schemas/*). Keep in sync
// with backend/docs/progress-tracker.md → "API changes for the frontend".

export type Role = "admin" | "operator" | "viewer";
export type Severity = "info" | "warning" | "critical";
export type Activity = "offline" | "parked" | "moving" | "discharging";
export type TankShape = "rectangular" | "vertical_cylinder" | "horizontal_cylinder";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface LatestReading {
  ts: string;
  gps_fix: boolean;
  lat: number | null;
  lon: number | null;
  speed_kmh: number | null;
  course_deg: number | null;
  sats: number;
  hdop: number | null;
  distance_cm: number | null;
  level_cm: number | null;
  volume_l: number | null;
  valve_open: boolean;
  geofence_id: string | null;
}

export interface TelemetryReading extends LatestReading {
  received_at: string;
}

export interface Truck {
  truck_id: string;
  plate: string | null;
  driver_name: string | null;
  notes: string | null;
  created_at: string;
  online: boolean;
  activity: Activity;
  last_seen_at: string | null;
  firmware_version: string | null;
  rssi_dbm: number | null;
  uptime_s: number | null;
  open_alerts: number;
  capacity_l: number | null;
  fill_pct: number | null;
  latest: LatestReading | null;
}

export interface TankCalibration {
  truck_id: string;
  shape: TankShape;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  diameter_cm: number | null;
  sensor_offset_cm: number;
  capacity_l: number;
  updated_at: string;
}

export interface Geofence {
  id: string;
  name: string;
  description: string | null;
  lat: number;
  lon: number;
  radius_m: number;
  truck_id: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Acknowledgement {
  user_id: string;
  user_email: string | null;
  note: string | null;
  created_at: string;
}

export interface Alert {
  id: string;
  truck_id: string;
  type: string;
  severity: Severity;
  message: string;
  triggered_by: Record<string, unknown> | null;
  lat: number | null;
  lon: number | null;
  created_at: string;
  digest: string | null;
  onchain_tx_hash: string | null;
  acknowledgement: Acknowledgement | null;
}

export interface Discharge {
  id: string;
  truck_id: string;
  opened_at: string;
  closed_at: string | null;
  open_lat: number | null;
  open_lon: number | null;
  close_lat: number | null;
  close_lon: number | null;
  geofence_id: string | null;
  authorized: boolean;
  volume_start_l: number | null;
  volume_end_l: number | null;
  litres: number | null;
  alert_id: string | null;
}

export interface ActivityEntry {
  ts: string;
  truck_id: string | null;
  category: "discharge" | "alert" | "acknowledgement" | "device" | "user";
  event: string;
  description: string;
  ref_id: string | null;
}

export interface ReportSummary {
  start: string | null;
  end: string | null;
  truck_id: string | null;
  discharges_total: number;
  discharges_authorized: number;
  discharges_unauthorized: number;
  litres_discharged: number;
  alerts_total: number;
  alerts_by_severity: Record<string, number>;
  alerts_by_type: Record<string, number>;
  alerts_unacknowledged: number;
  telemetry_points: number;
}

export interface Health {
  status: string;
  database: boolean;
  mqtt_connected: boolean;
}

export type WsMessage =
  | { type: "truck.update"; truck_id: string; data: Truck }
  | { type: "alert.created" | "alert.acknowledged"; truck_id: string; data: Alert }
  | { type: "discharge.started" | "discharge.ended"; truck_id: string; data: Discharge };
