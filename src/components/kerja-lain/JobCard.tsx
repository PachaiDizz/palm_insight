"use client";

import { MapPin, Users, Clock, Timer, Pencil, Truck, Eye, type LucideIcon } from "lucide-react";
import type { OtherWork } from "@/types";
import { getJobTypeMeta, getDetailChips, getMembajaSubline } from "./jobMeta";
import JobStatusChip from "./JobStatusChip";
import { formatDateTime, formatDuration } from "@/lib/otherWorks";

function Meta({ icon: Icon, value }: { icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
      <span className="truncate" style={{ color: "var(--text-secondary)" }}>
        {value}
      </span>
    </div>
  );
}

export default function JobCard({
  job,
  onEdit,
  onOpenTrips,
  onView,
}: {
  job: OtherWork;
  onEdit?: (job: OtherWork) => void;
  onOpenTrips?: (job: OtherWork) => void;
  onView?: (job: OtherWork) => void;
}) {
  const typeMeta = getJobTypeMeta(job.type);
  const Icon = typeMeta.icon;

  const blockText = job.plantations?.block
    ? `Block ${job.plantations.block}`
    : job.plantations?.rancangan || "—";
  const duration = formatDuration(job.started_at, job.ended_at);
  const progress = Math.max(0, Math.min(100, Number(job.progress) || 0));
  const chips = getDetailChips(job.type, job.details);
  const subline = job.type === "membaja" ? getMembajaSubline(job.details) : null;

  const isMembaja = job.type === "membaja";
  const detailsObj = (job.details ?? {}) as Record<string, unknown>;
  const contractorText =
    typeof detailsObj.contractor === "string" ? detailsObj.contractor : "";
  const workerText = `${Number(job.worker_count) || 0} pekerja`;
  const secondaryText = isMembaja ? contractorText || "—" : workerText;

  return (
    <article
      className="card-glow rounded-2xl p-4 sm:p-5 flex flex-col gap-3 transition-all"
      style={{ backgroundColor: "var(--bg-card)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)" }}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-theme truncate">{job.title}</h3>
            <p className="text-xs truncate uppercase" style={{ color: "var(--text-muted)" }}>
              {typeMeta.label}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <JobStatusChip status={job.status} />
          {onView && (
            <button
              type="button"
              onClick={() => onView(job)}
              aria-label={`Lihat butiran ${job.title}`}
              className="p-1.5 rounded-lg transition-colors hover:bg-[var(--hover-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              style={{ color: "var(--text-muted)" }}
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(job)}
              aria-label={`Sunting ${job.title}`}
              className="p-1.5 rounded-lg transition-colors hover:bg-[var(--hover-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              style={{ color: "var(--text-muted)" }}
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Detail chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip, i) => (
            <span
              key={`${chip}-${i}`}
              className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md"
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

      {/* Membaja contractor / lorry subline */}
      {subline && (
        <p
          className="text-[10px] font-semibold uppercase tracking-wide"
          style={{ color: "var(--text-muted)" }}
        >
          {subline}
        </p>
      )}

      {/* Meta */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        <Meta icon={MapPin} value={blockText} />
        <Meta icon={Users} value={secondaryText} />
        {isMembaja && <Meta icon={Users} value={workerText} />}
        <Meta icon={Clock} value={formatDateTime(job.started_at)} />
      </div>

      {/* Progress (running only) */}
      {job.status === "running" && (
        <div>
          <div
            className="flex items-center justify-between text-[11px] mb-1"
            style={{ color: "var(--text-muted)" }}
          >
            <span>Kemajuan</span>
            <span className="font-medium text-theme">{progress}%</span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--bg-input)" }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{ width: `${progress}%`, background: "var(--accent-gradient)" }}
            />
          </div>
        </div>
      )}

      {/* Duration / elapsed */}
      {duration && (
        <div
          className="flex items-center gap-1.5 text-xs"
          style={{ color: "var(--text-secondary)" }}
        >
          <Timer className="w-3.5 h-3.5" />
          <span>
            {job.status === "running" ? `Berjalan ${duration}` : `Tempoh ${duration}`}
          </span>
        </div>
      )}

      {/* Notes */}
      {job.notes && (
        <p
          className="text-xs leading-relaxed line-clamp-2"
          style={{ color: "var(--text-muted)" }}
        >
          {job.notes}
        </p>
      )}

      {/* Membaja: manage daily fertilizer trips */}
      {job.type === "membaja" && onOpenTrips && (
        <button
          type="button"
          onClick={() => onOpenTrips(job)}
          className="mt-1 inline-flex items-center justify-center gap-2 w-full rounded-xl border text-xs font-medium transition-colors hover:bg-[var(--accent-primary-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
          style={{
            borderColor: "var(--accent-primary-border)",
            color: "var(--accent-primary)",
          }}
        >
          <Truck className="w-4 h-4" />
          Urus Trip Baja
        </button>
      )}
    </article>
  );
}
