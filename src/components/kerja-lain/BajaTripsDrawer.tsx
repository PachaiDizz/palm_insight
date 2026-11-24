"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";
import { bajaTripFormSchema } from "@/lib/schemas";
import {
  useBajaTrips,
  summarizeTrips,
  formatTripDate,
} from "@/lib/bajaTrips";
import { toLocalDateKey } from "@/lib/date";
import { Truck, Trash2, Plus } from "lucide-react";
import type { OtherWork } from "@/types";

export default function BajaTripsDrawer({
  job,
  onClose,
}: {
  job: OtherWork;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: trips = [], isLoading } = useBajaTrips(user?.id, job.id);
  const summary = summarizeTrips(trips);

  const [date, setDate] = useState(toLocalDateKey(new Date()));
  const [count, setCount] = useState("0");
  const [quantity, setQuantity] = useState("");
  const [store, setStore] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["bajaTrips", job.id] });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const parsed = bajaTripFormSchema.safeParse({
      date,
      trips: count,
      quantity_tons: quantity === "" ? undefined : quantity,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Sila semak borang");
      return;
    }

    setError(null);
    setSaving(true);
    const { error: insertError } = await supabase.from("other_work_trips").insert({
      other_work_id: job.id,
      plantation_id: job.plantation_id,
      date,
      trips: Math.max(0, Number(count) || 0),
      quantity_tons: quantity === "" ? null : Number(quantity) || 0,
      store: store.trim() || null,
      notes: notes.trim() || null,
      created_by: user.id,
    });
    setSaving(false);

    if (insertError) {
      setError(insertError.message || "Gagal menyimpan trip");
      return;
    }
    setCount("0");
    setQuantity("");
    setStore("");
    setNotes("");
    refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Padam rekod trip ini?")) return;
    setDeletingId(id);
    await supabase.from("other_work_trips").delete().eq("id", id);
    setDeletingId(null);
    refresh();
  };

  return (
    <Modal open onClose={onClose} title="Trip Baja (Membaja)">
      <div className="space-y-4">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {job.title}
        </p>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Jumlah Trip", value: summary.totalTrips },
            { label: "Jumlah Tan", value: summary.totalTons.toFixed(2) },
            { label: "Hari", value: summary.days },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl py-2.5 px-2 text-center"
              style={{ backgroundColor: "var(--bg-input)" }}
            >
              <div className="text-lg font-bold text-theme">{s.value}</div>
              <div
                className="text-[10px] uppercase tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Daily trip list */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Truck className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
            <h3 className="text-sm font-semibold text-theme">Senarai Trip Harian</h3>
          </div>

          {isLoading ? (
            <div className="space-y-2 py-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-full h-9 rounded-lg" />
              ))}
            </div>
          ) : trips.length === 0 ? (
            <p
              className="text-xs py-4 text-center rounded-xl"
              style={{ backgroundColor: "var(--bg-input)", color: "var(--text-muted)" }}
            >
              Tiada trip direkodkan
            </p>
          ) : (
            <ul className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--bg-input)" }}>
              {trips.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-2 px-3 py-2.5 border-b last:border-b-0"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-theme">
                      {formatTripDate(t.date)}
                    </div>
                    <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                      {[
                        t.store,
                        t.quantity_tons != null
                          ? `${Number(t.quantity_tons).toFixed(2)} tan`
                          : null,
                        t.notes,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold text-theme">
                      {t.trips} trip
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(t.id)}
                      disabled={deletingId === t.id}
                      aria-label="Padam trip"
                      className="p-1.5 rounded-lg transition-colors hover:bg-[var(--hover-subtle)] disabled:opacity-50"
                      style={{ color: "var(--accent-red)" }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Add form */}
        <form onSubmit={handleAdd} className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Tarikh"
              name="trip_date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Input
              label="Bil. Trip"
              name="trip_count"
              type="number"
              min={0}
              inputMode="numeric"
              value={count}
              onChange={(e) => setCount(e.target.value)}
            />
            <Input
              label="Kuantiti (tan)"
              name="trip_qty"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              placeholder="pilihan"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <Input
              label="Stor / Gudang"
              name="trip_store"
              placeholder="pilihan"
              value={store}
              onChange={(e) => setStore(e.target.value)}
            />
          </div>
          <Input
            label="Catatan"
            name="trip_notes"
            placeholder="pilihan"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {error && (
            <p className="text-xs" style={{ color: "var(--accent-red)" }} role="alert">
              {error}
            </p>
          )}

          <Button type="submit" loading={saving} className="w-full">
            <Plus className="w-4 h-4" />
            Tambah Trip
          </Button>
        </form>
      </div>
    </Modal>
  );
}
