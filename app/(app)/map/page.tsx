"use client";

import { ArrowUpRight, ChevronDown, Crosshair, MapPin, Pencil, Plus, Search, Trash2, Truck as TruckIcon, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Field, Segmented, Select, Textarea } from "@/components/kit/controls";
import { EmptyState } from "@/components/kit/panel";
import { ActivityPill, Dot, FillBar, ValvePill } from "@/components/kit/status";
import { FleetMap } from "@/components/map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { coord, litres, num, timeAgo } from "@/lib/format";
import { useGeofenceMutations, useGeofences, useTelemetry, useTrucks } from "@/lib/queries";
import type { Geofence, Truck } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "trucks" | "geofences";

interface Draft {
  id?: string;
  name: string;
  description: string;
  lat: number | null;
  lon: number | null;
  radius_m: number;
  truck_id: string;
}

const EMPTY_DRAFT: Draft = { name: "", description: "", lat: null, lon: null, radius_m: 150, truck_id: "" };

export default function MapPage() {
  const { can } = useAuth();
  const canEdit = can("admin", "operator");
  const trucks = useTrucks();
  const fences = useGeofences();
  const { create, update, deactivate } = useGeofenceMutations();

  const [tab, setTab] = useState<Tab>("trucks");
  const [query, setQuery] = useState("");
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null);
  const [selectedFence, setSelectedFence] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  // On phones the list starts folded so the map stays visible.
  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) setCollapsed(true);
  }, []);

  const since = useMemo(() => new Date(Date.now() - 2 * 3600_000).toISOString(), [selectedTruck]); // eslint-disable-line react-hooks/exhaustive-deps
  const track = useTelemetry(selectedTruck ?? "", { start: since, limit: 1000, order: "asc" });
  const trackPoints = useMemo<[number, number][]>(
    () => (selectedTruck ? (track.data ?? []).filter((r) => r.lat != null && r.lon != null).map((r) => [r.lat!, r.lon!]) : []),
    [track.data, selectedTruck],
  );

  const fleet = trucks.data ?? [];
  const fenceList = fences.data ?? [];
  const q = query.trim().toLowerCase();
  const filteredTrucks = fleet.filter((t) => !q || [t.truck_id, t.plate, t.driver_name].some((v) => v?.toLowerCase().includes(q)));
  const filteredFences = fenceList.filter((g) => !q || g.name.toLowerCase().includes(q));
  const truck = fleet.find((t) => t.truck_id === selectedTruck) ?? null;

  const startNew = () => {
    setTab("geofences");
    setSelectedFence(null);
    setSelectedTruck(null);
    setDraft({ ...EMPTY_DRAFT });
  };
  const startEdit = (g: Geofence) => {
    setSelectedFence(g.id);
    setDraft({ id: g.id, name: g.name, description: g.description ?? "", lat: g.lat, lon: g.lon, radius_m: g.radius_m, truck_id: g.truck_id ?? "" });
  };

  const save = async () => {
    if (!draft || draft.lat === null || draft.lon === null || !draft.name.trim()) return;
    const body = {
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      lat: draft.lat,
      lon: draft.lon,
      radius_m: draft.radius_m,
      truck_id: draft.truck_id || null,
    };
    try {
      if (draft.id) {
        await update.mutateAsync({ id: draft.id, ...body });
        toast.success("Geofence updated");
      } else {
        const g = await create.mutateAsync(body);
        setSelectedFence(g.id);
        toast.success("Geofence created", { description: "The valve may now open inside it." });
      }
      setDraft(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save geofence");
    }
  };

  const remove = async (g: Geofence) => {
    try {
      await deactivate.mutateAsync(g.id);
      toast.success(`"${g.name}" deactivated`, { description: "It no longer authorizes discharges." });
      setSelectedFence(null);
      setDraft(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not deactivate");
    }
  };

  return (
    <div className="relative h-[calc(100dvh-3.5rem)]">
      <FleetMap
        trucks={fleet}
        geofences={draft?.id ? fenceList.filter((g) => g.id !== draft.id) : fenceList}
        selectedTruckId={selectedTruck}
        selectedFenceId={selectedFence}
        onSelectTruck={(id) => {
          setSelectedTruck(id);
          setSelectedFence(null);
          setTab("trucks");
        }}
        onSelectFence={(id) => {
          if (draft) return;
          setSelectedFence(id);
          setSelectedTruck(null);
          setTab("geofences");
        }}
        track={trackPoints}
        draft={draft && draft.lat !== null && draft.lon !== null ? { lat: draft.lat, lon: draft.lon, radius_m: draft.radius_m } : null}
        onMapClick={draft ? (lat, lon) => setDraft((d) => (d ? { ...d, lat, lon } : d)) : undefined}
        className="absolute inset-0"
      />

      {/* Floating side panel */}
      <div className="pointer-events-none absolute inset-y-3 left-3 z-[600] flex w-[340px] max-w-[calc(100%-1.5rem)] flex-col gap-3">
        <div className="pointer-events-auto flex max-h-full min-h-0 flex-col rounded-xl border bg-card/95 shadow-lg backdrop-blur">
          {draft ? (
            <GeofenceForm
              draft={draft}
              setDraft={setDraft}
              trucks={fleet}
              saving={create.isPending || update.isPending}
              onCancel={() => setDraft(null)}
              onSave={save}
            />
          ) : (
            <>
              <div className={cn("grid gap-3 p-3", !collapsed && "border-b")}>
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setCollapsed((c) => !c)}
                    className="flex min-w-0 items-center gap-1.5 text-left"
                    aria-expanded={!collapsed}
                  >
                    <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", collapsed && "-rotate-90")} />
                    <span className="min-w-0">
                    <p className="text-sm font-semibold">Live map</p>
                    <p className="text-xs text-muted-foreground">
                      {fleet.length} trucks · {fenceList.length} geofences
                    </p>
                    </span>
                  </button>
                  {canEdit && (
                    <Button size="sm" onClick={startNew}>
                      <Plus /> Geofence
                    </Button>
                  )}
                </div>
                {!collapsed && (
                <>
                <div className="relative">
                  <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search trucks or places…" className="h-9 bg-card pl-8" />
                </div>
                <Segmented
                  value={tab}
                  onChange={setTab}
                  options={[
                    { value: "trucks", label: `Trucks · ${fleet.length}` },
                    { value: "geofences", label: `Geofences · ${fenceList.length}` },
                  ]}
                  className="w-full [&>button]:flex-1"
                />
                </>
                )}
              </div>
              <div className={cn("min-h-0 flex-1 overflow-y-auto p-1.5", collapsed && "hidden")}>
                {tab === "trucks" &&
                  (filteredTrucks.length === 0 ? (
                    <EmptyState icon={<TruckIcon className="size-4" />} title="No trucks match" />
                  ) : (
                    filteredTrucks.map((t) => (
                      <button
                        key={t.truck_id}
                        onClick={() => setSelectedTruck(t.truck_id === selectedTruck ? null : t.truck_id)}
                        className={cn(
                          "grid w-full gap-2 rounded-lg border border-transparent p-2.5 text-left transition-colors hover:bg-muted",
                          t.truck_id === selectedTruck && "border-border bg-muted",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold">{t.truck_id}</span>
                            {t.open_alerts > 0 && (
                              <span className="tabular rounded-full bg-critical px-1.5 font-mono text-[10px] font-semibold text-white">{t.open_alerts}</span>
                            )}
                          </span>
                          <ActivityPill activity={t.activity} />
                        </div>
                        <div className="flex items-center gap-2">
                          <FillBar pct={t.fill_pct} className="flex-1" />
                          <span className="tabular w-14 text-right font-mono text-[11px]">{litres(t.latest?.volume_l)}</span>
                        </div>
                      </button>
                    ))
                  ))}
                {tab === "geofences" &&
                  (filteredFences.length === 0 ? (
                    <EmptyState icon={<MapPin className="size-4" />} title="No geofences yet">
                      {canEdit ? "Add one with “+ Geofence”, then click the map to place it." : "An operator can add approved discharge points."}
                    </EmptyState>
                  ) : (
                    filteredFences.map((g) => (
                      <div
                        key={g.id}
                        className={cn(
                          "group grid gap-1 rounded-lg border border-transparent p-2.5 transition-colors hover:bg-muted",
                          g.id === selectedFence && "border-border bg-muted",
                        )}
                      >
                        <button className="flex items-start justify-between gap-2 text-left" onClick={() => setSelectedFence(g.id)}>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">{g.name}</span>
                            <span className="block text-xs text-muted-foreground">
                              {num(g.radius_m)} m · {g.truck_id ? <span className="font-mono">{g.truck_id}</span> : "All trucks"}
                            </span>
                          </span>
                          <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        </button>
                        {canEdit && (
                          <div className="flex gap-1 pt-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                            <Button variant="outline" size="sm" className="h-7 bg-card text-xs" onClick={() => startEdit(g)}>
                              <Pencil /> Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => remove(g)}>
                              <Trash2 /> Deactivate
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Selected truck card */}
      {truck && !draft && <TruckCard truck={truck} trackCount={trackPoints.length} onClose={() => setSelectedTruck(null)} />}

      {draft && draft.lat === null && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-[600] -translate-x-1/2 md:bottom-auto md:top-4 md:left-[calc(50%+180px)]">
          <div className="flex items-center gap-2 rounded-full border bg-ink px-4 py-2 text-sm text-background shadow-lg">
            <Crosshair className="size-4" /> Click the map to place the geofence centre
          </div>
        </div>
      )}
    </div>
  );
}

function TruckCard({ truck: t, trackCount, onClose }: { truck: Truck; trackCount: number; onClose: () => void }) {
  const r = t.latest;
  return (
    <div className="absolute top-3 right-3 z-[600] w-[300px] max-w-[calc(100%-1.5rem)] rounded-xl border bg-card/95 shadow-lg backdrop-blur">
      <div className="flex items-start justify-between gap-2 border-b p-3">
        <div>
          <p className="font-mono text-base font-semibold">{t.truck_id}</p>
          <p className="text-xs text-muted-foreground">{[t.plate, t.driver_name].filter(Boolean).join(" · ") || "No plate/driver set"}</p>
        </div>
        <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
          <X className="size-4" />
        </button>
      </div>
      <div className="grid gap-3 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <ActivityPill activity={t.activity} />
          <ValvePill open={r?.valve_open} />
        </div>
        <div className="grid gap-1.5">
          <div className="flex items-baseline justify-between">
            <span className="label-caps">Tank</span>
            <span className="tabular font-mono text-sm font-semibold">
              {litres(r?.volume_l)} <span className="text-xs font-normal text-muted-foreground">/ {litres(t.capacity_l, 0)}</span>
            </span>
          </div>
          <FillBar pct={t.fill_pct} />
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <dt className="text-muted-foreground">Speed</dt>
          <dd className="tabular text-right font-mono">{r?.speed_kmh != null ? `${num(r.speed_kmh, 0)} km/h` : "—"}</dd>
          <dt className="text-muted-foreground">GPS</dt>
          <dd className="flex items-center justify-end gap-1.5">
            <Dot className={r?.gps_fix ? "bg-success" : "bg-warning"} />
            {r?.gps_fix ? `${r.sats} sats` : "No fix"}
          </dd>
          <dt className="text-muted-foreground">Position</dt>
          <dd className="tabular truncate text-right font-mono">{coord(r?.lat ?? null, r?.lon ?? null)}</dd>
          <dt className="text-muted-foreground">Last seen</dt>
          <dd className="text-right">{timeAgo(t.last_seen_at)}</dd>
          <dt className="text-muted-foreground">Track (2 h)</dt>
          <dd className="tabular text-right font-mono">{trackCount} pts</dd>
        </dl>
        <Button asChild size="sm" variant="outline" className="bg-card">
          <Link href={`/trucks/${encodeURIComponent(t.truck_id)}`}>
            Open truck <ArrowUpRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function GeofenceForm({
  draft,
  setDraft,
  trucks,
  saving,
  onCancel,
  onSave,
}: {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft | null>>;
  trucks: Truck[];
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const placed = draft.lat !== null && draft.lon !== null;
  return (
    <form
      className="flex min-h-0 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <div className="flex items-center justify-between border-b p-3">
        <div>
          <p className="text-sm font-semibold">{draft.id ? "Edit geofence" : "New geofence"}</p>
          <p className="text-xs text-muted-foreground">An approved place where the valve may open.</p>
        </div>
        <button type="button" onClick={onCancel} className="rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="Cancel">
          <X className="size-4" />
        </button>
      </div>
      <div className="grid min-h-0 gap-4 overflow-y-auto p-3">
        <div className={cn("flex items-start gap-2.5 rounded-lg border p-2.5 text-xs", placed ? "bg-muted" : "border-dashed")}>
          <Crosshair className="mt-0.5 size-4 shrink-0" />
          {placed ? (
            <span>
              <span className="block font-medium">Centre placed</span>
              <span className="tabular font-mono text-muted-foreground">{coord(draft.lat, draft.lon)}</span>
              <span className="block text-muted-foreground">Click the map again to move it.</span>
            </span>
          ) : (
            <span>
              <span className="block font-medium">Click on the map</span>
              <span className="text-muted-foreground">to place the centre of the approved discharge area.</span>
            </span>
          )}
        </div>
        <Field label="Name">
          <Input value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Total depot — Mvan" required className="bg-card" />
        </Field>
        <Field label={`Radius · ${num(draft.radius_m)} m`} hint="Keep it tight around the discharge point; GPS is accurate to a few metres.">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={20}
              max={2000}
              step={10}
              value={draft.radius_m}
              onChange={(e) => set({ radius_m: Number(e.target.value) })}
              className="flex-1 accent-[var(--ink)]"
            />
            <Input
              type="number"
              min={1}
              max={50000}
              value={draft.radius_m}
              onChange={(e) => set({ radius_m: Math.max(1, Number(e.target.value) || 1) })}
              className="h-8 w-20 bg-card font-mono"
            />
          </div>
        </Field>
        <Field label="Applies to">
          <Select value={draft.truck_id} onChange={(e) => set({ truck_id: e.target.value })}>
            <option value="">All trucks</option>
            {trucks.map((t) => (
              <option key={t.truck_id} value={t.truck_id}>
                {t.truck_id}
                {t.plate ? ` · ${t.plate}` : ""}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Notes (optional)">
          <Textarea value={draft.description} onChange={(e) => set({ description: e.target.value })} placeholder="Access hours, contact on site…" />
        </Field>
      </div>
      <div className="flex justify-end gap-2 border-t p-3">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={!placed || !draft.name.trim() || saving}>
          {saving ? "Saving…" : draft.id ? "Save changes" : "Create geofence"}
        </Button>
      </div>
    </form>
  );
}
