"use client";

import { AlertTriangle, Link } from "lucide-react";
import { useDashboard } from "@/lib/DashboardContext";
import { SeverityDonut } from "@/components/hud/SeverityDonut";
import { cn } from "@/lib/utils";
import type { AlertSeverity } from "@/lib/types";

const severityColors: Record<AlertSeverity, string> = {
  info: "border-l-accent-safe",
  warning: "border-l-accent-warning",
  critical: "border-l-accent-critical",
};

const severityIcons: Record<AlertSeverity, string> = {
  info: "text-accent-safe",
  warning: "text-accent-warning",
  critical: "text-accent-critical",
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  return `${h}h ago`;
}

export function AlertFeed() {
  const { alerts } = useDashboard();

  const info = alerts.filter((a) => a.severity === "info").length;
  const warning = alerts.filter((a) => a.severity === "warning").length;
  const critical = alerts.filter((a) => a.severity === "critical").length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-center py-2 border-b border-border-default">
        <SeverityDonut info={info} warning={warning} critical={critical} />
      </div>
      <div className="flex-1 overflow-y-auto space-y-1 px-1 py-2">
        {alerts.length === 0 && (
          <p className="text-text-muted text-xs text-center pt-4">No alerts</p>
        )}
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={cn(
              "flex items-start gap-2 px-2 py-1.5 rounded-sm border-l-2 bg-surface/50",
              severityColors[alert.severity],
            )}
          >
            <AlertTriangle className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", severityIcons[alert.severity])} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-semibold uppercase text-text-primary">
                  {alert.type}
                </span>
                <span className={cn(
                  "text-[9px] px-1 py-px rounded uppercase font-mono",
                  alert.severity === "critical" && "bg-accent-critical/20 text-accent-critical",
                  alert.severity === "warning" && "bg-accent-warning/20 text-accent-warning",
                  alert.severity === "info" && "bg-accent-safe/20 text-accent-safe",
                )}>
                  {alert.severity}
                </span>
              </div>
              <div className="text-xs text-text-muted truncate">{alert.message}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] text-text-muted">{formatTime(alert.created_at)}</span>
                <span className="text-[9px] font-mono text-text-muted">{alert.truck_id}</span>
                {alert.onchain_tx_hash && (
                  <Link className="w-2.5 h-2.5 text-accent-safe" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
