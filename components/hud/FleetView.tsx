"use client";

import { useState, useMemo } from "react";
import { Search, Info } from "lucide-react";
import { useDashboard } from "@/lib/DashboardContext";
import { TruckList } from "@/components/hud/TruckList";
import { TruckSchematic } from "@/components/hud/TruckSchematic";
import { RadialGauge } from "@/components/hud/RadialGauge";
import { GlowBackdrop } from "@/components/hud/GlowBackdrop";
import { TimelineScrubber } from "@/components/hud/TimelineScrubber";
import { PanelFrame } from "@/components/hud/PanelFrame";
import { TruckDetailPanel } from "@/components/hud/TruckDetailPanel";
import type { Truck } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FleetView() {
  const { selectedTruckId, telemetry, trucks } = useDashboard();
  const [search, setSearch] = useState("");
  const [detailTruck, setDetailTruck] = useState<Truck | null>(null);

  const latest = selectedTruckId ? (telemetry.get(selectedTruckId)?.[0] ?? null) : null;
  const readings = selectedTruckId ? (telemetry.get(selectedTruckId) ?? []) : [];

  const filteredTrucks = useMemo(() => {
    return Array.from(trucks.values()).filter((t) =>
      t.truck_id.toLowerCase().includes(search.toLowerCase()),
    );
  }, [trucks, search]);

  const NOW = Date.now();
  const ONE_HOUR = 3600_000;
  const currentTime = latest ? new Date(latest.ts).getTime() : NOW;
  const startTime = readings.length > 0
    ? new Date(readings[readings.length - 1]!.ts).getTime()
    : NOW - ONE_HOUR;

  return (
    <div className="flex h-full">
      {/* Left sidebar — truck list */}
      <div className="w-56 border-r border-border-default bg-surface flex flex-col shrink-0">
        {/* Search */}
        <div className="p-2 border-b border-border-default">
          <div className="flex items-center gap-1.5 bg-base rounded px-2 py-1 border border-border-default">
            <Search className="w-3 h-3 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search trucks..."
              className="bg-transparent border-none outline-none text-xs font-mono text-text-primary placeholder:text-text-muted/50 w-full"
            />
          </div>
        </div>
        {/* List */}
        <div className="flex-1 overflow-y-auto p-1">
          {filteredTrucks.map((t) => (
            <TruckListRow
              key={t.truck_id}
              truck={t}
              selected={t.truck_id === selectedTruckId}
              onDetail={setDetailTruck}
            />
          ))}
          {filteredTrucks.length === 0 && (
            <div className="text-text-muted text-xs text-center py-8">No trucks found</div>
          )}
        </div>
      </div>

      {/* Main content — selected truck details */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedTruckId && latest ? (
          <>
            {/* Top: gauges + schematic */}
            <div className="flex-1 flex gap-2 p-2 min-h-0">
              {/* Gauges column */}
              <div className="w-28 flex flex-col gap-2 shrink-0 justify-center">
                <RadialGauge value={latest.fuel_level_pct} max={100} thresholds={{ warning: 25, critical: 10 }} unit="%" label="Fuel" size={80} />
                <RadialGauge value={latest.temperature_c} max={100} thresholds={{ warning: 40, critical: 60 }} unit="°C" label="Temp" size={80} />
                <RadialGauge value={latest.pressure_kpa} max={300} thresholds={{ warning: 180, critical: 250 }} unit="kPa" label="Pressure" size={80} />
              </div>

              {/* Schematic */}
              <PanelFrame title={selectedTruckId} active className="flex-1 rounded overflow-hidden">
                <div className="relative w-full h-full flex items-center justify-center">
                  <GlowBackdrop />
                  <TruckSchematic telemetry={latest} />
                </div>
              </PanelFrame>

              {/* Quick stats */}
              <div className="w-32 flex flex-col gap-1.5 shrink-0 justify-center">
                {[
                  { label: "Tilt", value: `${latest.tilt_deg.toFixed(1)}°` },
                  { label: "Flow Rate", value: `${latest.flow_rate_lpm.toFixed(1)} L/min` },
                  { label: "Hatch", value: latest.hatch_open ? "Open" : "Closed" },
                  { label: "Lat", value: latest.lat.toFixed(4) },
                  { label: "Lon", value: latest.lon.toFixed(4) },
                ].map((s) => (
                  <div key={s.label} className="bg-surface/50 rounded border border-border-default px-2 py-1">
                    <div className="text-[8px] uppercase tracking-wider text-text-muted">{s.label}</div>
                    <div className="text-[11px] font-mono text-text-primary truncate">{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom: timeline scrubber */}
            <div className="h-14 border-t border-border-default p-2">
              <TimelineScrubber
                startTime={startTime}
                endTime={currentTime}
                currentTime={currentTime}
                onScrub={(t) => console.log("scrub", new Date(t).toISOString())}
                markers={[]}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
            <div className="text-center space-y-2">
              <div className="text-4xl">🚛</div>
              <div>Select a truck from the list to view details</div>
            </div>
          </div>
        )}
      </div>

      <TruckDetailPanel
        truck={detailTruck}
        latestTelemetry={detailTruck ? (telemetry.get(detailTruck.truck_id)?.[0] ?? null) : null}
        open={!!detailTruck}
        onClose={() => setDetailTruck(null)}
      />
    </div>
  );
}

function TruckListRow({ truck, selected, onDetail }: { truck: Truck; selected: boolean; onDetail: (t: Truck) => void }) {
  const { selectTruck } = useDashboard();
  return (
    <button
      onClick={() => selectTruck(truck.truck_id)}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1.5 text-left rounded text-xs transition-colors",
        selected ? "bg-accent-info/10 border-l-2 border-accent-info" : "hover:bg-surface border-l-2 border-transparent",
      )}
    >
      <span className={cn(
        "w-2 h-2 rounded-full shrink-0",
        truck.status === "alert" && "bg-accent-critical",
        truck.status === "offline" && "bg-text-muted",
        truck.status === "in_transit" && "bg-accent-safe",
        truck.status === "idle" && "bg-accent-info",
        (truck.status === "loading" || truck.status === "delivered") && "bg-accent-warning",
      )} />
      <div className="flex-1 min-w-0 text-left">
        <div className="font-mono text-text-primary truncate">{truck.truck_id}</div>
        <div className="text-[9px] text-text-muted capitalize">{truck.status.replace("_", " ")}</div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDetail(truck); }}
        className="shrink-0 text-text-muted hover:text-accent-info p-0.5"
        title="Details"
      >
          <Info className="w-3 h-3" />
      </button>
    </button>
  );
}
