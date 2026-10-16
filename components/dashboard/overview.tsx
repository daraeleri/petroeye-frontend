"use client";

import { useMemo } from "react";
import {
  Truck, Fuel, MapPin, AlertTriangle,
  TrendingUp, TrendingDown, Activity, Radio,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip,
  BarChart, Bar, AreaChart, Area,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboard } from "@/lib/DashboardContext";
import { cn } from "@/lib/utils";
import { VehicleMap } from "./vehicle-map";

const CHART_BLUE = "oklch(0.55 0.18 255)";
const CHART_GREEN = "oklch(0.7 0.17 162)";
const CHART_AMBER = "oklch(0.77 0.16 70)";
const CHART_RED = "oklch(0.63 0.22 25)";

function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function StatCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {sub && (
              <p
                className={cn(
                  "text-xs mt-1",
                  tone === "positive" && "text-[--safe]",
                  tone === "negative" && "text-destructive",
                  (!tone || tone === "neutral") && "text-muted-foreground",
                )}
              >
                {sub}
              </p>
            )}
          </div>
          <div className="p-3 rounded-full bg-muted">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivity() {
  const { alerts } = useDashboard();
  const recentAlerts = alerts.slice(0, 6);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardDescription>Latest fleet events (live)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentAlerts.length > 0 ? (
            recentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    alert.severity === "critical" && "bg-red-500",
                    alert.severity === "warning" && "bg-yellow-500",
                    alert.severity === "info" && "bg-blue-500",
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{alert.truck_id}</p>
                  <p className="text-xs text-muted-foreground truncate">{alert.message}</p>
                </div>
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(alert.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">No recent activity</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function OverviewDashboard() {
  const { trucks, telemetry, alerts, fleetHistory, connected, lastUpdate } = useDashboard();

  const stats = useMemo(() => {
    let online = 0, offline = 0, alertCount = 0;
    for (const t of trucks.values()) {
      if (t.status === "alert") alertCount++;
      else if (t.status === "offline") offline++;
      else online++;
    }
    const critical = alerts.filter((a) => a.severity === "critical" && !a.resolved_at).length;
    const warning = alerts.filter((a) => a.severity === "warning" && !a.resolved_at).length;
    const info = alerts.filter((a) => a.severity === "info" && !a.resolved_at).length;
    return { online, offline, alertCount, total: trucks.size, critical, warning, info };
  }, [trucks, alerts]);

  const fleetTelemetry = useMemo(() => {
    const samples: { truckId: string; reading: import("@/lib/types").TelemetryReading }[] = [];
    for (const [id, readings] of telemetry) {
      if (readings[0]) samples.push({ truckId: id, reading: readings[0] });
    }
    return samples;
  }, [telemetry]);

  const avgFuel = fleetTelemetry.length
    ? fleetTelemetry.reduce((s, x) => s + x.reading.fuel_level_pct, 0) / fleetTelemetry.length
    : 0;
  const avgTemp = fleetTelemetry.length
    ? fleetTelemetry.reduce((s, x) => s + x.reading.temperature_c, 0) / fleetTelemetry.length
    : 0;
  const lowFuelCount = fleetTelemetry.filter((x) => x.reading.fuel_level_pct < 25).length;
  const hatchOpenCount = fleetTelemetry.filter((x) => x.reading.hatch_open).length;

  // Live trend data (from rolling fleet history samples)
  const fuelTrendData = useMemo(
    () =>
      fleetHistory.slice(-30).map((h) => ({
        time: fmtTime(h.ts),
        fuel: Number(h.avgFuel.toFixed(1)),
        temp: Number(h.avgTemp.toFixed(1)),
      })),
    [fleetHistory],
  );

  const activeTrendData = useMemo(
    () =>
      fleetHistory.slice(-30).map((h) => ({
        time: fmtTime(h.ts),
        active: h.online,
        alert: h.alert,
      })),
    [fleetHistory],
  );

  const alertDistribution = useMemo(
    () => [
      { name: "Critical", value: stats.critical, color: "#EF4444" },
      { name: "Warning", value: stats.warning, color: "#F59E0B" },
      { name: "Info", value: stats.info, color: "#3B82F6" },
    ],
    [stats],
  );

  const chartTooltipStyle = {
    backgroundColor: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    fontSize: 12,
  };

  const hasHistory = fuelTrendData.length >= 2;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            {connected ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live{lastUpdate ? ` · last update ${fmtTime(lastUpdate)}` : ""}
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                Connecting to backend…
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={connected ? "success" : "secondary"}>{connected ? "System Online" : "Offline"}</Badge>
          <Badge variant="info">{stats.online} Active</Badge>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatCard
            icon={<Truck className="h-5 w-5 text-accent-safe" />}
            label="Active Vehicles"
            value={`${stats.online}/${stats.total}`}
            sub={stats.offline > 0 ? `${stats.offline} offline` : "All reporting"}
            tone="neutral"
          />
          <StatCard
            icon={<Fuel className="h-5 w-5 text-accent-warning" />}
            label="Avg Fuel Level"
            value={`${avgFuel.toFixed(1)}%`}
            sub={lowFuelCount > 0 ? `${lowFuelCount} truck(s) below 25%` : "Fleet fuel healthy"}
            tone={lowFuelCount > 0 ? "negative" : "positive"}
          />
          <StatCard
            icon={<Activity className="h-5 w-5 text-accent-info" />}
            label="Avg Temperature"
            value={`${avgTemp.toFixed(1)}°C`}
            sub="Across reporting trucks"
            tone="neutral"
          />
          <StatCard
            icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
            label="Active Alerts"
            value={stats.critical + stats.warning}
            sub={`${stats.critical} critical · ${stats.warning} warning`}
            tone={(stats.critical + stats.warning) > 0 ? "negative" : "positive"}
          />
        </div>

        {/* Main grid */}
        <div className="grid gap-4 lg:grid-cols-12 mb-6">
          {/* Map */}
          <div className="lg:col-span-8">
            <VehicleMap />
          </div>

          {/* Right sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Fuel & Temp Trend</CardTitle>
                <CardDescription>Live fleet averages (updates every 2s)</CardDescription>
              </CardHeader>
              <CardContent>
                {hasHistory ? (
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={fuelTrendData}>
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={24} />
                      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Line type="monotone" dataKey="fuel" name="Fuel %" stroke={CHART_GREEN} strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="temp" name="Temp °C" stroke={CHART_AMBER} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[150px] flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                    <Radio className="h-5 w-5 animate-pulse" />
                    Waiting for live data…
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Alert Distribution</CardTitle>
                <CardDescription>Current alert status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={120} height={120}>
                    <PieChart>
                      <Pie
                        data={alertDistribution.filter((d) => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {alertDistribution.filter((d) => d.value > 0).map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {alertDistribution.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom section */}
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Fleet Activity Trend</CardTitle>
                <CardDescription>Active vs alerting trucks over time (live)</CardDescription>
              </CardHeader>
              <CardContent>
                {hasHistory ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={activeTrendData}>
                      <defs>
                        <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_BLUE} stopOpacity={0.35} />
                          <stop offset="95%" stopColor={CHART_BLUE} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_RED} stopOpacity={0.35} />
                          <stop offset="95%" stopColor={CHART_RED} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={24} />
                      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Area type="monotone" dataKey="active" name="Active" stroke={CHART_BLUE} fill="url(#activeGrad)" strokeWidth={2} />
                      <Area type="monotone" dataKey="alert" name="Alert" stroke={CHART_RED} fill="url(#alertGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                    <Radio className="h-5 w-5 animate-pulse" />
                    Waiting for live data…
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4">
            <RecentActivity />
          </div>
        </div>
      </div>
    </div>
  );
}
