"use client";

import { useState } from "react";
import TripCard from "./TripCard";
import { Stepper } from "./controls";
import type { FertRow } from "./FertilizerTable";
import type { ToastData } from "@/components/ui/Toast";

export interface TripDraft {
  items: FertRow[];
}

export const emptyTrip = (): TripDraft => ({ items: [{ name: "", bags: "", kg: "" }] });

export function tripHasData(trip: TripDraft): boolean {
  return trip.items.some((r) => r.name || r.bags || r.kg);
}

export default function TripScheduleSection({
  trips,
  onChange,
  errors,
  plantationId,
  onToast,
}: {
  trips: TripDraft[];
  onChange: (trips: TripDraft[]) => void;
  errors: Record<string, string>;
  plantationId?: string | null;
  onToast?: (toast: ToastData) => void;
}) {
  const [pendingKeep, setPendingKeep] = useState<number | null>(null);

  const totalBags = trips.reduce(
    (s, t) => s + t.items.reduce((a, r) => a + (Number(r.bags) || 0), 0),
    0
  );
  const totalKg = trips.reduce(
    (s, t) => s + t.items.reduce((a, r) => a + (Number(r.kg) || 0), 0),
    0
  );

  const applyCount = (keep: number) => {
    const current = trips.length;
    if (keep === current) return;
    if (keep > current) {
      const next = [...trips];
      for (let i = current; i < keep; i += 1) next.push(emptyTrip());
      onChange(next);
      return;
    }
    const removed = trips.slice(keep);
    if (removed.some(tripHasData)) {
      setPendingKeep(keep);
      return;
    }
    onChange(trips.slice(0, keep));
  };

  const updateTrip = (index: number, items: FertRow[]) => {
    const next = trips.slice();
    next[index] = { items };
    onChange(next);
  };

  const firstRemovedNo = pendingKeep != null ? pendingKeep + 1 : 0;

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h4
          className="text-[11px] font-bold tracking-[0.14em]"
          style={{ color: "var(--accent-primary)" }}
        >
          Trip &amp; Jadual Baja
        </h4>
      </div>

      <div>
        <span
          className="block text-[11px] font-semibold tracking-wide mb-1.5"
          style={{ color: "var(--text-secondary)" }}
        >
          Bilangan Trip
        </span>
        <Stepper
          value={trips.length}
          onChange={applyCount}
          min={1}
          max={20}
          ariaLabel="Bilangan trip"
        />
        <p className="mt-1 text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
          Berapa kali lori pusing hari ini
        </p>
      </div>

      <div className="space-y-3 mt-3 min-w-0">
        {trips.map((trip, i) => {
          const hasData = tripHasData(trip);
          return (
            <TripCard
              key={i}
              tripNo={i + 1}
              rows={trip.items}
              onChange={(items) => updateTrip(i, items)}
              errors={errors}
              plantationId={plantationId}
              onToast={onToast}
              initiallyExpanded={i === 0 || !hasData}
            />
          );
        })}
      </div>

      <div
        className="mt-3 rounded-xl p-3 min-w-0"
        style={{
          backgroundColor: "var(--accent-primary-light)",
          border: "1px solid var(--accent-primary-border)",
        }}
      >
        <div
          className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold tabular-nums"
          style={{ color: "var(--accent-primary)" }}
        >
          <span className="tracking-[0.14em]">JUMLAH</span>
          <span>·</span>
          <span className="whitespace-nowrap">{trips.length} TRIP</span>
          <span>·</span>
          <span className="whitespace-nowrap">{totalBags.toLocaleString("en-MY")} BAG</span>
          <span>·</span>
          <span className="whitespace-nowrap">{totalKg.toLocaleString("en-MY")} KG</span>
        </div>
        <div className="mt-1.5 flex flex-col gap-0.5">
          {trips.map((trip, i) => {
            const tb = trip.items.reduce((a, r) => a + (Number(r.bags) || 0), 0);
            const tk = trip.items.reduce((a, r) => a + (Number(r.kg) || 0), 0);
            return (
              <span
                key={i}
                className="text-[10px] font-medium tabular-nums"
                style={{ color: "var(--accent-primary)" }}
              >
                TRIP {i + 1}: {tb.toLocaleString("en-MY")} BAG / {tk.toLocaleString("en-MY")} KG
              </span>
            );
          })}
        </div>
      </div>

      {pendingKeep != null && (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          role="dialog"
          aria-modal="true"
          aria-label={`Buang trip ${firstRemovedNo}`}
        >
          <div
            className="w-full max-w-sm rounded-2xl border p-4 space-y-4"
            style={{
              backgroundColor: "var(--bg-elevated)",
              borderColor: "var(--border-default)",
            }}
          >
            <p
              className="text-sm font-semibold uppercase leading-snug"
              style={{ color: "var(--text-primary)" }}
            >
              Buang TRIP {firstRemovedNo}? Data trip ini akan hilang.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingKeep(null)}
                className="h-10 px-4 rounded-xl border text-xs font-semibold transition-colors hover:bg-[var(--hover-subtle)]"
                style={{ borderColor: "var(--border-input-field)", color: "var(--text-secondary)" }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const keep = pendingKeep;
                  setPendingKeep(null);
                  if (keep != null) onChange(trips.slice(0, keep));
                }}
                className="h-10 px-4 rounded-xl text-xs font-semibold transition-colors"
                style={{ backgroundColor: "var(--accent-red)", color: "#fff" }}
              >
                Buang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
