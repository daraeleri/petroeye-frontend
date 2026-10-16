"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { Loader2 } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { useState } from "react";

const ATTRIBUTION = "Tiles &copy; Esri";
const DARK_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
const LIGHT_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}";

interface TruckMiniMapProps {
  lat: number;
  lon: number;
  color?: string;
  className?: string;
  zoom?: number;
}

export function TruckMiniMap({ lat, lon, color = "#22C55E", className, zoom = 13 }: TruckMiniMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);
  const { resolvedTheme } = useTheme();

  // Init once (StrictMode-safe)
  useEffect(() => {
    let cancelled = false;
    let ro: ResizeObserver | null = null;

    const loadMap = async () => {
      if (typeof window === "undefined") return;
      if (!mapRef.current) return;
      if ((mapRef.current as any)._leaflet_id) return;

      const L = await import("leaflet");
      if (cancelled || !mapRef.current || (mapRef.current as any)._leaflet_id) return;

      LRef.current = L;
      mapInstanceRef.current = L.map(mapRef.current, {
        center: [lat, lon],
        zoom,
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: false,
      });

      L.tileLayer(resolvedTheme === "light" ? LIGHT_TILES : DARK_TILES, {
        attribution: ATTRIBUTION,
        maxZoom: 16,
      }).addTo(mapInstanceRef.current);

      const total = 18;
      markerRef.current = L
        .marker([lat, lon], {
          icon: L.divIcon({
            className: "",
            html: `<div style="width:${total}px;height:${total}px;background:${color};border:3px solid #fff;border-radius:50%;box-shadow:0 0 10px ${color}aa;"></div>`,
            iconSize: [total, total],
            iconAnchor: [total / 2, total / 2],
          }),
        })
        .addTo(mapInstanceRef.current);

      ro = new ResizeObserver(() => mapInstanceRef.current?.invalidateSize());
      ro.observe(mapRef.current);

      setLoaded(true);
    };

    loadMap();

    return () => {
      cancelled = true;
      ro?.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
      setLoaded(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follow position updates in real time
  useEffect(() => {
    if (!loaded || !markerRef.current || !mapInstanceRef.current) return;
    markerRef.current.setLatLng([lat, lon]);
    mapInstanceRef.current.panTo([lat, lon], { animate: true, duration: 0.5 });
  }, [lat, lon, loaded]);

  // Swap tiles on theme change
  useEffect(() => {
    if (!loaded || !mapInstanceRef.current) return;
    mapInstanceRef.current.eachLayer((layer: any) => {
      if (layer.setUrl) layer.setUrl(resolvedTheme === "light" ? LIGHT_TILES : DARK_TILES);
    });
  }, [resolvedTheme, loaded]);

  return (
    <div className={className}>
      <div className="relative w-full h-full">
        <div ref={mapRef} className="w-full h-full" />
        {!loaded && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-muted">
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
