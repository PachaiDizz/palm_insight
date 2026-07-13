"use client";
import { MapPin } from "lucide-react";

interface MapControlsProps {
  overlayOpacity: number;
  onOpacityChange: (value: number) => void;
  onFitAll: () => void;
  markerCount: number;
}

export default function MapControls({
  overlayOpacity,
  onOpacityChange,
  onFitAll,
  markerCount,
}: MapControlsProps) {
  return (
    <div
      className="absolute top-3 right-3 sm:top-4 sm:right-4 z-[1000] rounded-xl overflow-hidden max-w-[calc(100vw-24px)]"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-default)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
        backdropFilter: "blur(12px)",
        minWidth: 160,
      }}
    >
      {/* Opacity Slider */}
      <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Map Opacity
          </span>
          <span className="text-xs font-medium" style={{ color: "var(--accent-primary)" }}>
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
          style={{ backgroundColor: "var(--bg-base)" }}
        />
      </div>

      {/* Show All Teams */}
      <div className="px-4 py-3">
        <button
          onClick={onFitAll}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80"
          style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)" }}
        >
          <MapPin className="w-3.5 h-3.5" />
          Show All Teams ({markerCount})
        </button>
      </div>
    </div>
  );
}
