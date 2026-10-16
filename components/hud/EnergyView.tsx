"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, Line } from "recharts";
import { PanelFrame } from "@/components/hud/PanelFrame";
import { RadialGauge } from "@/components/hud/RadialGauge";
import { useDashboard } from "@/lib/DashboardContext";

const strategyData = [
  { name: "Peak Shaving", revenue: 1240, hours: 6.5, active: true },
  { name: "Valley Fill", revenue: 890, hours: 4.2, active: true },
  { name: "Load Shift", revenue: 560, hours: 3.0, active: false },
  { name: "Demand Response", revenue: 2100, hours: 8.1, active: true },
];

const comparisonData = [
  { time: "00:00", peak: 120, valley: 80, shift: 60 },
  { time: "04:00", peak: 90, valley: 110, shift: 50 },
  { time: "08:00", peak: 150, valley: 70, shift: 90 },
  { time: "12:00", peak: 180, valley: 60, shift: 110 },
  { time: "16:00", peak: 160, valley: 85, shift: 100 },
  { time: "20:00", peak: 140, valley: 95, shift: 85 },
];

const scheduleData = [
  { name: "BAT-01", planned: 80, actual: 72 },
  { name: "BAT-02", planned: 90, actual: 85 },
  { name: "BAT-03", planned: 70, actual: 68 },
  { name: "BAT-04", planned: 95, actual: 78 },
];

const lifeData = [
  { cluster: "BAT-01", cycles: 320, lifeMonths: 48 },
  { cluster: "BAT-02", cycles: 280, lifeMonths: 52 },
  { cluster: "BAT-03", cycles: 150, lifeMonths: 62 },
  { cluster: "BAT-04", cycles: 410, lifeMonths: 36 },
];

export function EnergyView() {
  const { selectedTruckId, telemetry } = useDashboard();
  const latest = selectedTruckId ? (telemetry.get(selectedTruckId)?.[0] ?? null) : null;

  return (
    <div className="h-full overflow-y-auto p-3 space-y-3">
      {/* Top: strategy execution + SOC */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-3">
        {/* Strategy Execution Monitoring */}
        <PanelFrame title="Strategy Execution Monitoring">
          <div className="space-y-2">
            {strategyData.filter((s) => s.active).map((s) => (
              <div key={s.name} className="glass-panel rounded border border-border-default px-3 py-2 transition-all hover:shadow-[0_0_12px_rgba(56,189,248,0.15)] hover:-translate-y-0.5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-safe" />
                    <span className="text-xs font-mono text-text-primary">{s.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-accent-safe">+${s.revenue}</span>
                </div>
                <div className="flex justify-between text-[9px] text-text-muted">
                  <span>Revenue: ${s.revenue}</span>
                  <span>Hours: {s.hours}h</span>
                </div>
              </div>
            ))}
          </div>
        </PanelFrame>

        {/* SOC Equalization */}
        <PanelFrame title="SOC Equalization">
          <div className="flex flex-col items-center gap-2 py-2">
            <RadialGauge value={latest?.fuel_level_pct ?? 78} max={100} thresholds={{ warning: 25, critical: 10 }} unit="%" label="System SOC" size={110} />
            <div className="w-full space-y-1.5">
              {[
                { label: "BAT-01", value: 87, color: "bg-accent-safe" },
                { label: "BAT-02", value: 72, color: "bg-accent-warning" },
                { label: "BAT-03", value: 94, color: "bg-accent-safe" },
                { label: "BAT-04", value: 65, color: "bg-accent-warning" },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-2 text-[10px]">
                  <span className="w-10 font-mono text-text-muted">{b.label}</span>
                  <div className="flex-1 h-1.5 bg-base rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.value}%` }} />
                  </div>
                  <span className="w-8 text-right font-mono text-text-primary">{b.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </PanelFrame>
      </div>

      {/* Middle: comparison bar + schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-3">
        {/* Strategy Comparison */}
        <PanelFrame title="Strategy Comparison (24h)">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={comparisonData} barGap={2}>
              <XAxis dataKey="time" tick={{ fontSize: 8, fill: "#8B98A5" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 8, fill: "#8B98A5" }} axisLine={false} tickLine={false} width={25} />
              <Tooltip contentStyle={{ background: "rgba(20, 27, 34, 0.8)", backdropFilter: "blur(8px)", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: "6px", fontSize: 10, color: "#E6EDF3", boxShadow: "0 0 15px rgba(56,189,248,0.1)" }} />
              <Bar dataKey="peak" fill="#38BDF8" radius={[2, 2, 0, 0]} opacity={0.85} />
              <Bar dataKey="valley" fill="#22C55E" radius={[2, 2, 0, 0]} opacity={0.7} />
              <Bar dataKey="shift" fill="#F59E0B" radius={[2, 2, 0, 0]} opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        </PanelFrame>

        {/* Charge/Discharge Schedule */}
        <PanelFrame title="Charge / Discharge Schedule">
          <ResponsiveContainer width="100%" height={160}>
            <ComposedChart data={scheduleData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 8, fill: "#8B98A5" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: "#8B98A5" }} axisLine={false} tickLine={false} width={50} />
              <Tooltip contentStyle={{ background: "rgba(20, 27, 34, 0.8)", backdropFilter: "blur(8px)", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: "6px", fontSize: 10, color: "#E6EDF3", boxShadow: "0 0 15px rgba(56,189,248,0.1)" }} />
              <Bar dataKey="planned" fill="#2A333D" barSize={12} radius={[0, 2, 2, 0]} />
              <Bar dataKey="actual" fill="#38BDF8" barSize={12} radius={[0, 2, 2, 0]} opacity={0.85} />
            </ComposedChart>
          </ResponsiveContainer>
        </PanelFrame>
      </div>

      {/* Bottom: lifespan predictions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {lifeData.map((l) => (
          <PanelFrame key={l.cluster} title={`${l.cluster} Lifespan`}>
            <div className="text-center py-2 space-y-2">
              <RadialGauge
                value={Math.max(0, 100 - (l.cycles / 500) * 100)}
                max={100}
                thresholds={{ warning: 40, critical: 20 }}
                unit="%"
                label="Remaining"
                size={90}
              />
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-text-muted">Cycles</span>
                  <span className="font-mono text-text-primary">{l.cycles}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Est. Life</span>
                  <span className="font-mono text-accent-info">{l.lifeMonths}mo</span>
                </div>
              </div>
            </div>
          </PanelFrame>
        ))}
      </div>
    </div>
  );
}
