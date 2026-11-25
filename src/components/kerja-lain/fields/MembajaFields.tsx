"use client";

import { NumberField, FieldLabel, Stepper } from "../form/controls";
import CreatableCombobox from "../form/CreatableCombobox";
import PusinganPicker from "../form/PusinganPicker";
import TripScheduleSection, { type TripDraft, emptyTrip } from "../form/TripScheduleSection";
import type { FertRow } from "../form/FertilizerTable";
import type { FieldGroupProps } from "./types";

function parseRows(raw: unknown): FertRow[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [{ name: "", bags: "", kg: "" }];
  }
  return raw.map((r) => {
    const o = (r ?? {}) as Record<string, unknown>;
    return {
      name: String(o.name ?? ""),
      bags: o.bags == null || o.bags === "" ? "" : String(o.bags),
      kg: o.kg == null || o.kg === "" ? "" : String(o.kg),
    };
  });
}

function parseTrips(raw?: string, legacyItems?: string): TripDraft[] {
  let arr: unknown = [];
  try {
    arr = JSON.parse(raw || "[]");
  } catch {
    arr = [];
  }
  if (Array.isArray(arr) && arr.length > 0) {
    return arr.map((t) => {
      const o = (t ?? {}) as Record<string, unknown>;
      return { items: parseRows(o.items) };
    });
  }
  // Legacy flat `items` array → single trip.
  if (legacyItems) {
    try {
      const items = JSON.parse(legacyItems);
      if (Array.isArray(items) && items.length > 0) {
        return [{ items: parseRows(items) }];
      }
    } catch {
      // ignore malformed
    }
  }
  return [emptyTrip()];
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
  const trips = parseTrips(value.trips, value.items);

  const setTrips = (next: TripDraft[]) => {
    onChange("trips", JSON.stringify(next.map((t) => ({ items: t.items }))));
    onChange("trip_count", String(next.length));
  };

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

      {/* 4) PUSINGAN */}
      <PusinganPicker
        value={value.round_no ?? ""}
        onChange={(v) => onChange("round_no", v)}
      />

      {/* 5) JENIS BAJA */}
      <CreatableCombobox
        category="fertilizer"
        plantationId={plantationId}
        value={value.fertilizer_type ?? ""}
        onChange={(v) => onChange("fertilizer_type", v)}
        onToast={onToast}
        label="Jenis Baja"
        placeholder="PILIH JENIS BAJA"
        error={errors.fertilizer_type}
      />

      {/* 6) TRIP & JADUAL BAJA */}
      <TripScheduleSection
        trips={trips}
        onChange={setTrips}
        errors={errors}
        plantationId={plantationId}
        onToast={onToast}
      />

      {/* 7) KELUASAN HEKTAR + KADAR PER POKOK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <NumberField
          label="Keluasan Hektar (pilihan)"
          unit="HA"
          step="0.01"
          value={value.area_ha ?? ""}
          onChange={(v) => onChange("area_ha", v)}
          error={errors.area_ha}
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
