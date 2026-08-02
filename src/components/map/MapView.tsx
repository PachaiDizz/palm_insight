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

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  teamLeaderId: string;
  leaderName: string;
  block: string;
  lotLabel: string | null;
  date: string;
}

interface MapViewProps {
  entries: MapEntry[];
  mapMarkers?: MapMarker[];
  flyTo?: [number, number] | null;
  overlayOpacity?: number;
  onMapClick?: (lat: number, lng: number) => void;
  onDeleteMarker?: (id: string) => void;
  onMarkerMove?: (id: string, lat: number, lng: number) => void;
  zoomLevel?: number;
  onZoomChange?: (zoom: number) => void;
  drawMode?: DrawMode;
  drawStart?: [number, number] | null;
  onDrawStartChange?: (point: [number, number] | null) => void;
  drawings?: Drawing[];
  onDrawingComplete?: (drawing: Drawing) => void;
  onUpdateDrawing?: (index: number, drawing: Drawing) => void;
  selectedColor?: string;
  selectedWeight?: number;
  selectedDrawingIndex?: number | null;
  onSelectDrawing?: (index: number | null) => void;
  onDeleteDrawing?: (index: number) => void;
  filterTeamId?: string | null;
}

interface MapEntry {
  id: string;
  latitude: number | null;
  longitude: number | null;
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

// Distinct team color palette — visible on dark map backgrounds
const TEAM_COLORS = [
  "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#f97316", "#ec4899", "#14b8a6",
  "#6366f1", "#84cc16", "#e11d48", "#0ea5e9",
];

// Build a stable color map from sorted unique teamLeaderIds
function buildTeamColorMap(entries: MapEntry[]): Map<string, string> {
  const ids = [...new Set(entries.map((e) => e.teamLeaderId))].sort();
  const map = new Map<string, string>();
  ids.forEach((id, i) => map.set(id, TEAM_COLORS[i % TEAM_COLORS.length]));
  return map;
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
  mapMarkers = [],
  flyTo,
  overlayOpacity = 1.0,
  onMapClick,
  onDeleteMarker,
  onMarkerMove,
  zoomLevel = DEFAULT_MAP_ZOOM,
  onZoomChange,
  drawMode = "select",
  drawStart = null,
  onDrawStartChange,
  drawings = [],
  onDrawingComplete,
  onUpdateDrawing,
  selectedColor = "#ffffff",
  selectedWeight = 2.5,
  selectedDrawingIndex = null,
  onSelectDrawing,
  onDeleteDrawing,
  filterTeamId = null,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const drawingsLayerRef = useRef<L.LayerGroup | null>(null);
  const overlayRef = useRef<L.ImageOverlay | null>(null);
  const boundariesLayerRef = useRef<L.LayerGroup | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const onDeleteMarkerRef = useRef(onDeleteMarker);
  const onMarkerMoveRef = useRef(onMarkerMove);
  const onDrawingCompleteRef = useRef(onDrawingComplete);
  const onUpdateDrawingRef = useRef(onUpdateDrawing);
  const drawModeRef = useRef(drawMode);
  const drawStartRef = useRef(drawStart);
  const onDrawStartChangeRef = useRef(onDrawStartChange);
  const onZoomChangeRef = useRef(onZoomChange);
  const selectedColorRef = useRef(selectedColor);
  const selectedWeightRef = useRef(selectedWeight);
  const filterTeamIdRef = useRef(filterTeamId);

  // Keep refs in sync
  onMapClickRef.current = onMapClick;
  onDeleteMarkerRef.current = onDeleteMarker;
  onMarkerMoveRef.current = onMarkerMove;
  onDrawingCompleteRef.current = onDrawingComplete;
  onUpdateDrawingRef.current = onUpdateDrawing;
  drawModeRef.current = drawMode;
  drawStartRef.current = drawStart;
  onDrawStartChangeRef.current = onDrawStartChange;
  onZoomChangeRef.current = onZoomChange;
  selectedColorRef.current = selectedColor;
  selectedWeightRef.current = selectedWeight;
  filterTeamIdRef.current = filterTeamId;

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

    // Sync zoom back to parent when user scrolls/clicks zoom
    map.on("zoomend", () => {
      onZoomChangeRef.current?.(map.getZoom());
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

    const filteredMarkers = filterTeamId
      ? mapMarkers.filter((m) => m.teamLeaderId === filterTeamId)
      : mapMarkers;

    filteredMarkers.forEach((markerData) => {
      const teamColor = "#10b981";

      const markerIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:20px;height:20px;background:${teamColor};border:2px solid white;
          border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);
          display:flex;align-items:center;justify-content:center;font-size:10px;
        ">👤</div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -12],
      });

      const isDrawMode = drawMode === "draw";
      const marker = L.marker([markerData.lat, markerData.lng], {
        icon: markerIcon,
        draggable: !isDrawMode,
        interactive: !isDrawMode,
      });

      if (!isDrawMode) {
        marker.on("dragend", (e) => {
          const pos = e.target.getLatLng();
          onMarkerMoveRef.current?.(markerData.id, pos.lat, pos.lng);
        });
      }

      const popupContent = `
        <div style="font-family:Inter,system-ui,sans-serif;min-width:180px;">
          <div style="font-weight:700;font-size:14px;margin-bottom:6px;color:${teamColor};">
            ${markerData.leaderName}
          </div>
          <div style="font-size:12px;color:#555;margin-bottom:8px;">
            <div style="margin-bottom:2px;">
              <strong>📍</strong> Block ${markerData.block}${markerData.lotLabel ? ` — ${markerData.lotLabel}` : ""}
            </div>
            <div style="margin-top:4px;padding-top:4px;border-top:1px solid #eee;">
              <strong>📅</strong> ${markerData.date}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;
              background:${teamColor}20;color:${teamColor};">
              Map Marker
            </div>
            <button onclick="window.__deleteMarker('${markerData.id}')" style="
              padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;
              background:#fee2e2;color:#dc2626;border:none;cursor:pointer;
            ">Delete</button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.addTo(markersLayer);
    });
  }, [mapMarkers, filterTeamId, drawMode]);

  // Render drawings (arrows)
  useEffect(() => {
    const drawingsLayer = drawingsLayerRef.current;
    if (!drawingsLayer) return;

    drawingsLayer.clearLayers();

    drawings.forEach((drawing, index) => {
      const isSelected = selectedDrawingIndex === index;

      // Draw full line from start to end
      const polyline = L.polyline(
        [drawing.from, drawing.to],
        {
          color: drawing.color,
          weight: isSelected ? drawing.weight + 2 : drawing.weight,
          opacity: 1,
          className: isSelected ? "selected-drawing" : "",
        }
      );

      // Make line clickable when in select mode
      if (drawMode === "select") {
        polyline.on("click", (e) => {
          L.DomEvent.stop(e);
          onSelectDrawing?.(index);
        });
      }

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

      // Show controls for selected drawing
      if (isSelected && drawMode === "select") {
        const midPoint: [number, number] = [
          (drawing.from[0] + drawing.to[0]) / 2,
          (drawing.from[1] + drawing.to[1]) / 2,
        ];

        // Drag handle (move arrow)
        const dragIcon = L.divIcon({
          className: "",
          html: `<div style="
            background: #10b981;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: grab;
            font-size: 12px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            border: 2px solid white;
          ">✥</div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        const dragMarker = L.marker(midPoint, { icon: dragIcon, zIndexOffset: 1000, draggable: true });
        dragMarker.on("dragstart", (e) => {
          L.DomEvent.stop(e);
        });
        dragMarker.on("drag", (e) => {
          const newPos = e.target.getLatLng();
          const deltaLat = newPos.lat - midPoint[0];
          const deltaLng = newPos.lng - midPoint[1];
          const newFrom: [number, number] = [drawing.from[0] + deltaLat, drawing.from[1] + deltaLng];
          const newTo: [number, number] = [drawing.to[0] + deltaLat, drawing.to[1] + deltaLng];
          onUpdateDrawingRef.current?.(index, { ...drawing, from: newFrom, to: newTo });
        });
        dragMarker.on("dragend", (e) => {
          const newPos = e.target.getLatLng();
          const deltaLat = newPos.lat - midPoint[0];
          const deltaLng = newPos.lng - midPoint[1];
          const newFrom: [number, number] = [drawing.from[0] + deltaLat, drawing.from[1] + deltaLng];
          const newTo: [number, number] = [drawing.to[0] + deltaLat, drawing.to[1] + deltaLng];
          onUpdateDrawingRef.current?.(index, { ...drawing, from: newFrom, to: newTo });
        });
        dragMarker.addTo(drawingsLayer);

        // Delete button
        const deleteIcon = L.divIcon({
          className: "",
          html: `<div style="
            background: #ef4444;
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            border: 2px solid white;
          ">×</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        const deleteMarker = L.marker(
          [midPoint[0], midPoint[1] - 0.00005],
          { icon: deleteIcon, zIndexOffset: 1000 }
        );
        deleteMarker.on("click", (e) => {
          L.DomEvent.stop(e);
          onDeleteDrawing?.(index);
          onSelectDrawing?.(null);
        });
        deleteMarker.addTo(drawingsLayer);
      }
    });
  }, [drawings, selectedDrawingIndex, drawMode, onSelectDrawing, onDeleteDrawing]);

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
