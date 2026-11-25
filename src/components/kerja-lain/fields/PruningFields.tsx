"use client";

import { NumberField } from "../form/controls";
import CreatableCombobox from "../form/CreatableCombobox";
import type { FieldGroupProps } from "./types";

export default function PruningFields({
  value,
  onChange,
  errors,
  plantationId,
  onToast,
}: FieldGroupProps) {
  return (
    <div className="space-y-3">
      <CreatableCombobox
        category="contractor"
        plantationId={plantationId}
        value={value.contractor ?? ""}
        onChange={(v) => onChange("contractor", v)}
        onToast={onToast}
        label="Kontraktor (pilihan)"
        placeholder="PILIH KONTRAKTOR"
        error={errors.contractor}
      />

      <CreatableCombobox
        category="pruning_type"
        plantationId={plantationId}
        value={value.pruning_type ?? ""}
        onChange={(v) => onChange("pruning_type", v)}
        onToast={onToast}
        label="Jenis Pruning"
        placeholder="PILIH JENIS PRUNING"
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
