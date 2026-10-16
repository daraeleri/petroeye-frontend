"use client";

import { Bell, CheckCircle2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { Field, Segmented, Select, Table, Td, Textarea, Th, Tr } from "@/components/kit/controls";
import { EmptyState, PageHeader, Panel, Skeleton } from "@/components/kit/panel";
import { SeverityPill } from "@/components/kit/status";
import { FleetMap } from "@/components/map";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { alertLabel, coord, dateTime, timeAgo } from "@/lib/format";
import { useAcknowledge, useAlerts, useTrucks } from "@/lib/queries";
import type { Alert, Severity } from "@/lib/types";

type Status = "open" | "acknowledged" | "all";

export default function AlertsPage() {
  return (
    <Suspense>
      <AlertsView />
    </Suspense>
  );
}

function AlertsView() {
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get("id");
  const [status, setStatus] = useState<Status>("open");
  const [severity, setSeverity] = useState<"" | Severity>("");
  const [truckId, setTruckId] = useState(params.get("truck_id") ?? "");
  const trucks = useTrucks();

  const query = {
    acknowledged: status === "all" ? undefined : status === "acknowledged",
    severity: severity || undefined,
    truck_id: truckId || undefined,
    limit: 500,
  };
  const { data, isLoading } = useAlerts(query);
  const all = useAlerts({ limit: 500 });
  const selected = (data ?? []).find((a) => a.id === selectedId) ?? (all.data ?? []).find((a) => a.id === selectedId) ?? null;
  const openCritical = (all.data ?? []).filter((a) => !a.acknowledgement && a.severity === "critical").length;

  const select = (id: string | null) => {
    const sp = new URLSearchParams(params.toString());
    if (id) sp.set("id", id);
    else sp.delete("id");
    router.replace(`/alerts${sp.toString() ? `?${sp}` : ""}`, { scroll: false });
  };

  return (
    <div className="mx-auto grid max-w-[1400px] gap-5 p-4 md:p-6">
      <PageHeader
        title="Alerts"
        description="Rule-engine alerts from every truck. Acknowledge them once handled — the original alert is never changed."
      />
      {openCritical > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-critical/30 bg-critical/10 px-4 py-3 text-sm">
          <ShieldAlert className="size-5 shrink-0 text-critical" />
          <p>
            <span className="font-semibold text-critical">{openCritical} critical</span> alert{openCritical > 1 ? "s" : ""} waiting for review —
            usually a valve opened outside an approved geofence.
          </p>
        </div>
      )}
      <Panel
        title={`${data?.length ?? 0} alerts`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={truckId} onChange={(e) => setTruckId(e.target.value)} className="h-8 text-xs">
              <option value="">All trucks</option>
              {(trucks.data ?? []).map((t) => (
                <option key={t.truck_id} value={t.truck_id}>
                  {t.truck_id}
                </option>
              ))}
            </Select>
            <Select value={severity} onChange={(e) => setSeverity(e.target.value as "" | Severity)} className="h-8 text-xs">
              <option value="">All severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </Select>
            <Segmented
              value={status}
              onChange={setStatus}
              options={[
                { value: "open", label: "Open" },
                { value: "acknowledged", label: "Acknowledged" },
                { value: "all", label: "All" },
              ]}
            />
          </div>
        }
        bodyClassName="p-0"
      >
        {isLoading ? (
          <div className="grid gap-2 p-4">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : (data?.length ?? 0) === 0 ? (
          <EmptyState icon={status === "open" ? <CheckCircle2 className="size-4" /> : <Bell className="size-4" />} title={status === "open" ? "Nothing to review" : "No alerts"}>
            {status === "open" ? "Every alert has been acknowledged." : "Try other filters."}
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
              {data!.map((a) => (
                <Tr key={a.id} onClick={() => select(a.id)} className={a.id === selectedId ? "bg-muted/60" : undefined}>
                  <Td>
                    <p className="font-medium">{alertLabel(a.type)}</p>
                    <p className="max-w-[360px] truncate text-xs text-muted-foreground">{a.message}</p>
                  </Td>
                  <Td className="font-mono text-xs">{a.truck_id}</Td>
                  <Td>
                    <SeverityPill severity={a.severity} />
                  </Td>
                  <Td className="text-muted-foreground" >
                    <span title={dateTime(a.created_at)}>{timeAgo(a.created_at)}</span>
                  </Td>
                  <Td className="text-xs">
                    {a.acknowledgement ? (
                      <span className="text-muted-foreground">by {a.acknowledgement.user_email ?? "user"}</span>
                    ) : (
                      <span className="font-medium">Open</span>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      <Sheet open={!!selected} onOpenChange={(o) => !o && select(null)}>
        <SheetContent className="w-full overflow-y-auto bg-card sm:max-w-lg">{selected && <AlertDetail alert={selected} />}</SheetContent>
      </Sheet>
    </div>
  );
}

/** Human-readable version of the rule's `triggered_by` values. */
function explain(a: Alert): { label: string; value: string }[] {
  const t = (a.triggered_by ?? {}) as Record<string, unknown>;
  const rows: { label: string; value: string }[] = [];
  const add = (label: string, v: unknown, suffix = "") => v !== undefined && v !== null && rows.push({ label, value: `${v}${suffix}` });
  if (a.type === "valve_open_outside_geofence") {
    const reason = String(t.reason ?? "");
    add("Why", reason === "no_gps_fix" ? "Valve opened with no GPS fix (location can't be confirmed)" : reason === "left_geofence_with_valve_open" ? "Truck left the geofence with the valve still open" : "Valve opened outside every approved geofence");
    add("Nearest geofence", t.nearest_geofence_name);
    add("Distance to it", t.distance_to_nearest_m, " m");
    add("Its radius", t.nearest_radius_m, " m");
  } else if (a.type === "volume_drop_valve_closed") {
    add("Volume before", t.previous_volume_l, " L");
    add("Volume after", t.current_volume_l, " L");
    add("Drop", t.drop_l, " L");
    add("Allowed per reading", t.max_drop_l, " L");
  } else {
    for (const [k, v] of Object.entries(t)) add(k.replaceAll("_", " "), typeof v === "object" ? JSON.stringify(v) : v);
  }
  return rows;
}

function AlertDetail({ alert: a }: { alert: Alert }) {
  const { can } = useAuth();
  const ack = useAcknowledge();
  const [note, setNote] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ack.mutateAsync({ id: a.id, note: note.trim() || undefined });
      toast.success("Alert acknowledged");
      setNote("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not acknowledge");
    }
  };

  return (
    <div className="grid gap-5">
      <SheetHeader className="p-0">
        <div className="flex items-center gap-2">
          <SeverityPill severity={a.severity} />
          <span className="font-mono text-xs text-muted-foreground">{dateTime(a.created_at)}</span>
        </div>
        <SheetTitle className="text-xl">{alertLabel(a.type)}</SheetTitle>
        <SheetDescription>{a.message}</SheetDescription>
      </SheetHeader>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border p-3">
          <p className="label-caps">Truck</p>
          <Link href={`/trucks/${encodeURIComponent(a.truck_id)}`} className="mt-1 block font-mono font-semibold underline-offset-4 hover:underline">
            {a.truck_id}
          </Link>
        </div>
        <div className="rounded-lg border p-3">
          <p className="label-caps">Position</p>
          <p className="tabular mt-1 font-mono text-xs">{coord(a.lat, a.lon)}</p>
        </div>
      </div>

      {a.lat !== null && a.lon !== null && (
        <div className="overflow-hidden rounded-lg border">
          <FleetMap trucks={[]} pins={[{ lat: a.lat, lon: a.lon, label: alertLabel(a.type), tone: a.severity === "critical" ? "critical" : "ink" }]} className="h-48" controls={false} />
        </div>
      )}

      <div>
        <p className="label-caps mb-2">Details</p>
        <dl className="divide-y rounded-lg border">
          {explain(a).map((r) => (
            <div key={r.label} className="flex justify-between gap-4 px-3 py-2 text-sm">
              <dt className="text-muted-foreground capitalize">{r.label}</dt>
              <dd className="tabular text-right font-medium">{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div>
        <p className="label-caps mb-2">Audit</p>
        <p className="font-mono text-[11px] break-all text-muted-foreground">SHA-256 {a.digest ?? "—"}</p>
        <p className="mt-1 text-xs text-muted-foreground">{a.onchain_tx_hash ? `Anchored: ${a.onchain_tx_hash}` : "Not anchored on-chain yet (anchoring is a later phase)."}</p>
      </div>

      {a.acknowledgement ? (
        <div className="rounded-lg border bg-muted p-3 text-sm">
          <p className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="size-4" /> Acknowledged by {a.acknowledgement.user_email ?? "a user"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{dateTime(a.acknowledgement.created_at)}</p>
          {a.acknowledgement.note && <p className="mt-2">{a.acknowledgement.note}</p>}
        </div>
      ) : can("admin", "operator") ? (
        <form onSubmit={submit} className="grid gap-3">
          <Field label="Acknowledge" hint="Say what happened or what was done. This is final and goes into the activity report.">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Test button pressed at the yard; driver informed." />
          </Field>
          <Button type="submit" disabled={ack.isPending}>
            <CheckCircle2 /> {ack.isPending ? "Saving…" : "Acknowledge alert"}
          </Button>
        </form>
      ) : (
        <p className="text-xs text-muted-foreground">An operator or admin can acknowledge this alert.</p>
      )}
    </div>
  );
}
