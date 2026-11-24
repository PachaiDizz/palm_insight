"use client";

import { SegmentedControl, NumberField, TextField } from "../form/controls";
import type { FieldGroupProps } from "./types";

export default function BaikiJalanFields({ value, onChange, errors }: FieldGroupProps) {
  return (
    <div className="space-y-3">
      <NumberField
        label="Panjang jalan"
        unit="M"
        step="0.01"
        required
        value={value.road_length_m ?? ""}
        onChange={(v) => onChange("road_length_m", v)}
        error={errors.road_length_m}
      />
      <div>
        <span
          className="block text-[11px] font-semibold tracking-wide mb-1.5"
          style={{ color: "var(--text-secondary)" }}
        >
          Bahan
        </span>
        <SegmentedControl
          ariaLabel="Bahan"
          value={value.material ?? "batu"}
          onChange={(v) => onChange("material", v)}
          options={[
            { value: "batu", label: "Batu" },
            { value: "tanah_merah", label: "Tanah Merah" },
            { value: "lain_lain", label: "Lain-lain" },
          ]}
        />
      </div>
      <TextField
        label="Mesin digunakan (pilihan)"
        placeholder="Cth. Jentera / grader"
        value={value.machine ?? ""}
        onChange={(v) => onChange("machine", v)}
      />
    </div>
  );
}
