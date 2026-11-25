"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Loader2, Plus, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useWorkOptions, normalizeOption } from "@/lib/workOptions";
import { FieldLabel } from "./controls";
import type { ToastData } from "@/components/ui/Toast";
import type { WorkOptionCategory } from "@/types";

interface CreatableComboboxProps {
  category: WorkOptionCategory;
  plantationId?: string | null;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  onToast?: (toast: ToastData) => void;
  /** 44px height, no label — for use inside repeatable row cards. */
  compact?: boolean;
  autoFocus?: boolean;
  ariaLabel?: string;
  disabled?: boolean;
}

interface PanelRect {
  style: React.CSSProperties;
}

export default function CreatableCombobox({
  category,
  plantationId,
  value,
  onChange,
  label,
  placeholder,
  error,
  required,
  onToast,
  compact = false,
  autoFocus = false,
  ariaLabel,
  disabled = false,
}: CreatableComboboxProps) {
  const { user } = useAuth();
  const { options, addOption, removeOption } = useWorkOptions(category, plantationId);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedError, setSavedError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [panel, setPanel] = useState<PanelRect | null>(null);
  // Search text is kept separate from the selected value so reopening the
  // dropdown always shows the full list (the selected value is never the query).
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const normalized = normalizeOption(value);
  const normalizedQuery = normalizeOption(query);
  const filtered = useMemo(() => {
    if (!normalizedQuery) return options;
    return options.filter((o) => o.value.toUpperCase().includes(normalizedQuery));
  }, [options, normalizedQuery]);

  const exactMatch = options.some((o) => o.value.toUpperCase() === normalizedQuery);
  const canCreate = normalizedQuery.length > 0 && !exactMatch;
  const rowCount = filtered.length + (canCreate ? 1 : 0);

  const updatePosition = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const spaceBelow = vh - r.bottom;
    const spaceAbove = r.top;
    const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
    const maxHeight = Math.min(260, Math.max(140, (openUp ? spaceAbove : spaceBelow) - 12));
    const style: React.CSSProperties = {
      position: "fixed",
      left: Math.min(r.left, window.innerWidth - 8),
      width: Math.min(r.width, window.innerWidth - r.left - 8),
      maxHeight,
      zIndex: 300,
    };
    if (openUp) style.bottom = vh - r.top + 4;
    else style.top = r.bottom + 4;
    setPanel({ style });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onReflow = () => updatePosition();
    document.addEventListener("mousedown", onDown);
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
    };
  }, [open, updatePosition]);

  const openDropdown = () => {
    if (open) return;
    setQuery("");
    setActiveIndex(-1);
    setOpen(true);
  };

  const selectOption = (optionValue: string) => {
    onChange(optionValue);
    setQuery("");
    setOpen(false);
    setActiveIndex(-1);
  };

  const clearSelection = () => {
    onChange("");
    setQuery("");
    setSavedError(null);
  };

  const createOption = async () => {
    if (saving || !canCreate) return;
    setSaving(true);
    setSavedError(null);
    try {
      const saved = await addOption(normalizedQuery);
      onChange(saved);
      onToast?.({ type: "success", message: "DISIMPAN" });
      setOpen(false);
      setActiveIndex(-1);
    } catch (err) {
      console.error("Failed to add work option:", err);
      const msg =
        err instanceof Error && err.message
          ? err.message.toUpperCase()
          : "GAGAL MENYIMPAN";
      setSavedError(msg);
      onToast?.({ type: "error", message: msg });
    } finally {
      setSaving(false);
    }
  };

  const deleteOption = async (id: string, optionValue: string) => {
    if (typeof window !== "undefined" && !window.confirm(`PADAM "${optionValue}"?`)) {
      return;
    }
    try {
      await removeOption(id);
      if (optionValue.toUpperCase() === normalized) onChange("");
      onToast?.({ type: "success", message: "DIPADAM" });
    } catch (err) {
      console.error("Failed to delete work option:", err);
      onToast?.({ type: "error", message: "GAGAL MEMADAM" });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) openDropdown();
      setActiveIndex((i) => (rowCount === 0 ? -1 : (i + 1) % rowCount));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) openDropdown();
      setActiveIndex((i) => (rowCount === 0 ? -1 : (i - 1 + rowCount) % rowCount));
    } else if (e.key === "Enter") {
      if (!open) {
        openDropdown();
        return;
      }
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < filtered.length) {
        selectOption(filtered[activeIndex].value);
      } else if (canCreate) {
        void createOption();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const errorText = error || savedError;

  const dropdown = open && typeof document !== "undefined" && panel
    ? createPortal(
        <div
          ref={panelRef}
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel || label || placeholder}
          className="rounded-xl border overflow-auto animate-menu"
          style={{
            backgroundColor: "var(--bg-elevated)",
            borderColor: "var(--border-default)",
            boxShadow: "0 12px 30px -8px rgba(0,0,0,0.55)",
            ...panel.style,
          }}
        >
          {filtered.length === 0 && !canCreate && (
            <p className="px-3 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
              TIADA PILIHAN
            </p>
          )}

          {filtered.map((o, i) => {
            const selected = o.value.toUpperCase() === normalized;
            const isCustom = !!o.created_by && o.created_by === user?.id;
            return (
              <div
                key={o.id}
                role="option"
                aria-selected={selected}
                tabIndex={-1}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectOption(o.value);
                }}
                onMouseEnter={() => setActiveIndex(i)}
                className="flex items-center gap-2 px-3 h-11 cursor-pointer transition-colors duration-150"
                style={{
                  backgroundColor:
                    activeIndex === i ? "var(--accent-primary-light)" : "transparent",
                }}
              >
                <span
                  className="flex-1 min-w-0 truncate text-sm font-medium"
                  style={{
                    color: selected ? "var(--accent-primary)" : "var(--text-primary)",
                  }}
                >
                  {o.value}
                </span>
                {selected && (
                  <Check className="w-4 h-4 shrink-0" style={{ color: "var(--accent-primary)" }} />
                )}
                {isCustom && !selected && (
                  <button
                    type="button"
                    aria-label={`Padam ${o.value}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void deleteOption(o.id, o.value);
                    }}
                    className="flex items-center justify-center w-7 h-7 rounded-md shrink-0 transition-colors hover:bg-[var(--accent-red-light)]"
                    style={{ color: "var(--accent-red)" }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}

          {canCreate && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                void createOption();
              }}
              onMouseEnter={() => setActiveIndex(filtered.length)}
              className="w-full flex items-center gap-2 px-3 h-11 text-left transition-colors duration-150 border-t"
              style={{
                color: "var(--accent-primary)",
                borderColor: "var(--border-subtle)",
                backgroundColor:
                  activeIndex === filtered.length
                    ? "var(--accent-primary-light)"
                    : "transparent",
              }}
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="truncate text-xs font-bold tracking-wide">
                {saving ? "MENYIMPAN…" : `+ TAMBAH "${normalizedQuery}"`}
              </span>
            </button>
          )}
        </div>,
        document.body
      )
    : null;

  return (
    <div className="min-w-0" ref={wrapRef}>
      {label && <FieldLabel required={required}>{label}</FieldLabel>}
      <div className="relative min-w-0">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-label={ariaLabel || label || placeholder}
          aria-invalid={errorText ? true : undefined}
          autoComplete="off"
          autoFocus={autoFocus}
          disabled={disabled}
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            setQuery(e.target.value);
            setSavedError(null);
            setActiveIndex(-1);
            if (!open) setOpen(true);
          }}
          onFocus={openDropdown}
          onClick={openDropdown}
          onKeyDown={handleKeyDown}
          className={`w-full min-w-0 box-border rounded-xl text-sm outline-none border transition-colors duration-150 bg-[var(--bg-input-field)] border-[var(--border-input-field)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] placeholder:uppercase focus:border-[var(--accent-primary)] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/30 disabled:opacity-50 ${
            compact ? "h-11 px-[14px] pr-16" : "h-12 px-3 pr-[68px]"
          }`}
          style={errorText ? { borderColor: "var(--accent-red)" } : undefined}
        />
        {value && !disabled && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              clearSelection();
            }}
            aria-label="Kosongkan pilihan"
            className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-md transition-colors hover:bg-[var(--hover-subtle)]"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "var(--text-muted)" }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </div>

      {errorText && (
        <p
          className="mt-1 text-[11px] font-medium uppercase"
          style={{ color: "var(--accent-red)" }}
          role="alert"
        >
          {errorText}
        </p>
      )}

      {dropdown}
    </div>
  );
}
