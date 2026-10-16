"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Marker {
  time: number;
  severity: "info" | "warning" | "critical";
}

interface TimelineScrubberProps {
  startTime: number;
  endTime: number;
  currentTime: number;
  onScrub: (time: number) => void;
  markers?: Marker[];
  className?: string;
}

const severityColors: Record<string, string> = {
  info: "bg-accent-safe",
  warning: "bg-accent-warning",
  critical: "bg-accent-critical",
};

export function TimelineScrubber({
  startTime,
  endTime,
  currentTime,
  onScrub,
  markers = [],
  className,
}: TimelineScrubberProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const duration = endTime - startTime;
  const progress = duration > 0 ? (currentTime - startTime) / duration : 0;

  const handleMove = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const time = startTime + x * duration;
      onScrub(time);
    },
    [startTime, duration, onScrub],
  );

  const formatTime = (t: number) => {
    const d = new Date(t);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const formatMarkerTime = (t: number) => {
    const d = new Date(t);
    return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${formatTime(t)}`;
  };

  const stepCount = 6;
  const ticks = Array.from({ length: stepCount + 1 }, (_, i) => {
    const t = startTime + (duration * i) / stepCount;
    return { time: t, label: formatTime(t) };
  });

  return (
    <div className={cn("w-full select-none", className)}>
      <div
        ref={trackRef}
        className="relative h-8 cursor-pointer"
        onMouseDown={(e) => {
          setDragging(true);
          handleMove(e.clientX);
        }}
        onMouseMove={(e) => { if (dragging) handleMove(e.clientX); }}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
        onTouchStart={(e) => {
          setDragging(true);
          handleMove(e.touches[0]!.clientX);
        }}
        onTouchMove={(e) => { if (dragging) handleMove(e.touches[0]!.clientX); }}
        onTouchEnd={() => setDragging(false)}
        role="slider"
        aria-label="Timeline scrubber"
        aria-valuemin={startTime}
        aria-valuemax={endTime}
        aria-valuenow={currentTime}
        tabIndex={0}
        onKeyDown={(e) => {
          const step = duration / 100;
          if (e.key === "ArrowRight") onScrub(Math.min(endTime, currentTime + step));
          if (e.key === "ArrowLeft") onScrub(Math.max(startTime, currentTime - step));
        }}
      >
        {/* Track background */}
        <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 rounded-full bg-border-default" />

        {/* Filled track */}
        <div
          className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full bg-accent-info transition-[width]"
          style={{ width: `${progress * 100}%` }}
        />

        {/* Markers */}
        {markers.map((m, i) => {
          const pos = duration > 0 ? (m.time - startTime) / duration : 0;
          return (
            <div
              key={i}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-base z-10",
                severityColors[m.severity],
              )}
              style={{ left: `${pos * 100}%` }}
              title={formatMarkerTime(m.time)}
            />
          );
        })}

        {/* Playhead */}
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-5 rounded-sm border border-accent-info bg-accent-info z-20 transition-[left]",
            dragging && "scale-110",
          )}
          style={{ left: `${progress * 100}%` }}
        />
      </div>

      {/* Time labels */}
      <div className="flex justify-between mt-1">
        {ticks.map((t, i) => (
          <span key={i} className="text-[10px] font-mono text-text-muted">
            {t.label}
          </span>
        ))}
      </div>
    </div>
  );
}
