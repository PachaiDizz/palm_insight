"use client";
import { Polygon, Tooltip } from "react-leaflet";
import { LotBoundary as LotBoundaryType } from "./PlantationData";

interface LotBoundaryProps {
  boundary: LotBoundaryType;
}

const BLOCK_COLORS: Record<string, string> = {
  "01": "#10b981",
  "04": "#3b82f6",
};

export default function LotBoundaryOverlay({ boundary }: LotBoundaryProps) {
  const color = BLOCK_COLORS[boundary.block] || "#f59e0b";

  return (
    <Polygon
      positions={boundary.coordinates}
      pathOptions={{
        color,
        weight: 1.5,
        fillColor: color,
        fillOpacity: 0.06,
        dashArray: "4 4",
      }}
    >
      <Tooltip direction="center" permanent={false}>
        <span style={{ fontSize: 11, fontWeight: 600 }}>{boundary.name}</span>
      </Tooltip>
    </Polygon>
  );
}
