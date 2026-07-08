"use client";
import { Leaf, X } from "lucide-react";

interface TeamLeaderCardProps {
  index: number;
  name: string;
  phone: string;
  notes: string;
  onChange: (index: number, field: string, value: string) => void;
  onRemove: (index: number) => void;
}

export default function TeamLeaderCard({ index, name, phone, notes, onChange, onRemove }: TeamLeaderCardProps) {
  const inputStyle = {
    backgroundColor: "var(--bg-input)",
    border: "1px solid var(--border-default)",
    color: "white",
  };

  return (
    <div className="card-glow rounded-2xl p-5 relative" style={{ backgroundColor: "var(--bg-card)" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--accent-subtle)" }}>
            <Leaf className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
          </div>
          <span className="text-sm font-medium text-theme">Team Leader #{index + 1}</span>
        </div>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/20"
          style={{ color: "var(--text-muted)" }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Leader Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => onChange(index, "name", e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
            style={{ ...inputStyle, "--tw-ring-color": "rgba(245,158,11,0.3)" } as React.CSSProperties}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => onChange(index, "phone", e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
            style={{ ...inputStyle, "--tw-ring-color": "rgba(245,158,11,0.3)" } as React.CSSProperties}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => onChange(index, "notes", e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
            style={{ ...inputStyle, "--tw-ring-color": "rgba(245,158,11,0.3)" } as React.CSSProperties}
          />
        </div>
      </div>
    </div>
  );
}
