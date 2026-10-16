"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Truck, TelemetryReading } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  alert: "#EF4444",
  offline: "#8B98A5",
  in_transit: "#22C55E",
  idle: "#38BDF8",
  loading: "#F59E0B",
  delivered: "#22C55E",
};

interface MapContentProps {
  markers: { truck: Truck; reading: TelemetryReading | null }[];
  selectedTruckId: string | null;
  onMarkerClick: (truckId: string) => void;
}

const DARK_TILES = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
const ATTRIBUTION = 'Tiles &copy; Esri — Esri, DeLorme, NAVTEQ';

function createMarkerIcon(status: string, isSelected: boolean): L.DivIcon {
  const color = STATUS_COLORS[status] ?? "#38BDF8";
  const size = isSelected ? 18 : 12;
  const borderWidth = isSelected ? 3 : 2;
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:${borderWidth}px solid ${isSelected ? "#fff" : "#0B0F14"};
      border-radius:50%;
      box-shadow:0 0 ${isSelected ? "12px" : "4px"} ${color}88;
      transition:all 0.2s;
    "></div>`,
    iconSize: [size + borderWidth * 2, size + borderWidth * 2],
    iconAnchor: [(size + borderWidth * 2) / 2, (size + borderWidth * 2) / 2],
  });
}

function FlyToSelected({ truckId, markers }: { truckId: string | null; markers: { truck: Truck; reading: TelemetryReading | null }[] }) {
  const map = useMap();
  useEffect(() => {
    if (!truckId) return;
    const m = markers.find((mm) => mm.truck.truck_id === truckId);
    if (m?.reading) {
      map.flyTo([m.reading.lat, m.reading.lon], 14, { duration: 0.8 });
    }
  }, [truckId, markers, map]);
  return null;
}

export default function MapContent({ markers, selectedTruckId, onMarkerClick }: MapContentProps) {
  const center: [number, number] = useMemo(() => {
    const m = markers.find((mm) => mm.reading);
    return m?.reading ? [m.reading.lat, m.reading.lon] : [3.848, 11.502];
  }, [markers]);

  return (
    <MapContainer
      center={center}
      zoom={11}
      maxZoom={16}
      className="w-full h-full"
      zoomControl={true}
      attributionControl={false}
    >
      <TileLayer url={DARK_TILES} attribution={ATTRIBUTION} />
      <FlyToSelected truckId={selectedTruckId} markers={markers} />

      {markers.map((m) => {
        if (!m.reading) return null;
        const isSelected = m.truck.truck_id === selectedTruckId;
        return (
          <Marker
            key={m.truck.truck_id}
            position={[m.reading.lat, m.reading.lon]}
            icon={createMarkerIcon(m.truck.status, isSelected)}
            eventHandlers={{ click: () => onMarkerClick(m.truck.truck_id) }}
          >
            <Popup>
              <div style={{ fontFamily: "monospace", fontSize: "12px", lineHeight: "1.4" }}>
                <strong>{m.truck.truck_id}</strong>
                <br />
                Status: {m.truck.status.replace("_", " ")}
                <br />
                Fuel: {m.reading.fuel_level_pct.toFixed(1)}%
                <br />
                Temp: {m.reading.temperature_c.toFixed(1)}°C
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
