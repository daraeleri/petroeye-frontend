"use client";

import { Droplets } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Segmented, Select, Table, Td, Th, Tr } from "@/components/kit/controls";
import { EmptyState, PageHeader, Panel, Skeleton } from "@/components/kit/panel";
import { StatCard } from "@/components/kit/stat-card";
import { Dot, Pill } from "@/components/kit/status";
import { dateTime, daysAgoIso, duration, litres, num } from "@/lib/format";
import { useDischarges, useGeofences, useTrucks } from "@/lib/queries";

type Kind = "all" | "authorized" | "unauthorized" | "open";
type Range = "7" | "30" | "90";

export default function DischargesPage() {
  const router = useRouter();
  const [kind, setKind] = useState<Kind>("all");
  const [range, setRange] = useState<Range>("30");
  const [truckId, setTruckId] = useState("");
  const start = useMemo(() => daysAgoIso(Number(range)), [range]);
  const trucks = useTrucks();
  const fences = useGeofences({ include_inactive: true });
  const { data, isLoading } = useDischarges({
    start,
    truck_id: truckId || undefined,
    authorized: kind === "authorized" ? true : kind === "unauthorized" ? false : undefined,
    open_only: kind === "open" || undefined,
    limit: 1000,
  });
  const rows = data ?? [];
  const fenceName = (id: string | null) => fences.data?.find((f) => f.id === id)?.name;
  const total = rows.reduce((s, d) => s + Math.max(0, d.litres ?? 0), 0);
  const unauthorized = rows.filter((d) => !d.authorized);

  return (
    <div className="mx-auto grid max-w-[1400px] gap-5 p-4 md:p-6">
      <PageHeader
        title="Discharges"
        description="Every valve opening, from open to close: where it happened, whether it was inside an approved geofence, and how much left the tank."
        actions={
          <Segmented
            value={range}
            onChange={setRange}
            options={[
              { value: "7", label: "7 days" },
              { value: "30", label: "30 days" },
              { value: "90", label: "90 days" },
            ]}
          />
        }
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Sessions" value={rows.length} loading={isLoading} footnote={`${rows.filter((d) => !d.closed_at).length} still open`} />
        <StatCard label="Litres discharged" value={num(total, 1)} unit="L" loading={isLoading} footnote="closed, calibrated sessions" />
        <StatCard
          label="Unauthorized"
          value={unauthorized.length}
          tone={unauthorized.length ? "critical" : undefined}
          loading={isLoading}
          footnote={`${litres(unauthorized.reduce((s, d) => s + Math.max(0, d.litres ?? 0), 0))} outside geofences`}
        />
      </div>
      <Panel
        title={`${rows.length} sessions`}
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
            <Segmented
              value={kind}
              onChange={setKind}
              options={[
                { value: "all", label: "All" },
                { value: "authorized", label: "Authorized" },
                { value: "unauthorized", label: "Unauthorized" },
                { value: "open", label: "Open now" },
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
        ) : rows.length === 0 ? (
          <EmptyState icon={<Droplets className="size-4" />} title="No discharges in this period" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Truck</Th>
                <Th>Opened</Th>
                <Th>Duration</Th>
                <Th>Location</Th>
                <Th className="text-right">Start</Th>
                <Th className="text-right">End</Th>
                <Th className="text-right">Litres</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <Tr key={d.id} onClick={() => (d.alert_id ? router.push(`/alerts?id=${d.alert_id}`) : router.push(`/trucks/${encodeURIComponent(d.truck_id)}`))}>
                  <Td className="font-mono text-xs font-semibold">{d.truck_id}</Td>
                  <Td className="text-muted-foreground">{dateTime(d.opened_at)}</Td>
                  <Td className="tabular font-mono text-xs">
                    {d.closed_at ? (
                      duration(d.opened_at, d.closed_at)
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Dot className="bg-ink" pulse /> open {duration(d.opened_at, null)}
                      </span>
                    )}
                  </Td>
                  <Td>
                    {d.authorized ? (
                      <Pill>{fenceName(d.geofence_id) ?? "Inside geofence"}</Pill>
                    ) : (
                      <Pill className="border-critical/30 bg-critical/10 text-critical">Outside geofences</Pill>
                    )}
                  </Td>
                  <Td className="tabular text-right font-mono text-xs text-muted-foreground">{litres(d.volume_start_l)}</Td>
                  <Td className="tabular text-right font-mono text-xs text-muted-foreground">{litres(d.volume_end_l)}</Td>
                  <Td className="tabular text-right font-mono font-semibold">{litres(d.litres)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
    </div>
  );
}
