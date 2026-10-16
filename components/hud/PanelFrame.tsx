import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PanelFrameProps {
  title: string;
  children?: ReactNode;
  active?: boolean;
  className?: string;
  headerRight?: ReactNode;
}

export function PanelFrame({ title, children, active = false, className, headerRight }: PanelFrameProps) {
  const borderColor = active ? "border-accent-info/60" : "border-border-default";
  const cornerColor = active ? "text-accent-info" : "text-border-default";

  return (
    <div className={cn("relative rounded-lg border", borderColor, "glass-panel transition-all duration-300", active && "shadow-[0_0_15px_rgba(56,189,248,0.15)]", className)}>
      {/* Corner brackets */}
      <svg className="absolute top-0 left-0 w-4 h-4 pointer-events-none" aria-hidden>
        <path d="M0 0 L0 16 L2 16 L2 2 L16 2 L16 0 Z" fill="currentColor" />
      </svg>
      <svg className={cn("absolute top-0 right-0 w-4 h-4 pointer-events-none rotate-90", cornerColor)} aria-hidden>
        <path d="M0 0 L0 16 L2 16 L2 2 L16 2 L16 0 Z" fill="currentColor" />
      </svg>
      <svg className={cn("absolute bottom-0 left-0 w-4 h-4 pointer-events-none -rotate-90", cornerColor)} aria-hidden>
        <path d="M0 0 L0 16 L2 16 L2 2 L16 2 L16 0 Z" fill="currentColor" />
      </svg>
      <svg className={cn("absolute bottom-0 right-0 w-4 h-4 pointer-events-none rotate-180", cornerColor)} aria-hidden>
        <path d="M0 0 L0 16 L2 16 L2 2 L16 2 L16 0 Z" fill="currentColor" />
      </svg>

      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <h3
          className={cn(
            "text-xs tracking-[0.15em] uppercase font-sans",
            active ? "text-accent-info" : "text-text-muted",
          )}
        >
          {title}
        </h3>
        {headerRight && <div className="shrink-0">{headerRight}</div>}
      </div>
      <div className="mx-4 h-px bg-gradient-to-r from-accent-info/80 to-transparent shadow-[0_1px_5px_rgba(56,189,248,0.4)]" />

      {/* Content */}
      {children && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}
