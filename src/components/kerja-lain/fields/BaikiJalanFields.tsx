"use client";

import { NumberField } from "../form/controls";
import CreatableCombobox from "../form/CreatableCombobox";
import type { FieldGroupProps } from "./types";

export default function BaikiJalanFields({
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

      <NumberField
        label="Panjang jalan"
        unit="M"
        step="0.01"
        required
        value={value.road_length_m ?? ""}
        onChange={(v) => onChange("road_length_m", v)}
        error={errors.road_length_m}
      />

      <CreatableCombobox
        category="material"
        plantationId={plantationId}
        value={value.material ?? ""}
        onChange={(v) => onChange("material", v)}
        onToast={onToast}
        label="Bahan"
        placeholder="PILIH BAHAN"
        error={errors.material}
      />

      <CreatableCombobox
        category="machine"
        plantationId={plantationId}
        value={value.machine ?? ""}
        onChange={(v) => onChange("machine", v)}
        onToast={onToast}
        label="Mesin Digunakan (pilihan)"
        placeholder="PILIH / TAMBAH MESIN"
        error={errors.machine}
      />
    </div>
  );
}
