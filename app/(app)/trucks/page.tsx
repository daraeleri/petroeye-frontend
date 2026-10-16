"use client";

import { Plus, Search, Truck as TruckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Field, Segmented, Table, Td, Th, Tr } from "@/components/kit/controls";
import { EmptyState, PageHeader, Panel, Skeleton } from "@/components/kit/panel";
import { ActivityPill, FillBar, ValvePill } from "@/components/kit/status";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { litres, timeAgo } from "@/lib/format";
import { useTruckMutations, useTrucks } from "@/lib/queries";
import type { Activity } from "@/lib/types";

type Filter = "all" | Activity | "alerts";

export default function TrucksPage() {
  const router = useRouter();
  const { can } = useAuth();
  const { data, isLoading } = useTrucks();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const fleet = data ?? [];
  const q = query.trim().toLowerCase();
  const rows = fleet.filter(
    (t) =>
      (filter === "all" || (filter === "alerts" ? t.open_alerts > 0 : t.activity === filter)) &&
      (!q || [t.truck_id, t.plate, t.driver_name].some((v) => v?.toLowerCase().includes(q))),
  );
  const count = (f: Filter) => fleet.filter((t) => (f === "alerts" ? t.open_alerts > 0 : t.activity === f)).length;

  return (
    <div className="mx-auto grid max-w-[1400px] gap-5 p-4 md:p-6">
      <PageHeader
        title="Trucks"
        description="Every registered truck with its live tank level, valve state and connectivity."
        actions={
          can("admin") && (
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus /> Register truck
            </Button>
          )
        }
      />
      <Panel
        title={`${rows.length} of ${fleet.length} trucks`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ID, plate, driver" className="h-8 w-52 bg-card pl-8 text-xs" />
            </div>
            <Segmented
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "All" },
                { value: "moving", label: `Moving ${count("moving")}` },
                { value: "discharging", label: `Discharging ${count("discharging")}` },
                { value: "offline", label: `Offline ${count("offline")}` },
                { value: "alerts", label: `With alerts ${count("alerts")}` },
              ]}
            />
          </div>
        }
        bodyClassName="p-0"
      >
        {isLoading ? (
          <div className="grid gap-2 p-4">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={<TruckIcon className="size-4" />} title={fleet.length ? "No trucks match" : "No trucks yet"}>
            {fleet.length ? "Try another filter." : "Trucks appear when their ESP32 first connects, or register one here."}
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Truck</Th>
                <Th>Status</Th>
                <Th>Valve</Th>
                <Th className="w-[220px]">Tank</Th>
                <Th>Speed</Th>
                <Th>Alerts</Th>
                <Th>Last seen</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <Tr key={t.truck_id} onClick={() => router.push(`/trucks/${encodeURIComponent(t.truck_id)}`)}>
                  <Td>
                    <p className="font-mono font-semibold">{t.truck_id}</p>
                    <p className="text-xs text-muted-foreground">{[t.plate, t.driver_name].filter(Boolean).join(" · ") || "—"}</p>
                  </Td>
                  <Td>
                    <ActivityPill activity={t.activity} />
                  </Td>
                  <Td>
                    <ValvePill open={t.latest?.valve_open} />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <FillBar pct={t.fill_pct} className="w-28" />
                      <span className="tabular font-mono text-xs">{t.capacity_l ? litres(t.latest?.volume_l) : "not calibrated"}</span>
                    </div>
                  </Td>
                  <Td className="tabular font-mono text-xs">{t.latest?.speed_kmh != null ? `${Math.round(t.latest.speed_kmh)} km/h` : "—"}</Td>
                  <Td>
                    {t.open_alerts > 0 ? (
                      <span className="tabular rounded-full bg-critical px-2 py-0.5 font-mono text-[11px] font-semibold text-white">{t.open_alerts}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </Td>
                  <Td className="text-muted-foreground">{timeAgo(t.last_seen_at)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
      <RegisterTruckDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

function RegisterTruckDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { create } = useTruckMutations();
  const router = useRouter();
  const [form, setForm] = useState({ truck_id: "", plate: "", driver_name: "" });
  const valid = /^[A-Za-z0-9_-]{1,64}$/.test(form.truck_id);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const t = await create.mutateAsync({
        truck_id: form.truck_id,
        plate: form.plate || undefined,
        driver_name: form.driver_name || undefined,
      });
      toast.success(`${t.truck_id} registered`, { description: "Set its tank calibration so volume can be computed." });
      onOpenChange(false);
      router.push(`/trucks/${encodeURIComponent(t.truck_id)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not register truck");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl bg-card sm:max-w-md">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Register truck</DialogTitle>
            <DialogDescription>
              The ID must match the one in the ESP32 firmware (MQTT topic <span className="font-mono">petrotwin/&lt;id&gt;/…</span>).
            </DialogDescription>
          </DialogHeader>
          <Field label="Truck ID" hint={form.truck_id && !valid ? "Letters, digits, - and _ only" : "e.g. truck-002"}>
            <Input value={form.truck_id} onChange={(e) => setForm({ ...form, truck_id: e.target.value.trim() })} className="font-mono" required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Plate (optional)">
              <Input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} />
            </Field>
            <Field label="Driver (optional)">
              <Input value={form.driver_name} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!valid || create.isPending}>
              {create.isPending ? "Registering…" : "Register"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
