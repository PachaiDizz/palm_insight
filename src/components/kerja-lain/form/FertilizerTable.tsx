"use client";

import { useRef } from "react";
import { Trash2, Plus } from "lucide-react";

export interface FertRow {
  name: string;
  bags: string;
  kg: string;
}

const FERT_OPTIONS = ["FELDA COMPACT", "NPK", "UREA", "MOP", "KIESERITE"];
const DATALIST_ID = "baja-name-options";

const letterFor = (i: number) => String.fromCharCode(65 + (i % 26));
const digits = (s: string) => s.replace(/[^\d]/g, "");
const fmtKg = (raw: string) => (raw ? Number(raw).toLocaleString("en-MY") : "");

const inputBase =
  "w-full h-11 rounded-lg text-sm font-medium outline-none border transition-colors duration-150 bg-[var(--bg-base)] border-[var(--border-input-field)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/30";

const grid =
  "sm:grid sm:grid-cols-[44px_minmax(200px,1fr)_120px_150px_40px] sm:gap-3 sm:items-center sm:px-4";

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
  const nameRefs = useRef<(HTMLInputElement | null)[]>([]);
  const totalBags = rows.reduce((s, r) => s + (Number(r.bags) || 0), 0);
  const totalKg = rows.reduce((s, r) => s + (Number(r.kg) || 0), 0);

  const update = (i: number, field: keyof FertRow, raw: string) => {
    const next = rows.slice();
    next[i] = { ...next[i], [field]: field === "name" ? raw : digits(raw) };
    onChange(next);
  };

  const addRow = () => {
    const next = [...rows, { name: defaultName, bags: "", kg: "" }];
    onChange(next);
    const idx = next.length - 1;
    requestAnimationFrame(() => nameRefs.current[idx]?.focus());
  };

  const removeRow = (i: number) => {
    if (rows.length <= 1) return;
    onChange(rows.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      <datalist id={DATALIST_ID}>
        {FERT_OPTIONS.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>

      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-input)" }}
      >
        {/* Desktop header */}
        <div
          className={`hidden ${grid} py-3 text-[10px] font-semibold uppercase`}
          style={{ color: "var(--text-muted)" }}
        >
          <span>No.</span>
          <span>Nama Baja</span>
          <span className="text-right">Bag</span>
          <span className="text-right">Kg</span>
          <span />
        </div>

        {rows.map((row, i) => {
          const eName = errors[`items.${i}.name`];
          const eBags = errors[`items.${i}.bags`];
          const eKg = errors[`items.${i}.kg`];
          const isLast = i === rows.length - 1;
          const badge = (
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
              style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}
            >
              {letterFor(i)}
            </span>
          );
          const delBtn = (mobile: boolean) => (
            <button
              type="button"
              onClick={() => removeRow(i)}
              disabled={rows.length <= 1}
              aria-label={`Padam baris ${letterFor(i)}`}
              className={`${mobile ? "sm:hidden" : "hidden sm:flex"} items-center justify-center w-8 h-8 rounded-lg transition-colors duration-150 hover:bg-[var(--accent-red-light)] disabled:opacity-30`}
              style={{ color: "var(--accent-red)" }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          );

          return (
            <div
              key={i}
              className="border-t"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              {/* Desktop row */}
              <div className={`hidden ${grid} py-2`}>
                <span className="justify-self-center">{badge}</span>
                <div>
                  <input
                    ref={(el) => {
                      nameRefs.current[i] = el;
                    }}
                    type="text"
                    list={DATALIST_ID}
                    value={row.name}
                    onChange={(e) => update(i, "name", e.target.value)}
                    placeholder="Nama baja"
                    aria-label={`Nama baja baris ${letterFor(i)}`}
                    className={inputBase}
                    style={eName ? { borderColor: "var(--accent-red)" } : undefined}
                    aria-invalid={eName ? true : undefined}
                  />
                  {eName && (
                    <p className="mt-1 text-[10px] font-medium" style={{ color: "var(--accent-red)" }}>
                      {eName}
                    </p>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={row.bags}
                    onChange={(e) => update(i, "bags", e.target.value)}
                    placeholder="0"
                    aria-label={`Bag baris ${letterFor(i)}`}
                    className={`${inputBase} text-right pr-12`}
                    style={eBags ? { borderColor: "var(--accent-red)" } : undefined}
                    aria-invalid={eBags ? true : undefined}
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold pointer-events-none"
                    style={{ color: "var(--text-muted)" }}
                  >
                    BAG
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={fmtKg(row.kg)}
                    onChange={(e) => update(i, "kg", e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && isLast) {
                        e.preventDefault();
                        addRow();
                      }
                    }}
                    placeholder="0"
                    aria-label={`Kg baris ${letterFor(i)}`}
                    className={`${inputBase} text-right pr-10 tabular-nums`}
                    style={eKg ? { borderColor: "var(--accent-red)" } : undefined}
                    aria-invalid={eKg ? true : undefined}
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold pointer-events-none"
                    style={{ color: "var(--text-muted)" }}
                  >
                    KG
                  </span>
                </div>
                {delBtn(false)}
              </div>

              {/* Mobile card */}
              <div className="sm:hidden p-3">
                <div className="flex items-center justify-between mb-2">
                  {badge}
                  {delBtn(true)}
                </div>
                <div className="mb-2">
                  <input
                    type="text"
                    list={DATALIST_ID}
                    value={row.name}
                    onChange={(e) => update(i, "name", e.target.value)}
                    placeholder="Nama baja"
                    aria-label={`Nama baja baris ${letterFor(i)}`}
                    className={inputBase}
                    style={eName ? { borderColor: "var(--accent-red)" } : undefined}
                    aria-invalid={eName ? true : undefined}
                  />
                  {eName && (
                    <p className="mt-1 text-[10px] font-medium" style={{ color: "var(--accent-red)" }}>
                      {eName}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={row.bags}
                      onChange={(e) => update(i, "bags", e.target.value)}
                      placeholder="0"
                      aria-label={`Bag baris ${letterFor(i)}`}
                      className={`${inputBase} text-right pr-12`}
                      style={eBags ? { borderColor: "var(--accent-red)" } : undefined}
                      aria-invalid={eBags ? true : undefined}
                    />
                    <span
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold pointer-events-none"
                      style={{ color: "var(--text-muted)" }}
                    >
                      BAG
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={fmtKg(row.kg)}
                      onChange={(e) => update(i, "kg", e.target.value)}
                      placeholder="0"
                      aria-label={`Kg baris ${letterFor(i)}`}
                      className={`${inputBase} text-right pr-10 tabular-nums`}
                      style={eKg ? { borderColor: "var(--accent-red)" } : undefined}
                      aria-invalid={eKg ? true : undefined}
                    />
                    <span
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold pointer-events-none"
                      style={{ color: "var(--text-muted)" }}
                    >
                      KG
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add row */}
        <div className="px-3 sm:px-4 py-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <button
            type="button"
            onClick={addRow}
            className="w-full h-11 rounded-xl border border-dashed flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors duration-150 hover:bg-[var(--accent-primary-light)]"
            style={{ borderColor: "var(--accent-primary-border)", color: "var(--accent-primary)" }}
          >
            <Plus className="w-4 h-4" />
            Tambah Baris
          </button>
        </div>

        {/* JUMLAH footer */}
        <div
          className={`hidden ${grid} py-3 border-t`}
          style={{ borderColor: "var(--accent-primary-border)" }}
        >
          <span />
          <span className="text-[11px] font-bold tracking-[0.14em]" style={{ color: "var(--accent-primary)" }}>
            Jumlah
          </span>
          <span className="text-right text-base font-bold tabular-nums" style={{ color: "var(--accent-primary)" }}>
            {totalBags.toLocaleString("en-MY")} BAG
          </span>
          <span className="text-right text-base font-bold tabular-nums" style={{ color: "var(--accent-primary)" }}>
            {totalKg.toLocaleString("en-MY")} KG
          </span>
          <span />
        </div>
        <div
          className="sm:hidden px-3 py-3 border-t flex items-center justify-between"
          style={{ borderColor: "var(--accent-primary-border)" }}
        >
          <span className="text-[11px] font-bold tracking-[0.14em]" style={{ color: "var(--accent-primary)" }}>
            Jumlah
          </span>
          <div className="flex items-center gap-3 text-base font-bold tabular-nums" style={{ color: "var(--accent-primary)" }}>
            <span>{totalBags.toLocaleString("en-MY")} BAG</span>
            <span>{totalKg.toLocaleString("en-MY")} KG</span>
          </div>
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
