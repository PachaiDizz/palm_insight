"use client";

import { useRef } from "react";
import { FieldLabel } from "./controls";

const fieldBase =
  "w-full h-12 px-3 rounded-xl text-sm outline-none border transition-colors duration-150 bg-[var(--bg-input-field)] border-[var(--border-input-field)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/30";

export default function CreatableInput({
  label,
  value,
  onChange,
  suggestions = [],
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suggestions?: string[];
  placeholder?: string;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const q = value.trim().toLowerCase();
  const filtered = suggestions
    .filter((s) => s && (!q || s.toLowerCase().includes(q)))
    .filter((s) => s.toLowerCase() !== q)
    .slice(0, 8);

  return (
    <div>
      <label className="block">
        <FieldLabel>{label}</FieldLabel>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={fieldBase}
          style={error ? { borderColor: "var(--accent-red)" } : undefined}
          aria-invalid={error ? true : undefined}
          autoComplete="off"
        />
      </label>

      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {filtered.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className="px-2 py-1 rounded-md text-[10px] font-semibold transition-colors hover:bg-[var(--hover-subtle)]"
            style={{ backgroundColor: "var(--bg-input)", color: "var(--text-secondary)" }}
          >
            {s}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          className="px-2 py-1 rounded-md text-[10px] font-bold"
          style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}
        >
          + Tambah Baru
        </button>
      </div>

      {error && (
        <p className="mt-1 text-[11px] font-medium" style={{ color: "var(--accent-red)" }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
