"use client";

import Link from "next/link";
import { Briefcase, ArrowRight } from "lucide-react";
import { useOtherWorkCounts } from "@/lib/otherWorks";
import { STATUS_STYLES } from "@/components/kerja-lain/statusStyles";

interface OtherWorksCardProps {
  userId?: string;
  plantationId?: string;
  year: number;
  month: number;
}

export default function OtherWorksCard({
  userId,
  plantationId,
  year,
  month,
}: OtherWorksCardProps) {
  const { data, isLoading } = useOtherWorkCounts(userId, plantationId, year, month);
  const counts = data ?? { scheduled: 0, running: 0, completed: 0, total: 0 };

  const stats = [
    { label: "Dijadualkan", value: counts.scheduled, accent: STATUS_STYLES.scheduled.text },
    { label: "Sedang Berjalan", value: counts.running, accent: STATUS_STYLES.running.text },
    { label: "Selesai", value: counts.completed, accent: STATUS_STYLES.completed.text },
    { label: "Jumlah Kerja", value: counts.total, accent: "var(--text-secondary)" },
  ];

  return (
    <Link
      href="/kerja-lain"
      className="group block card-glow rounded-2xl p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent-primary-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
      style={{ backgroundColor: "var(--bg-card)" }}
      aria-label="Lihat semua kerja-kerja lain"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)" }}
          >
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-wide text-theme truncate">
              KERJA-KERJA LAIN
            </h2>
            <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
              Rekod kerja bukan hasil
            </p>
          </div>
        </div>

        <span
          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0"
          style={{
            backgroundColor: "var(--accent-primary-light)",
            color: "var(--accent-primary)",
          }}
        >
          Lihat Semua
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl py-2.5 px-2 text-center"
            style={{ backgroundColor: "var(--bg-input)" }}
          >
            <div
              className="text-lg sm:text-xl font-bold text-theme transition-opacity"
              style={{ opacity: isLoading ? 0.5 : 1 }}
            >
              {s.value}
            </div>
            <div
              className="text-[10px] uppercase tracking-wide flex items-center justify-center gap-1"
              style={{ color: "var(--text-muted)" }}
            >
              {s.label === "Sedang Berjalan" && counts.running > 0 && (
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: s.accent }}
                />
              )}
              <span className="truncate">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {!isLoading && counts.total === 0 && (
        <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
          Tiada kerja direkodkan bulan ini
        </p>
      )}
    </Link>
  );
}
