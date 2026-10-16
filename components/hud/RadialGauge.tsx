"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface Thresholds {
  warning: number;
  critical: number;
}

interface RadialGaugeProps {
  value: number;
  min?: number;
  max: number;
  thresholds: Thresholds;
  unit: string;
  label: string;
  size?: number;
  className?: string;
}

export function RadialGauge({
  value,
  min = 0,
  max,
  thresholds,
  unit,
  label,
  size = 120,
  className,
}: RadialGaugeProps) {
  const clamped = Math.max(min, Math.min(max, value));
  const progress = max === min ? 0 : (clamped - min) / (max - min);

  const arcColor = useMemo(() => {
    if (clamped >= thresholds.critical) return "stroke-accent-critical";
    if (clamped >= thresholds.warning) return "stroke-accent-warning";
    return "stroke-accent-safe";
  }, [clamped, thresholds]);

  const viewBox = 100;
  const cx = viewBox / 2;
  const cy = viewBox / 2;
  const r = 42;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * r;
  const visibleLength = (270 / 360) * circumference;

  const trackProps = {
    cx,
    cy,
    r,
    fill: "none",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeDasharray: `${visibleLength} ${circumference - visibleLength}`,
  };

  const filledLength = visibleLength * progress;

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <svg
        viewBox={`0 0 ${viewBox} ${viewBox}`}
        width={size}
        height={size}
        className="transform -rotate-135"
      >
        <circle {...trackProps} className="stroke-border-default opacity-40" />
        <circle
          {...trackProps}
          className={cn("transition-[stroke-dashoffset_stroke] duration-500", arcColor)}
          style={{
            strokeDasharray: `${filledLength} ${circumference - filledLength}`,
          }}
        />
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          className="fill-text-primary font-mono text-lg font-semibold"
        >
          {clamped.toFixed(clamped < 10 ? 1 : 0)}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          className="fill-text-muted font-mono text-[10px]"
        >
          {unit}
        </text>
      </svg>
      <span className="text-text-muted text-xs tracking-wide uppercase">{label}</span>
    </div>
  );
}
