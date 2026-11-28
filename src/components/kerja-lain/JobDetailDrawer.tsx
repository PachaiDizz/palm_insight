"use client";

import Modal from "@/components/ui/Modal";
import JobStatusChip from "./JobStatusChip";
import { getJobTypeMeta, getDetailChips } from "./jobMeta";
import { getStatusStyle } from "./statusStyles";
import { formatDateTime } from "@/lib/otherWorks";
import { Clock } from "lucide-react";
import type { OtherWork } from "@/types";

const MONTHS = [
  "JAN", "FEB", "MAC", "APR", "MEI", "JUN",
  "JUL", "OGOS", "SEP", "OKT", "NOV", "DIS",
];

function fmtDate(v?: unknown): string {
  if (typeof v !== "string") return "";
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "";
  return `${m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}`;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div className="text-sm font-medium text-theme truncate">{value || "—"}</div>
    </div>
  );
}

export default function JobDetailDrawer({
  job,
  onClose,
}: {
  job: OtherWork;
  onClose: () => void;
}) {
  const typeMeta = getJobTypeMeta(job.type);
  const Icon = typeMeta.icon;
  const details = (job.details ?? {}) as Record<string, unknown>;

  const chips = getDetailChips(job.type, job.details);

  const isMembaja = job.type === "membaja";
  const isMencuci = job.type === "mencuci_merumput";

  const parseItems = (raw: unknown) =>
    (Array.isArray(raw) ? (raw as unknown[]) : []).map((r) => {
      const o = (r ?? {}) as Record<string, unknown>;
      return {
        name: String(o.name ?? ""),
        bags: Number(o.bags) || 0,
        kg: Number(o.kg) || 0,
      };
    });

  // Prefer the new `trips` array; fall back to legacy flat `items`.
  const rawTrips = Array.isArray(details.trips) ? (details.trips as unknown[]) : [];
  const trips = rawTrips.length
    ? rawTrips.map((t, i) => {
        const o = (t ?? {}) as Record<string, unknown>;
        return { trip_no: Number(o.trip_no) || i + 1, items: parseItems(o.items) };
      })
    : Array.isArray(details.items) && details.items.length
      ? [{ trip_no: 1, items: parseItems(details.items) }]
      : [];

  const totalBags =
    Number(details.total_bags) ||
    trips.reduce((s, t) => s + t.items.reduce((a, i) => a + i.bags, 0), 0);
  const totalKg =
    Number(details.total_kg) ||
    trips.reduce((s, t) => s + t.items.reduce((a, i) => a + i.kg, 0), 0);
  const tripCount = Number(details.trip_count) || trips.length;
  const roundNo = details.round_no == null ? null : Number(details.round_no);

  const rawRounds = Array.isArray(details.rounds) ? (details.rounds as unknown[]) : [];
  const rounds = rawRounds.map((r, i) => {
    const o = (r ?? {}) as Record<string, unknown>;
    return {
      no: Number(o.no) || i + 1,
      start_date: String(o.start_date ?? ""),
      end_date: String(o.end_date ?? ""),
      area_ha: o.area_ha == null || o.area_ha === "" ? null : Number(o.area_ha),
      worker_count:
        o.worker_count == null || o.worker_count === "" ? null : Number(o.worker_count),
      notes: String(o.notes ?? ""),
    };
  });

  const blockText = job.plantations?.block ? `BLOK ${job.plantations.block}` : "";

  const timeText = job.started_at
    ? `${formatDateTime(job.started_at)}${
        job.ended_at ? ` → ${formatDateTime(job.ended_at)}` : " (BERJALAN)"
      }`
    : "—";

  const letterFor = (i: number) => String.fromCharCode(65 + (i % 26));

  return (
    <Modal open onClose={onClose} title="BUTIRAN KERJA" size="lg" mobileFull>
      <div style={{ textTransform: "uppercase" }} className="space-y-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)" }}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-theme">{job.title}</h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {typeMeta.label}
            </p>
          </div>
          <JobStatusChip status={job.status} size="md" />
        </div>

        {/* Chips */}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((chip, i) => (
              <span
                key={`${chip}-${i}`}
                className="text-[10px] font-semibold uppercase px-2 py-1 rounded-md"
                style={{
                  backgroundColor: i === 0 ? "var(--accent-primary-light)" : "var(--bg-input)",
                  color: i === 0 ? "var(--accent-primary)" : "var(--text-secondary)",
                }}
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        {/* Common meta */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Blok" value={blockText} />
          <Field label="Pekerja" value={`${job.worker_count} pekerja`} />
          <Field label="Kontraktor" value={String(details.contractor ?? "")} />
          <Field label="Status" value={getStatusStyle(job.status).label} />
        </div>

        <div
          className="flex items-center gap-2 text-xs rounded-xl px-3 py-2.5"
          style={{ backgroundColor: "var(--bg-input)", color: "var(--text-secondary)" }}
        >
          <Clock className="w-4 h-4 shrink-0" style={{ color: "var(--accent-primary)" }} />
          <span>{timeText}</span>
        </div>

        {/* MEMBAJA specifics */}
        {isMembaja && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Pusingan" value={roundNo ? `PUSINGAN ${roundNo}` : ""} />
              <Field label="Bilangan Trip" value={tripCount ? `${tripCount} TRIP` : ""} />
              <Field label="Jenis Baja" value={String(details.fertilizer_type ?? "")} />
              <Field label="Nama Driver" value={String(details.driver_name ?? "")} />
              <Field label="No. Lori" value={String(details.lorry_no ?? "")} />
              <Field
                label="Keluasan Hektar"
                value={details.area_ha != null ? `${Number(details.area_ha)} HA` : ""}
              />
              <Field
                label="Kadar Per Pokok"
                value={details.rate_per_palm_kg != null ? `${Number(details.rate_per_palm_kg)} KG` : ""}
              />
            </div>

            {/* JADUAL BAJA — one table per trip */}
            <div>
              <h3 className="text-[11px] font-bold tracking-[0.14em] mb-2" style={{ color: "var(--accent-primary)" }}>
                Jadual Baja
              </h3>
              {trips.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Tiada trip
                </p>
              ) : (
                <div className="space-y-3">
                  {trips.map((trip) => {
                    const tripBags = trip.items.reduce((s, i) => s + i.bags, 0);
                    const tripKg = trip.items.reduce((s, i) => s + i.kg, 0);
                    return (
                      <div
                        key={trip.trip_no}
                        className="rounded-xl overflow-hidden"
                        style={{ backgroundColor: "var(--bg-input)" }}
                      >
                        <div
                          className="flex items-center justify-between gap-2 px-3 py-2 text-[10px] font-bold"
                          style={{ color: "var(--accent-primary)" }}
                        >
                          <span>TRIP {trip.trip_no}</span>
                          <span className="tabular-nums">
                            {tripBags.toLocaleString("en-MY")} BAG · {tripKg.toLocaleString("en-MY")} KG
                          </span>
                        </div>
                        {trip.items.map((it, i) => (
                          <div
                            key={i}
                            className="grid grid-cols-[24px_minmax(0,1fr)_64px_84px] gap-2 px-3 py-2 text-xs border-t"
                            style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
                          >
                            <span className="font-bold" style={{ color: "var(--accent-primary)" }}>
                              {letterFor(i)}
                            </span>
                            <span className="truncate text-theme">{it.name}</span>
                            <span className="text-right tabular-nums">{it.bags.toLocaleString("en-MY")}</span>
                            <span className="text-right tabular-nums">{it.kg.toLocaleString("en-MY")}</span>
                          </div>
                        ))}
                        <div
                          className="grid grid-cols-[24px_minmax(0,1fr)_64px_84px] gap-2 px-3 py-2 text-xs font-bold border-t"
                          style={{ borderColor: "var(--accent-primary-border)", color: "var(--accent-primary)" }}
                        >
                          <span />
                          <span>Subjumlah</span>
                          <span className="text-right tabular-nums">{tripBags.toLocaleString("en-MY")}</span>
                          <span className="text-right tabular-nums">{tripKg.toLocaleString("en-MY")}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div
                className="mt-3 rounded-xl p-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm font-bold tabular-nums"
                style={{
                  backgroundColor: "var(--accent-primary-light)",
                  border: "1px solid var(--accent-primary-border)",
                  color: "var(--accent-primary)",
                }}
              >
                <span>JUMLAH</span>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="whitespace-nowrap">{tripCount} TRIP</span>
                  <span className="whitespace-nowrap">{totalBags.toLocaleString("en-MY")} BAG</span>
                  <span className="whitespace-nowrap">{totalKg.toLocaleString("en-MY")} KG</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* MENCUCI / MERUMPUT specifics */}
        {isMencuci && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Kaedah" value={String(details.method ?? "")} />
              <Field
                label="Luas"
                value={details.area_ha != null ? `${Number(details.area_ha)} HA` : ""}
              />
              <Field label="Nama Racun" value={String(details.chemical_name ?? "")} />
              <Field
                label="Kuantiti Racun"
                value={details.chemical_qty_l != null ? `${Number(details.chemical_qty_l)} L` : ""}
              />
            </div>

            {(details.first_work_date || details.last_work_date) && (
              <Field
                label="Tempoh Kerja"
                value={[fmtDate(details.first_work_date), fmtDate(details.last_work_date)]
                  .filter(Boolean)
                  .join(" - ")}
              />
            )}

            <div>
              <h3 className="text-[11px] font-bold tracking-[0.14em] mb-2" style={{ color: "var(--accent-primary)" }}>
                Pusingan
              </h3>
              {rounds.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Tiada pusingan
                </p>
              ) : (
                <div className="space-y-2">
                  {rounds.map((r) => {
                    const range =
                      [fmtDate(r.start_date), fmtDate(r.end_date)].filter(Boolean).join(" - ") || "—";
                    return (
                      <div
                        key={r.no}
                        className="rounded-xl border p-3"
                        style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-input)" }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold tracking-wide" style={{ color: "var(--accent-primary)" }}>
                            Pusingan {r.no}
                          </span>
                          <span className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>
                            {range}
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                          {r.area_ha != null && <span>{r.area_ha} HA</span>}
                          {r.worker_count != null && <span>{r.worker_count} PEKERJA</span>}
                        </div>
                        {r.notes && (
                          <p className="mt-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                            {r.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <div
                className="mt-2 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs font-bold"
                style={{
                  backgroundColor: "var(--accent-primary-light)",
                  border: "1px solid var(--accent-primary-border)",
                  color: "var(--accent-primary)",
                }}
              >
                <span>JUMLAH PUSINGAN: {Number(details.total_rounds) || rounds.length}</span>
                <span>
                  JUMLAH LUAS: {Number(details.total_round_area_ha || 0).toLocaleString("en-MY")} HA
                </span>
              </div>
            </div>
          </>
        )}

        {/* CUCI PARIT specifics */}
        {job.type === "cuci_parit" && (
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Panjang Parit"
              value={
                details.ditch_length_value != null
                  ? `${Number(details.ditch_length_value).toLocaleString("en-MY")} ${String(
                      details.ditch_length_unit ?? "M"
                    )}`
                  : details.ditch_length_m != null
                    ? `${Number(details.ditch_length_m).toLocaleString("en-MY")} M`
                    : ""
              }
            />
            <Field label="Bilangan Parit" value={String(details.ditch_count ?? "")} />
            <Field
              label="Kedalaman"
              value={details.depth_cm != null ? `${Number(details.depth_cm)} CM` : ""}
            />
          </div>
        )}

        {/* PRUNING specifics */}
        {job.type === "pruning" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Jenis Pruning" value={String(details.pruning_type ?? "")} />
            <Field label="Bilangan Pokok" value={String(details.tree_count ?? "")} />
            <Field
              label="Luas"
              value={details.area_hectare != null ? `${Number(details.area_hectare)} HA` : ""}
            />
          </div>
        )}

        {/* BAIKI JALAN specifics */}
        {job.type === "baiki_jalan" && (
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Panjang Jalan"
              value={details.road_length_m != null ? `${Number(details.road_length_m)} M` : ""}
            />
            <Field
              label="Bahan"
              value={
                String(details.material ?? "").toUpperCase() === "LAIN-LAIN" &&
                details.material_other
                  ? String(details.material_other)
                  : String(details.material ?? "")
              }
            />
            <Field label="Mesin" value={String(details.machine ?? "")} />
          </div>
        )}

        {/* LAIN-LAIN specifics */}
        {job.type === "lain_lain" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Huraian" value={String(details.description ?? "")} />
            <Field
              label="Kuantiti"
              value={
                details.quantity != null
                  ? `${Number(details.quantity)} ${String(details.unit ?? "")}`.trim()
                  : ""
              }
            />
          </div>
        )}

        {/* Notes */}
        {job.notes && (
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>
              Catatan
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {job.notes}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
