"use client";

import { cn } from "@/lib/utils";
import type { AlertSeverity } from "@/lib/types";

const severityColors: Record<AlertSeverity, string> = {
  info: "border-accent-info text-accent-info",
  warning: "border-accent-warning text-accent-warning",
  critical: "border-accent-critical text-accent-critical",
};

interface SensorBadgeProps {
  label: string;
  value: string;
  severity?: AlertSeverity;
  className?: string;
}

export function SensorBadge({ label, value, severity = "info", className }: SensorBadgeProps) {
  return (
    <div
      className={cn(
        "absolute px-1.5 py-0.5 rounded border bg-base/90 backdrop-blur-sm text-[10px] leading-tight whitespace-nowrap z-20 pointer-events-none",
        severityColors[severity],
        "shadow-lg",
        className,
      )}
    >
      <div className="font-mono font-semibold">{value}</div>
      <div className="text-[8px] uppercase tracking-wider opacity-70">{label}</div>
    </div>
  );
}
