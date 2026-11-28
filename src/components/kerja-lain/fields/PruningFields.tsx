"use client";

import { NumberField, ContractorField } from "../form/controls";
import OptionTabs from "../form/OptionTabs";
import type { FieldGroupProps } from "./types";

const PRUNING_TYPE_OPTIONS = [
  { value: "RUTIN", label: "RUTIN" },
  { value: "SANITASI", label: "SANITASI" },
];

export default function PruningFields({ value, onChange, errors }: FieldGroupProps) {
  return (
    <div className="space-y-3">
      <ContractorField
        label="Kontraktor (pilihan)"
        value={value.contractor ?? ""}
        onChange={(v) => onChange("contractor", v)}
        error={errors.contractor}
      />

      <OptionTabs
        label="Jenis Pruning"
        ariaLabel="Jenis pruning"
        options={PRUNING_TYPE_OPTIONS}
        value={(value.pruning_type ?? "").toUpperCase()}
        onChange={(v) => onChange("pruning_type", v ?? "")}
        allowClear
        error={errors.pruning_type}
      />

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
