"use client";

import { NumberField } from "../form/controls";
import CreatableCombobox from "../form/CreatableCombobox";
import DateField, { formatDateOnly } from "../form/DateField";
import PusinganList from "./PusinganList";
import type { FieldGroupProps } from "./types";

function daysBetween(first: string, last: string): number {
  const a = new Date(`${first}T00:00:00`);
  const b = new Date(`${last}T00:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1;
}

export default function MencuciFields({
  value,
  onChange,
  errors,
  plantationId,
  onToast,
}: FieldGroupProps) {
  const first = value.first_work_date ?? "";
  const last = value.last_work_date ?? "";
  const showTempoh = !!first && !!last;
  const days = showTempoh ? daysBetween(first, last) : 0;

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
        category="method"
        plantationId={plantationId}
        value={value.method ?? ""}
        onChange={(v) => onChange("method", v)}
        onToast={onToast}
        label="Kaedah"
        placeholder="PILIH KAEDAH"
        error={errors.method}
      />

      <NumberField
        label="Luas dikerjakan"
        unit="HA"
        step="0.01"
        required
        value={value.area_ha ?? ""}
        onChange={(v) => onChange("area_ha", v)}
        error={errors.area_ha}
      />

      <CreatableCombobox
        category="chemical_name"
        plantationId={plantationId}
        value={value.chemical_name ?? ""}
        onChange={(v) => onChange("chemical_name", v)}
        onToast={onToast}
        label="Nama Racun (pilihan)"
        placeholder="PILIH / TAMBAH NAMA RACUN"
        error={errors.chemical_name}
      />

      <NumberField
        label="Kuantiti racun (pilihan)"
        unit="L"
        step="0.01"
        value={value.chemical_qty_l ?? ""}
        onChange={(v) => onChange("chemical_qty_l", v)}
        error={errors.chemical_qty_l}
      />

      {/* TEMPOH KERJA */}
      <div className="pt-1">
        <h4
          className="text-[11px] font-bold tracking-[0.14em] mb-2"
          style={{ color: "var(--accent-primary)" }}
        >
          Tempoh Kerja
        </h4>
        <div className="grid grid-cols-2 gap-2 min-w-0">
          <DateField
            label="Tarikh Kerja Pertama"
            value={first}
            onChange={(v) => onChange("first_work_date", v)}
            placeholder="PILIH TARIKH"
            ariaLabel="Tarikh kerja pertama"
            error={errors.first_work_date}
          />
          <DateField
            label="Tarikh Kerja Tamat (pilihan)"
            optional
            value={last}
            onChange={(v) => onChange("last_work_date", v)}
            placeholder="PILIH TARIKH"
            ariaLabel="Tarikh kerja tamat"
            error={errors.last_work_date}
          />
        </div>
        {showTempoh && days > 0 && (
          <p
            className="mt-2 text-[11px] font-semibold tracking-wide"
            style={{ color: "var(--accent-primary)" }}
          >
            TEMPOH: {formatDateOnly(first)} - {formatDateOnly(last)} ({days} HARI)
          </p>
        )}
      </div>

      {/* PUSINGAN */}
      <div className="pt-1">
        <PusinganList
          raw={value.rounds}
          onChange={(json) => onChange("rounds", json)}
          errors={errors}
          firstDate={first}
          lastDate={last}
        />
      </div>
    </div>
  );
}
