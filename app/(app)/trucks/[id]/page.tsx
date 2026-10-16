"use client";

import { ArrowLeft, Bell, Cpu, Droplets, Gauge, Navigation, Pencil, Ruler, Satellite, Signal, Timer } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Field, Segmented, Select, Table, Td, Th, Tr } from "@/components/kit/controls";
import { EmptyState, Panel, Skeleton } from "@/components/kit/panel";
import { ActivityPill, Dot, Pill, SeverityPill, ValvePill } from "@/components/kit/status";
import { FleetMap } from "@/components/map";
import { TankGauge } from "@/components/truck/tank-gauge";
import { VolumeChart } from "@/components/truck/volume-chart";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { alertLabel, coord, dateTime, duration, litres, num, timeAgo } from "@/lib/format";
import { useAlerts, useDischarges, useGeofences, useTank, useTelemetry, useTruck, useTruckMutations } from "@/lib/queries";
import type { TankCalibration, TankShape, Truck } from "@/lib/types";

type Window = "1" | "6" | "24";

function Metric({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg border bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="tabular font-mono text-sm font-semibold break-words">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

export default function TruckPage() {
  const { id: raw } = useParams<{ id: string }>();
  const id = decodeURIComponent(raw);
  const router = useRouter();
  const { can } = useAuth();
  const truck = useTruck(id);
  const tank = useTank(id);
  const fences = useGeofences({ truck_id: id });
  const [win, setWin] = useState<Window>("6");
  const since = useMemo(() => new Date(Date.now() - Number(win) * 3600_000).toISOString(), [win]);
  const telemetry = useTelemetry(id, { start: since, limit: 5000, order: "asc" });
  const discharges = useDischarges({ truck_id: id, limit: 50 });
  const alerts = useAlerts({ truck_id: id, limit: 50 });
  const [editOpen, setEditOpen] = useState(false);
  const [tankOpen, setTankOpen] = useState(false);

  if (truck.isLoading) {
    return (
      <div className="grid gap-4 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (!truck.data) {
    return (
      <EmptyState title="Truck not found">
        <Link href="/trucks" className="underline">
          Back to trucks
        </Link>
      </EmptyState>
    );
  }

  const t = truck.data;
  const r = t.latest;
  const track = (telemetry.data ?? []).filter((x) => x.lat != null && x.lon != null).map((x) => [x.lat!, x.lon!] as [number, number]);
  const fenceName = fences.data?.find((f) => f.id === r?.geofence_id)?.name;
  const openDischarge = discharges.data?.find((d) => !d.closed_at);

  return (
    <div className="mx-auto grid max-w-[1400px] gap-5 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="outline" size="icon" className="bg-card" onClick={() => router.push("/trucks")} aria-label="Back">
            <ArrowLeft />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-2xl font-semibold tracking-tight">{t.truck_id}</h1>
              <ActivityPill activity={t.activity} />
              {t.open_alerts > 0 && (
                <Link href={`/alerts?truck_id=${encodeURIComponent(t.truck_id)}`}>
                  <Pill className="border-critical/30 bg-critical/10 text-critical">
                    <Bell className="size-3" /> {t.open_alerts} open
                  </Pill>
                </Link>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {[t.plate, t.driver_name].filter(Boolean).join(" · ") || "No plate or driver set"} · last seen {timeAgo(t.last_seen_at)}
            </p>
          </div>
        </div>
        {can("admin") && (
          <Button variant="outline" size="sm" className="bg-card" onClick={() => setEditOpen(true)}>
            <Pencil /> Edit details
          </Button>
        )}
      </div>

      {/* Twin row: tank / valve / GPS / device */}
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-[1.3fr_1fr_1fr]">
        <Panel
          className="md:col-span-2 2xl:col-span-1"
          title="Tank"
          actions={
            can("admin") && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setTankOpen(true)}>
                <Ruler /> Calibrate
              </Button>
            )
          }
        >
          <div className="grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_11rem]">
            <TankGauge pct={t.fill_pct} valveOpen={r?.valve_open} className="mx-auto max-w-[340px]" />
            <div className="grid gap-3">
              <div>
                <p className="label-caps">Volume</p>
                <p className="tabular font-mono text-3xl font-semibold tracking-tight">
                  {r?.volume_l != null ? num(r.volume_l, 1) : "—"}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">L</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.capacity_l ? `${num(t.fill_pct)}% of ${litres(t.capacity_l, 0)}` : "Tank not calibrated"}
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-y-1 text-xs">
                <dt className="text-muted-foreground">Level</dt>
                <dd className="tabular text-right font-mono">{r?.level_cm != null ? `${num(r.level_cm, 1)} cm` : "—"}</dd>
                <dt className="text-muted-foreground">Sensor</dt>
                <dd className="tabular text-right font-mono">{r?.distance_cm != null ? `${num(r.distance_cm, 1)} cm` : "no echo"}</dd>
              </dl>
            </div>
          </div>
        </Panel>

        <Panel title="Valve">
          <div className="grid h-full content-between gap-4">
            <div>
              <ValvePill open={r?.valve_open} className="text-sm" />
              <p className="mt-3 text-sm">
                {r?.valve_open
                  ? r.geofence_id
                    ? `Discharging inside ${fenceName ?? "an approved geofence"}.`
                    : "Open OUTSIDE any approved geofence."
                  : "Closed. The ESP32 controls the valve locally; this dashboard only observes it."}
              </p>
            </div>
            {openDischarge && (
              <div className={openDischarge.authorized ? "rounded-lg border bg-muted p-3 text-xs" : "rounded-lg border border-critical/30 bg-critical/10 p-3 text-xs"}>
                <p className="font-medium">{openDischarge.authorized ? "Authorized discharge in progress" : "Unauthorized discharge in progress"}</p>
                <p className="tabular mt-0.5 font-mono text-muted-foreground">
                  open for {duration(openDischarge.opened_at, null)} · started at {litres(openDischarge.volume_start_l)}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Metric icon={Droplets} label="Discharges (50)" value={discharges.data?.length ?? "—"} />
              <Metric
                icon={Bell}
                label="Unauthorized"
                value={<span className={(discharges.data?.filter((d) => !d.authorized).length ?? 0) > 0 ? "text-critical" : ""}>{discharges.data?.filter((d) => !d.authorized).length ?? "—"}</span>}
              />
            </div>
          </div>
        </Panel>

        <Panel title="GPS & device">
          <div className="grid grid-cols-2 gap-x-3 gap-y-4">
            <Metric icon={Navigation} label="Speed" value={r?.speed_kmh != null ? `${num(r.speed_kmh)} km/h` : "—"} sub={r?.course_deg != null ? `heading ${num(r.course_deg)}°` : undefined} />
            <Metric
              icon={Satellite}
              label="GPS fix"
              value={
                <span className="flex items-center gap-1.5">
                  <Dot className={r?.gps_fix ? "bg-success" : "bg-warning"} />
                  {r?.gps_fix ? `${r.sats} sats` : "No fix"}
                </span>
              }
              sub={r?.hdop != null ? `HDOP ${num(r.hdop, 1)}` : undefined}
            />
            <Metric icon={Gauge} label="Position" value={coord(r?.lat ?? null, r?.lon ?? null)} sub={fenceName ? `in ${fenceName}` : "outside geofences"} />
            <Metric icon={Signal} label="Signal" value={t.rssi_dbm != null ? `${t.rssi_dbm} dBm` : "—"} />
            <Metric icon={Cpu} label="Firmware" value={t.firmware_version ?? "—"} />
            <Metric icon={Timer} label="Uptime" value={t.uptime_s != null ? duration(new Date(Date.now() - t.uptime_s * 1000).toISOString(), null) : "—"} />
          </div>
        </Panel>
      </div>

      {/* Chart + map */}
      <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <Panel
          title="Tank volume"
          subtitle="Red bands = valve open"
          actions={
            <Segmented
              value={win}
              onChange={setWin}
              options={[
                { value: "1", label: "1 h" },
                { value: "6", label: "6 h" },
                { value: "24", label: "24 h" },
              ]}
            />
          }
        >
          {telemetry.isLoading ? (
            <Skeleton className="h-[220px]" />
          ) : (telemetry.data?.length ?? 0) === 0 ? (
            <EmptyState title="No readings in this window" />
          ) : !t.capacity_l ? (
            <EmptyState title="Tank not calibrated">Set the tank geometry to turn the ultrasonic distance into litres.</EmptyState>
          ) : (
            <VolumeChart readings={telemetry.data!} capacity={t.capacity_l} />
          )}
        </Panel>
        <Panel title="Route" subtitle={`${track.length} positions in the last ${win} h`} bodyClassName="p-0">
          <FleetMap trucks={[t]} geofences={fences.data} selectedTruckId={t.truck_id} track={track} className="h-[260px] rounded-b-xl" />
        </Panel>
      </div>

      {/* Discharges + alerts */}
      <div className="grid gap-3 xl:grid-cols-2">
        <Panel title="Discharges" bodyClassName="p-0">
          {(discharges.data?.length ?? 0) === 0 ? (
            <EmptyState icon={<Droplets className="size-4" />} title="No discharges yet" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Opened</Th>
                  <Th>Duration</Th>
                  <Th>Where</Th>
                  <Th className="text-right">Litres</Th>
                </tr>
              </thead>
              <tbody>
                {discharges.data!.slice(0, 8).map((d) => (
                  <Tr key={d.id}>
                    <Td className="text-muted-foreground">{dateTime(d.opened_at)}</Td>
                    <Td className="tabular font-mono text-xs">{d.closed_at ? duration(d.opened_at, d.closed_at) : "open"}</Td>
                    <Td>
                      {d.authorized ? (
                        <Pill>Inside geofence</Pill>
                      ) : (
                        <Pill className="border-critical/30 bg-critical/10 text-critical">Unauthorized</Pill>
                      )}
                    </Td>
                    <Td className="tabular text-right font-mono">{litres(d.litres)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>
        <Panel title="Alerts" bodyClassName="p-0">
          {(alerts.data?.length ?? 0) === 0 ? (
            <EmptyState icon={<Bell className="size-4" />} title="No alerts" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Alert</Th>
                  <Th>Severity</Th>
                  <Th>When</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {alerts.data!.slice(0, 8).map((a) => (
                  <Tr key={a.id} onClick={() => router.push(`/alerts?id=${a.id}`)}>
                    <Td className="max-w-[220px] truncate">{alertLabel(a.type)}</Td>
                    <Td>
                      <SeverityPill severity={a.severity} />
                    </Td>
                    <Td className="text-muted-foreground">{timeAgo(a.created_at)}</Td>
                    <Td className="text-xs">{a.acknowledgement ? <span className="text-muted-foreground">Acknowledged</span> : "Open"}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>
      </div>

      <EditTruckDialog truck={t} open={editOpen} onOpenChange={setEditOpen} />
      <TankDialog truckId={t.truck_id} current={tank.data ?? null} open={tankOpen} onOpenChange={setTankOpen} />
    </div>
  );
}

function EditTruckDialog({ truck, open, onOpenChange }: { truck: Truck; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { update } = useTruckMutations();
  const [form, setForm] = useState({ plate: truck.plate ?? "", driver_name: truck.driver_name ?? "", notes: truck.notes ?? "" });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await update.mutateAsync({ id: truck.truck_id, plate: form.plate || null, driver_name: form.driver_name || null, notes: form.notes || null });
      toast.success("Truck updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update truck");
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl bg-card sm:max-w-md">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Edit {truck.truck_id}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Plate">
              <Input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} />
            </Field>
            <Field label="Driver">
              <Input value={form.driver_name} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} />
            </Field>
          </div>
          <Field label="Notes">
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={update.isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const SHAPES: { value: TankShape; label: string; fields: ("length_cm" | "width_cm" | "height_cm" | "diameter_cm")[] }[] = [
  { value: "rectangular", label: "Rectangular box", fields: ["length_cm", "width_cm", "height_cm"] },
  { value: "vertical_cylinder", label: "Vertical cylinder", fields: ["diameter_cm", "height_cm"] },
  { value: "horizontal_cylinder", label: "Horizontal cylinder (tanker)", fields: ["diameter_cm", "length_cm"] },
];
const FIELD_LABEL = { length_cm: "Length (cm)", width_cm: "Width (cm)", height_cm: "Inner height (cm)", diameter_cm: "Inner diameter (cm)" };

function TankDialog({ truckId, current, open, onOpenChange }: { truckId: string; current: TankCalibration | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { tank } = useTruckMutations();
  const [shape, setShape] = useState<TankShape>(current?.shape ?? "rectangular");
  const [dims, setDims] = useState<Record<string, string>>({
    length_cm: current?.length_cm?.toString() ?? "",
    width_cm: current?.width_cm?.toString() ?? "",
    height_cm: current?.height_cm?.toString() ?? "",
    diameter_cm: current?.diameter_cm?.toString() ?? "",
    sensor_offset_cm: current?.sensor_offset_cm?.toString() ?? "0",
  });
  const fields = SHAPES.find((s) => s.value === shape)!.fields;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = (k: string) => (dims[k] ? Number(dims[k]) : null);
    try {
      const res = await tank.mutateAsync({
        id: truckId,
        shape,
        length_cm: fields.includes("length_cm") ? n("length_cm") : null,
        width_cm: fields.includes("width_cm") ? n("width_cm") : null,
        height_cm: fields.includes("height_cm") ? n("height_cm") : null,
        diameter_cm: fields.includes("diameter_cm") ? n("diameter_cm") : null,
        sensor_offset_cm: Number(dims.sensor_offset_cm || 0),
      });
      toast.success("Tank calibrated", { description: `Capacity ${litres(res.capacity_l)}. Applies to new readings.` });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save calibration");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl bg-card sm:max-w-md">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Tank calibration</DialogTitle>
            <DialogDescription>Inner dimensions of the tank. The sensor offset is what the ultrasonic sensor reads when the tank is full.</DialogDescription>
          </DialogHeader>
          <Field label="Shape">
            <Select value={shape} onChange={(e) => setShape(e.target.value as TankShape)}>
              {SHAPES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            {fields.map((f) => (
              <Field key={f} label={FIELD_LABEL[f]}>
                <Input type="number" step="0.1" min="0.1" required value={dims[f]} onChange={(e) => setDims({ ...dims, [f]: e.target.value })} className="font-mono" />
              </Field>
            ))}
            <Field label="Sensor offset (cm)">
              <Input type="number" step="0.1" min="0" value={dims.sensor_offset_cm} onChange={(e) => setDims({ ...dims, sensor_offset_cm: e.target.value })} className="font-mono" />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={tank.isPending}>
              {tank.isPending ? "Saving…" : "Save calibration"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
