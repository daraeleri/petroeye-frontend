"use client";

import { useMemo } from "react";
import {
  Thermometer, Droplet, Wind, Flame,
  BarChart3, Activity,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ComposedChart, Area, AreaChart,
} from "recharts";
import { PanelFrame } from "@/components/hud/PanelFrame";
import { RadialGauge } from "@/components/hud/RadialGauge";
import { useDashboard } from "@/lib/DashboardContext";
import { cn } from "@/lib/utils";

const powerData = [
  { name: "00:00", actual: 120, rated: 150 },
  { name: "04:00", actual: 95, rated: 150 },
  { name: "08:00", actual: 145, rated: 150 },
  { name: "12:00", actual: 148, rated: 150 },
  { name: "16:00", actual: 140, rated: 150 },
  { name: "20:00", actual: 130, rated: 150 },
];

const envData = [
  { time: "00:00", temp: 22, humidity: 55 },
  { time: "04:00", temp: 19, humidity: 62 },
  { time: "08:00", temp: 24, humidity: 50 },
  { time: "12:00", temp: 31, humidity: 38 },
  { time: "16:00", temp: 33, humidity: 35 },
  { time: "20:00", temp: 27, humidity: 45 },
];

const priceData = [
  { time: "00:00", price: 0.38 },
  { time: "04:00", price: 0.32 },
  { time: "08:00", price: 0.52 },
  { time: "12:00", price: 0.65 },
  { time: "16:00", price: 0.72 },
  { time: "20:00", price: 0.58 },
];

const weatherData = [
  { day: "Mon", high: 32, low: 22, condition: "Sunny" },
  { day: "Tue", high: 30, low: 21, condition: "Cloudy" },
  { day: "Wed", high: 28, low: 20, condition: "Rain" },
  { day: "Thu", high: 31, low: 23, condition: "Sunny" },
  { day: "Fri", high: 29, low: 21, condition: "Cloudy" },
];

const batteryClusters = [
  { id: "BAT-01", soc: 87, soh: 96, maxV: 3.65, minV: 3.12, maxT: 32, minT: 24 },
  { id: "BAT-02", soc: 72, soh: 91, maxV: 3.58, minV: 3.08, maxT: 35, minT: 26 },
  { id: "BAT-03", soc: 94, soh: 98, maxV: 3.71, minV: 3.18, maxT: 30, minT: 23 },
  { id: "BAT-04", soc: 65, soh: 87, maxV: 3.52, minV: 2.98, maxT: 38, minT: 28 },
];

export function AnalyticsView() {
  const { selectedTruckId, telemetry } = useDashboard();
  const latest = selectedTruckId ? (telemetry.get(selectedTruckId)?.[0] ?? null) : null;

  return (
    <div className="h-full overflow-y-auto p-3 space-y-3">
      {/* Top row: gauges + power bar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-3">
        {/* PCS Operating Parameters */}
        <PanelFrame title="PCS Operating Parameters">
          <div className="flex items-center justify-around py-2">
            {latest ? (
              <>
                <RadialGauge value={latest.pressure_kpa} max={300} thresholds={{ warning: 180, critical: 250 }} unit="kPa" label="Pressure" size={90} />
                <RadialGauge value={latest.temperature_c} max={100} thresholds={{ warning: 40, critical: 60 }} unit="°C" label="Temperature" size={90} />
                <RadialGauge value={latest.fuel_level_pct} max={100} thresholds={{ warning: 25, critical: 10 }} unit="%" label="Fuel" size={90} />
              </>
            ) : (
              <div className="text-text-muted text-xs py-6">No data</div>
            )}
          </div>
        </PanelFrame>

        {/* Real-time vs Rated Power */}
        <PanelFrame title="Power Comparison (Real-time vs Rated)">
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={powerData} barGap={2}>
              <XAxis dataKey="name" tick={{ fontSize: 8, fill: "#8B98A5" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 8, fill: "#8B98A5" }} axisLine={false} tickLine={false} width={25} />
              <Tooltip contentStyle={{ background: "rgba(20, 27, 34, 0.8)", backdropFilter: "blur(8px)", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: "6px", fontSize: 10, color: "#E6EDF3", boxShadow: "0 0 15px rgba(56,189,248,0.1)" }} itemStyle={{ color: "#38BDF8" }} />
              <Bar dataKey="actual" fill="#38BDF8" radius={[2, 2, 0, 0]} opacity={0.85} />
              <Bar dataKey="rated" fill="#2A333D" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </PanelFrame>
      </div>

      {/* Bottom row: env + battery + weather */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1.2fr_0.8fr] gap-3">
        {/* Environmental Monitoring */}
        <PanelFrame title="Environmental Monitoring">
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="glass-panel shadow-[0_0_8px_rgba(56,189,248,0.1)] transition-all hover:shadow-[0_0_12px_rgba(56,189,248,0.2)] hover:-translate-y-0.5 rounded border border-border-default px-2 py-1.5 text-center">
              <Flame className="w-3.5 h-3.5 text-accent-safe mx-auto mb-0.5" />
              <div className="text-[9px] text-text-muted">Smoke</div>
              <div className="text-[10px] font-mono text-accent-safe">Normal</div>
            </div>
            <div className="glass-panel shadow-[0_0_8px_rgba(56,189,248,0.1)] transition-all hover:shadow-[0_0_12px_rgba(56,189,248,0.2)] hover:-translate-y-0.5 rounded border border-border-default px-2 py-1.5 text-center">
              <Droplet className="w-3.5 h-3.5 text-accent-info mx-auto mb-0.5" />
              <div className="text-[9px] text-text-muted">Water</div>
              <div className="text-[10px] font-mono text-accent-info">Dry</div>
            </div>
            <div className="glass-panel shadow-[0_0_8px_rgba(56,189,248,0.1)] transition-all hover:shadow-[0_0_12px_rgba(56,189,248,0.2)] hover:-translate-y-0.5 rounded border border-border-default px-2 py-1.5 text-center">
              <Flame className="w-3.5 h-3.5 text-accent-warning mx-auto mb-0.5" />
              <div className="text-[9px] text-text-muted">Fire Sys</div>
              <div className="text-[10px] font-mono text-accent-warning">Standby</div>
            </div>
          </div>

          <div className="text-[9px] uppercase tracking-wider text-text-muted mb-1">Temp & Humidity</div>
          <ResponsiveContainer width="100%" height={100}>
            <ComposedChart data={envData}>
              <XAxis dataKey="time" tick={{ fontSize: 7, fill: "#8B98A5" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="temp" domain={[15, 40]} tick={{ fontSize: 7, fill: "#8B98A5" }} axisLine={false} tickLine={false} width={20} />
              <YAxis yAxisId="humidity" domain={[20, 80]} orientation="right" tick={{ fontSize: 7, fill: "#8B98A5" }} axisLine={false} tickLine={false} width={20} />
              <Tooltip contentStyle={{ background: "rgba(20, 27, 34, 0.8)", backdropFilter: "blur(8px)", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: "6px", fontSize: 10, color: "#E6EDF3", boxShadow: "0 0 15px rgba(56,189,248,0.1)" }} />
              <Area yAxisId="temp" type="monotone" dataKey="temp" stroke="#EF4444" fill="#EF444422" strokeWidth={1.5} />
              <Area yAxisId="humidity" type="monotone" dataKey="humidity" stroke="#38BDF8" fill="#38BDF822" strokeWidth={1.5} />
            </ComposedChart>
          </ResponsiveContainer>
        </PanelFrame>

        {/* Battery Cluster Monitoring */}
        <PanelFrame title="Battery Cluster Monitoring">
          <div className="overflow-x-auto">
            <table className="w-full text-[9px] font-mono">
              <thead>
                <tr className="text-text-muted border-b border-border-default">
                  <th className="text-left py-1 pr-1">ID</th>
                  <th className="text-right px-1">SOC</th>
                  <th className="text-right px-1">SOH</th>
                  <th className="text-right px-1">Vmax</th>
                  <th className="text-right px-1">Vmin</th>
                  <th className="text-right px-1">Tmax</th>
                  <th className="text-right pl-1">Tmin</th>
                </tr>
              </thead>
              <tbody>
                {batteryClusters.map((b) => (
                  <tr key={b.id} className="border-b border-border-default/30 hover:bg-surface/30">
                    <td className="py-1 pr-1 text-accent-info">{b.id}</td>
                    <td className="text-right px-1">{b.soc}%</td>
                    <td className="text-right px-1 text-accent-safe">{b.soh}%</td>
                    <td className="text-right px-1">{b.maxV}V</td>
                    <td className="text-right px-1">{b.minV}V</td>
                    <td className="text-right px-1">{b.maxT}°C</td>
                    <td className="text-right pl-1">{b.minT}°C</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PanelFrame>

        {/* Weather & Pricing */}
        <PanelFrame title="Weather & Pricing">
          <div className="space-y-2">
            <div className="text-[9px] uppercase tracking-wider text-text-muted">Forecast</div>
            <div className="grid grid-cols-5 gap-1">
              {weatherData.map((w) => (
                <div key={w.day} className="text-center bg-base/30 rounded border border-border-default p-1">
                  <div className="text-[8px] text-text-muted">{w.day}</div>
                  <div className="text-[10px] font-mono text-accent-warning">{w.high}°</div>
                  <div className="text-[8px] font-mono text-text-muted">{w.low}°</div>
                  <div className="text-[7px] text-text-muted/60">{w.condition}</div>
                </div>
              ))}
            </div>

            <div className="text-[9px] uppercase tracking-wider text-text-muted pt-2">Time-of-Use Pricing</div>
            <ResponsiveContainer width="100%" height={60}>
              <AreaChart data={priceData}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fontSize: 7, fill: "#8B98A5" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "rgba(20, 27, 34, 0.8)", backdropFilter: "blur(8px)", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: "6px", fontSize: 10, color: "#E6EDF3", boxShadow: "0 0 15px rgba(56,189,248,0.1)" }} />
                <Area type="monotone" dataKey="price" stroke="#F59E0B" fill="url(#priceGrad)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>

            <div className="flex justify-between text-[9px]">
              <span className="text-text-muted">Peak</span>
              <span className="font-mono text-accent-critical">$0.72/kWh</span>
            </div>
            <div className="flex justify-between text-[9px]">
              <span className="text-text-muted">Valley</span>
              <span className="font-mono text-accent-safe">$0.32/kWh</span>
            </div>
          </div>
        </PanelFrame>
      </div>
    </div>
  );
}
