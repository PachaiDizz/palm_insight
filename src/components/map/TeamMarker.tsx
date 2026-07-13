"use client";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Users, MapPin, Truck, Sprout } from "lucide-react";

interface TeamMarkerProps {
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
  onClick?: () => void;
}

const workIcon = L.divIcon({
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
  html: `<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:#10b981;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  </div>`,
});

const noWorkIcon = L.divIcon({
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
  html: `<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:#6b7280;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);opacity:0.7;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
    </svg>
  </div>`,
});

export default function TeamMarker({
  latitude,
  longitude,
  leaderName,
  block,
  lotLabel,
  workStatus,
  numWorkers,
  bunches,
  tons,
  date,
}: TeamMarkerProps) {
  const isWork = workStatus === "work";
  const icon = isWork ? workIcon : noWorkIcon;

  return (
    <Marker position={[latitude, longitude]} icon={icon}>
      <Popup>
        <div style={{ fontFamily: "Inter, system-ui, sans-serif", minWidth: 180 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: "#fff" }}>
            {leaderName}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
              <span style={{ color: "#f59e0b" }}>📍</span> Block {block}{lotLabel ? ` — ${lotLabel}` : ""}
            </div>
            {isWork && numWorkers != null && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                <span style={{ color: "#a78bfa" }}>👷</span> Workers: {numWorkers}
              </div>
            )}
            {isWork && bunches != null && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                <span style={{ color: "#22c55e" }}>🌿</span> Bunches: {bunches.toLocaleString("en-MY")}
              </div>
            )}
            {tons != null && tons > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                <span style={{ color: "#3b82f6" }}>⚖️</span> Tons: {Number(tons).toFixed(2)}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, paddingTop: 4, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <span style={{ color: "#f59e0b" }}>📅</span> {date}
            </div>
          </div>
          <div style={{ display: "inline-block", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: isWork ? "rgba(16,185,129,0.2)" : "rgba(107,114,128,0.2)", color: isWork ? "#10b981" : "#6b7280" }}>
            {isWork ? "Work Day" : "No Work"}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
