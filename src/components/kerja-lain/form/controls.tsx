"use client";

import { Minus, Plus, Check, type LucideIcon } from "lucide-react";

const fieldBase =
  "w-full h-12 px-3 rounded-xl text-sm outline-none border transition-colors duration-150 bg-[var(--bg-input-field)] border-[var(--border-input-field)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/30 disabled:opacity-50";

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3
        className="text-[11px] font-bold tracking-[0.14em]"
        style={{ color: "var(--accent-primary)" }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

export function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <span
      className="block text-[11px] font-semibold tracking-wide mb-1.5"
      style={{ color: "var(--text-secondary)" }}
    >
      {children}
      {required && <span style={{ color: "var(--accent-primary)" }}> *</span>}
    </span>
  );
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="mt-1 text-[11px] font-medium" style={{ color: "var(--accent-red)" }} role="alert">
      {error}
    </p>
  );
}

// ── Number input with unit suffix ───────────────────────────────────────────

export function NumberField({
  label,
  value,
  onChange,
  unit,
  placeholder,
  error,
  min = 0,
  step = "1",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  placeholder?: string;
  error?: string;
  min?: number;
  step?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${fieldBase} ${unit ? "pr-14" : ""}`}
          style={error ? { borderColor: "var(--accent-red)" } : undefined}
          aria-invalid={error ? true : undefined}
        />
        {unit && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold pointer-events-none"
            style={{ color: "var(--text-muted)" }}
          >
            {unit}
          </span>
        )}
      </div>
      <FieldError error={error} />
    </label>
  );
}

// ── Free text input ─────────────────────────────────────────────────────────

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  error,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={fieldBase}
        style={error ? { borderColor: "var(--accent-red)" } : undefined}
        aria-invalid={error ? true : undefined}
      />
      <FieldError error={error} />
    </label>
  );
}

// ── Segmented control ───────────────────────────────────────────────────────

export interface SegOption<T extends string> {
  value: T;
  label: string;
  /** Active background (defaults to amber). */
  bg?: string;
  /** Active text color (defaults to amber). */
  color?: string;
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: SegOption<T>[];
  ariaLabel: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex flex-wrap gap-1.5 p-1 rounded-xl"
      style={{ backgroundColor: "var(--bg-input)" }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className="flex-1 basis-[calc(50%-4px)] sm:basis-0 px-3 rounded-lg text-[11px] font-semibold transition-all duration-150 min-h-[40px]"
            style={{
              backgroundColor: active
                ? o.bg ?? "var(--accent-primary-light)"
                : "transparent",
              color: active ? o.color ?? "var(--accent-primary)" : "var(--text-secondary)",
              border: `1px solid ${active ? "transparent" : "transparent"}`,
              boxShadow: active ? "inset 0 0 0 1px var(--accent-primary-border)" : "none",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Number stepper ──────────────────────────────────────────────────────────

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 9999,
  ariaLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  ariaLabel: string;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        aria-label={`${ariaLabel}: kurang`}
        className="w-12 h-12 rounded-xl border flex items-center justify-center transition-colors duration-150 hover:bg-[var(--hover-subtle)] disabled:opacity-40"
        style={{ borderColor: "var(--border-input-field)", color: "var(--text-secondary)" }}
      >
        <Minus className="w-4 h-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          onChange(Number.isFinite(n) ? clamp(Math.round(n)) : min);
        }}
        aria-label={ariaLabel}
        className="flex-1 h-12 text-center rounded-xl text-sm font-semibold outline-none border transition-colors bg-[var(--bg-input-field)] text-[var(--text-primary)] focus:border-[var(--accent-primary)]"
        style={{ borderColor: "var(--border-input-field)" }}
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label={`${ariaLabel}: tambah`}
        className="w-12 h-12 rounded-xl border flex items-center justify-center transition-colors duration-150 hover:bg-[var(--hover-subtle)] disabled:opacity-40"
        style={{ borderColor: "var(--border-input-field)", color: "var(--text-secondary)" }}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Progress slider ─────────────────────────────────────────────────────────

export function ProgressSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <FieldLabel>Kemajuan</FieldLabel>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-md tabular-nums"
          style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}
        >
          {pct}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={pct}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Kemajuan kerja"
        className="progress-range w-full"
        style={{
          background: `linear-gradient(to right, var(--accent-primary) ${pct}%, var(--bg-elevated) ${pct}%)`,
        }}
      />
    </div>
  );
}

// ── Icon tile grid (job type) ───────────────────────────────────────────────

export function IconTileGrid<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon: LucideIcon }[];
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {options.map((o) => {
        const active = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className="relative flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 min-h-[84px] transition-all duration-150 hover:bg-[var(--hover-subtle)]"
            style={{
              borderColor: active ? "var(--accent-primary)" : "var(--border-default)",
              backgroundColor: active ? "var(--accent-primary-light)" : "var(--bg-input)",
              boxShadow: active
                ? "0 0 0 2px var(--accent-primary-light), 0 0 20px -4px var(--accent-shadow)"
                : "none",
            }}
          >
            <Icon
              className="w-5 h-5"
              style={{ color: active ? "var(--accent-primary)" : "var(--text-muted)" }}
            />
            <span
              className="text-[11px] font-semibold text-center leading-tight"
              style={{ color: active ? "var(--accent-primary)" : "var(--text-secondary)" }}
            >
              {o.label}
            </span>
            {active && (
              <span
                className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--accent-primary)", color: "var(--text-on-accent)" }}
                aria-hidden
              >
                <Check className="w-3 h-3" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
