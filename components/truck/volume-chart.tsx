"use client";

import { Area, AreaChart, CartesianGrid, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { time } from "@/lib/format";
import type { TelemetryReading } from "@/lib/types";
import { useThemeColors } from "@/lib/use-theme-colors";

interface Point {
  t: number;
  volume: number | null;
  open: boolean;
}

/** Tank volume over time, with valve-open periods shaded red. */
export function VolumeChart({ readings, capacity }: { readings: TelemetryReading[]; capacity: number | null }) {
  const c = useThemeColors();
  const data: Point[] = readings.map((r) => ({ t: new Date(r.ts).getTime(), volume: r.volume_l, open: r.valve_open }));

  // Contiguous valve-open spans → shaded bands.
  const spans: [number, number][] = [];
  let startT: number | null = null;
  data.forEach((p, i) => {
    if (p.open && startT === null) startT = p.t;
    if ((!p.open || i === data.length - 1) && startT !== null) {
      spans.push([startT, p.t]);
      startT = null;
    }
  });

  const tick = { fontSize: 10, fill: c.muted, fontFamily: "var(--font-geist-mono)" };

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id="vol-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.ink} stopOpacity={0.16} />
            <stop offset="100%" stopColor={c.ink} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={c.border} strokeDasharray="2 4" />
        {spans.map(([a, b], i) => (
          <ReferenceArea key={i} x1={a} x2={b} fill={c.critical} fillOpacity={0.14} stroke="none" ifOverflow="extendDomain" />
        ))}
        <XAxis
          dataKey="t"
          type="number"
          domain={["dataMin", "dataMax"]}
          scale="time"
          tickFormatter={(t: number) => new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          tick={tick}
          axisLine={false}
          tickLine={false}
          minTickGap={40}
        />
        <YAxis
          domain={[0, capacity ?? "auto"]}
          tick={tick}
          axisLine={false}
          tickLine={false}
          width={44}
          tickFormatter={(v: number) => `${v}L`}
        />
        <Tooltip
          cursor={{ stroke: c.ink3 }}
          content={({ active, payload }) => {
            const p = active && payload?.[0] ? (payload[0].payload as Point) : null;
            if (!p) return null;
            return (
              <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-sm">
                <p className="font-mono text-[10px] text-muted-foreground">{time(new Date(p.t).toISOString())}</p>
                <p className="tabular font-medium">{p.volume === null ? "no reading" : `${p.volume.toFixed(2)} L`}</p>
                {p.open && <p className="text-critical">valve open</p>}
              </div>
            );
          }}
        />
        <Area type="monotone" dataKey="volume" stroke={c.ink} strokeWidth={1.75} fill="url(#vol-fill)" connectNulls isAnimationActive={false} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
