"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import FertilizerTable, { type FertRow } from "./FertilizerTable";
import type { ToastData } from "@/components/ui/Toast";

export default function TripCard({
  tripNo,
  rows,
  onChange,
  errors,
  plantationId,
  onToast,
  initiallyExpanded = false,
}: {
  tripNo: number;
  rows: FertRow[];
  onChange: (rows: FertRow[]) => void;
  errors: Record<string, string>;
  plantationId?: string | null;
  onToast?: (toast: ToastData) => void;
  initiallyExpanded?: boolean;
}) {
  const prefix = `trips.${tripNo - 1}.items`;
  const hasError = Object.keys(errors).some(
    (k) =>
      k === `trips.${tripNo - 1}` ||
      k === prefix ||
      k.startsWith(`${prefix}.`)
  );

  const [expanded, setExpanded] = useState(initiallyExpanded);
  // Auto-expand (derived, not an effect) whenever this trip has a validation error.
  const isExpanded = expanded || hasError;

  const totalBags = rows.reduce((s, r) => s + (Number(r.bags) || 0), 0);
  const totalKg = rows.reduce((s, r) => s + (Number(r.kg) || 0), 0);
  const hasData = rows.some((r) => r.name || r.bags || r.kg);

  return (
    <div
      className="rounded-xl border min-w-0 overflow-hidden"
      style={{
        borderColor: hasError ? "var(--accent-red)" : "var(--border-default)",
        backgroundColor: "var(--bg-input)",
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={isExpanded}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-[var(--hover-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
      >
        <span
          className="text-[11px] font-bold tracking-[0.14em] shrink-0"
          style={{ color: "var(--accent-primary)" }}
        >
          TRIP {tripNo}
        </span>
        {(hasData || totalBags > 0 || totalKg > 0) && (
          <span
            className="text-[10px] font-semibold tabular-nums px-2 py-0.5 rounded-md whitespace-nowrap"
            style={{
              backgroundColor: "var(--accent-primary-light)",
              color: "var(--accent-primary)",
            }}
          >
            {totalBags.toLocaleString("en-MY")} BAG · {totalKg.toLocaleString("en-MY")} KG
          </span>
        )}
        <ChevronDown
          className="w-4 h-4 ml-auto shrink-0 transition-transform duration-200"
          style={{
            color: "var(--text-muted)",
            transform: isExpanded ? "rotate(180deg)" : "none",
          }}
        />
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 pt-1 min-w-0">
          <FertilizerTable
            rows={rows}
            onChange={onChange}
            errors={errors}
            plantationId={plantationId}
            onToast={onToast}
            showTotals={false}
            errorPrefix={prefix}
          />
        </div>
      )}
    </div>
  );
}
