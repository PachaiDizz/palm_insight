"use client";

import { NumberField } from "../form/controls";
import type { FieldGroupProps } from "./types";

export default function CuciParitFields({ value, onChange, errors }: FieldGroupProps) {
  return (
    <div className="space-y-3">
      <NumberField
        label="Panjang parit"
        unit="M"
        step="0.01"
        required
        value={value.ditch_length_m ?? ""}
        onChange={(v) => onChange("ditch_length_m", v)}
        error={errors.ditch_length_m}
      />
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
