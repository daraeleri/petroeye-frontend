"use client";

import { Box } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlaceholderProps {
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Placeholder({ active, onClick, className }: PlaceholderProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded text-[10px] uppercase tracking-wider font-mono transition-colors",
        active
          ? "bg-accent-info/20 text-accent-info border border-accent-info/40"
          : "text-text-muted hover:text-text-primary border border-transparent",
        className,
      )}
    >
      <Box className="w-3.5 h-3.5" />
      3D
      <span className="text-[8px] opacity-60 ml-0.5">Coming Soon</span>
    </button>
  );
}
