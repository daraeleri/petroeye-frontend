import { cn } from "@/lib/utils";

interface GlowBackdropProps {
  color?: string;
  size?: string;
  className?: string;
}

export function GlowBackdrop({
  color = "rgba(56,189,248,0.2)",
  size = "70%",
  className,
}: GlowBackdropProps) {
  return (
    <div
      className={cn("absolute inset-0 pointer-events-none z-0", className)}
      aria-hidden
    >
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-breath"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(ellipse at center, ${color} 0%, transparent 70%)`,
        }}
      />
    </div>
  );
}
