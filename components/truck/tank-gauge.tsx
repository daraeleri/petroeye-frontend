import { cn } from "@/lib/utils";

/** Side view of a tank with the liquid level — the twin's centrepiece. */
export function TankGauge({ pct, valveOpen, className }: { pct: number | null; valveOpen?: boolean; className?: string }) {
  const v = pct === null ? 0 : Math.max(0, Math.min(100, pct));
  const W = 220;
  const H = 120;
  const pad = 6;
  const innerH = H - pad * 2;
  const levelY = pad + innerH * (1 - v / 100);
  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} className={cn("w-full", className)} role="img" aria-label={`Tank ${Math.round(v)}% full`}>
      <defs>
        <clipPath id="tank-clip">
          <rect x={pad} y={pad} width={W - pad * 2} height={innerH} rx={26} />
        </clipPath>
        <pattern id="tank-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" className="stroke-ink-4" strokeWidth="2" />
        </pattern>
      </defs>
      {/* shell */}
      <rect x={pad} y={pad} width={W - pad * 2} height={innerH} rx={26} className="fill-muted" />
      <g clipPath="url(#tank-clip)">
        <rect x={pad} y={pad} width={W - pad * 2} height={innerH} fill="url(#tank-hatch)" />
        {pct !== null && (
          <rect
            x={pad}
            y={levelY}
            width={W - pad * 2}
            height={H - pad - levelY}
            className="fill-ink transition-all duration-700"
          />
        )}
        {/* level line */}
        {pct !== null && <line x1={pad} x2={W - pad} y1={levelY} y2={levelY} className="stroke-background/60" strokeWidth="1" />}
        {/* 25/50/75 ticks */}
        {[25, 50, 75].map((t) => (
          <line
            key={t}
            x1={W - pad - 14}
            x2={W - pad}
            y1={pad + innerH * (1 - t / 100)}
            y2={pad + innerH * (1 - t / 100)}
            className={v >= t ? "stroke-background/50" : "stroke-ink-3"}
            strokeWidth="1"
          />
        ))}
      </g>
      <rect x={pad} y={pad} width={W - pad * 2} height={innerH} rx={26} className="fill-none stroke-ink" strokeWidth="2" />
      {/* sensor on top */}
      <rect x={W / 2 - 10} y={0} width={20} height={pad + 2} rx={2} className="fill-ink" />
      {/* outlet + valve at the bottom right */}
      <path d={`M ${W - 40} ${H - pad} v 10 h 24`} className="fill-none stroke-ink" strokeWidth="3" />
      <rect
        x={W - 22}
        y={H + 1}
        width={14}
        height={14}
        rx={3}
        className={cn(valveOpen ? "fill-critical" : "fill-card", "stroke-ink")}
        strokeWidth="2"
      />
      {valveOpen && (
        <text x={W - 28} y={H + 21} textAnchor="end" className="fill-critical font-mono text-[9px] font-semibold">
          OPEN
        </text>
      )}
    </svg>
  );
}
