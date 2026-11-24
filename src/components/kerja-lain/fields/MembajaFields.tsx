"use client";

import { NumberField, TextField, FieldLabel } from "../form/controls";
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

function parseBlocks(raw?: string): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export default function MembajaFields({
  value,
  onChange,
  errors,
  plantations = [],
  primaryPlantationId,
  contractorSuggestions = [],
}: FieldGroupProps) {
  const rows = parseRows(value.items);
  const totalBags = rows.reduce((s, r) => s + (Number(r.bags) || 0), 0);
  const totalKg = rows.reduce((s, r) => s + (Number(r.kg) || 0), 0);

  const storedBlocks = parseBlocks(value.blocks);
  const selectedBlocks =
    storedBlocks.length > 0
      ? storedBlocks
      : primaryPlantationId
        ? [primaryPlantationId]
        : [];

  const toggleBlock = (id: string) => {
    const set = new Set(selectedBlocks);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange("blocks", JSON.stringify(Array.from(set)));
  };

  return (
    <div className="space-y-3">
      <CreatableInput
        label="Kontraktor"
        value={value.contractor ?? ""}
        onChange={(v) => onChange("contractor", v)}
        suggestions={contractorSuggestions}
        placeholder="Taip nama kontraktor"
        error={errors.contractor}
      />

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

      <div>
        <CreatableInput
          label="Jenis Baja"
          value={value.fertilizer_type ?? "FELDA COMPACT"}
          onChange={(v) => onChange("fertilizer_type", v)}
          suggestions={FERTILIZER_SUGGESTIONS}
          placeholder="Cth. FELDA COMPACT"
          error={errors.fertilizer_type}
        />
      </div>

      {/* JADUAL BAJA */}
      <div>
        <FieldLabel required>Jadual Baja</FieldLabel>
        <FertilizerTable
          rows={rows}
          onChange={(next) => onChange("items", JSON.stringify(next))}
          errors={errors}
          defaultName={value.fertilizer_type ?? "FELDA COMPACT"}
        />
      </div>

      {/* JUMLAH BAJA read-only summary */}
      <div
        className="flex items-center justify-between rounded-xl px-3 py-2.5"
        style={{ backgroundColor: "var(--accent-primary-light)" }}
      >
        <span className="text-[11px] font-bold tracking-[0.12em]" style={{ color: "var(--accent-primary)" }}>
          Jumlah Baja
        </span>
        <span className="text-sm font-bold tabular-nums" style={{ color: "var(--accent-primary)" }}>
          {totalBags.toLocaleString("en-MY")} BAG · {totalKg.toLocaleString("en-MY")} KG
        </span>
      </div>

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

      {/* Block multi-select */}
      {plantations.length > 0 && (
        <div>
          <FieldLabel>Blok Diliputi</FieldLabel>
          <div className="flex flex-wrap gap-1.5">
            {plantations.map((p) => {
              const active = selectedBlocks.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleBlock(p.id)}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors duration-150"
                  style={{
                    backgroundColor: active ? "var(--accent-primary-light)" : "var(--bg-input)",
                    color: active ? "var(--accent-primary)" : "var(--text-secondary)",
                    boxShadow: active ? "inset 0 0 0 1px var(--accent-primary-border)" : "none",
                  }}
                >
                  BLOK {p.block}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
