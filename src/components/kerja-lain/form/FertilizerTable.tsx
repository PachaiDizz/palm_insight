"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import CreatableCombobox from "./CreatableCombobox";
import RepeatableRowCard from "./RepeatableRowCard";
import type { ToastData } from "@/components/ui/Toast";

export interface FertRow {
  name: string;
  bags: string;
  kg: string;
}

const letterFor = (i: number) => String.fromCharCode(65 + (i % 26));
const digits = (s: string) => s.replace(/[^\d]/g, "");
const fmtNum = (raw: string) => (raw ? Number(raw).toLocaleString("en-MY") : "");

const inputBase =
  "w-full min-w-0 box-border h-11 px-[14px] rounded-lg text-sm font-medium text-right tabular-nums outline-none border border-transparent transition-colors duration-150 bg-[var(--bg-input-field)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/30";

const label = "block text-[10px] font-semibold uppercase tracking-wide mb-1.5";

export default function FertilizerTable({
  rows,
  onChange,
  errors,
  plantationId,
  onToast,
  tripCount = 0,
  showTotals = true,
  errorPrefix = "items",
}: {
  rows: FertRow[];
  onChange: (rows: FertRow[]) => void;
  errors: Record<string, string>;
  plantationId?: string | null;
  onToast?: (toast: ToastData) => void;
  tripCount?: number;
  /** Hide the grand-total footer (used inside per-trip cards). */
  showTotals?: boolean;
  /** Error key prefix, e.g. `trips.0.items`. */
  errorPrefix?: string;
}) {
  const [autoFocusIndex, setAutoFocusIndex] = useState(-1);
  const totalBags = rows.reduce((s, r) => s + (Number(r.bags) || 0), 0);
  const totalKg = rows.reduce((s, r) => s + (Number(r.kg) || 0), 0);

  const update = (i: number, field: keyof FertRow, raw: string) => {
    const next = rows.slice();
    next[i] = { ...next[i], [field]: field === "name" ? raw : digits(raw) };
    onChange(next);
  };

  const addRow = () => {
    const next = [...rows, { name: "", bags: "", kg: "" }];
    onChange(next);
    setAutoFocusIndex(next.length - 1);
  };

  const removeRow = (i: number) => {
    if (rows.length <= 1) return;
    onChange(rows.filter((_, idx) => idx !== i));
  };

  return (
    <div className="min-w-0 overflow-hidden">
      <div className="space-y-3 min-w-0">
        {rows.map((row, i) => {
          const eName = errors[`${errorPrefix}.${i}.name`];
          const eBags = errors[`${errorPrefix}.${i}.bags`];
          const eKg = errors[`${errorPrefix}.${i}.kg`];
          const isLast = i === rows.length - 1;

          return (
            <RepeatableRowCard
              key={i}
              onRemove={() => removeRow(i)}
              removeDisabled={rows.length <= 1}
              removeLabel={`Padam baris ${letterFor(i)}`}
              header={
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                    style={{
                      backgroundColor: "var(--accent-primary-light)",
                      color: "var(--accent-primary)",
                    }}
                    aria-hidden
                  >
                    {letterFor(i)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <CreatableCombobox
                      category="fertilizer"
                      plantationId={plantationId}
                      value={row.name}
                      onChange={(v) => update(i, "name", v)}
                      onToast={onToast}
                      placeholder="PILIH NAMA BAJA"
                      ariaLabel={`Nama baja baris ${letterFor(i)}`}
                      error={eName}
                      compact
                      autoFocus={i === autoFocusIndex}
                    />
                  </div>
                </div>
              }
            >
              <div className="grid grid-cols-2 gap-3 min-w-0">
                <div className="min-w-0">
                  <span className={label} style={{ color: "var(--text-muted)" }}>
                    Bag
                  </span>
                  <div className="relative min-w-0">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={fmtNum(row.bags)}
                      onChange={(e) => update(i, "bags", e.target.value)}
                      placeholder="0"
                      aria-label={`Bag baris ${letterFor(i)}`}
                      className={`${inputBase} pr-11`}
                      style={
                        eBags
                          ? { borderColor: "var(--accent-red)" }
                          : { borderColor: "transparent" }
                      }
                      aria-invalid={eBags ? true : undefined}
                    />
                    <span
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold pointer-events-none"
                      style={{ color: "var(--text-muted)" }}
                    >
                      BAG
                    </span>
                  </div>
                  {eBags && (
                    <p className="mt-1 text-[10px] font-medium uppercase" style={{ color: "var(--accent-red)" }}>
                      {eBags}
                    </p>
                  )}
                </div>

                <div className="min-w-0">
                  <span className={label} style={{ color: "var(--text-muted)" }}>
                    Kg
                  </span>
                  <div className="relative min-w-0">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={fmtNum(row.kg)}
                      onChange={(e) => update(i, "kg", e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && isLast) {
                          e.preventDefault();
                          addRow();
                        }
                      }}
                      placeholder="0"
                      aria-label={`Kg baris ${letterFor(i)}`}
                      className={`${inputBase} pr-9`}
                      style={
                        eKg
                          ? { borderColor: "var(--accent-red)" }
                          : { borderColor: "transparent" }
                      }
                      aria-invalid={eKg ? true : undefined}
                    />
                    <span
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold pointer-events-none"
                      style={{ color: "var(--text-muted)" }}
                    >
                      KG
                    </span>
                  </div>
                  {eKg && (
                    <p className="mt-1 text-[10px] font-medium uppercase" style={{ color: "var(--accent-red)" }}>
                      {eKg}
                    </p>
                  )}
                </div>
              </div>
            </RepeatableRowCard>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="w-full h-11 mt-3 rounded-xl border border-dashed flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors duration-150 hover:bg-[var(--accent-primary-light)]"
        style={{ borderColor: "var(--accent-primary-border)", color: "var(--accent-primary)" }}
      >
        <Plus className="w-4 h-4" />
        Tambah Baris
      </button>

      {showTotals && (
        <div
          className="mt-3 rounded-xl p-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 min-w-0"
          style={{
            backgroundColor: "var(--accent-primary-light)",
            border: "1px solid var(--accent-primary-border)",
          }}
        >
          <span
            className="text-[11px] font-bold tracking-[0.14em] shrink-0"
            style={{ color: "var(--accent-primary)" }}
          >
            Jumlah
          </span>
          <div
            className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-base font-bold tabular-nums min-w-0"
            style={{ color: "var(--accent-primary)" }}
          >
            <span className="whitespace-nowrap">{totalBags.toLocaleString("en-MY")} BAG</span>
            <span className="whitespace-nowrap">{totalKg.toLocaleString("en-MY")} KG</span>
            {tripCount > 0 && (
              <span className="whitespace-nowrap">{tripCount.toLocaleString("en-MY")} TRIP</span>
            )}
          </div>
        </div>
      )}

      {errors[errorPrefix] && (
        <p className="mt-2 text-[11px] font-medium uppercase" style={{ color: "var(--accent-red)" }} role="alert">
          {errors[errorPrefix]}
        </p>
      )}
    </div>
  );
}
