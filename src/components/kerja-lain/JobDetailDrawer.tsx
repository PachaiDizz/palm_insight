"use client";

import Modal from "@/components/ui/Modal";
import JobStatusChip from "./JobStatusChip";
import { getJobTypeMeta, getDetailChips } from "./jobMeta";
import { formatDateTime } from "@/lib/otherWorks";
import { Clock } from "lucide-react";
import type { OtherWork, Plantation } from "@/types";

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
  plantations = [],
}: {
  job: OtherWork;
  onClose: () => void;
  plantations?: Plantation[];
}) {
  const typeMeta = getJobTypeMeta(job.type);
  const Icon = typeMeta.icon;
  const details = (job.details ?? {}) as Record<string, unknown>;

  const chips = getDetailChips(job.type, job.details);

  const isMembaja = job.type === "membaja";
  const rawItems = Array.isArray(details.items) ? (details.items as unknown[]) : [];
  const items = rawItems.map((r) => {
    const o = (r ?? {}) as Record<string, unknown>;
    return {
      name: String(o.name ?? ""),
      bags: Number(o.bags) || 0,
      kg: Number(o.kg) || 0,
    };
  });
  const totalBags = Number(details.total_bags) || items.reduce((s, i) => s + i.bags, 0);
  const totalKg = Number(details.total_kg) || items.reduce((s, i) => s + i.kg, 0);

  const blockIds = Array.isArray(details.blocks)
    ? (details.blocks as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  const blockLabels = blockIds
    .map((id) => plantations.find((p) => p.id === id)?.block)
    .filter(Boolean);
  const blocksText =
    blockLabels.length > 0
      ? blockLabels.map((b) => `BLOK ${b}`).join(", ")
      : job.plantations?.block
        ? `BLOK ${job.plantations.block}`
        : "";

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
          <Field label="Blok" value={blocksText} />
          <Field label="Kumpulan" value={[job.group_name, job.leader_name].filter(Boolean).join(" · ")} />
          <Field label="Pekerja" value={`${job.worker_count} pekerja`} />
          <Field label="Status" value={job.status.replace("_", " ")} />
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
              <Field label="Kontraktor" value={String(details.contractor ?? "")} />
              <Field label="Jenis Baja" value={String(details.fertilizer_type ?? "")} />
              <Field label="Nama Driver" value={String(details.driver_name ?? "")} />
              <Field label="No. Lori" value={String(details.lorry_no ?? "")} />
              <Field
                label="Keluasan Chekar"
                value={details.chekar_area_ha != null ? `${Number(details.chekar_area_ha)} HA` : ""}
              />
              <Field
                label="Kadar Per Pokok"
                value={details.rate_per_palm_kg != null ? `${Number(details.rate_per_palm_kg)} KG` : ""}
              />
            </div>

            {/* JADUAL BAJA */}
            <div>
              <h3 className="text-[11px] font-bold tracking-[0.14em] mb-2" style={{ color: "var(--accent-primary)" }}>
                Jadual Baja
              </h3>
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--bg-input)" }}>
                <div
                  className="grid grid-cols-[24px_minmax(0,1fr)_64px_84px] gap-2 px-3 py-2 text-[10px] font-semibold"
                  style={{ color: "var(--text-muted)" }}
                >
                  <span>No.</span>
                  <span>Nama Baja</span>
                  <span className="text-right">Bag</span>
                  <span className="text-right">Kg</span>
                </div>
                {items.length === 0 ? (
                  <p className="px-3 pb-3 text-xs" style={{ color: "var(--text-muted)" }}>
                    Tiada baris
                  </p>
                ) : (
                  items.map((it, i) => (
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
                  ))
                )}
                <div
                  className="grid grid-cols-[24px_minmax(0,1fr)_64px_84px] gap-2 px-3 py-2.5 text-xs font-bold border-t"
                  style={{ borderColor: "var(--accent-primary-border)", color: "var(--accent-primary)" }}
                >
                  <span />
                  <span>Jumlah</span>
                  <span className="text-right tabular-nums">{totalBags.toLocaleString("en-MY")}</span>
                  <span className="text-right tabular-nums">{totalKg.toLocaleString("en-MY")}</span>
                </div>
              </div>
            </div>
          </>
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
