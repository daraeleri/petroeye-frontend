"use client";

import { Info } from "lucide-react";
import { useDashboard } from "@/lib/DashboardContext";
import { cn } from "@/lib/utils";
import type { Truck, TruckStatus } from "@/lib/types";

const statusColors: Record<TruckStatus, string> = {
  idle: "bg-accent-info",
  loading: "bg-accent-warning",
  in_transit: "bg-accent-safe",
  delivered: "bg-accent-safe",
  alert: "bg-accent-critical",
  offline: "bg-text-muted",
};

function formatLastSeen(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  return `${h}h ago`;
}

interface TruckListProps {
  onDetail: (truck: Truck) => void;
}

export function TruckList({ onDetail }: TruckListProps) {
  const { trucks, selectedTruckId, selectTruck } = useDashboard();
  const entries = Array.from(trucks.values());

  return (
    <div className="space-y-1">
      {entries.length === 0 && (
        <p className="text-text-muted text-xs px-3 pt-2">Waiting for trucks...</p>
      )}
      {entries.map((truck) => (
        <div
          key={truck.truck_id}
          className={cn(
            "flex items-center gap-1 px-2 py-1.5 transition-colors rounded-sm",
            selectedTruckId === truck.truck_id
              ? "bg-accent-info/10"
              : "hover:bg-surface",
          )}
        >
          <button
            onClick={() => selectTruck(truck.truck_id)}
            className="flex items-center gap-2 flex-1 min-w-0 text-left"
          >
            <span className={cn("w-2 h-2 rounded-full shrink-0", statusColors[truck.status])} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-mono text-text-primary truncate">{truck.truck_id}</div>
              <div className="text-[10px] text-text-muted">{formatLastSeen(truck.last_seen_at)}</div>
            </div>
            {truck.status === "alert" && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent-critical animate-pulse" />
            )}
          </button>
          <button
            onClick={() => onDetail(truck)}
            className="shrink-0 p-1 text-text-muted hover:text-accent-info transition-colors"
            title="Truck details"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
