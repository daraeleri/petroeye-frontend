"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { PanelFrame } from "@/components/hud/PanelFrame";
import { cn } from "@/lib/utils";
import type { Alert, TelemetryReading, Truck } from "@/lib/types";
import { fetchAlerts } from "@/lib/api";

interface TruckDetailPanelProps {
  truck: Truck | null;
  latestTelemetry: TelemetryReading | null;
  open: boolean;
  onClose: () => void;
}

export function TruckDetailPanel({ truck, latestTelemetry, open, onClose }: TruckDetailPanelProps) {
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (!truck) return;
    fetchAlerts(truck.truck_id, undefined, 20).then(setRecentAlerts).catch(() => {});
  }, [truck]);

  if (!open || !truck) return null;

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <aside
        className={cn(
          "fixed top-16 bottom-0 right-0 w-[360px] z-40 bg-base border-l border-border-default overflow-y-auto",
          "transition-transform duration-200",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <PanelFrame title={truck.truck_id} active className="rounded-none border-0 min-h-full">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-text-muted hover:text-text-primary"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-4 mt-2">
            {/* Status */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Status</div>
              <span className={cn(
                "text-sm font-mono px-2 py-0.5 rounded border",
                truck.status === "alert" && "border-accent-critical text-accent-critical",
                truck.status === "offline" && "border-text-muted text-text-muted",
                truck.status === "in_transit" && "border-accent-safe text-accent-safe",
                truck.status === "idle" && "border-accent-info text-accent-info",
              )}>
                {truck.status}
              </span>
            </div>

            {/* Last seen */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Last Seen</div>
              <div className="text-sm font-mono">{truck.last_seen_at ?? "—"}</div>
            </div>

            {/* Live sensor readout */}
            {latestTelemetry && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Live Sensors</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Fuel", value: `${latestTelemetry.fuel_level_pct.toFixed(1)}%` },
                    { label: "Temp", value: `${latestTelemetry.temperature_c.toFixed(1)}°C` },
                    { label: "Pressure", value: `${latestTelemetry.pressure_kpa.toFixed(1)} kPa` },
                    { label: "Tilt", value: `${latestTelemetry.tilt_deg.toFixed(1)}°` },
                    { label: "Flow Rate", value: `${latestTelemetry.flow_rate_lpm.toFixed(1)} L/min` },
                    { label: "Hatch", value: latestTelemetry.hatch_open ? "Open" : "Closed" },
                    { label: "Lat", value: latestTelemetry.lat.toFixed(5) },
                    { label: "Lon", value: latestTelemetry.lon.toFixed(5) },
                  ].map((s) => (
                    <div key={s.label} className="bg-surface rounded px-2 py-1">
                      <div className="text-[9px] uppercase tracking-wider text-text-muted">{s.label}</div>
                      <div className="text-xs font-mono text-text-primary">{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent alerts */}
            {recentAlerts.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Recent Alerts</div>
                <div className="space-y-1">
                  {recentAlerts.map((a) => (
                    <div key={a.id} className="text-xs font-mono flex items-center gap-2 bg-surface rounded px-2 py-1">
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        a.severity === "critical" && "bg-accent-critical",
                        a.severity === "warning" && "bg-accent-warning",
                        a.severity === "info" && "bg-accent-safe",
                      )} />
                      <span className="text-text-primary">{a.type}</span>
                      <span className="text-text-muted ml-auto">{new Date(a.created_at).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </PanelFrame>
      </aside>
    </>
  );
}
