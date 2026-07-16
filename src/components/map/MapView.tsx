"use client";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
  MAX_BOUNDS,
  PDF_OVERLAY_URL,
  PDF_OVERLAY_BOUNDS,
  LOT_BOUNDARIES,
} from "./PlantationData";
import { Drawing, DrawMode } from "./MapClient";

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
  teamLeaderId: string;
}

interface MapViewProps {
  entries: MapEntry[];
  flyTo?: [number, number] | null;
  overlayOpacity?: number;
  onMapClick?: (lat: number, lng: number) => void;
  onDeleteMarker?: (id: string) => void;
  zoomLevel?: number;
  drawMode?: DrawMode;
  drawStart?: [number, number] | null;
  onDrawStartChange?: (point: [number, number] | null) => void;
  drawings?: Drawing[];
  onDrawingComplete?: (drawing: Drawing) => void;
  selectedColor?: string;
  selectedWeight?: number;
}

// Calculate bearing between two points — 0 = North, clockwise
function getBearing(from: [number, number], to: [number, number]): number {
  const dLat = to[0] - from[0];
  const dLng = to[1] - from[1];
  return Math.atan2(dLng, dLat) * (180 / Math.PI);
}

// Get point slightly before the end to stop line before arrowhead
function getPointBefore(
  from: [number, number],
  to: [number, number],
  ratio = 0.85
): [number, number] {
  return [
    from[0] + (to[0] - from[0]) * ratio,
    from[1] + (to[1] - from[1]) * ratio,
  ];
}

export default function MapView({
  entries,
  flyTo,
  overlayOpacity = 1.0,
  onMapClick,
  onDeleteMarker,
  zoomLevel = DEFAULT_MAP_ZOOM,
  drawMode = "select",
  drawStart = null,
  onDrawStartChange,
  drawings = [],
  onDrawingComplete,
  selectedColor = "#ffffff",
  selectedWeight = 2.5,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const drawingsLayerRef = useRef<L.LayerGroup | null>(null);
  const overlayRef = useRef<L.ImageOverlay | null>(null);
  const boundariesLayerRef = useRef<L.LayerGroup | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const onDeleteMarkerRef = useRef(onDeleteMarker);
  const drawModeRef = useRef(drawMode);
  const drawStartRef = useRef(drawStart);
  const onDrawStartChangeRef = useRef(onDrawStartChange);
  const onDrawingCompleteRef = useRef(onDrawingComplete);
  const selectedColorRef = useRef(selectedColor);
  const selectedWeightRef = useRef(selectedWeight);

  // Keep refs in sync
  onMapClickRef.current = onMapClick;
  onDeleteMarkerRef.current = onDeleteMarker;
  drawModeRef.current = drawMode;
  drawStartRef.current = drawStart;
  onDrawStartChangeRef.current = onDrawStartChange;
  onDrawingCompleteRef.current = onDrawingComplete;
  selectedColorRef.current = selectedColor;
  selectedWeightRef.current = selectedWeight;

  // Initialize map — dragging enabled
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Set up global delete marker handler
    (window as any).__deleteMarker = (id: string) => {
      onDeleteMarkerRef.current?.(id);
    };

    const map = L.map(mapRef.current, {
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      maxBounds: MAX_BOUNDS,
      maxBoundsViscosity: 1.0,
      zoomControl: true,
      attributionControl: false,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: false,
      touchZoom: true,
      keyboard: false,
    });

    mapRef.current.style.background = "transparent";
    map.zoomControl.setPosition("topright");

    const imageOverlay = L.imageOverlay(PDF_OVERLAY_URL, PDF_OVERLAY_BOUNDS, {
      opacity: overlayOpacity,
      interactive: false,
    });
    imageOverlay.addTo(map);
    overlayRef.current = imageOverlay;

    const boundariesLayer = L.layerGroup().addTo(map);
    const markersLayer = L.layerGroup().addTo(map);
    const drawingsLayer = L.layerGroup().addTo(map);

    // Map click handler for draw mode
    map.on("click", (e: L.LeafletMouseEvent) => {
      if (drawModeRef.current === "draw") {
        const point: [number, number] = [e.latlng.lat, e.latlng.lng];
        if (!drawStartRef.current) {
          onDrawStartChangeRef.current?.(point);
        } else {
          onDrawingCompleteRef.current?.({
            from: drawStartRef.current,
            to: point,
            color: selectedColorRef.current,
            weight: selectedWeightRef.current,
          });
          onDrawStartChangeRef.current?.(null);
        }
      } else if (onMapClickRef.current) {
        onMapClickRef.current(e.latlng.lat, e.latlng.lng);
      }
    });

    mapInstanceRef.current = map;
    markersLayerRef.current = markersLayer;
    drawingsLayerRef.current = drawingsLayer;
    boundariesLayerRef.current = boundariesLayer;

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
      drawingsLayerRef.current = null;
      overlayRef.current = null;
      boundariesLayerRef.current = null;
    };
  }, []);

  // Toggle dragging based on draw mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (drawMode === "draw") {
      map.dragging.disable();
    } else {
      map.dragging.enable();
    }
  }, [drawMode]);

  // Sync zoom level
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setZoom(zoomLevel, { animate: true });
  }, [zoomLevel]);

  // Update markers
  useEffect(() => {
    const markersLayer = markersLayerRef.current;
    if (!markersLayer) return;

    markersLayer.clearLayers();

    entries.forEach((entry) => {
      const isWork = entry.workStatus === "work";
      const isNoWork = entry.workStatus === "no_work";

      const WorkIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:20px;height:20px;background:#10b981;border:2px solid white;
          border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);
          display:flex;align-items:center;justify-content:center;font-size:10px;
        ">👤</div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -12],
      });

      const NoWorkIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:20px;height:20px;background:#6b7280;border:2px solid white;
          border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);
          display:flex;align-items:center;justify-content:center;font-size:10px;
        ">✖</div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -12],
      });

      const UnknownIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:20px;height:20px;background:#f59e0b;border:2px solid white;
          border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);
          display:flex;align-items:center;justify-content:center;font-size:10px;
        ">?</div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -12],
      });

      const icon = isWork ? WorkIcon : isNoWork ? NoWorkIcon : UnknownIcon;

      const marker = L.marker([entry.latitude, entry.longitude], { icon });

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
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;
              background:${isWork ? "#d1fae5" : "#e5e7eb"};color:${isWork ? "#065f46" : "#374151"};">
              ${isWork ? "Work Day" : "No Work"}
            </div>
            <button onclick="window.__deleteMarker('${entry.id}')" style="
              padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;
              background:#fee2e2;color:#dc2626;border:none;cursor:pointer;
            ">Delete</button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.addTo(markersLayer);
    });
  }, [entries]);

  // Render drawings (arrows)
  useEffect(() => {
    const drawingsLayer = drawingsLayerRef.current;
    if (!drawingsLayer) return;

    drawingsLayer.clearLayers();

    drawings.forEach((drawing) => {
      // Draw shortened line (stops before arrowhead)
      const lineEnd = getPointBefore(drawing.from, drawing.to, 0.88);
      const polyline = L.polyline(
        [drawing.from, lineEnd],
        {
          color: drawing.color,
          weight: drawing.weight,
          opacity: 1,
        }
      );
      polyline.addTo(drawingsLayer);

      // Draw arrowhead at endpoint using CSS border triangle
      const bearing = getBearing(drawing.from, drawing.to);
      const size = drawing.weight * 4;
      const halfSize = size / 2;
      const arrowHeadIcon = L.divIcon({
        className: "",
        html: `<div style="
          width: 0;
          height: 0;
          border-left: ${halfSize}px solid transparent;
          border-right: ${halfSize}px solid transparent;
          border-bottom: ${size}px solid ${drawing.color};
          transform: rotate(${bearing}deg);
          transform-origin: center center;
          filter: drop-shadow(0 0 2px rgba(0,0,0,0.5));
        "></div>`,
        iconSize: [size, size],
        iconAnchor: [halfSize, halfSize],
      });

      const arrowHead = L.marker(drawing.to, { icon: arrowHeadIcon, interactive: false });
      arrowHead.addTo(drawingsLayer);
    });
  }, [drawings]);

  // Render draw start indicator (green dot)
  useEffect(() => {
    const drawingsLayer = drawingsLayerRef.current;
    if (!drawingsLayer || !drawStart) return;

    const circleMarker = L.circleMarker(drawStart, {
      radius: 6,
      color: "#10b981",
      fillColor: "#10b981",
      fillOpacity: 1,
      weight: 2,
    });
    circleMarker.addTo(drawingsLayer);

    return () => {
      drawingsLayer.removeLayer(circleMarker);
    };
  }, [drawStart]);

  // Handle flyTo
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !flyTo) return;
    map.flyTo(flyTo, 15, { duration: 1.5 });
  }, [flyTo]);

  // Handle overlay opacity
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    overlay.setOpacity(overlayOpacity);
  }, [overlayOpacity]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full"
      style={{ cursor: drawMode === "draw" ? "crosshair" : "default" }}
    />
  );
}
