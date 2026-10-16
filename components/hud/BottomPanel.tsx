"use client";

import { useMemo, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { RadialGauge } from "@/components/hud/RadialGauge";
import { TimelineScrubber } from "@/components/hud/TimelineScrubber";
import { useDashboard } from "@/lib/DashboardContext";
import type { TelemetryReading } from "@/lib/types";

const NOW = Date.now();
const ONE_HOUR = 3600_000;

function readingToChartPoint(r: TelemetryReading, index: number) {
  return {
    index,
    fuel: r.fuel_level_pct,
    temp: r.temperature_c,
    pressure: r.pressure_kpa,
  };
}

export function BottomPanel() {
  const { selectedTruckId, telemetry } = useDashboard();
  const readings = selectedTruckId ? telemetry.get(selectedTruckId) ?? [] : [];
  const latest = readings[0] ?? null;

  const chartData = useMemo(
    () => readings.map((r, i) => readingToChartPoint(r, readings.length - i)).reverse(),
    [readings],
  );

  const currentTime = useMemo(() => {
    if (readings.length === 0) return NOW;
    return new Date(readings[0]!.ts).getTime();
  }, [readings]);

  const startTime = useMemo(() => {
    if (readings.length === 0) return NOW - ONE_HOUR;
    return new Date(readings[readings.length - 1]!.ts).getTime();
  }, [readings]);

  const handleScrub = useCallback((time: number) => {
    console.log("Scrub to:", new Date(time).toISOString());
  }, []);

  return (
    <div className="flex items-stretch gap-4 h-full">
      {/* Radial gauges */}
      <div className="flex items-center gap-3 shrink-0">
        <RadialGauge
          value={latest?.fuel_level_pct ?? 0}
          max={100}
          thresholds={{ warning: 25, critical: 10 }}
          unit="%"
          label="Fuel"
          size={90}
        />
        <RadialGauge
          value={latest?.temperature_c ?? 0}
          max={100}
          thresholds={{ warning: 40, critical: 60 }}
          unit="°C"
          label="Temperature"
          size={90}
        />
        <RadialGauge
          value={latest?.pressure_kpa ?? 0}
          max={300}
          thresholds={{ warning: 180, critical: 250 }}
          unit="kPa"
          label="Pressure"
          size={90}
        />
      </div>

      {/* Recharts line chart */}
      <div className="flex-1 min-w-0">
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
              <XAxis dataKey="index" hide />
              <YAxis
                stroke="var(--color-text-muted)"
                fontSize={10}
                tickFormatter={(v: number) => `${v}`}
                width={32}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border-default)",
                  borderRadius: "4px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "var(--color-text-muted)" }}
              />
              <Line
                type="monotone"
                dataKey="fuel"
                stroke="var(--color-accent-safe)"
                strokeWidth={1.5}
                dot={false}
                name="Fuel %"
              />
              <Line
                type="monotone"
                dataKey="temp"
                stroke="var(--color-accent-critical)"
                strokeWidth={1.5}
                dot={false}
                name="Temp °C"
              />
              <Line
                type="monotone"
                dataKey="pressure"
                stroke="var(--color-accent-info)"
                strokeWidth={1.5}
                dot={false}
                name="Pressure kPa"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-text-muted text-xs">
            {selectedTruckId ? "Collecting data..." : "Select a truck"}
          </div>
        )}
      </div>

      {/* Timeline scrubber */}
      <div className="w-48 shrink-0 flex flex-col justify-center pr-2">
        <TimelineScrubber
          startTime={startTime}
          endTime={currentTime}
          currentTime={currentTime}
          onScrub={handleScrub}
          markers={[]}
        />
      </div>
    </div>
  );
}
