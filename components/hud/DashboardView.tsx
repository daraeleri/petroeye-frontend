"use client";

import { useMemo } from "react";
import {
  Truck, CircleDot, CircleOff, AlertTriangle,
  DollarSign, BatteryFull, Thermometer, Zap,
  Wifi, Clock, ShieldCheck,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip,
} from "recharts";
import { PanelFrame } from "@/components/hud/PanelFrame";
import { RadialGauge } from "@/components/hud/RadialGauge";
import { GlowBackdrop } from "@/components/hud/GlowBackdrop";
import { TimelineScrubber } from "@/components/hud/TimelineScrubber";
import { TruckSchematic } from "@/components/hud/TruckSchematic";
import { useDashboard } from "@/lib/DashboardContext";
import { cn } from "@/lib/utils";

function MiniStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color?: string }) {
  return (
    <div className={cn("flex items-center gap-2 glass-panel rounded border border-border-default px-2.5 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(56,189,248,0.15)] hover:border-accent-info/50", color)}>
      <div className="shrink-0">{icon}</div>
      <div>
        <div className="text-sm font-mono font-bold text-text-primary">{value}</div>
        <div className="text-[9px] uppercase tracking-wider text-text-muted">{label}</div>
      </div>
    </div>
  );
}

const healthChartData = [
  { name: "Mon", health: 92 }, { name: "Tue", health: 88 }, { name: "Wed", health: 95 },
  { name: "Thu", health: 90 }, { name: "Fri", health: 93 }, { name: "Sat", health: 91 }, { name: "Sun", health: 94 },
];

const sohTrendData = [
  { name: "W1", soh: 98 }, { name: "W2", soh: 97 }, { name: "W3", soh: 95 }, { name: "W4", soh: 94 },
];

const ALARM_COLORS = ["#EF4444", "#F59E0B", "#22C55E"];
const SOH_COLORS = ["#38BDF8", "#22C55E", "#F59E0B", "#EF4444"];

export function DashboardView() {
  const { trucks, telemetry, alerts, selectedTruckId, selectTruck } = useDashboard();

  const stats = useMemo(() => {
    let online = 0, offline = 0, alertCount = 0;
    for (const t of trucks.values()) {
      if (t.status === "alert") alertCount++;
      else if (t.status === "offline") offline++;
      else online++;
    }
    const critical = alerts.filter((a) => a.severity === "critical").length;
    const warning = alerts.filter((a) => a.severity === "warning").length;
    const info = alerts.filter((a) => a.severity === "info").length;
    return { online, offline, alertCount, total: trucks.size, critical, warning, info };
  }, [trucks, alerts]);

  const latestReading = selectedTruckId ? (telemetry.get(selectedTruckId)?.[0] ?? null) : null;
  const telemetryList = selectedTruckId ? (telemetry.get(selectedTruckId) ?? []) : [];
  const NOW = Date.now();
  const ONE_HOUR = 3600_000;
  const currentTime = latestReading ? new Date(latestReading.ts).getTime() : NOW;
  const startTime = telemetryList.length > 0
    ? new Date(telemetryList[telemetryList.length - 1]!.ts).getTime()
    : NOW - ONE_HOUR;

  const pieData = [
    { name: "Critical", value: stats.critical },
    { name: "Warning", value: stats.warning },
    { name: "Info", value: stats.info },
  ].filter((d) => d.value > 0);

  return (
    <div className="h-full flex flex-col bg-base">
      {/* Top KPI bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border-default bg-surface/50 shrink-0">
        <div className="flex items-center gap-2 text-text-muted text-[11px] font-mono">
          <Clock className="w-3.5 h-3.5" />
          <span>Welcome back, Admin</span>
        </div>
        <div className="w-px h-4 bg-border-default" />
        <MiniStat
          icon={<Truck className="w-4 h-4 text-accent-info" />}
          label="Active Trucks"
          value={stats.online}
        />
        <MiniStat
          icon={<DollarSign className="w-4 h-4 text-accent-safe" />}
          label="Est. Daily Revenue"
          value={`$${(stats.online * 247.5).toFixed(0)}`}
        />
        <MiniStat
          icon={<BatteryFull className="w-4 h-4 text-accent-warning" />}
          label="Avg Utilization"
          value={`${stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0}%`}
        />
        <MiniStat
          icon={<Zap className="w-4 h-4 text-accent-info" />}
          label="Total Volume"
          value={`${(stats.online * 1800).toLocaleString()} L`}
        />
      </div>

      {/* Main area: left panel | center | right panel */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 min-h-0 overflow-y-auto lg:overflow-hidden">
        {/* Left floating panel */}
        <div className="lg:col-span-3 xl:col-span-3 flex flex-col gap-3 overflow-y-visible lg:overflow-y-auto">
          {/* Key Indicators */}
          <PanelFrame title="Key Indicators">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-text-muted">Est. Daily Revenue</span>
                <span className="text-xs font-mono text-accent-safe">${(stats.online * 247.5).toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-text-muted">Utilization Rate</span>
                <span className="text-xs font-mono text-accent-info">{stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0}%</span>
              </div>
              <div className="w-full h-1.5 bg-base rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent-info to-accent-safe rounded-full transition-all"
                  style={{ width: `${stats.total > 0 ? (stats.online / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </PanelFrame>

          {/* Capacity Management */}
          <PanelFrame title="Fleet Capacity">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px]">
                <span className="text-text-muted">Max Capacity</span>
                <span className="font-mono text-text-primary">24,000 L</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-text-muted">Current Load</span>
                <span className="font-mono text-accent-warning">{stats.online * 1800} L</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-text-muted">Adjustable</span>
                <span className="font-mono text-accent-safe">+{stats.offline * 1800} L</span>
              </div>
            </div>
          </PanelFrame>

          {/* Core Data Monitoring */}
          <PanelFrame title="Core Telemetry">
            <div className="grid grid-cols-2 gap-2">
              {latestReading ? (
                <>
                  <RadialGauge value={latestReading.fuel_level_pct} max={100} thresholds={{ warning: 25, critical: 10 }} unit="%" label="Fuel" size={64} />
                  <RadialGauge value={latestReading.temperature_c} max={100} thresholds={{ warning: 40, critical: 60 }} unit="°C" label="Temp" size={64} />
                  <RadialGauge value={latestReading.pressure_kpa} max={300} thresholds={{ warning: 180, critical: 250 }} unit="kPa" label="Press" size={64} />
                  <RadialGauge value={latestReading.tilt_deg} max={45} thresholds={{ warning: 15, critical: 25 }} unit="°" label="Tilt" size={64} />
                </>
              ) : (
                <div className="col-span-2 text-text-muted text-[10px] text-center py-4">No data</div>
              )}
            </div>
          </PanelFrame>

          {/* SOH Trend */}
          <PanelFrame title="Battery SOH Trend">
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={sohTrendData}>
                <XAxis dataKey="name" tick={{ fontSize: 8, fill: "#8B98A5" }} axisLine={false} tickLine={false} />
                <YAxis domain={[90, 100]} tick={{ fontSize: 8, fill: "#8B98A5" }} axisLine={false} tickLine={false} width={20} />
                <Tooltip contentStyle={{ background: "#141B22", border: "1px solid #2A333D", fontSize: 10 }} />
                <Line type="monotone" dataKey="soh" stroke="#22C55E" strokeWidth={1.5} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </PanelFrame>
        </div>

        {/* Center: truck schematic + glow */}
        <div className="lg:col-span-6 xl:col-span-6 relative rounded-lg border border-border-default glass-panel overflow-hidden min-h-[400px] lg:min-h-0">
          <GlowBackdrop color="rgba(56,189,248,0.15)" />
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-full max-w-lg">
              {selectedTruckId && latestReading ? (
                <TruckSchematic telemetry={latestReading} />
              ) : (
                <div className="text-center text-text-muted">
                  <Truck className="w-24 h-24 mx-auto opacity-20 mb-4" />
                  <p className="text-sm">Select a truck to view telemetry</p>
                </div>
              )}
            </div>
          </div>

          {/* Fleet grid overlay at bottom */}
          <div className="absolute bottom-3 left-3 right-3 z-20">
            <div className="flex flex-wrap justify-center gap-1.5">
              {Array.from(trucks.values()).slice(0, 8).map((t) => (
                <button
                  key={t.truck_id}
                  onClick={() => selectTruck(t.truck_id)}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono border transition-all duration-300",
                    selectedTruckId === t.truck_id
                      ? "border-accent-info bg-accent-info/20 text-accent-info shadow-[0_0_10px_rgba(56,189,248,0.3)]"
                      : "border-border-default glass-panel text-text-muted hover:border-accent-info/50 hover:text-accent-info hover:shadow-[0_0_8px_rgba(56,189,248,0.2)]",
                  )}
                >
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    t.status === "alert" && "bg-accent-critical",
                    t.status === "offline" && "bg-text-muted",
                    t.status === "in_transit" && "bg-accent-safe",
                    t.status === "idle" && "bg-accent-info",
                    (t.status === "loading" || t.status === "delivered") && "bg-accent-warning",
                  )} />
                  <span className="truncate">{t.truck_id.slice(-4)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right floating panel */}
        <div className="lg:col-span-3 xl:col-span-3 flex flex-col gap-3 overflow-y-visible lg:overflow-y-auto">
          {/* System Key Status */}
          <PanelFrame title="System Status">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent-info" />
                  <span className="text-[10px] text-text-muted">Health Score</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-mono font-bold text-accent-safe">92</span>
                  <span className="text-[9px] text-text-muted">/100</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={60}>
                <LineChart data={healthChartData}>
                  <Line type="monotone" dataKey="health" stroke="#22C55E" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex justify-between text-[10px]">
                <span className="text-text-muted">Online Rate</span>
                <span className="font-mono text-accent-safe">{stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0}%</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-text-muted">Communications</span>
                <span className="font-mono text-accent-safe">98.2%</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-accent-critical" />
                  <span className="text-text-muted">Fire System</span>
                </div>
                <span className="font-mono text-accent-critical text-[9px] bg-accent-critical/10 px-1 rounded">ANOMALY</span>
              </div>
            </div>
          </PanelFrame>

          {/* Alarm Aggregation Pie */}
          <PanelFrame title="Alarm Summary">
            {pieData.length > 0 ? (
              <div className="flex items-center gap-3">
                <ResponsiveContainer width={100} height={100}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={24} outerRadius={40} dataKey="value" stroke="none">
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={ALARM_COLORS[i]} opacity={0.85} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-[10px]">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ALARM_COLORS[i] }} />
                      <span className="text-text-muted">{d.name}</span>
                      <span className="font-mono text-text-primary ml-auto">{d.value}</span>
                    </div>
                  ))}
                  <div className="pt-1 text-[9px] text-text-muted">Total: {stats.critical + stats.warning + stats.info}</div>
                </div>
              </div>
            ) : (
              <div className="text-text-muted text-[10px] text-center py-4">No alarms</div>
            )}
          </PanelFrame>

          {/* Equipment Status */}
          <PanelFrame title="Equipment Status">
            <div className="space-y-1.5 text-[10px]">
              <div className="flex justify-between">
                <span className="text-text-muted">Total Trucks</span>
                <span className="font-mono text-text-primary">{stats.total}</span>
              </div>
              <div className="flex justify-between">
                <div className="flex items-center gap-1">
                  <CircleDot className="w-2.5 h-2.5 text-accent-safe" />
                  <span className="text-text-muted">Online</span>
                </div>
                <span className="font-mono text-text-primary">{stats.online}</span>
              </div>
              <div className="flex justify-between">
                <div className="flex items-center gap-1">
                  <CircleOff className="w-2.5 h-2.5 text-text-muted" />
                  <span className="text-text-muted">Offline</span>
                </div>
                <span className="font-mono text-text-primary">{stats.offline}</span>
              </div>
              <div className="flex justify-between">
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-2.5 h-2.5 text-accent-critical" />
                  <span className="text-text-muted">Alert</span>
                </div>
                <span className="font-mono text-text-primary">{stats.alertCount}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-border-default">
                <span className="text-text-muted">Comm Stability</span>
                <span className="font-mono text-accent-safe">98.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Health Avg</span>
                <span className="font-mono text-accent-safe">92%</span>
              </div>
            </div>
          </PanelFrame>
        </div>
      </div>

      {/* Bottom timeline */}
      <div className="h-12 border-t border-border-default px-3 flex items-center shrink-0 bg-surface/30">
        <TimelineScrubber
          startTime={startTime}
          endTime={currentTime + ONE_HOUR / 6}
          currentTime={currentTime}
          onScrub={(t) => console.log("scrub", new Date(t).toISOString())}
          markers={[]}
          className="max-w-3xl mx-auto w-full"
        />
      </div>
    </div>
  );
}
