"use client";

import { SegmentedControl, NumberField, TextField } from "../form/controls";
import type { FieldGroupProps } from "./types";

export default function MencuciFields({ value, onChange, errors }: FieldGroupProps) {
  return (
    <div className="space-y-3">
      <div>
        <span
          className="block text-[11px] font-semibold tracking-wide mb-1.5"
          style={{ color: "var(--text-secondary)" }}
        >
          Kaedah
        </span>
        <SegmentedControl
          ariaLabel="Kaedah"
          value={value.method ?? "manual"}
          onChange={(v) => onChange("method", v)}
          options={[
            { value: "manual", label: "Manual" },
            { value: "racun", label: "Racun" },
            { value: "mesin", label: "Mesin" },
          ]}
        />
      </div>

      <NumberField
        label="Luas dikerjakan"
        unit="HA"
        step="0.01"
        required
        value={value.area_hectare ?? ""}
        onChange={(v) => onChange("area_hectare", v)}
        error={errors.area_hectare}
      />
      <TextField
        label="Nama racun (pilihan)"
        placeholder="Cth. Glyphosate"
        value={value.chemical_name ?? ""}
        onChange={(v) => onChange("chemical_name", v)}
      />
      <NumberField
        label="Kuantiti racun (pilihan)"
        unit="L"
        step="0.01"
        value={value.chemical_qty_liter ?? ""}
        onChange={(v) => onChange("chemical_qty_liter", v)}
        error={errors.chemical_qty_liter}
      />
    </div>
  );
}
