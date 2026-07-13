"use client";
import { useEffect, useRef, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import MapLegend from "./MapLegend";
import {
  PLANTATION_BOUNDS,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
  PDF_OVERLAY_URL,
  PDF_OVERLAY_BOUNDS,
  LOT_BOUNDARIES,
} from "./PlantationData";

// Fix Leaflet default marker icon paths
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

interface MapEntry {
  id: string;
  latitude: number;
  longitude: number;
  leaderName: string;
  block: string;
  lotLabel: string | null;
  workStatus: string;
  numWorkers: number | null;
  bunches: number | null;
  tons: number | null;
  date: string;
}

interface MapViewProps {
  entries: MapEntry[];
  flyTo?: [number, number] | null;
  overlayOpacity?: number;
  onMapClick?: (lat: number, lng: number) => void;
}

export default function MapView({
  entries,
  flyTo,
  overlayOpacity = 1.0,
  onMapClick,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const overlayRef = useRef<L.ImageOverlay | null>(null);
  const boundariesLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize map once — no tile layer, just the plantation overlay
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: DEFAULT_MAP_CENTER,
      zoom: 14,
      maxZoom: MAX_ZOOM,
      minZoom: MIN_ZOOM,
      maxBounds: [
        [PLANTATION_BOUNDS.sw[0] - 0.015, PLANTATION_BOUNDS.sw[1] - 0.015],
        [PLANTATION_BOUNDS.ne[0] + 0.015, PLANTATION_BOUNDS.ne[1] + 0.015],
      ],
      maxBoundsViscosity: 1.0,
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
    });

    // Dark green background — no tile layer
    mapRef.current.style.background = "#1a2a1a";

    // Zoom control — top right
    L.control.zoom({ position: "topright" }).addTo(map);

    // PDF overlay — fully opaque, this IS the map
    const imageOverlay = L.imageOverlay(PDF_OVERLAY_URL, PDF_OVERLAY_BOUNDS, {
      opacity: overlayOpacity,
      interactive: false,
    });
    imageOverlay.addTo(map);
    overlayRef.current = imageOverlay;

    // Layer groups
    const boundariesLayer = L.layerGroup().addTo(map);
    const markersLayer = L.layerGroup().addTo(map);

    // Click handler for adding new markers
    map.on("click", (e: L.LeafletMouseEvent) => {
      if (onMapClick) {
        // Use the raw lat/lng from the click event (before flip)
        // The click event gives us the actual coordinate on the overlay
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    });

    mapInstanceRef.current = map;
    markersLayerRef.current = markersLayer;
    boundariesLayerRef.current = boundariesLayer;

    // Draw lot boundaries
    const BLOCK_COLORS: Record<string, string> = {
      "01": "#10b981",
      "04": "#3b82f6",
    };

    LOT_BOUNDARIES.forEach((boundary) => {
      const color = BLOCK_COLORS[boundary.block] || "#f59e0b";
      const polygon = L.polygon(boundary.coordinates, {
        color,
        weight: 1.5,
        fillColor: color,
        fillOpacity: 0.06,
        dashArray: "4 4",
      });
      polygon.bindTooltip(boundary.name, { permanent: false, direction: "center" });
      polygon.addTo(boundariesLayer);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      overlayRef.current = null;
      boundariesLayerRef.current = null;
    };
  }, []);

  // Update markers when entries change
  useEffect(() => {
    const markersLayer = markersLayerRef.current;
    if (!markersLayer) return;

    markersLayer.clearLayers();

    entries.forEach((entry) => {
      const isWork = entry.workStatus === "work";
      const color = isWork ? "#10b981" : "#6b7280";
      const opacity = isWork ? 1 : 0.7;

      const icon = L.divIcon({
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
        html: `<div style="
          width:32px;height:32px;display:flex;align-items:center;justify-content:center;
          background:${color};border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);border:3px solid #fff;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);opacity:${opacity};
        ">
          <span style="transform:rotate(45deg);display:block;text-align:center;line-height:26px;font-size:14px;">
            ${isWork ? "👤" : "🚫"}
          </span>
        </div>`,
      });

      const popupContent = `
        <div style="font-family:Inter,system-ui,sans-serif;min-width:180px;">
          <div style="font-weight:700;font-size:14px;margin-bottom:6px;color:#1a1a1a;">
            ${entry.leaderName}
          </div>
          <div style="font-size:12px;color:#555;margin-bottom:8px;">
            <div style="margin-bottom:2px;">
              <strong>📍</strong> Block ${entry.block}${entry.lotLabel ? ` — ${entry.lotLabel}` : ""}
            </div>
            ${isWork && entry.numWorkers != null ? `<div style="margin-bottom:2px;"><strong>👷</strong> Workers: ${entry.numWorkers}</div>` : ""}
            ${isWork && entry.bunches != null ? `<div style="margin-bottom:2px;"><strong>🌿</strong> Bunches: ${entry.bunches.toLocaleString("en-MY")}</div>` : ""}
            ${entry.tons != null && entry.tons > 0 ? `<div style="margin-bottom:2px;"><strong>⚖️</strong> Tons: ${Number(entry.tons).toFixed(2)}</div>` : ""}
            <div style="margin-top:4px;padding-top:4px;border-top:1px solid #eee;">
              <strong>📅</strong> ${entry.date}
            </div>
          </div>
          <div style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;
            background:${isWork ? "#d1fae5" : "#e5e7eb"};color:${isWork ? "#065f46" : "#374151"};">
            ${isWork ? "Work Day" : "No Work"}
          </div>
        </div>
      `;

      const marker = L.marker([entry.latitude, entry.longitude], { icon });
      marker.bindPopup(popupContent);
      marker.addTo(markersLayer);
    });
  }, [entries]);

  // Handle flyTo
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !flyTo) return;
    map.flyTo(flyTo, 16, { duration: 1.5 });
  }, [flyTo]);

  // Handle overlay opacity changes
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    overlay.setOpacity(overlayOpacity);
  }, [overlayOpacity]);

  return (
    <div className="relative w-full" style={{ height: "calc(100vh - 180px)" }}>
      <div ref={mapRef} className="w-full h-full rounded-2xl" />
      <MapLegend />
    </div>
  );
}
