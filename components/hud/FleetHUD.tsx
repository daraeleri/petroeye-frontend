"use client";

import { useMemo } from "react";
import { CircleDot, CircleOff, AlertTriangle } from "lucide-react";
import { useDashboard } from "@/lib/DashboardContext";
import { cn } from "@/lib/utils";

function StatBlock({ icon, label, count, color }: { icon: React.ReactNode; label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={color}>{icon}</div>
      <div>
        <span className="font-mono text-lg font-semibold text-text-primary">{count}</span>
        <span className="ml-1.5 text-xs text-text-muted tracking-wide uppercase">{label}</span>
      </div>
    </div>
  );
}

export function FleetHUD() {
  const { trucks, alerts } = useDashboard();

  const stats = useMemo(() => {
    let online = 0;
    let offline = 0;
    let info = 0;
    let warning = 0;
    let critical = 0;

    for (const t of trucks.values()) {
      if (t.status === "offline") offline++;
      else online++;
    }

    for (const a of alerts) {
      if (a.severity === "info") info++;
      else if (a.severity === "warning") warning++;
      else if (a.severity === "critical") critical++;
    }

    return { online, offline, info, warning, critical };
  }, [trucks, alerts]);

  return (
    <header className="h-16 bg-surface border-b border-border-default flex items-center px-6 gap-8">
      <span className="text-xs tracking-[0.2em] uppercase text-text-muted font-semibold">PetroTwin</span>

      <div className="flex items-center gap-6 ml-auto">
        <StatBlock
          icon={<CircleDot className="w-5 h-5" />}
          label="Online"
          count={stats.online}
          color="text-accent-safe"
        />
        <StatBlock
          icon={<CircleOff className="w-5 h-5" />}
          label="Offline"
          count={stats.offline}
          color="text-text-muted"
        />
        <div className="w-px h-8 bg-border-default" />
        <StatBlock
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Info"
          count={stats.info}
          color="text-accent-safe"
        />
        <StatBlock
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Warning"
          count={stats.warning}
          color="text-accent-warning"
        />
        <StatBlock
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Critical"
          count={stats.critical}
          color="text-accent-critical"
        />
      </div>
    </header>
  );
}
