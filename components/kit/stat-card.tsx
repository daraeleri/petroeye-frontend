import { MiniBars } from "@/components/kit/charts";
import { Skeleton } from "@/components/kit/panel";
import { cn } from "@/lib/utils";

/** KPI card: small-caps label, big mono number, sparkline, footnote. */
export function StatCard({
  label,
  value,
  unit,
  bars,
  footnote,
  tone,
  loading,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  bars?: number[];
  footnote?: React.ReactNode;
  tone?: "critical";
  loading?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col justify-between gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="label-caps">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-24" />
          ) : (
            <p className={cn("tabular mt-1.5 truncate font-mono text-[28px] leading-none font-semibold tracking-tight", tone === "critical" && "text-critical")}>
              {value}
              {unit && <span className="ml-1.5 font-sans text-xs font-normal text-muted-foreground">{unit}</span>}
            </p>
          )}
        </div>
        {bars && bars.length > 0 && <MiniBars values={bars} className="shrink-0" />}
      </div>
      {footnote && <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{footnote}</div>}
    </div>
  );
}
