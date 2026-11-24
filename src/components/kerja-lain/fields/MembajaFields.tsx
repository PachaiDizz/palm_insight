"use client";

import { NumberField, TextField, FieldLabel, Stepper } from "../form/controls";
import CreatableInput from "../form/CreatableInput";
import FertilizerTable, { type FertRow } from "../form/FertilizerTable";
import type { FieldGroupProps } from "./types";

const FERTILIZER_SUGGESTIONS = ["FELDA COMPACT", "NPK", "UREA", "MOP", "KIESERITE"];

function parseRows(raw?: string): FertRow[] {
  if (!raw) return [{ name: "", bags: "", kg: "" }];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr) && arr.length) {
      return arr.map((r) => ({
        name: String(r?.name ?? ""),
        bags: String(r?.bags ?? ""),
        kg: String(r?.kg ?? ""),
      }));
    }
  } catch {
    // ignore malformed
  }
  return [{ name: "", bags: "", kg: "" }];
}

export default function MembajaFields({
  value,
  onChange,
  errors,
  workerCount = 0,
  onWorkerCountChange,
  contractorSuggestions = [],
}: FieldGroupProps) {
  const rows = parseRows(value.items);

  return (
    <div className="space-y-3">
      {/* 1) KONTRAKTOR */}
      <CreatableInput
        label="Kontraktor"
        value={value.contractor ?? ""}
        onChange={(v) => onChange("contractor", v)}
        suggestions={contractorSuggestions}
        placeholder="Taip nama kontraktor"
        error={errors.contractor}
      />

      {/* 2) BILANGAN PEKERJA */}
      <div>
        <FieldLabel>Bilangan Pekerja</FieldLabel>
        <Stepper
          value={workerCount}
          onChange={(n) => onWorkerCountChange?.(n)}
          ariaLabel="Bilangan pekerja"
        />
      </div>

      {/* 3) NAMA DRIVER + 4) NO. LORI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <TextField
          label="Nama Driver (pilihan)"
          placeholder="Nama driver lori"
          value={value.driver_name ?? ""}
          onChange={(v) => onChange("driver_name", v)}
          error={errors.driver_name}
        />
        <TextField
          label="No. Lori (pilihan)"
          placeholder="Cth. SAB 1234 A"
          value={value.lorry_no ?? ""}
          onChange={(v) => onChange("lorry_no", v)}
          error={errors.lorry_no}
        />
      </div>

      {/* 5) JENIS BAJA */}
      <CreatableInput
        label="Jenis Baja"
        value={value.fertilizer_type ?? "FELDA COMPACT"}
        onChange={(v) => onChange("fertilizer_type", v)}
        suggestions={FERTILIZER_SUGGESTIONS}
        placeholder="Cth. FELDA COMPACT"
        error={errors.fertilizer_type}
      />

      {/* 6) JADUAL BAJA */}
      <div>
        <FieldLabel required>Jadual Baja</FieldLabel>
        <FertilizerTable
          rows={rows}
          onChange={(next) => onChange("items", JSON.stringify(next))}
          errors={errors}
          defaultName={value.fertilizer_type ?? "FELDA COMPACT"}
        />
      </div>

      {/* 7) KELUASAN CHEKAR + KADAR PER POKOK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <NumberField
          label="Keluasan Chekar (pilihan)"
          unit="HA"
          step="0.01"
          value={value.chekar_area_ha ?? ""}
          onChange={(v) => onChange("chekar_area_ha", v)}
          error={errors.chekar_area_ha}
        />
        <NumberField
          label="Kadar Per Pokok (pilihan)"
          unit="KG"
          step="0.01"
          value={value.rate_per_palm_kg ?? ""}
          onChange={(v) => onChange("rate_per_palm_kg", v)}
          error={errors.rate_per_palm_kg}
        />
      </div>
    </div>
  );
}
