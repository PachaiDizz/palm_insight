"use client";

import { NumberField, FieldLabel, Stepper } from "../form/controls";
import CreatableCombobox from "../form/CreatableCombobox";
import FertilizerTable, { type FertRow } from "../form/FertilizerTable";
import type { FieldGroupProps } from "./types";

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
  plantationId,
  onToast,
}: FieldGroupProps) {
  const rows = parseRows(value.items);
  const tripCount = Math.max(0, Math.round(Number(value.trip_count) || 0));

  return (
    <div className="space-y-3">
      {/* 1) KONTRAKTOR */}
      <CreatableCombobox
        category="contractor"
        plantationId={plantationId}
        value={value.contractor ?? ""}
        onChange={(v) => onChange("contractor", v)}
        onToast={onToast}
        label="Kontraktor"
        placeholder="PILIH KONTRAKTOR"
        required
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
        <div>
          <label className="block">
            <FieldLabel>Nama Driver (pilihan)</FieldLabel>
            <input
              type="text"
              value={value.driver_name ?? ""}
              onChange={(e) => onChange("driver_name", e.target.value)}
              placeholder="NAMA DRIVER LORI"
              className="w-full min-w-0 box-border h-11 px-[14px] rounded-xl text-sm outline-none border transition-colors duration-150 bg-[var(--bg-input-field)] border-[var(--border-input-field)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/30"
            />
          </label>
        </div>
        <div>
          <label className="block">
            <FieldLabel>No. Lori (pilihan)</FieldLabel>
            <input
              type="text"
              value={value.lorry_no ?? ""}
              onChange={(e) => onChange("lorry_no", e.target.value)}
              placeholder="CTH. SAB 1234 A"
              className="w-full min-w-0 box-border h-11 px-[14px] rounded-xl text-sm outline-none border transition-colors duration-150 bg-[var(--bg-input-field)] border-[var(--border-input-field)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/30"
            />
          </label>
        </div>
      </div>

      {/* 5) BILANGAN TRIP (HARI INI) */}
      <div>
        <FieldLabel>Bilangan Trip (Hari Ini)</FieldLabel>
        <Stepper
          value={tripCount}
          onChange={(n) => onChange("trip_count", String(n))}
          ariaLabel="Bilangan trip hari ini"
        />
        <p className="mt-1 text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
          Berapa kali lori pusing hari ini
        </p>
      </div>

      {/* 6) JENIS BAJA */}
      <CreatableCombobox
        category="fertilizer_type"
        plantationId={plantationId}
        value={value.fertilizer_type ?? ""}
        onChange={(v) => onChange("fertilizer_type", v)}
        onToast={onToast}
        label="Jenis Baja"
        placeholder="PILIH JENIS BAJA"
        error={errors.fertilizer_type}
      />

      {/* 7) JADUAL BAJA */}
      <div>
        <FieldLabel required>Jadual Baja</FieldLabel>
        <FertilizerTable
          rows={rows}
          onChange={(next) => onChange("items", JSON.stringify(next))}
          errors={errors}
          plantationId={plantationId}
          onToast={onToast}
          tripCount={tripCount}
        />
      </div>

      {/* 8) KELUASAN CHEKAR + KADAR PER POKOK */}
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
