"use client";

import { useState, useMemo } from "react";
import {
  Search, Fuel, Thermometer, Gauge, Clock, Truck,
  AlertTriangle, CheckCircle, PauseCircle, Wrench, PackageCheck, WifiOff, Radio,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/lib/DashboardContext";
import type { Truck as TruckType, TelemetryReading } from "@/lib/types";

type StatusStyle = {
  color: string;
  badge: "success" | "secondary" | "info" | "destructive" | "outline";
  icon: typeof CheckCircle;
  label: string;
};

const STATUS_FALLBACK: StatusStyle = {
  color: "bg-gray-500",
  badge: "outline",
  icon: WifiOff,
  label: "Offline",
};

const STATUS_CONFIG: Record<string, StatusStyle> = {
  in_transit: { color: "bg-green-500", badge: "success", icon: CheckCircle, label: "In Transit" },
  idle: { color: "bg-yellow-500", badge: "secondary", icon: PauseCircle, label: "Idle" },
  loading: { color: "bg-blue-500", badge: "info", icon: Wrench, label: "Loading" },
  delivered: { color: "bg-purple-500", badge: "info", icon: PackageCheck, label: "Delivered" },
  alert: { color: "bg-red-500", badge: "destructive", icon: AlertTriangle, label: "Alert" },
  offline: { color: "bg-gray-500", badge: "outline", icon: WifiOff, label: "Offline" },
};

function VehicleCard({
  truck,
  latestTelemetry,
  onViewTruck,
}: {
  truck: TruckType;
  latestTelemetry: TelemetryReading | null;
  onViewTruck?: (truckId: string) => void;
}) {
  const config = STATUS_CONFIG[truck.status] ?? STATUS_FALLBACK;
  const StatusIcon = config.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full", config.color)} />
            <span className="font-semibold">{truck.truck_id}</span>
          </div>
          <Badge variant={config.badge}>{config.label}</Badge>
        </div>

        <div className="mb-3">
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <StatusIcon className="h-3.5 w-3.5" />
            {truck.operator || "Unassigned"}
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Clock className="h-3 w-3" />
            <span className="truncate">
              {truck.last_seen_at
                ? new Date(truck.last_seen_at).toLocaleString("en-US", {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
                  })
                : "—"}
            </span>
          </div>
        </div>

        {latestTelemetry ? (
          <>
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Fuel Level</span>
                <span className="font-medium">{latestTelemetry.fuel_level_pct.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    latestTelemetry.fuel_level_pct > 50 ? "bg-green-500" :
                    latestTelemetry.fuel_level_pct > 25 ? "bg-yellow-500" : "bg-red-500",
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, latestTelemetry.fuel_level_pct))}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Thermometer className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{latestTelemetry.temperature_c.toFixed(1)}°C</span>
              </div>
              <div className="flex items-center gap-1">
                <Gauge className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{latestTelemetry.pressure_kpa.toFixed(0)} kPa</span>
              </div>
              <div className="flex items-center gap-1">
                <Fuel className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{latestTelemetry.flow_rate_lpm.toFixed(1)} L/min</span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-xs text-muted-foreground py-2">Awaiting telemetry…</div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full mt-4"
          onClick={() => onViewTruck?.(truck.truck_id)}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}

export function FleetDashboard({ onViewTruck }: { onViewTruck?: (truckId: string) => void }) {
  const { trucks, telemetry, connected } = useDashboard();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const vehicleList = useMemo(() => Array.from(trucks.values()), [trucks]);

  const filteredVehicles = useMemo(() => {
    return vehicleList.filter((vehicle) => {
      const matchesSearch =
        vehicle.truck_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (vehicle.operator ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (vehicle.plate ?? "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [vehicleList, searchQuery, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts = { in_transit: 0, idle: 0, loading: 0, alert: 0, offline: 0, delivered: 0 };
    for (const t of vehicleList) {
      counts[t.status as keyof typeof counts] = (counts[t.status as keyof typeof counts] ?? 0) + 1;
    }
    return counts;
  }, [vehicleList]);

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Fleet</h1>
            <p className="text-muted-foreground text-sm flex items-center gap-1.5">
              {connected ? (
                <>
                  <Radio className="h-3.5 w-3.5 text-accent-safe" /> Live · manage and monitor your vehicles
                </>
              ) : (
                "Connecting to fleet..."
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, operator, plate..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border rounded-md bg-background"
            >
              <option value="all">All Status</option>
              <option value="in_transit">In Transit</option>
              <option value="idle">Idle</option>
              <option value="loading">Loading</option>
              <option value="delivered">Delivered</option>
              <option value="alert">Alert</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-4 border-b">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {(
            [
              ["in_transit", "In Transit"],
              ["idle", "Idle"],
              ["loading", "Loading"],
              ["delivered", "Delivered"],
              ["alert", "Alert"],
              ["offline", "Offline"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="text-center">
              <div
                className="text-2xl font-bold"
                style={{ color: key === "alert" ? "#EF4444" : key === "offline" ? "#6B7280" : undefined }}
              >
                {statusCounts[key]}
              </div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.truck_id}
              truck={vehicle}
              latestTelemetry={telemetry.get(vehicle.truck_id)?.[0] ?? null}
              onViewTruck={onViewTruck}
            />
          ))}
        </div>

        {filteredVehicles.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No vehicles found</p>
          </div>
        )}
      </div>
    </div>
  );
}
