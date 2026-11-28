"use client";

import { useRef, useState } from "react";
import { FieldLabel } from "./controls";

export interface OptionTab {
  value: string;
  label: string;
}

interface OptionTabsProps {
  options: OptionTab[];
  value: string | null | undefined;
  onChange: (next: string | null) => void;
  allowClear?: boolean;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  label?: string;
  ariaLabel?: string;
}

/**
 * Reusable segmented tab control for small fixed option sets.
 * - role="radiogroup" with role="radio" buttons
 * - Arrow keys move focus, Space/Enter selects
 * - allowClear lets tapping the active pill clear the value
 * - legacy values that are not in `options` are shown as an extra selected pill
 */
export default function OptionTabs({
  options,
  value,
  onChange,
  allowClear = false,
  disabled = false,
  error,
  required = false,
  label,
  ariaLabel,
}: OptionTabsProps) {
  const [touched, setTouched] = useState(false);
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const list: OptionTab[] = [...options];
  const current = value ?? "";
  const inOptions = list.some((o) => o.value === current);
  if (current && !inOptions) list.push({ value: current, label: current });

  const selectedIndex = list.findIndex((o) => o.value === current);
  const showError = !!error || (touched && required && !current);
  const tabbableIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const select = (idx: number) => {
    if (disabled) return;
    setTouched(true);
    const opt = list[idx];
    if (!opt) return;
    if (allowClear && opt.value === current) {
      onChange(null);
      return;
    }
    onChange(opt.value);
  };

  const focusIndex = (idx: number) => {
    const normalized = (idx + list.length) % list.length;
    refs.current[normalized]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (disabled) return;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        focusIndex(idx + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        focusIndex(idx - 1);
        break;
      case "Home":
        e.preventDefault();
        focusIndex(0);
        break;
      case "End":
        e.preventDefault();
        focusIndex(list.length - 1);
        break;
      case " ":
      case "Enter":
        e.preventDefault();
        select(idx);
        break;
    }
  };

  return (
    <div className="min-w-0">
      {label && <FieldLabel required={required}>{label}</FieldLabel>}
      <div
        role="radiogroup"
        aria-label={ariaLabel ?? label}
        aria-invalid={showError ? true : undefined}
        className="flex flex-wrap gap-1.5 p-1 rounded-xl"
        style={{
          backgroundColor: "var(--bg-input)",
          boxShadow: showError ? "inset 0 0 0 1px var(--accent-red)" : undefined,
        }}
      >
        {list.map((o, i) => {
          const active = o.value === current;
          return (
            <button
              key={o.value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={o.label}
              disabled={disabled}
              tabIndex={i === tabbableIndex ? 0 : -1}
              onClick={() => select(i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              className="flex-1 basis-[calc(50%-0.375rem)] sm:basis-0 min-w-0 min-h-[44px] px-3 rounded-lg text-[11px] font-semibold break-words leading-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] disabled:opacity-50"
              style={{
                backgroundColor: active ? "var(--accent-primary-light)" : "transparent",
                color: active ? "var(--accent-primary)" : "var(--text-secondary)",
                boxShadow: active ? "inset 0 0 0 1px var(--accent-primary-border)" : "none",
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {showError && (
        <p className="mt-1 text-[11px] font-medium uppercase" style={{ color: "var(--accent-red)" }} role="alert">
          {error || "MEDAN INI DIPERLUKAN"}
        </p>
      )}
    </div>
  );
}
