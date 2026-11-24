"use client";

import { SegmentedControl, NumberField } from "../form/controls";
import type { FieldGroupProps } from "./types";

export default function PruningFields({ value, onChange, errors }: FieldGroupProps) {
  return (
    <div className="space-y-3">
      <div>
        <span
          className="block text-[11px] font-semibold tracking-wide mb-1.5"
          style={{ color: "var(--text-secondary)" }}
        >
          Jenis pruning
        </span>
        <SegmentedControl
          ariaLabel="Jenis pruning"
          value={value.pruning_type ?? "rutin"}
          onChange={(v) => onChange("pruning_type", v)}
          options={[
            { value: "rutin", label: "Rutin" },
            { value: "sanitasi", label: "Sanitasi" },
          ]}
        />
      </div>

      <NumberField
        label="Bilangan pokok dipruning"
        unit="POKOK"
        required
        value={value.tree_count ?? ""}
        onChange={(v) => onChange("tree_count", v)}
        error={errors.tree_count}
      />
      <NumberField
        label="Luas"
        unit="HA"
        step="0.01"
        required
        value={value.area_hectare ?? ""}
        onChange={(v) => onChange("area_hectare", v)}
        error={errors.area_hectare}
      />
    </div>
  );
}
