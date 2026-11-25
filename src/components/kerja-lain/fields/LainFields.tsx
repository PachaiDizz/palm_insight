"use client";

import { NumberField, TextField } from "../form/controls";
import CreatableCombobox from "../form/CreatableCombobox";
import type { FieldGroupProps } from "./types";

export default function LainFields({
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

      <TextField
        label="Huraian kerja"
        placeholder="Terangkan kerja yang dibuat"
        required
        value={value.description ?? ""}
        onChange={(v) => onChange("description", v)}
        error={errors.description}
      />
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="Kuantiti"
          step="0.01"
          required
          value={value.quantity ?? ""}
          onChange={(v) => onChange("quantity", v)}
          error={errors.quantity}
        />
        <TextField
          label="Unit"
          placeholder="Cth. Unit / lot"
          required
          value={value.unit ?? ""}
          onChange={(v) => onChange("unit", v)}
          error={errors.unit}
        />
      </div>
    </div>
  );
}
