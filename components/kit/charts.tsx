"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/** Thin vertical bars for KPI cards (the reference's "|||||" sparkline). */
export function MiniBars({ values, className }: { values: number[]; className?: string }) {
  const max = Math.max(1, ...values);
  return (
    <div className={cn("flex h-8 items-end gap-[3px]", className)} aria-hidden>
      {values.map((v, i) => (
        <span
          key={i}
          className={cn("w-[3px] rounded-full", i === values.length - 1 ? "bg-ink" : "bg-ink-3")}
          style={{ height: `${Math.max(12, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export interface PixelSeries {
  label: string;
  values: number[];
  tone: "ink" | "ink-3" | "critical";
}

const TONE: Record<PixelSeries["tone"], string> = {
  ink: "fill-ink",
  "ink-3": "fill-ink-3",
  critical: "fill-critical",
};

/**
 * Pixel bar chart: each column is a stack of small squares, like the
 * reference "Sales trend". Series stack bottom-up; empty cells are faint.
 */
export function PixelBars({
  labels,
  series,
  rows = 12,
  unit = "",
  className,
}: {
  labels: string[];
  series: PixelSeries[];
  rows?: number;
  unit?: string;
  className?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const totals = labels.map((_, i) => series.reduce((s, x) => s + (x.values[i] ?? 0), 0));
  const max = Math.max(1, ...totals);
  const cols = labels.length;
  const cell = 10;
  const gap = 3;
  const colW = cell + gap;
  const width = cols * colW;
  const height = rows * colW;
  const perCell = max / rows;

  return (
    <div className={cn("relative", className)}>
      <svg viewBox={`0 0 ${width} ${height + 16}`} className="w-full" role="img" aria-label="Activity per day">
        {labels.map((label, c) => {
          // Cells per series for this column, stacked bottom-up.
          let filled = 0;
          const cells: { row: number; tone: string }[] = [];
          for (const s of series) {
            const n = Math.round((s.values[c] ?? 0) / perCell);
            for (let k = 0; k < n && filled < rows; k++) cells.push({ row: filled++, tone: TONE[s.tone] });
          }
          return (
            <g key={c} onMouseEnter={() => setHover(c)} onMouseLeave={() => setHover(null)}>
              <rect x={c * colW - 1} y={0} width={colW} height={height} className="fill-transparent" />
              {Array.from({ length: rows }, (_, r) => {
                const hit = cells.find((x) => x.row === r);
                return (
                  <rect
                    key={r}
                    x={c * colW}
                    y={height - (r + 1) * colW + gap}
                    width={cell}
                    height={cell}
                    rx={1.5}
                    className={cn(hit ? hit.tone : "fill-ink-4", hover !== null && hover !== c && "opacity-50", "transition-opacity")}
                  />
                );
              })}
              {(cols <= 16 || c % Math.ceil(cols / 12) === 0) && (
                <text x={c * colW + cell / 2} y={height + 13} textAnchor="middle" className="fill-muted-foreground font-mono text-[7px]">
                  {label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-sm"
          style={{ left: `${((hover + 0.5) / cols) * 100}%` }}
        >
          <p className="font-mono text-[10px] text-muted-foreground">{labels[hover]}</p>
          {series.map((s) => (
            <p key={s.label} className="tabular flex items-center gap-1.5">
              <span className={cn("size-2 rounded-[2px]", s.tone === "ink" ? "bg-ink" : s.tone === "critical" ? "bg-critical" : "bg-ink-3")} />
              {s.label}: <span className="font-medium">{(s.values[hover] ?? 0).toLocaleString()}{unit}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function Legend({ items }: { items: { label: string; tone: PixelSeries["tone"] }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className={cn("size-2 rounded-[2px]", i.tone === "ink" ? "bg-ink" : i.tone === "critical" ? "bg-critical" : "bg-ink-3")} />
          {i.label}
        </span>
      ))}
    </div>
  );
}
