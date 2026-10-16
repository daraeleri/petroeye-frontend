"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MapPin, Maximize2, Minimize2, Loader2, X, Radio } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { useDashboard } from "@/lib/DashboardContext";

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

function makeIcon(L: any, status: string, isSelected: boolean) {
  const color = STATUS_COLORS[status] ?? "#38BDF8";
  const size = isSelected ? 14 : 10;
  const border = isSelected ? 3 : 2;
  const total = size + border * 2;
  return L.divIcon({
    className: "",
    html: `<div style="width:${total}px;height:${total}px;background:${color};border:${border}px solid ${isSelected ? "#fff" : "rgba(0,0,0,0.55)"};border-radius:50%;box-shadow:0 0 ${isSelected ? 14 : 6}px ${color}aa;"></div>`,
    iconSize: [total, total],
    iconAnchor: [total / 2, total / 2],
  });
}

function statusLabel(status: string): string {
  return status.replace("_", " ");
}

export function VehicleMap({ className }: { className?: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const LRef = useRef<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { trucks, telemetry, connected } = useDashboard();
  const { resolvedTheme } = useTheme();
  const mountedRef = useRef(false);

  const vehicleList = useMemo(() => Array.from(trucks.values()), [trucks]);

  // ---- init map once ----------------------------------------------------
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

    for (const truck of Array.from(trucks.values())) {
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
  }, [trucks, telemetry, selectedVehicle]);

  useEffect(() => {
    if (!mapLoaded) return;
    syncMarkers();
  }, [mapLoaded, syncMarkers]);

  // ---- fit bounds once when first telemetry arrives ---------------------
  const didFitRef = useRef(false);
  useEffect(() => {
    if (didFitRef.current || !mapLoaded) return;
    const map = mapInstanceRef.current;
    if (!map) return;
    const points: [number, number][] = [];
    for (const [id, readings] of telemetry) {
      const r = readings[0];
      if (r) points.push([r.lat, r.lon]);
    }
    if (points.length >= 2) {
      map.fitBounds(LRef.current.latLngBounds(points).pad(0.25));
      didFitRef.current = true;
    } else if (points.length === 1) {
      map.setView(points[0], 13);
      didFitRef.current = true;
    }
  }, [telemetry, mapLoaded]);

  const activeCount = vehicleList.filter((v) => v.status !== "offline").length;
  const alertCount = vehicleList.filter((v) => v.status === "alert").length;
  const selectedTruck = selectedVehicle ? trucks.get(selectedVehicle) : null;
  const selectedReading = selectedVehicle ? telemetry.get(selectedVehicle)?.[0] ?? null : null;

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Fleet Overview</CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              {connected ? (
                <>
                  <Radio className="h-3 w-3 text-accent-safe" /> Live · real-time vehicle locations
                </>
              ) : (
                "Connecting to fleet..."
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success">{activeCount} Active</Badge>
            {alertCount > 0 && <Badge variant="destructive">{alertCount} Alert</Badge>}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          <div
            ref={mapRef}
            className={cn(
              "w-full bg-muted transition-all duration-300",
              isExpanded ? "h-[600px]" : "h-[400px]",
            )}
          />

          {!mapLoaded && (
            <div className="absolute inset-0 z-[500] flex items-center justify-center bg-muted">
              <div className="text-center">
                <Loader2 className="h-12 w-12 mx-auto text-muted-foreground mb-2 animate-spin" />
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            </div>
          )}

          {/* Selected vehicle overlay */}
          {selectedTruck && (
            <div className="absolute top-4 right-4 z-[500] w-64">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{selectedTruck.truck_id}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setSelectedVehicle(null)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <CardDescription className="text-xs capitalize">
                    {statusLabel(selectedTruck.status)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs space-y-1.5">
                  {selectedReading ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fuel</span>
                        <span className="font-medium">{selectedReading.fuel_level_pct.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Temp</span>
                        <span className="font-medium">{selectedReading.temperature_c.toFixed(1)}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pressure</span>
                        <span className="font-medium">{selectedReading.pressure_kpa.toFixed(0)} kPa</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Position</span>
                        <span className="font-mono">
                          {selectedReading.lat.toFixed(3)}, {selectedReading.lon.toFixed(3)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Awaiting telemetry…</p>
                  )}
                </CardContent>
              </Card>
              </div>
          )}

          {/* Vehicle list overlay */}
          <div className="absolute bottom-4 left-4 right-4 z-[500]">
            <div className="bg-background/95 backdrop-blur-sm rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Vehicles ({vehicleList.length})</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                {vehicleList.map((truck) => {
                  const reading = telemetry.get(truck.truck_id)?.[0];
                  return (
                    <div
                      key={truck.truck_id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors",
                        selectedVehicle === truck.truck_id
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted/50",
                      )}
                      onClick={() => setSelectedVehicle(truck.truck_id)}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: STATUS_COLORS[truck.status] ?? "#38BDF8" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{truck.truck_id}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {reading
                            ? `${reading.fuel_level_pct.toFixed(0)}% · ${reading.temperature_c.toFixed(1)}°C`
                            : truck.operator || "—"}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {vehicleList.length === 0 && (
                  <div className="col-span-full text-center py-2 text-xs text-muted-foreground">
                    No vehicles reporting yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
