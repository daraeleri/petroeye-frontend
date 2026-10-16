"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  MapPin, Search, Truck, Fuel, Thermometer, Gauge, Navigation,
  Battery, Radio, Loader2, X, ArrowLeft,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import { useDashboard } from "@/lib/DashboardContext";
import type { Truck as TruckType, TelemetryReading } from "@/lib/types";

const ATTRIBUTION = "Tiles &copy; Esri";
const DARK_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
const LIGHT_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}";

const STATUS_COLORS: Record<string, string> = {
  in_transit: "#22C55E",
  idle: "#F59E0B",
  loading: "#38BDF8",
  delivered: "#8B5CF6",
  alert: "#EF4444",
  offline: "#6B7280",
};

const STATUS_LEGEND: { key: string; label: string }[] = [
  { key: "in_transit", label: "In Transit" },
  { key: "idle", label: "Idle" },
  { key: "alert", label: "Alert" },
  { key: "offline", label: "Offline" },
];

function makeIcon(L: any, status: string, isSelected: boolean) {
  const color = STATUS_COLORS[status] ?? "#38BDF8";
  const size = isSelected ? 18 : 12;
  const border = isSelected ? 3 : 2;
  const total = size + border * 2;
  return L.divIcon({
    className: "",
    html: `<div style="width:${total}px;height:${total}px;background:${color};border:${border}px solid ${isSelected ? "#fff" : "rgba(0,0,0,0.55)"};border-radius:50%;box-shadow:0 0 ${isSelected ? 14 : 6}px ${color}aa;"></div>`,
    iconSize: [total, total],
    iconAnchor: [total / 2, total / 2],
  });
}

function VehicleRow({
  truck,
  reading,
  isSelected,
  onSelect,
}: {
  truck: TruckType;
  reading: TelemetryReading | null;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-all",
        isSelected ? "bg-primary/10 border-primary" : "hover:bg-muted/50 border-transparent",
      )}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: STATUS_COLORS[truck.status] ?? "#38BDF8" }}
          />
          <span className="font-medium text-sm">{truck.truck_id}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground capitalize">
            {truck.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="text-xs text-muted-foreground mb-2">{truck.operator || "—"}</div>

      {reading ? (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <Fuel className="h-3 w-3" />
            <span>{reading.fuel_level_pct.toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-1">
            <Thermometer className="h-3 w-3" />
            <span>{reading.temperature_c.toFixed(1)}°C</span>
          </div>
          <div className="flex items-center gap-1">
            <Gauge className="h-3 w-3" />
            <span>{reading.pressure_kpa.toFixed(0)} kPa</span>
          </div>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">Awaiting telemetry…</div>
      )}
    </div>
  );
}

export function LiveMap({ onViewTruck }: { onViewTruck?: (truckId: string) => void }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const LRef = useRef<any>(null);
  const didFitRef = useRef(false);

  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { trucks, telemetry, connected } = useDashboard();
  const { resolvedTheme } = useTheme();

  const vehicleList = useMemo(() => Array.from(trucks.values()), [trucks]);

  const filteredVehicles = useMemo(() => {
    return vehicleList.filter((vehicle) => {
      const matchesSearch =
        vehicle.truck_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (vehicle.operator ?? "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [vehicleList, searchQuery, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      in_transit: 0, idle: 0, alert: 0, offline: 0, loading: 0, delivered: 0,
    };
    for (const t of vehicleList) {
      counts[t.status] = (counts[t.status] ?? 0) + 1;
    }
    return counts;
  }, [vehicleList]);

  // ---- init map once (StrictMode-safe) ----------------------------------
  useEffect(() => {
    let cancelled = false;
    let ro: ResizeObserver | null = null;

    const loadMap = async () => {
      if (typeof window === "undefined") return;
      if (!mapRef.current) return;
      if ((mapRef.current as any)._leaflet_id) return;

      const L = await import("leaflet");
      if (cancelled || !mapRef.current || (mapRef.current as any)._leaflet_id) return;

      LRef.current = L;
      mapInstanceRef.current = L.map(mapRef.current, {
        center: [40.7484, -73.9857],
        zoom: 11,
        zoomControl: false,
      });

      tileRef.current = L.tileLayer(resolvedTheme === "light" ? LIGHT_TILES : DARK_TILES, {
        attribution: ATTRIBUTION,
        maxZoom: 16,
      }).addTo(mapInstanceRef.current);

      ro = new ResizeObserver(() => mapInstanceRef.current?.invalidateSize());
      ro.observe(mapRef.current);

      setMapLoaded(true);
    };

    loadMap();

    return () => {
      cancelled = true;
      ro?.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markersRef.current.clear();
      setMapLoaded(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- swap tiles when theme changes ------------------------------------
  useEffect(() => {
    if (!mapLoaded || !tileRef.current) return;
    tileRef.current.setUrl(resolvedTheme === "light" ? LIGHT_TILES : DARK_TILES);
  }, [resolvedTheme, mapLoaded]);

  // ---- sync markers with live data --------------------------------------
  const syncMarkers = useCallback(() => {
    const L = LRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    for (const truck of vehicleList) {
      const reading = telemetry.get(truck.truck_id)?.[0];
      if (!reading) continue;

      const pos: [number, number] = [reading.lat, reading.lon];
      let marker = markersRef.current.get(truck.truck_id);
      const icon = makeIcon(L, truck.status, selectedVehicle === truck.truck_id);

      if (!marker) {
        marker = L.marker(pos, { icon }).addTo(map);
        marker.on("click", () => setSelectedVehicle(truck.truck_id));
        markersRef.current.set(truck.truck_id, marker);
      } else {
        marker.setLatLng(pos);
        marker.setIcon(icon);
      }
    }
  }, [vehicleList, telemetry, selectedVehicle]);

  useEffect(() => {
    if (!mapLoaded) return;
    syncMarkers();
  }, [mapLoaded, syncMarkers]);

  // ---- fit bounds once when we have positions ---------------------------
  useEffect(() => {
    if (didFitRef.current || !mapLoaded) return;
    const map = mapInstanceRef.current;
    const L = LRef.current;
    if (!map || !L) return;
    const points: [number, number][] = [];
    for (const [, readings] of telemetry) {
      const r = readings[0];
      if (r) points.push([r.lat, r.lon]);
    }
    if (points.length >= 2) {
      map.fitBounds(L.latLngBounds(points).pad(0.25));
      didFitRef.current = true;
    } else if (points.length === 1) {
      map.setView(points[0], 13);
      didFitRef.current = true;
    }
  }, [telemetry, mapLoaded]);

  // ---- fly to selected vehicle ------------------------------------------
  useEffect(() => {
    if (!selectedVehicle || !mapLoaded) return;
    const r = telemetry.get(selectedVehicle)?.[0];
    if (r) mapInstanceRef.current?.flyTo([r.lat, r.lon], 14, { duration: 0.8 });
  }, [selectedVehicle, telemetry, mapLoaded]);

  const selectedTruck = selectedVehicle ? trucks.get(selectedVehicle) ?? null : null;
  const selectedReading = selectedVehicle ? telemetry.get(selectedVehicle)?.[0] ?? null : null;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Map Header */}
      <div className="p-4 border-b flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Live Map</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            {connected ? (
              <>
                <Radio className="h-3.5 w-3.5 text-accent-safe" /> Real-time fleet tracking
              </>
            ) : (
              "Connecting to fleet..."
            )}
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {STATUS_LEGEND.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[s.key] }}
                />
                <span className="text-xs">{s.label}</span>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? "Hide Panel" : "Show Panel"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Area */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="w-full h-full" />

          {!mapLoaded && (
            <div className="absolute inset-0 z-[500] flex items-center justify-center bg-muted">
              <div className="text-center">
                <Loader2 className="h-12 w-12 mx-auto text-muted-foreground mb-2 animate-spin" />
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            </div>
          )}

          {/* Selected vehicle info overlay */}
          {selectedTruck && (
            <div className="absolute top-4 left-4 z-[500] w-72">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{selectedTruck.truck_id}</CardTitle>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant={
                          selectedTruck.status === "alert"
                            ? "destructive"
                            : selectedTruck.status === "offline"
                              ? "outline"
                              : "success"
                        }
                        className="capitalize"
                      >
                        {selectedTruck.status.replace("_", " ")}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setSelectedVehicle(null)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{selectedTruck.operator || "—"}</CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedReading ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2 rounded-lg bg-muted/50">
                          <div className="text-xs text-muted-foreground">Fuel</div>
                          <div className="font-medium">{selectedReading.fuel_level_pct.toFixed(1)}%</div>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/50">
                          <div className="text-xs text-muted-foreground">Temp</div>
                          <div className="font-medium">{selectedReading.temperature_c.toFixed(1)}°C</div>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/50">
                          <div className="text-xs text-muted-foreground">Pressure</div>
                          <div className="font-medium">{selectedReading.pressure_kpa.toFixed(0)} kPa</div>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/50">
                          <div className="text-xs text-muted-foreground">Tilt</div>
                          <div className="font-medium">{selectedReading.tilt_deg.toFixed(1)}°</div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={() => onViewTruck?.(selectedTruck.truck_id)}
                        >
                          View Details
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedVehicle(null)}>
                          Close
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Awaiting telemetry…
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div
          className={cn(
            "w-80 border-l flex flex-col transition-all duration-200",
            sidebarOpen ? "translate-x-0" : "translate-x-full w-0 overflow-hidden border-0",
          )}
        >
          {/* Search and Filter */}
          <div className="p-4 border-b space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicles..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                className="flex-1"
              >
                All ({vehicleList.length})
              </Button>
              <Button
                variant={statusFilter === "in_transit" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("in_transit")}
                className="flex-1"
              >
                Active ({statusCounts.in_transit})
              </Button>
              <Button
                variant={statusFilter === "alert" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("alert")}
                className="flex-1"
              >
                Alert ({statusCounts.alert})
              </Button>
            </div>
          </div>

          {/* Vehicle List */}
          <div className="flex-1 overflow-auto p-4 space-y-2">
            {filteredVehicles.map((vehicle) => (
              <VehicleRow
                key={vehicle.truck_id}
                truck={vehicle}
                reading={telemetry.get(vehicle.truck_id)?.[0] ?? null}
                isSelected={selectedVehicle === vehicle.truck_id}
                onSelect={() => setSelectedVehicle(vehicle.truck_id)}
              />
            ))}

            {filteredVehicles.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Truck className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No vehicles found</p>
              </div>
            )}
          </div>

          {/* Stats Footer */}
          <div className="p-4 border-t">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-lg font-bold" style={{ color: STATUS_COLORS.in_transit }}>
                  {statusCounts.in_transit}
                </div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
              <div>
                <div className="text-lg font-bold" style={{ color: STATUS_COLORS.idle }}>
                  {statusCounts.idle}
                </div>
                <div className="text-xs text-muted-foreground">Idle</div>
              </div>
              <div>
                <div className="text-lg font-bold" style={{ color: STATUS_COLORS.alert }}>
                  {statusCounts.alert}
                </div>
                <div className="text-xs text-muted-foreground">Alert</div>
              </div>
              <div>
                <div className="text-lg font-bold" style={{ color: STATUS_COLORS.offline }}>
                  {statusCounts.offline}
                </div>
                <div className="text-xs text-muted-foreground">Offline</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
