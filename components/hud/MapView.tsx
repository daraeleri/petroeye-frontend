"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type { Truck, TelemetryReading } from "@/lib/types";
import { useDashboard } from "@/lib/DashboardContext";
import { PanelFrame } from "@/components/hud/PanelFrame";
import { cn } from "@/lib/utils";
import { Map, AlertTriangle } from "lucide-react";

const MapContent = dynamic(
  () => import("@/components/hud/MapContent"),
  { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center text-text-muted text-sm">Loading map...</div> },
);

export function MapView() {
  const { trucks, telemetry, selectedTruckId, selectTruck, alerts } = useDashboard();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const truckMarkers = useMemo(() => {
    const markers: { truck: Truck; reading: TelemetryReading | null }[] = [];
    for (const t of trucks.values()) {
      const readings = telemetry.get(t.truck_id);
      markers.push({ truck: t, reading: readings?.[0] ?? null });
    }
    return markers;
  }, [trucks, telemetry]);

  const selectedMarker = useMemo(
    () => truckMarkers.find((m) => m.truck.truck_id === selectedTruckId) ?? null,
    [truckMarkers, selectedTruckId],
  );

  const truckAlerts = useMemo(
    () => (selectedTruckId ? alerts.filter((a) => a.truck_id === selectedTruckId).slice(0, 5) : []),
    [alerts, selectedTruckId],
  );

  const handleMarkerClick = useCallback((truckId: string) => {
    selectTruck(truckId);
  }, [selectTruck]);

  return (
    <div className="flex h-full">
      {/* Map takes remaining space */}
      <div className="flex-1 relative">
        <MapContent
          markers={truckMarkers}
          selectedTruckId={selectedTruckId}
          onMarkerClick={handleMarkerClick}
        />
        {/* Toggle sidebar button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-2 left-2 z-[1000] px-2 py-1 rounded text-[10px] bg-base/80 border border-border-default text-text-muted hover:text-text-primary"
        >
          {sidebarOpen ? "Hide Panel" : "Show Panel"}
        </button>
      </div>

      {/* Right info panel */}
      <div className={cn(
        "w-72 border-l border-border-default bg-surface overflow-y-auto transition-all duration-200",
        sidebarOpen ? "translate-x-0" : "translate-x-full w-0 overflow-hidden border-0",
      )}>
        {selectedMarker ? (
          <div className="p-3 space-y-3">
            {/* Truck header */}
            <div className="flex items-center gap-2">
              <span className={cn(
                "w-2.5 h-2.5 rounded-full shrink-0",
                selectedMarker.truck.status === "alert" && "bg-accent-critical",
                selectedMarker.truck.status === "offline" && "bg-text-muted",
                selectedMarker.truck.status === "in_transit" && "bg-accent-safe",
                (selectedMarker.truck.status === "idle" || selectedMarker.truck.status === "loading") && "bg-accent-warning",
                selectedMarker.truck.status === "delivered" && "bg-accent-info",
              )} />
              <div>
                <div className="text-sm font-mono font-semibold text-text-primary">{selectedMarker.truck.truck_id}</div>
                <div className="text-[10px] text-text-muted capitalize">{selectedMarker.truck.status.replace("_", " ")}</div>
              </div>
            </div>

            {/* Telemetry datapoints */}
            {selectedMarker.reading && (
              <div className="grid grid-cols-2 gap-2">
                <MiniStat label="Fuel" value={`${selectedMarker.reading.fuel_level_pct.toFixed(1)}%`} />
                <MiniStat label="Temp" value={`${selectedMarker.reading.temperature_c.toFixed(1)}°C`} />
                <MiniStat label="Pressure" value={`${selectedMarker.reading.pressure_kpa.toFixed(0)} kPa`} />
                <MiniStat label="Tilt" value={`${selectedMarker.reading.tilt_deg.toFixed(1)}°`} />
                <MiniStat label="Lat" value={selectedMarker.reading.lat.toFixed(4)} />
                <MiniStat label="Lon" value={selectedMarker.reading.lon.toFixed(4)} />
              </div>
            )}

            {/* Recent alerts */}
            {truckAlerts.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Recent Alerts</div>
                <div className="space-y-1">
                  {truckAlerts.map((a) => (
                    <div key={a.id} className="flex items-center gap-1.5 text-[10px] font-mono">
                      <AlertTriangle className={cn(
                        "w-2.5 h-2.5 shrink-0",
                        a.severity === "critical" && "text-accent-critical",
                        a.severity === "warning" && "text-accent-warning",
                        a.severity === "info" && "text-accent-safe",
                      )} />
                      <span className="text-text-primary">{a.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-text-muted text-xs gap-4 p-4">
            <Map className="w-8 h-8 opacity-30" />
            <div className="text-center">
              <div className="font-semibold mb-1">No Truck Selected</div>
              <div>Click a marker on the map to view details</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-base/50 rounded px-2 py-1 border border-border-default">
      <div className="text-[8px] uppercase tracking-wider text-text-muted">{label}</div>
      <div className="text-xs font-mono text-text-primary">{value}</div>
    </div>
  );
}
