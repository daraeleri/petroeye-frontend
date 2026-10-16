"use client";

import { cn } from "@/lib/utils";

interface SeverityDonutProps {
  info: number;
  warning: number;
  critical: number;
  className?: string;
}

export function SeverityDonut({ info, warning, critical, className }: SeverityDonutProps) {
  const total = info + warning + critical;
  if (total === 0) return null;

  const segments = [
    { count: info, color: "stroke-accent-safe", label: "Info" },
    { count: warning, color: "stroke-accent-warning", label: "Warning" },
    { count: critical, color: "stroke-accent-critical", label: "Critical" },
  ];

  const circumference = 2 * Math.PI * 36;
  let offset = 0;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <svg viewBox="0 0 100 100" className="w-20 h-20 -rotate-90">
        {segments.map((seg) => {
          if (seg.count === 0) return null;
          const ratio = seg.count / total;
          const length = circumference * ratio;
          const dash = `${length} ${circumference - length}`;
          const el = (
            <circle
              key={seg.label}
              cx="50"
              cy="50"
              r="36"
              fill="none"
              strokeWidth="8"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              className={seg.color}
              strokeLinecap="butt"
            />
          );
          offset += length;
          return el;
        })}
        <text x="50" y="56" textAnchor="middle" className="fill-text-primary font-mono text-xl font-bold">
          {total}
        </text>
      </svg>
      <div className="flex gap-3 mt-1">
        {segments.map((seg) => (
          seg.count > 0 && (
            <span key={seg.label} className="text-[10px] font-mono text-text-muted flex items-center gap-1">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${seg.color.replace("stroke", "bg")}`} />
              {seg.count}
            </span>
          )
        ))}
      </div>
    </div>
  );
}
