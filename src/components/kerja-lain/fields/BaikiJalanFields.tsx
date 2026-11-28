"use client";

import { NumberField, ContractorField, TextField } from "../form/controls";
import OptionTabs from "../form/OptionTabs";
import type { FieldGroupProps } from "./types";

const MATERIAL_OPTIONS = [
  { value: "BATU", label: "BATU" },
  { value: "TANAH MERAH", label: "TANAH MERAH" },
  { value: "LAIN-LAIN", label: "LAIN-LAIN" },
];

export default function BaikiJalanFields({ value, onChange, errors }: FieldGroupProps) {
  const material = (value.material ?? "").toUpperCase();
  const showMaterialOther = material === "LAIN-LAIN";

  return (
    <div className="space-y-3">
      <ContractorField
        label="Kontraktor (pilihan)"
        value={value.contractor ?? ""}
        onChange={(v) => onChange("contractor", v)}
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

      <OptionTabs
        label="Bahan"
        ariaLabel="Bahan"
        options={MATERIAL_OPTIONS}
        value={material}
        onChange={(v) => onChange("material", v ?? "")}
        allowClear
        error={errors.material}
      />

      {showMaterialOther && (
        <div className="animate-menu">
          <TextField
            label="Nama Bahan"
            placeholder="TAIP NAMA BAHAN"
            value={value.material_other ?? ""}
            onChange={(v) => onChange("material_other", v.toUpperCase())}
            error={errors.material_other}
          />
        </div>
      )}

      <TextField
        label="Mesin Digunakan (pilihan)"
        placeholder="TAIP NAMA MESIN"
        value={value.machine ?? ""}
        onChange={(v) => onChange("machine", v.toUpperCase())}
        error={errors.machine}
      />
    </div>
  );
}
