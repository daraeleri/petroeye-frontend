import { ACTIVITY_LABEL, SEVERITY_LABEL } from "@/lib/format";
import type { Activity, Severity } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Dot({ className, pulse }: { className?: string; pulse?: boolean }) {
  return (
    <span className="relative inline-flex size-2 shrink-0">
      {pulse && <span className={cn("absolute inset-0 animate-ping rounded-full opacity-60", className)} />}
      <span className={cn("relative inline-flex size-2 rounded-full", className)} />
    </span>
  );
}

const ACTIVITY_DOT: Record<Activity, string> = {
  offline: "bg-ink-3",
  parked: "bg-success",
  moving: "bg-success",
  discharging: "bg-ink",
};

export function ActivityPill({ activity, className }: { activity: Activity; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs", className)}>
      <Dot className={ACTIVITY_DOT[activity]} pulse={activity === "discharging" || activity === "moving"} />
      {ACTIVITY_LABEL[activity]}
    </span>
  );
}

const SEVERITY_STYLE: Record<Severity, string> = {
  critical: "border-critical/30 bg-critical/10 text-critical",
  warning: "border-warning/40 bg-warning/10 text-foreground",
  info: "border-border bg-muted text-muted-foreground",
};
const SEVERITY_DOT: Record<Severity, string> = { critical: "bg-critical", warning: "bg-warning", info: "bg-ink-3" };

export function SeverityPill({ severity, className }: { severity: Severity; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium", SEVERITY_STYLE[severity], className)}>
      <Dot className={SEVERITY_DOT[severity]} />
      {SEVERITY_LABEL[severity]}
    </span>
  );
}

export function ValvePill({ open, className }: { open: boolean | undefined; className?: string }) {
  if (open === undefined) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[11px] font-medium tracking-wide",
        open ? "border-ink bg-ink text-background" : "text-muted-foreground",
        className,
      )}
    >
      {open ? "VALVE OPEN" : "CLOSED"}
    </span>
  );
}

export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs", className)}>{children}</span>;
}

/** Horizontal tank fill bar with a 10% tick grid. */
export function FillBar({ pct, className }: { pct: number | null; className?: string }) {
  const v = pct === null ? 0 : Math.max(0, Math.min(100, pct));
  return (
    <div className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-ink-4", className)}>
      <div className={cn("h-full rounded-full bg-ink transition-[width] duration-700", pct === null && "opacity-0")} style={{ width: `${v}%` }} />
    </div>
  );
}
