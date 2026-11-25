"use client";

import { NumberField, FieldLabel } from "../form/controls";
import CreatableCombobox from "../form/CreatableCombobox";
import type { FieldGroupProps } from "./types";

const UNITS = ["M", "KM"] as const;

export default function CuciParitFields({
  value,
  onChange,
  errors,
  plantationId,
  onToast,
}: FieldGroupProps) {
  const unit = (value.ditch_length_unit || "M").toUpperCase() === "KM" ? "KM" : "M";

  return (
    <div className="space-y-3">
      <CreatableCombobox
        category="contractor"
        plantationId={plantationId}
        value={value.contractor ?? ""}
        onChange={(v) => onChange("contractor", v)}
        onToast={onToast}
        label="Kontraktor"
        placeholder="PILIH KONTRAKTOR"
        required
        error={errors.contractor}
      />

      <div>
        <FieldLabel required>Panjang Parit</FieldLabel>
        <div className="flex items-stretch gap-2 min-w-0">
          <div className="relative flex-1 min-w-0">
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={value.ditch_length_value ?? ""}
              onChange={(e) => onChange("ditch_length_value", e.target.value)}
              placeholder="0"
              aria-label="Panjang parit"
              className="w-full min-w-0 box-border h-12 px-3 rounded-xl text-sm outline-none border transition-colors duration-150 bg-[var(--bg-input-field)] border-[var(--border-input-field)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/30"
              style={errors.ditch_length_value ? { borderColor: "var(--accent-red)" } : undefined}
              aria-invalid={errors.ditch_length_value ? true : undefined}
            />
          </div>
          <div
            role="radiogroup"
            aria-label="Unit panjang parit"
            className="flex gap-1 p-1 rounded-xl shrink-0"
            style={{ backgroundColor: "var(--bg-input)" }}
          >
            {UNITS.map((u) => {
              const active = u === unit;
              return (
                <button
                  key={u}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onChange("ditch_length_unit", u)}
                  className="w-12 h-10 rounded-lg text-xs font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                  style={{
                    backgroundColor: active ? "var(--accent-primary-light)" : "transparent",
                    color: active ? "var(--accent-primary)" : "var(--text-secondary)",
                    boxShadow: active ? "inset 0 0 0 1px var(--accent-primary-border)" : "none",
                  }}
                >
                  {u}
                </button>
              );
            })}
          </div>
        </div>
        {errors.ditch_length_value && (
          <p className="mt-1 text-[11px] font-medium" style={{ color: "var(--accent-red)" }} role="alert">
            {errors.ditch_length_value}
          </p>
        )}
      </div>

      <NumberField
        label="Bilangan parit"
        required
        value={value.ditch_count ?? ""}
        onChange={(v) => onChange("ditch_count", v)}
        error={errors.ditch_count}
      />
      <NumberField
        label="Kedalaman (pilihan)"
        unit="CM"
        step="0.01"
        value={value.depth_cm ?? ""}
        onChange={(v) => onChange("depth_cm", v)}
        error={errors.depth_cm}
      />
    </div>
  );
}
