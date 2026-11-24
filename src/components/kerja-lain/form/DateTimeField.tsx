"use client";

import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock, Minus, Plus, X } from "lucide-react";
import { FieldLabel } from "./controls";

const MONTHS = [
  "JAN", "FEB", "MAC", "APR", "MEI", "JUN",
  "JUL", "OGOS", "SEP", "OKT", "NOV", "DIS",
];
const WEEKDAYS = ["AHI", "ISN", "SEL", "RAB", "KHA", "JUM", "SAB"];

const pad = (n: number) => String(n).padStart(2, "0");

function parseValue(v: string) {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  return { y: +m[1], mo: +m[2] - 1, d: +m[3], h: +m[4], mi: +m[5] };
}

function compose(y: number, mo: number, d: number, h: number, mi: number) {
  return `${y}-${pad(mo + 1)}-${pad(d)}T${pad(h)}:${pad(mi)}`;
}

function display(v: string) {
  const p = parseValue(v);
  if (!p) return "";
  return `${pad(p.d)} ${MONTHS[p.mo]} ${p.y} · ${pad(p.h)}:${pad(p.mi)}`;
}

export default function DateTimeField({
  label,
  value,
  onChange,
  placeholder = "Pilih tarikh & masa",
  optional,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  optional?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const initial = parseValue(value);
  const [cursor, setCursor] = useState<{ y: number; mo: number }>({
    y: initial?.y ?? now.getFullYear(),
    mo: initial?.mo ?? now.getMonth(),
  });

  const sel = parseValue(value);

  const openPicker = () => {
    const p = parseValue(value);
    setCursor({ y: p?.y ?? now.getFullYear(), mo: p?.mo ?? now.getMonth() });
    setOpen(true);
  };

  const setDay = (d: number) => {
    const h = sel?.h ?? 8;
    const mi = sel?.mi ?? 0;
    onChange(compose(cursor.y, cursor.mo, d, h, mi));
  };

  const shiftTime = (field: "h" | "mi", delta: number) => {
    const base = sel ?? { y: cursor.y, mo: cursor.mo, d: 1, h: 8, mi: 0 };
    let h = base.h;
    let mi = base.mi;
    if (field === "h") h = (h + delta + 24) % 24;
    else mi = (mi + delta + 60) % 60;
    onChange(compose(base.y, base.mo, base.d, h, mi));
  };

  // Build the calendar grid for the cursor month.
  const firstDay = new Date(cursor.y, cursor.mo, 1).getDay();
  const daysInMonth = new Date(cursor.y, cursor.mo + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (d: number) => {
    const t = new Date();
    return t.getFullYear() === cursor.y && t.getMonth() === cursor.mo && t.getDate() === d;
  };

  return (
    <div>
      <FieldLabel required={!optional}>{label}</FieldLabel>
      <div className="relative">
        <button
          type="button"
          onClick={() => (open ? setOpen(false) : openPicker())}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="w-full h-12 px-3 pr-10 rounded-xl text-sm text-left flex items-center justify-between gap-2 outline-none border transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/30"
          style={{
            backgroundColor: "var(--bg-input-field)",
            borderColor: open ? "var(--accent-primary)" : "var(--border-input-field)",
            color: sel ? "var(--text-primary)" : "var(--text-muted)",
          }}
        >
          <span className="flex items-center gap-2 min-w-0">
            <Calendar className="w-4 h-4 shrink-0" style={{ color: "var(--accent-primary)" }} />
            <span className="truncate">{sel ? display(value) : placeholder}</span>
          </span>
          {!sel && (
            <Clock className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
          )}
        </button>
        {sel && (
          <button
            type="button"
            aria-label="Kosongkan"
            onClick={() => onChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-[var(--hover-subtle)]"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && (
        <div
          className="mt-2 rounded-xl border p-3 animate-menu"
          style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-default)" }}
          role="dialog"
          aria-label={`${label} picker`}
        >
          {/* Month nav */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              aria-label="Bulan sebelum"
              onClick={() =>
                setCursor((c) => {
                  const mo = c.mo - 1;
                  return mo < 0 ? { y: c.y - 1, mo: 11 } : { y: c.y, mo };
                })
              }
              className="p-1.5 rounded-lg hover:bg-[var(--hover-subtle)]"
              style={{ color: "var(--text-secondary)" }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-theme">
              {MONTHS[cursor.mo]} {cursor.y}
            </span>
            <button
              type="button"
              aria-label="Bulan selepas"
              onClick={() =>
                setCursor((c) => {
                  const mo = c.mo + 1;
                  return mo > 11 ? { y: c.y + 1, mo: 0 } : { y: c.y, mo };
                })
              }
              className="p-1.5 rounded-lg hover:bg-[var(--hover-subtle)]"
              style={{ color: "var(--text-secondary)" }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday header */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((w) => (
              <span
                key={w}
                className="text-[9px] font-semibold text-center"
                style={{ color: "var(--text-muted)" }}
              >
                {w}
              </span>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <span key={`e${i}`} />;
              const selected =
                sel && sel.y === cursor.y && sel.mo === cursor.mo && sel.d === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDay(d)}
                  aria-label={`Pilih ${d} ${MONTHS[cursor.mo]} ${cursor.y}`}
                  aria-pressed={!!selected}
                  className="h-8 rounded-lg text-xs font-medium transition-colors duration-100"
                  style={{
                    backgroundColor: selected ? "var(--accent-primary)" : "transparent",
                    color: selected
                      ? "var(--text-on-accent)"
                      : "var(--text-primary)",
                    border: isToday(d) && !selected ? "1px solid var(--accent-primary-border)" : "1px solid transparent",
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* Time steppers */}
          <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Jam kurang"
                onClick={() => shiftTime("h", -1)}
                className="p-1.5 rounded-lg hover:bg-[var(--hover-subtle)]"
                style={{ color: "var(--text-secondary)" }}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center text-sm font-bold text-theme tabular-nums">
                {pad(sel?.h ?? 8)}
              </span>
              <button
                type="button"
                aria-label="Jam tambah"
                onClick={() => shiftTime("h", 1)}
                className="p-1.5 rounded-lg hover:bg-[var(--hover-subtle)]"
                style={{ color: "var(--text-secondary)" }}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-sm font-bold text-theme">:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Minit kurang"
                onClick={() => shiftTime("mi", -5)}
                className="p-1.5 rounded-lg hover:bg-[var(--hover-subtle)]"
                style={{ color: "var(--text-secondary)" }}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center text-sm font-bold text-theme tabular-nums">
                {pad(sel?.mi ?? 0)}
              </span>
              <button
                type="button"
                aria-label="Minit tambah"
                onClick={() => shiftTime("mi", 5)}
                className="p-1.5 rounded-lg hover:bg-[var(--hover-subtle)]"
                style={{ color: "var(--text-secondary)" }}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex justify-end mt-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
