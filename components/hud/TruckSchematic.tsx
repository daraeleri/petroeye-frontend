"use client";

import { useEffect, useRef, useState } from "react";
import { SensorBadge } from "@/components/hud/SensorBadge";
import type { TelemetryReading } from "@/lib/types";

interface Hotspot {
  id: string;
  x: number;
  y: number;
}

interface TruckSchematicProps {
  telemetry: TelemetryReading | null;
}

function severityForFuel(pct: number) {
  if (pct < 10) return "critical" as const;
  if (pct < 25) return "warning" as const;
  return "info" as const;
}

function severityForTemp(c: number) {
  if (c >= 60) return "critical" as const;
  if (c >= 40) return "warning" as const;
  return "info" as const;
}

function severityForTilt(deg: number) {
  if (deg >= 25) return "critical" as const;
  if (deg >= 15) return "warning" as const;
  return "info" as const;
}

export function TruckSchematic({ telemetry }: TruckSchematicProps) {
  const svgRef = useRef<HTMLDivElement>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [svgContent, setSvgContent] = useState<string>("");

  useEffect(() => {
    fetch("/assets/truck-schematic.svg")
      .then((r) => r.text())
      .then((text) => setSvgContent(text))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!svgContent || !svgRef.current) return;
    const temp = document.createElement("div");
    temp.innerHTML = svgContent;
    const root = temp.querySelector("svg");
    if (!root) return;

    const found: Hotspot[] = [];
    const names = ["fuel", "temp", "hatch", "tilt", "gps"];
    for (const name of names) {
      const el = root.querySelector(`#hotspot-${name}`);
      if (el) {
        const bbox = el.getBoundingClientRect();
        found.push({ id: `hotspot-${name}`, x: bbox.left, y: bbox.top });
      }
    }
    if (found.length > 0) setHotspots(found);
  }, [svgContent]);

  if (!svgContent) {
    return <div className="text-text-muted text-sm">Loading schematic...</div>;
  }

  return (
    <div ref={svgRef} className="relative w-full h-full flex items-center justify-center">
      <div
        className="w-[90%] max-w-[600px]"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />

      {telemetry && hotspots.map((h) => {
        if (h.id === "hotspot-fuel") {
          return (
            <SensorBadge
              key="fuel"
              label="Fuel"
              value={`${telemetry.fuel_level_pct.toFixed(1)}%`}
              severity={severityForFuel(telemetry.fuel_level_pct)}
              className="top-[38%] left-[30%]"
            />
          );
        }
        if (h.id === "hotspot-temp") {
          return (
            <SensorBadge
              key="temp"
              label="Temp"
              value={`${telemetry.temperature_c.toFixed(1)}°C`}
              severity={severityForTemp(telemetry.temperature_c)}
              className="top-[38%] left-[52%]"
            />
          );
        }
        if (h.id === "hotspot-tilt") {
          return (
            <SensorBadge
              key="tilt"
              label="Tilt"
              value={`${telemetry.tilt_deg.toFixed(1)}°`}
              severity={severityForTilt(telemetry.tilt_deg)}
              className="top-[38%] left-[5%]"
            />
          );
        }
        if (h.id === "hotspot-gps") {
          return (
            <SensorBadge
              key="gps"
              label="GPS"
              value={`${telemetry.lat.toFixed(4)}, ${telemetry.lon.toFixed(4)}`}
              severity="info"
              className="top-[38%] left-[85%]"
            />
          );
        }
        if (h.id === "hotspot-hatch") {
          return (
            <SensorBadge
              key="hatch"
              label="Hatch"
              value={telemetry.hatch_open ? "OPEN" : "CLOSED"}
              severity={telemetry.hatch_open ? "critical" : "info"}
              className="top-[15%] left-[78%]"
            />
          );
        }
        return null;
      })}
    </div>
  );
}
