"use client";

import { ArrowUpRight, Bell, CalendarDays, Download, Droplets, Loader2, ShieldAlert, Truck as TruckIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Legend, PixelBars } from "@/components/kit/charts";
import { Segmented, Table, Td, Th, Tr } from "@/components/kit/controls";
import { EmptyState, Panel, Skeleton } from "@/components/kit/panel";
import { StatCard } from "@/components/kit/stat-card";
import { ActivityPill, FillBar, SeverityPill, ValvePill } from "@/components/kit/status";
import { FleetMap } from "@/components/map";
import { Button } from "@/components/ui/button";
import { downloadReport } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { alertLabel, bucketByDay, day, daysAgoIso, litres, num, timeAgo } from "@/lib/format";
import { useActivity, useAlerts, useDischarges, useGeofences, useSummary, useTrucks } from "@/lib/queries";

type Range = "7" | "30" | "90";

export default function OverviewPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [range, setRange] = useState<Range>("30");
  const days = Number(range);
  const start = useMemo(() => daysAgoIso(days), [days]);

  const trucks = useTrucks();
  const fences = useGeofences();
  const summary = useSummary({ start });
  const discharges = useDischarges({ start, limit: 1000 });
  const alerts = useAlerts({ start, limit: 1000 });
  const openAlerts = useAlerts({ acknowledged: false, limit: 100 });
  const activity = useActivity({ start });
  const [exporting, setExporting] = useState(false);

  const fleet = trucks.data ?? [];
  const online = fleet.filter((t) => t.online).length;
  const dischargingNow = fleet.filter((t) => t.activity === "discharging").length;

  const daily = useMemo(() => {
    const d = discharges.data ?? [];
    const a = alerts.data ?? [];
    const auth = bucketByDay(d.filter((x) => x.authorized), (x) => x.opened_at, days);
    const unauth = bucketByDay(d.filter((x) => !x.authorized), (x) => x.opened_at, days);
    const vol = bucketByDay(d, (x) => x.opened_at, days, (x) => Math.max(0, x.litres ?? 0));
    const al = bucketByDay(a, (x) => x.created_at, days);
    return {
      labels: auth.map((b) => day(b.date.toISOString())),
      authorized: auth.map((b) => b.value),
      unauthorized: unauth.map((b) => b.value),
      litres: vol.map((b) => Math.round(b.value * 10) / 10),
      alerts: al.map((b) => b.value),
    };
  }, [discharges.data, alerts.data, days]);

  const tail = (v: number[]) => v.slice(-12);
  const s = summary.data;
  const firstName = user?.full_name.split(" ")[0] ?? "";
  const typeRows = Object.entries(s?.alerts_by_type ?? {}).sort((a, b) => b[1] - a[1]);
  const typeMax = Math.max(1, ...typeRows.map(([, n]) => n));

  const exportCsv = async () => {
    setExporting(true);
    try {
      await downloadReport("activity", "csv", { start });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-[1400px] gap-5 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {fleet.length === 0 ? "No trucks registered yet." : `${online} of ${fleet.length} trucks online · ${dischargingNow} discharging now`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            value={range}
            onChange={setRange}
            options={[
              { value: "7", label: "7 days" },
              { value: "30", label: "30 days" },
              { value: "90", label: "90 days" },
            ]}
          />
          <span className="hidden items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1.5 text-xs text-muted-foreground sm:flex">
            <CalendarDays className="size-3.5" />
            {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <Button size="sm" onClick={exportCsv} disabled={exporting}>
            {exporting ? <Loader2 className="animate-spin" /> : <Download />} Export CSV
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Trucks online"
          loading={trucks.isLoading}
          value={
            <>
              {online}
              <span className="text-muted-foreground">/{fleet.length}</span>
            </>
          }
          bars={fleet.map((t) => t.fill_pct ?? 0)}
          footnote={
            <>
              <TruckIcon className="size-3.5" /> {dischargingNow} discharging · {fleet.filter((t) => t.activity === "moving").length} moving
            </>
          }
        />
        <StatCard
          label="Litres discharged"
          loading={summary.isLoading}
          value={num(s?.litres_discharged, 1)}
          unit="L"
          bars={tail(daily.litres)}
          footnote={
            <>
              <Droplets className="size-3.5" /> {s?.discharges_total ?? 0} discharges in {days} days
            </>
          }
        />
        <StatCard
          label="Unauthorized openings"
          loading={summary.isLoading}
          tone={s && s.discharges_unauthorized > 0 ? "critical" : undefined}
          value={s?.discharges_unauthorized ?? 0}
          bars={tail(daily.unauthorized)}
          footnote={
            <>
              <ShieldAlert className="size-3.5" /> valve opened outside a geofence
            </>
          }
        />
        <StatCard
          label="Open alerts"
          loading={openAlerts.isLoading}
          tone={openAlerts.data?.some((a) => a.severity === "critical") ? "critical" : undefined}
          value={openAlerts.data?.length ?? 0}
          bars={tail(daily.alerts)}
          footnote={
            <>
              <Bell className="size-3.5" /> {openAlerts.data?.filter((a) => a.severity === "critical").length ?? 0} critical awaiting review
            </>
          }
        />
      </div>

      {/* Map + fleet list */}
      <div className="grid gap-3 xl:grid-cols-[1fr_360px]">
        <Panel
          title="Live fleet"
          subtitle={`${fleet.filter((t) => t.latest?.gps_fix).length} trucks with GPS fix · ${fences.data?.length ?? 0} geofences`}
          actions={
            <Button variant="outline" size="sm" asChild className="bg-card">
              <Link href="/map">
                Open map <ArrowUpRight />
              </Link>
            </Button>
          }
          bodyClassName="p-0"
        >
          <FleetMap
            trucks={fleet}
            geofences={fences.data}
            onSelectTruck={(id) => router.push(`/trucks/${encodeURIComponent(id)}`)}
            className="h-[380px] rounded-b-xl"
          />
        </Panel>
        <Panel title="Fleet" subtitle="Tank level and valve state" bodyClassName="p-0">
          <div className="max-h-[380px] divide-y overflow-y-auto">
            {trucks.isLoading &&
              Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="p-4">
                  <Skeleton className="h-12" />
                </div>
              ))}
            {!trucks.isLoading && fleet.length === 0 && (
              <EmptyState icon={<TruckIcon className="size-4" />} title="No trucks yet">
                Trucks appear here when their ESP32 first connects, or when an admin registers them.
              </EmptyState>
            )}
            {fleet.map((t) => (
              <Link key={t.truck_id} href={`/trucks/${encodeURIComponent(t.truck_id)}`} className="grid gap-2.5 p-4 transition-colors hover:bg-muted/60">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold">{t.truck_id}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[t.plate, t.driver_name].filter(Boolean).join(" · ") || `seen ${timeAgo(t.last_seen_at)}`}
                    </p>
                  </div>
                  <ActivityPill activity={t.activity} />
                </div>
                <div className="flex items-center gap-3">
                  <FillBar pct={t.fill_pct} className="flex-1" />
                  <span className="tabular w-16 text-right font-mono text-xs">{t.latest?.volume_l != null ? litres(t.latest.volume_l) : "—"}</span>
                  <ValvePill open={t.latest?.valve_open} />
                </div>
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      {/* Discharge trend + alert breakdown */}
      <div className="grid gap-3 xl:grid-cols-[1fr_360px]">
        <Panel
          title="Discharge activity"
          actions={
            <Legend
              items={[
                { label: "Authorized", tone: "ink" },
                { label: "Unauthorized", tone: "critical" },
              ]}
            />
          }
        >
          <div className="mb-3 flex items-baseline gap-2">
            <span className="tabular font-mono text-2xl font-semibold">{litres(s?.litres_discharged ?? 0)}</span>
            <span className="text-xs text-muted-foreground">
              over {s?.discharges_total ?? 0} sessions · last {days} days
            </span>
          </div>
          {discharges.isLoading ? (
            <Skeleton className="h-48" />
          ) : (
            <PixelBars
              labels={daily.labels}
              rows={10}
              series={[
                { label: "Authorized", values: daily.authorized, tone: "ink" },
                { label: "Unauthorized", values: daily.unauthorized, tone: "critical" },
              ]}
            />
          )}
        </Panel>
        <Panel title="Alerts by type" subtitle={`${s?.alerts_total ?? 0} in the last ${days} days`}>
          {typeRows.length === 0 ? (
            <EmptyState icon={<Bell className="size-4" />} title="No alerts in this period" />
          ) : (
            <div className="grid gap-3.5">
              {typeRows.map(([type, n]) => (
                <div key={type} className="grid gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={type === "valve_open_outside_geofence" ? "font-medium text-critical" : ""}>{alertLabel(type)}</span>
                    <span className="tabular font-mono">{n}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-ink-4">
                    <div
                      className={type === "valve_open_outside_geofence" ? "h-full rounded-full bg-critical" : "h-full rounded-full bg-ink"}
                      style={{ width: `${(n / typeMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
                {Object.entries(s?.alerts_by_severity ?? {}).map(([sev, n]) => (
                  <span key={sev} className="rounded-md border px-2 py-1 capitalize">
                    {sev} <span className="tabular font-mono text-foreground">{n}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </Panel>
      </div>

      {/* Recent alerts + activity */}
      <div className="grid gap-3 xl:grid-cols-[1fr_360px]">
        <Panel
          title="Recent alerts"
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/alerts">
                View all <ArrowUpRight />
              </Link>
            </Button>
          }
          bodyClassName="p-0"
        >
          {(alerts.data?.length ?? 0) === 0 ? (
            <EmptyState icon={<Bell className="size-4" />} title="All quiet">
              No alerts in the last {days} days.
            </EmptyState>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Alert</Th>
                  <Th>Truck</Th>
                  <Th>Severity</Th>
                  <Th>When</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {alerts.data!.slice(0, 6).map((a) => (
                  <Tr key={a.id} onClick={() => router.push(`/alerts?id=${a.id}`)}>
                    <Td className="max-w-[260px] truncate font-medium">{alertLabel(a.type)}</Td>
                    <Td className="font-mono text-xs">{a.truck_id}</Td>
                    <Td>
                      <SeverityPill severity={a.severity} />
                    </Td>
                    <Td className="text-muted-foreground">{timeAgo(a.created_at)}</Td>
                    <Td>
                      {a.acknowledgement ? (
                        <span className="text-xs text-muted-foreground">Acknowledged</span>
                      ) : (
                        <span className="text-xs font-medium">Open</span>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>
        <Panel
          title="Activity"
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/reports">
                Reports <ArrowUpRight />
              </Link>
            </Button>
          }
          bodyClassName="p-0"
        >
          <ol className="max-h-[340px] overflow-y-auto">
            {(activity.data ?? [])
              .filter((e) => e.category !== "user")
              .slice(-10)
              .reverse()
              .map((e, i) => (
                <li key={`${e.ref_id}-${e.event}-${i}`} className="flex gap-3 border-b px-4 py-3 last:border-b-0">
                  <span
                    className={
                      e.event.includes("valve_open_outside") || (e.event === "discharge.opened" && e.description.includes("OUTSIDE"))
                        ? "mt-1.5 size-2 shrink-0 rounded-full bg-critical"
                        : "mt-1.5 size-2 shrink-0 rounded-full bg-ink-3"
                    }
                  />
                  <div className="min-w-0">
                    <p className="text-sm">{e.description}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono">{e.truck_id ?? "system"}</span> · {timeAgo(e.ts)}
                    </p>
                  </div>
                </li>
              ))}
            {(activity.data?.length ?? 0) === 0 && <EmptyState title="No activity yet" />}
          </ol>
        </Panel>
      </div>
    </div>
  );
}
