"use client";
import { RotateCcw, Trash2 } from "lucide-react";
import { DrawMode, Drawing } from "./MapClient";

const DRAW_COLORS = [
  { color: '#ffffff', label: 'White' },
  { color: '#000000', label: 'Black' },
  { color: '#10b981', label: 'Green' },
  { color: '#ef4444', label: 'Red' },
];

const WEIGHTS = {
  thin: { value: 1.5, label: 'Thin' },
  normal: { value: 2.5, label: 'Normal' },
  thick: { value: 4.0, label: 'Thick' },
};

const ZOOM_MIN = 13;
const ZOOM_MAX = 18;

interface MapRightPanelProps {
  overlayOpacity: number;
  onOpacityChange: (value: number) => void;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  onResetView: () => void;
  drawMode: DrawMode;
  onDrawModeChange: (mode: DrawMode) => void;
  drawStart: [number, number] | null;
  drawings: Drawing[];
  selectedColor: string;
  onColorChange: (color: string) => void;
  selectedWeight: "thin" | "normal" | "thick";
  onWeightChange: (weight: "thin" | "normal" | "thick") => void;
  onClearDrawings: () => void;
  markerCount: number;
  onClearAllMarkers: () => void;
}

export default function MapRightPanel({
  overlayOpacity,
  onOpacityChange,
  zoomLevel,
  onZoomChange,
  onResetView,
  drawMode,
  onDrawModeChange,
  drawStart,
  drawings,
  selectedColor,
  onColorChange,
  selectedWeight,
  onWeightChange,
  onClearDrawings,
  markerCount,
  onClearAllMarkers,
}: MapRightPanelProps) {
  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Box 1 — Map Controls */}
      <div className="map-control-box">
        <h4>Map Controls</h4>

        {/* Opacity */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
              Map Opacity
            </span>
            <span className="text-[10px] font-medium" style={{ color: "#10b981" }}>
              {Math.round(overlayOpacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(overlayOpacity * 100)}
            onChange={(e) => onOpacityChange(Number(e.target.value) / 100)}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
            style={{ backgroundColor: "rgba(16, 185, 129, 0.2)" }}
          />
        </div>

        {/* Zoom */}
        <div className="mb-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#6b7280" }}>
            Zoom
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium" style={{ color: "#6b7280" }}>−</span>
            <input
              type="range"
              min={ZOOM_MIN}
              max={ZOOM_MAX}
              step={0.25}
              value={zoomLevel}
              onChange={(e) => onZoomChange(parseFloat(e.target.value))}
              className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer"
              style={{ backgroundColor: "rgba(16, 185, 129, 0.2)" }}
            />
            <span className="text-[10px] font-medium" style={{ color: "#6b7280" }}>+</span>
          </div>
        </div>

        {/* Reset */}
        <button
          onClick={onResetView}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
          style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}
        >
          <RotateCcw className="w-3 h-3" />
          Reset View
        </button>

        {/* Legend */}
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(16, 185, 129, 0.15)" }}>
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#6b7280" }}>
            Legend
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#10b981" }} />
              <span className="text-[10px]" style={{ color: "#a3be8c" }}>Work Day</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#6b7280" }} />
              <span className="text-[10px]" style={{ color: "#a3be8c" }}>No Work</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
              <span className="text-[10px]" style={{ color: "#a3be8c" }}>Not Logged</span>
            </div>
          </div>
        </div>

        {/* Clear All Markers */}
        {markerCount > 0 && (
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(16, 185, 129, 0.15)" }}>
            <button
              onClick={onClearAllMarkers}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
              style={{ backgroundColor: "rgba(220, 38, 38, 0.15)", color: "#ef4444" }}
            >
              <Trash2 className="w-3 h-3" />
              Clear All Markers ({markerCount})
            </button>
          </div>
        )}
      </div>

      {/* Box 2 — Draw */}
      <div className="map-control-box">
        <h4>Draw</h4>

        {/* Mode */}
        <div className="mb-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#6b7280" }}>
            Mode
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onDrawModeChange("select")}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: drawMode === "select" ? "rgba(16, 185, 129, 0.3)" : "rgba(255, 255, 255, 0.05)",
                color: drawMode === "select" ? "#10b981" : "#6b7280",
                border: drawMode === "select" ? "2px solid #10b981" : "2px solid transparent",
              }}
            >
              <span>👆</span>
              Select
            </button>
            <button
              onClick={() => onDrawModeChange("draw")}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: drawMode === "draw" ? "rgba(16, 185, 129, 0.3)" : "rgba(255, 255, 255, 0.05)",
                color: drawMode === "draw" ? "#10b981" : "#6b7280",
                border: drawMode === "draw" ? "2px solid #10b981" : "2px solid transparent",
              }}
            >
              <span>✏️</span>
              Draw
            </button>
          </div>
        </div>

        {/* Shape */}
        <div className="mb-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#6b7280" }}>
            Shape
          </div>
          <div className="flex gap-2">
            <button
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.3)",
                color: "#10b981",
                border: "2px solid #10b981",
              }}
            >
              <span>➡️</span>
              Arrow
            </button>
          </div>
        </div>

        {/* Color */}
        <div className="mb-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#6b7280" }}>
            Color
          </div>
          <div className="flex items-center gap-2">
            {DRAW_COLORS.map(({ color, label }) => (
              <button
                key={color}
                onClick={() => onColorChange(color)}
                title={label}
                className="w-7 h-7 rounded-md transition-all"
                style={{
                  backgroundColor: color === '#000000' ? '#1f2937' : color,
                  border: selectedColor === color ? "2px solid #10b981" : "2px solid rgba(255,255,255,0.2)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Weight */}
        <div className="mb-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#6b7280" }}>
            Weight
          </div>
          <div className="flex gap-2">
            {(Object.entries(WEIGHTS) as [keyof typeof WEIGHTS, typeof WEIGHTS[keyof typeof WEIGHTS]][]).map(([key, { label }]) => (
              <button
                key={key}
                onClick={() => onWeightChange(key)}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  backgroundColor: selectedWeight === key ? "rgba(16, 185, 129, 0.3)" : "rgba(255, 255, 255, 0.05)",
                  color: selectedWeight === key ? "#10b981" : "#6b7280",
                  border: selectedWeight === key ? "2px solid #10b981" : "2px solid transparent",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Clear All */}
        {drawings.length > 0 && (
          <button
            onClick={onClearDrawings}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80"
            style={{ backgroundColor: "rgba(220, 38, 38, 0.15)", color: "#ef4444" }}
          >
            <Trash2 className="w-3 h-3" />
            Clear All Drawings ({drawings.length})
          </button>
        )}
      </div>
    </div>
  );
}
