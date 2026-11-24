"use client";

import { Plus } from "lucide-react";
import DateField from "../form/DateField";
import RepeatableRowCard from "../form/RepeatableRowCard";
import { NumberField, TextField } from "../form/controls";

interface RoundRow {
  start_date: string;
  end_date: string;
  area_ha: string;
  worker_count: string;
  notes: string;
}

function parse(raw?: string): RoundRow[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      return arr.map((r) => {
        const o = (r ?? {}) as Record<string, unknown>;
        return {
          start_date: String(o.start_date ?? ""),
          end_date: String(o.end_date ?? ""),
          area_ha: o.area_ha == null || o.area_ha === "" ? "" : String(o.area_ha),
          worker_count:
            o.worker_count == null || o.worker_count === "" ? "" : String(o.worker_count),
          notes: String(o.notes ?? ""),
        };
      });
    }
  } catch {
    // ignore malformed
  }
  return [];
}

function serialize(rows: RoundRow[]): string {
  return JSON.stringify(
    rows.map((r, i) => ({
      no: i + 1,
      start_date: r.start_date,
      end_date: r.end_date,
      area_ha: r.area_ha,
      worker_count: r.worker_count,
      notes: r.notes,
    }))
  );
}

export default function PusinganList({
  raw,
  onChange,
  errors,
  firstDate,
  lastDate,
}: {
  raw?: string;
  onChange: (json: string) => void;
  errors: Record<string, string>;
  firstDate?: string;
  lastDate?: string;
}) {
  const rows = parse(raw);
  const totalArea = rows.reduce((s, r) => s + (Number(r.area_ha) || 0), 0);

  const update = (i: number, field: keyof RoundRow, val: string) => {
    const next = rows.slice();
    next[i] = { ...next[i], [field]: val };
    onChange(serialize(next));
  };

  const add = () => onChange(serialize([...rows, { start_date: "", end_date: "", area_ha: "", worker_count: "", notes: "" }]));

  const remove = (i: number) => onChange(serialize(rows.filter((_, idx) => idx !== i)));

  const outsideTempoh = (date: string): boolean => {
    if (!date) return false;
    if (firstDate && date < firstDate) return true;
    if (lastDate && date > lastDate) return true;
    return false;
  };

  return (
    <div className="min-w-0">
      <span
        className="block text-[11px] font-semibold tracking-wide mb-2"
        style={{ color: "var(--text-secondary)" }}
      >
        Pusingan
      </span>

      {rows.length === 0 ? (
        <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
          BELUM ADA PUSINGAN
        </p>
      ) : (
        <div className="space-y-3 min-w-0 mb-3">
          {rows.map((row, i) => {
            const eStart = errors[`rounds.${i}.start_date`];
            const eEnd = errors[`rounds.${i}.end_date`];
            const warn = outsideTempoh(row.start_date) || outsideTempoh(row.end_date);
            return (
              <RepeatableRowCard
                key={i}
                onRemove={() => remove(i)}
                removeLabel={`Padam pusingan ${i + 1}`}
                header={
                  <span
                    className="text-[11px] font-bold tracking-[0.14em]"
                    style={{ color: "var(--accent-primary)" }}
                  >
                    Pusingan {i + 1}
                  </span>
                }
              >
                <div className="grid grid-cols-2 gap-2 min-w-0">
                  <DateField
                    label="Tarikh Mula"
                    compact
                    value={row.start_date}
                    onChange={(v) => update(i, "start_date", v)}
                    placeholder="PILIH TARIKH"
                    ariaLabel={`Tarikh mula pusingan ${i + 1}`}
                    error={eStart}
                  />
                  <DateField
                    label="Tarikh Tamat (pilihan)"
                    compact
                    optional
                    value={row.end_date}
                    onChange={(v) => update(i, "end_date", v)}
                    placeholder="PILIH TARIKH"
                    ariaLabel={`Tarikh tamat pusingan ${i + 1}`}
                    error={eEnd}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 min-w-0">
                  <NumberField
                    label="Luas"
                    unit="HA"
                    step="0.01"
                    value={row.area_ha}
                    onChange={(v) => update(i, "area_ha", v)}
                  />
                  <NumberField
                    label="Bilangan Pekerja"
                    step="1"
                    value={row.worker_count}
                    onChange={(v) => update(i, "worker_count", v)}
                  />
                </div>

                <TextField
                  label="Catatan (pilihan)"
                  placeholder="NOTA PUSINGAN"
                  value={row.notes}
                  onChange={(v) => update(i, "notes", v)}
                />

                {warn && (
                  <p className="text-[10px] font-medium uppercase" style={{ color: "var(--accent-primary)" }}>
                    Tarikh di luar tempoh kerja
                  </p>
                )}
              </RepeatableRowCard>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={add}
        className="w-full h-11 rounded-xl border border-dashed flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors duration-150 hover:bg-[var(--accent-primary-light)]"
        style={{ borderColor: "var(--accent-primary-border)", color: "var(--accent-primary)" }}
      >
        <Plus className="w-4 h-4" />
        Tambah Pusingan
      </button>

      <div
        className="mt-3 rounded-xl p-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs font-bold tabular-nums"
        style={{
          backgroundColor: "var(--accent-primary-light)",
          border: "1px solid var(--accent-primary-border)",
          color: "var(--accent-primary)",
        }}
      >
        <span className="whitespace-nowrap">JUMLAH PUSINGAN: {rows.length}</span>
        <span className="whitespace-nowrap">
          JUMLAH LUAS: {totalArea.toLocaleString("en-MY")} HA
        </span>
      </div>
    </div>
  );
}
