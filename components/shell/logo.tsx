import { cn } from "@/lib/utils";

/** PetroEye mark: an ink square with an "eye" — a ring and a level line. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("grid size-8 place-items-center rounded-lg bg-ink text-background", className)}>
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
        <circle cx="12" cy="12" r="3" />
        <path d="M9 12h6" strokeWidth="1.5" />
      </svg>
    </span>
  );
}

export function Logo({ subtitle = "Fleet digital twin" }: { subtitle?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <LogoMark />
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-semibold tracking-tight">PetroEye</p>
        <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
