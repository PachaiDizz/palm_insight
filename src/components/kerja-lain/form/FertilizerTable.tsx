"use client";

import { Trash2, Plus } from "lucide-react";

export interface FertRow {
  name: string;
  bags: string;
  kg: string;
}

const cell =
  "w-full h-11 px-2.5 rounded-lg text-sm outline-none border transition-colors duration-150 bg-[var(--bg-base)] border-[var(--border-input-field)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/30";

const letterFor = (i: number) => String.fromCharCode(65 + (i % 26));
const digits = (s: string) => s.replace(/[^\d]/g, "");
const fmtKg = (raw: string) => (raw ? Number(raw).toLocaleString("en-MY") : "");

export default function FertilizerTable({
  rows,
  onChange,
  errors,
  defaultName,
}: {
  rows: FertRow[];
  onChange: (rows: FertRow[]) => void;
  errors: Record<string, string>;
  defaultName: string;
}) {
  const totalBags = rows.reduce((s, r) => s + (Number(r.bags) || 0), 0);
  const totalKg = rows.reduce((s, r) => s + (Number(r.kg) || 0), 0);

  const update = (i: number, field: keyof FertRow, raw: string) => {
    const next = rows.slice();
    next[i] = {
      ...next[i],
      [field]: field === "name" ? raw : digits(raw),
    };
    onChange(next);
  };

  const addRow = () =>
    onChange([...rows, { name: defaultName, bags: "", kg: "" }]);

  const removeRow = (i: number) => {
    if (rows.length <= 1) return;
    onChange(rows.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      {/* Desktop header */}
      <div
        className="hidden sm:grid grid-cols-[28px_minmax(0,1fr)_84px_104px_36px] gap-2 px-1 pb-1.5 text-[10px] font-semibold uppercase"
        style={{ color: "var(--text-muted)" }}
      >
        <span>No.</span>
        <span>Nama Baja</span>
        <span className="text-right">Bag</span>
        <span className="text-right">Kg</span>
        <span />
      </div>

      <div className="space-y-2 sm:space-y-1.5">
        {rows.map((row, i) => {
          const eName = errors[`items.${i}.name`];
          const eBags = errors[`items.${i}.bags`];
          const eKg = errors[`items.${i}.kg`];
          return (
            <div
              key={i}
              className="rounded-xl border p-2.5 sm:border-0 sm:p-0 sm:rounded-none sm:grid sm:grid-cols-[28px_minmax(0,1fr)_84px_104px_36px] sm:gap-2 sm:items-center"
              style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-input)" }}
            >
              {/* letter + mobile delete */}
              <div className="flex items-center justify-between mb-2 sm:mb-0 sm:block">
                <span className="text-xs font-bold" style={{ color: "var(--accent-primary)" }}>
                  {letterFor(i)}
                </span>
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  disabled={rows.length <= 1}
                  aria-label={`Padam baris ${letterFor(i)}`}
                  className="sm:hidden p-1 rounded-md hover:bg-[var(--hover-subtle)] disabled:opacity-30"
                  style={{ color: "var(--accent-red)" }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="sm:col-auto">
                <input
                  type="text"
                  value={row.name}
                  onChange={(e) => update(i, "name", e.target.value)}
                  placeholder="Nama baja"
                  aria-label={`Nama baja baris ${letterFor(i)}`}
                  className={cell}
                  style={eName ? { borderColor: "var(--accent-red)" } : undefined}
                  aria-invalid={eName ? true : undefined}
                />
                {eName && (
                  <p className="mt-1 text-[10px] font-medium" style={{ color: "var(--accent-red)" }}>
                    {eName}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2 sm:mt-0 sm:contents">
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={row.bags}
                    onChange={(e) => update(i, "bags", e.target.value)}
                    placeholder="BAG"
                    aria-label={`Bag baris ${letterFor(i)}`}
                    className={`${cell} sm:text-right`}
                    style={eBags ? { borderColor: "var(--accent-red)" } : undefined}
                    aria-invalid={eBags ? true : undefined}
                  />
                  {eBags && (
                    <p className="mt-1 text-[10px] font-medium" style={{ color: "var(--accent-red)" }}>
                      {eBags}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={fmtKg(row.kg)}
                    onChange={(e) => update(i, "kg", e.target.value)}
                    placeholder="KG"
                    aria-label={`Kg baris ${letterFor(i)}`}
                    className={`${cell} sm:text-right tabular-nums`}
                    style={eKg ? { borderColor: "var(--accent-red)" } : undefined}
                    aria-invalid={eKg ? true : undefined}
                  />
                  {eKg && (
                    <p className="mt-1 text-[10px] font-medium" style={{ color: "var(--accent-red)" }}>
                      {eKg}
                    </p>
                  )}
                </div>
              </div>

              {/* desktop delete */}
              <button
                type="button"
                onClick={() => removeRow(i)}
                disabled={rows.length <= 1}
                aria-label={`Padam baris ${letterFor(i)}`}
                className="hidden sm:flex items-center justify-center h-9 w-9 rounded-lg hover:bg-[var(--hover-subtle)] disabled:opacity-30"
                style={{ color: "var(--accent-red)" }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="w-full mt-2 h-11 rounded-xl border border-dashed text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors hover:bg-[var(--accent-primary-light)]"
        style={{ borderColor: "var(--accent-primary-border)", color: "var(--accent-primary)" }}
      >
        <Plus className="w-4 h-4" />
        Tambah Baris
      </button>

      {/* JUMLAH row */}
      <div
        className="flex items-center justify-between mt-3 pt-2.5 border-t"
        style={{ borderColor: "var(--accent-primary-border)" }}
      >
        <span className="text-[11px] font-bold tracking-[0.12em]" style={{ color: "var(--accent-primary)" }}>
          Jumlah
        </span>
        <div className="flex items-center gap-4 text-sm font-bold tabular-nums" style={{ color: "var(--accent-primary)" }}>
          <span>{totalBags.toLocaleString("en-MY")} BAG</span>
          <span>{totalKg.toLocaleString("en-MY")} KG</span>
        </div>
      </div>

      {errors.items && (
        <p className="mt-2 text-[11px] font-medium" style={{ color: "var(--accent-red)" }} role="alert">
          {errors.items}
        </p>
      )}
    </div>
  );
}
