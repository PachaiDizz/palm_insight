"use client";

import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { FieldLabel } from "./controls";

const MONTHS = [
  "JAN", "FEB", "MAC", "APR", "MEI", "JUN",
  "JUL", "OGOS", "SEP", "OKT", "NOV", "DIS",
];
const WEEKDAYS = ["AHI", "ISN", "SEL", "RAB", "KHA", "JUM", "SAB"];

const pad = (n: number) => String(n).padStart(2, "0");

function parseValue(v: string) {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return { y: +m[1], mo: +m[2] - 1, d: +m[3] };
}

function compose(y: number, mo: number, d: number) {
  return `${y}-${pad(mo + 1)}-${pad(d)}`;
}

export function formatDateOnly(v?: string | null): string {
  const p = parseValue(v ?? "");
  if (!p) return "";
  return `${pad(p.d)} ${MONTHS[p.mo]} ${p.y}`;
}

const fieldBase =
  "w-full min-w-0 box-border px-[14px] rounded-xl text-sm outline-none border transition-colors duration-150 bg-[var(--bg-input-field)] border-[var(--border-input-field)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/30";

export default function DateField({
  label,
  value,
  onChange,
  placeholder = "PILIH TARIKH",
  optional,
  error,
  ariaLabel,
  compact = false,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  optional?: boolean;
  error?: string;
  ariaLabel?: string;
  compact?: boolean;
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
    onChange(compose(cursor.y, cursor.mo, d));
    setOpen(false);
  };

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
    <div className="min-w-0">
      {label && <FieldLabel required={!optional}>{label}</FieldLabel>}
      <div className="relative min-w-0">
        <button
          type="button"
          onClick={() => (open ? setOpen(false) : openPicker())}
          aria-label={ariaLabel || label || placeholder}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={`${fieldBase} text-left flex items-center justify-between gap-2 pr-9 ${
            compact ? "" : "h-12"
          }`}
          style={{
            borderColor: open
              ? "var(--accent-primary)"
              : error
                ? "var(--accent-red)"
                : "var(--border-input-field)",
            color: sel ? "var(--text-primary)" : "var(--text-muted)",
          }}
        >
          <span className="flex items-center gap-2 min-w-0">
            <Calendar className="w-4 h-4 shrink-0" style={{ color: "var(--accent-primary)" }} />
            <span className="truncate uppercase">
              {sel ? formatDateOnly(value) : placeholder}
            </span>
          </span>
        </button>
        {sel && (
          <button
            type="button"
            aria-label="Kosongkan tarikh"
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
          aria-label={`${ariaLabel || label || "Tarikh"} picker`}
        >
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
                    color: selected ? "var(--text-on-accent)" : "var(--text-primary)",
                    border:
                      isToday(d) && !selected
                        ? "1px solid var(--accent-primary-border)"
                        : "1px solid transparent",
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-[11px] font-medium uppercase" style={{ color: "var(--accent-red)" }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
