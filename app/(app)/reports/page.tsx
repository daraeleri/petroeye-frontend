"use client";

import { FileJson, FileSpreadsheet, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Field, Select } from "@/components/kit/controls";
import { EmptyState, PageHeader, Panel, Skeleton } from "@/components/kit/panel";
import { StatCard } from "@/components/kit/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadReport, type ExportKind } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { alertLabel, dateTime, num } from "@/lib/format";
import { useActivity, useSummary, useTrucks } from "@/lib/queries";
import type { ActivityEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

const toDateInput = (d: Date) => d.toISOString().slice(0, 10);

const EXPORTS: { kind: ExportKind; title: string; text: string; admin?: boolean }[] = [
  { kind: "activity", title: "Activity log", text: "Discharges, alerts, acknowledgements, device and configuration events in one timeline." },
  { kind: "discharges", title: "Discharges", text: "Each valve session with location, geofence, duration and litres." },
  { kind: "alerts", title: "Alerts", text: "Every alert with its explanation and acknowledgement." },
  { kind: "telemetry", title: "Telemetry", text: "Raw readings: GPS, ultrasonic distance, level, volume, valve (max 100,000 rows)." },
  { kind: "audit", title: "Audit log", text: "Full audit trail including logins and exports.", admin: true },
];

const CATEGORY_DOT: Record<ActivityEntry["category"], string> = {
  discharge: "bg-ink",
  alert: "bg-critical",
  acknowledgement: "bg-success",
  device: "bg-ink-3",
  user: "bg-ink-3",
};

export default function ReportsPage() {
  const { can } = useAuth();
  const trucks = useTrucks();
  const [from, setFrom] = useState(() => toDateInput(new Date(Date.now() - 29 * 86_400_000)));
  const [to, setTo] = useState(() => toDateInput(new Date()));
  const [truckId, setTruckId] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const range = useMemo(
    () => ({
      start: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
      end: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
      truck_id: truckId || undefined,
    }),
    [from, to, truckId],
  );
  const summary = useSummary(range);
  const activity = useActivity(range);
  const s = summary.data;

  const download = async (kind: ExportKind, format: "csv" | "json") => {
    setBusy(`${kind}.${format}`);
    try {
      await downloadReport(kind, format, range);
      toast.success(`${kind} report downloaded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto grid max-w-[1400px] gap-5 p-4 md:p-6">
      <PageHeader title="Reports" description="Pick a period and a truck, review the summary, then export what you need." />

      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
        <Field label="From">
          <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="h-9 w-40 bg-card font-mono" />
        </Field>
        <Field label="To">
          <Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="h-9 w-40 bg-card font-mono" />
        </Field>
        <Field label="Truck">
          <Select value={truckId} onChange={(e) => setTruckId(e.target.value)} className="w-44">
            <option value="">All trucks</option>
            {(trucks.data ?? []).map((t) => (
              <option key={t.truck_id} value={t.truck_id}>
                {t.truck_id}
              </option>
            ))}
          </Select>
        </Field>
        <div className="ml-auto flex gap-2 text-xs text-muted-foreground">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              className="rounded-md border px-2.5 py-1.5 hover:bg-muted hover:text-foreground"
              onClick={() => {
                setFrom(toDateInput(new Date(Date.now() - (d - 1) * 86_400_000)));
                setTo(toDateInput(new Date()));
              }}
            >
              Last {d} days
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Discharges" value={s?.discharges_total ?? 0} loading={summary.isLoading} footnote={`${s?.discharges_authorized ?? 0} authorized`} />
        <StatCard label="Litres" value={num(s?.litres_discharged, 1)} unit="L" loading={summary.isLoading} footnote="discharged in period" />
        <StatCard
          label="Unauthorized"
          value={s?.discharges_unauthorized ?? 0}
          tone={s && s.discharges_unauthorized > 0 ? "critical" : undefined}
          loading={summary.isLoading}
          footnote="valve opened outside geofences"
        />
        <StatCard label="Alerts" value={s?.alerts_total ?? 0} loading={summary.isLoading} footnote={`${s?.alerts_unacknowledged ?? 0} not acknowledged · ${num(s?.telemetry_points)} readings`} />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_420px]">
        <Panel title="Activity timeline" subtitle={`${activity.data?.length ?? 0} events`} bodyClassName="p-0">
          {activity.isLoading ? (
            <div className="grid gap-2 p-4">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : (activity.data?.length ?? 0) === 0 ? (
            <EmptyState title="Nothing happened in this period" />
          ) : (
            <ol className="max-h-[560px] overflow-y-auto">
              {[...activity.data!].reverse().map((e, i) => (
                <li key={`${e.ref_id}-${e.event}-${i}`} className="grid grid-cols-[auto_1fr_auto] items-start gap-3 border-b px-4 py-3 last:border-b-0">
                  <span
                    className={cn(
                      "mt-1.5 size-2 rounded-full",
                      e.event === "discharge.opened" && e.description.includes("OUTSIDE") ? "bg-critical" : CATEGORY_DOT[e.category],
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-sm">{e.event.startsWith("alert.") && e.category === "alert" ? `${alertLabel(e.event.slice(6))} — ${e.description}` : e.description}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono">{e.truck_id ?? "system"}</span> · {e.category}
                    </p>
                  </div>
                  <span className="tabular font-mono text-[11px] whitespace-nowrap text-muted-foreground">{dateTime(e.ts)}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel title="Export" subtitle="Files use the period and truck selected above">
          <div className="grid gap-2.5">
            {EXPORTS.filter((x) => !x.admin || can("admin")).map((x) => (
              <div key={x.kind} className="grid gap-2 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{x.title}</p>
                  <p className="text-xs text-muted-foreground">{x.text}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="h-8" onClick={() => download(x.kind, "csv")} disabled={!!busy}>
                    {busy === `${x.kind}.csv` ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />} CSV
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 bg-card" onClick={() => download(x.kind, "json")} disabled={!!busy}>
                    {busy === `${x.kind}.json` ? <Loader2 className="animate-spin" /> : <FileJson />} JSON
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
