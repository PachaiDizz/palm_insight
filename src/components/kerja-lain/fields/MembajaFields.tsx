"use client";

import { SegmentedControl, NumberField, FieldLabel } from "../form/controls";
import type { FieldGroupProps } from "./types";

export default function MembajaFields({ value, onChange, errors }: FieldGroupProps) {
  const unit = (value.quantity_unit ?? "kg").toUpperCase();
  return (
    <div className="space-y-3">
      <div>
        <span
          className="block text-[11px] font-semibold tracking-wide mb-1.5"
          style={{ color: "var(--text-secondary)" }}
        >
          Jenis baja
        </span>
        <SegmentedControl
          ariaLabel="Jenis baja"
          value={value.fertilizer_type ?? "npk"}
          onChange={(v) => onChange("fertilizer_type", v)}
          options={[
            { value: "npk", label: "NPK" },
            { value: "urea", label: "Urea" },
            { value: "mop", label: "MOP" },
            { value: "kieserite", label: "Kieserite" },
            { value: "lain_lain", label: "Lain-lain" },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="Kuantiti"
          unit={unit}
          step="0.01"
          required
          value={value.quantity_value ?? ""}
          onChange={(v) => onChange("quantity_value", v)}
          error={errors.quantity_value}
        />
        <div>
          <FieldLabel required>Unit</FieldLabel>
          <SegmentedControl
            ariaLabel="Unit kuantiti"
            value={value.quantity_unit ?? "kg"}
            onChange={(v) => onChange("quantity_unit", v)}
            options={[
              { value: "kg", label: "KG" },
              { value: "bag", label: "BAG" },
            ]}
          />
        </div>
      </div>

      <NumberField
        label="Luas"
        unit="HA"
        step="0.01"
        required
        value={value.area_hectare ?? ""}
        onChange={(v) => onChange("area_hectare", v)}
        error={errors.area_hectare}
      />
      <NumberField
        label="Bilangan pokok dibaja"
        unit="POKOK"
        required
        value={value.tree_count ?? ""}
        onChange={(v) => onChange("tree_count", v)}
        error={errors.tree_count}
      />
      <NumberField
        label="Kadar per pokok (pilihan)"
        unit="KG"
        step="0.01"
        value={value.rate_per_tree_kg ?? ""}
        onChange={(v) => onChange("rate_per_tree_kg", v)}
        error={errors.rate_per_tree_kg}
      />
    </div>
  );
}
