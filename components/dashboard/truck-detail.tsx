"use client";

import { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Float, useGLTF, Bounds } from "@react-three/drei";
import {
  ArrowLeft, Fuel, Thermometer, MapPin, Clock, Gauge, Droplets, Wind,
  Eye, Activity, ChevronRight, Radio, Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as THREE from "three";
import { useDashboard } from "@/lib/DashboardContext";
import { TruckMiniMap } from "./truck-mini-map";
import type { TelemetryReading } from "@/lib/types";

interface TruckDetailProps {
  truckId: string;
  onBack?: () => void;
}

// ---------------- 3D model ----------------

function TruckGLBModel() {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF("/assets/3DModels/fuel_tanker_3d_model.glb");

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1 - 0.5;
    }
  });

  return (
    <group ref={groupRef} scale={1.4}>
      <Bounds fit clip margin={1.2}>
        <primitive object={scene.clone()} />
      </Bounds>
    </group>
  );
}

function Truck3DView({ online }: { online: boolean }) {
  return (
    <div className="relative w-full h-64 md:h-80">
      <Canvas camera={{ position: [5, 3, 5], fov: 50 }} gl={{ antialias: true, alpha: true }}>
        <Suspense
          fallback={
            <mesh>
              <boxGeometry args={[2, 1, 4]} />
              <meshBasicMaterial color="#374151" wireframe />
            </mesh>
          }
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1.2} />
          <directionalLight position={[-10, 5, -10]} intensity={0.4} />
          <spotLight position={[0, 15, 0]} intensity={0.6} angle={0.6} penumbra={1} />
          <pointLight position={[0, 5, 5]} intensity={0.3} />

          <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.2}>
            <TruckGLBModel />
          </Float>

          <ContactShadows position={[0, -0.5, 0]} opacity={0.5} scale={20} blur={2} far={5} />
          <Environment preset="city" />
          <OrbitControls
            enableZoom
            enablePan={false}
            minDistance={2}
            maxDistance={20}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2}
          />
        </Suspense>
      </Canvas>

      <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2">
        <div className="flex items-center gap-1 mb-1">
          <span className={cn("w-2 h-2 rounded-full", online ? "bg-green-500" : "bg-gray-400")} />
          <span>{online ? "Engine Reporting" : "No Signal"}</span>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2">
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
}

// ---------------- Parameter card ----------------

function ParameterCard({
  icon: Icon,
  label,
  value,
  unit,
  severity = "info",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  unit?: string;
  severity?: "info" | "warning" | "critical";
}) {
  const severityStyles = {
    info: "border-blue-500/30 bg-blue-500/5",
    warning: "border-yellow-500/30 bg-yellow-500/5",
    critical: "border-red-500/30 bg-red-500/5",
  };
  const severityIcon = {
    info: "text-blue-500",
    warning: "text-yellow-500",
    critical: "text-red-500",
  };

  return (
    <Card className={cn("transition-all", severityStyles[severity])}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", severityIcon[severity])} />
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold">{value}</span>
          {unit && <span className="text-sm text-muted-foreground ml-1">{unit}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function severityFor(reading: TelemetryReading) {
  return {
    fuel: reading.fuel_level_pct < 15 ? "critical" : reading.fuel_level_pct < 30 ? "warning" : "info",
    temp: reading.temperature_c > 60 ? "critical" : reading.temperature_c > 45 ? "warning" : "info",
    pressure: reading.pressure_kpa > 250 ? "critical" : reading.pressure_kpa > 180 ? "warning" : "info",
    tilt: reading.tilt_deg > 25 ? "critical" : reading.tilt_deg > 15 ? "warning" : "info",
  } as const;
}

// ---------------- Main page ----------------

export function TruckDetailPage({ truckId, onBack }: TruckDetailProps) {
  const { trucks, telemetry, alerts, connected } = useDashboard();

  const truck = trucks.get(truckId) ?? null;
  const reading = telemetry.get(truckId)?.[0] ?? null;
  const truckAlerts = useMemo(
    () => alerts.filter((a) => a.truck_id === truckId).slice(0, 8),
    [alerts, truckId],
  );

  if (!truck) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Waiting for truck {truckId} data…</p>
        {onBack && (
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        )}
      </div>
    );
  }

  const sev = reading ? severityFor(reading) : null;
  const online = truck.status !== "offline";

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-4 flex-wrap">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{truck.truck_id}</h1>
              <Badge
                variant={
                  truck.status === "alert" ? "destructive" : truck.status === "offline" ? "outline" : "success"
                }
                className="capitalize"
              >
                {truck.status.replace("_", " ")}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                {connected ? (
                  <>
                    <Radio className="h-3 w-3 text-accent-safe animate-pulse" /> Live
                  </>
                ) : (
                  "Offline feed"
                )}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {truck.operator || "Unassigned"}
              {truck.plate ? ` · ${truck.plate}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {truck.last_seen_at
                ? `Last seen ${new Date(truck.last_seen_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}`
                : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vehicle Overview</CardTitle>
                <CardDescription>Interactive 3D visualization of the tanker truck</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Truck3DView online={online} />
              </CardContent>
            </Card>

            {/* Live parameter grid */}
            <div>
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground mb-3">
                Live Telemetry
              </h2>
              {reading && sev ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ParameterCard
                    icon={Fuel}
                    label="Fuel Level"
                    value={reading.fuel_level_pct.toFixed(1)}
                    unit="%"
                    severity={sev.fuel}
                  />
                  <ParameterCard
                    icon={Thermometer}
                    label="Temperature"
                    value={reading.temperature_c.toFixed(1)}
                    unit="°C"
                    severity={sev.temp}
                  />
                  <ParameterCard
                    icon={Gauge}
                    label="Pressure"
                    value={reading.pressure_kpa.toFixed(0)}
                    unit="kPa"
                    severity={sev.pressure}
                  />
                  <ParameterCard
                    icon={Wind}
                    label="Flow Rate"
                    value={reading.flow_rate_lpm.toFixed(1)}
                    unit="L/min"
                  />
                  <ParameterCard
                    icon={MapPin}
                    label="Tilt"
                    value={reading.tilt_deg.toFixed(1)}
                    unit="°"
                    severity={sev.tilt}
                  />
                  <ParameterCard
                    icon={Eye}
                    label="Hatch"
                    value={reading.hatch_open ? "Open" : "Closed"}
                    severity={reading.hatch_open ? "critical" : "info"}
                  />
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p className="text-sm">Waiting for telemetry stream…</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Truck alerts */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Recent Alerts</CardTitle>
                <CardDescription>Alerts for this truck</CardDescription>
              </CardHeader>
              <CardContent>
                {truckAlerts.length > 0 ? (
                  <div className="space-y-2">
                    {truckAlerts.map((a) => (
                      <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            a.severity === "critical" && "bg-red-500",
                            a.severity === "warning" && "bg-yellow-500",
                            a.severity === "info" && "bg-blue-500",
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{a.type}</p>
                          <p className="text-xs text-muted-foreground truncate">{a.message}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(a.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No alerts recorded for this truck.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Live location map */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Location</CardTitle>
                <CardDescription>Updates in real time</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {reading ? (
                  <TruckMiniMap
                    lat={reading.lat}
                    lon={reading.lon}
                    color={
                      truck.status === "alert" ? "#EF4444" :
                      truck.status === "offline" ? "#6B7280" : "#22C55E"
                    }
                    className="h-48 w-full"
                  />
                ) : (
                  <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                    Awaiting position…
                  </div>
                )}
                {reading && (
                  <div className="px-6 py-3 text-sm font-mono text-muted-foreground">
                    {reading.lat.toFixed(5)}, {reading.lon.toFixed(5)}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Truck info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vehicle Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Truck ID</span>
                  <span className="font-medium">{truck.truck_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plate</span>
                  <span className="font-medium">{truck.plate || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Operator</span>
                  <span className="font-medium">{truck.operator || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium capitalize">{truck.status.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Seen</span>
                  <span className="font-medium">
                    {truck.last_seen_at ? new Date(truck.last_seen_at).toLocaleString() : "—"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Telemetry samples */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Readings</CardTitle>
                <CardDescription>Latest telemetry stream</CardDescription>
              </CardHeader>
              <CardContent>
                {(telemetry.get(truckId)?.length ?? 0) > 1 ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {telemetry
                      .get(truckId)!
                      .slice(0, 10)
                      .map((r, i) => (
                        <div
                          key={`${r.ts}-${i}`}
                          className="flex items-center justify-between text-xs font-mono text-muted-foreground hover:bg-muted/50 rounded px-1.5 py-1"
                        >
                          <span>{new Date(r.ts).toLocaleTimeString("en-US", { hour12: false })}</span>
                          <span>{r.fuel_level_pct.toFixed(1)}%</span>
                          <span>{r.temperature_c.toFixed(1)}°C</span>
                          <span>{r.pressure_kpa.toFixed(0)} kPa</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Collecting samples…</p>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground justify-end">
              <ChevronRight className="h-3.5 w-3.5" />
              Data streams live from the backend
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
