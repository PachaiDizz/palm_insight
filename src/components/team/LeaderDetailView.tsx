"use client";
import { motion } from "framer-motion";
import { Users, Phone, MapPin, Edit2, Trash2, AlertCircle, BarChart3, TrendingUp, ChevronLeft, Calendar, ChevronDown, Truck } from "lucide-react";
import { TeamLeader, DailyEntry } from "@/types";
import { useI18n } from "@/lib/i18n";

interface DetailStats {
  totalEntries: number;
  workDays: number;
  noWorkDays: number;
  totalBunches: number;
  totalTons: number;
  totalBacklogs: number;
  avgBunches: number;
  avgTons: string;
  avgWorkers: number;
}

interface DetailViewState {
  month: string;
  dateFrom: string;
  dateTo: string;
  showEditModal: boolean;
  editEntry: DailyEntry | null;
  saving: boolean;
}

interface LeaderDetailViewProps {
  leader: TeamLeader;
  detailStats: DetailStats;
  detailView: DetailViewState;
  detailFilteredEntries: DailyEntry[];
  detailViewDispatch: React.Dispatch<any>;
  onBack: () => void;
  onEditEntry: (entry: DailyEntry) => void;
  onDeleteEntry: (id: string) => void;
  detailFormatMonthLabel: (ym: string) => string;
}

export default function LeaderDetailView({
  leader,
  detailStats,
  detailView,
  detailFilteredEntries,
  detailViewDispatch,
  onBack,
  onEditEntry,
  onDeleteEntry,
  detailFormatMonthLabel,
}: LeaderDetailViewProps) {
  const { t } = useI18n();
  const plantation = leader.plantations;

  return (
    <motion.div
      key="detail-view"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="mt-8"
    >
      <motion.button
        whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.08)" }}
        whileTap={{ scale: 0.97 }}
        onClick={onBack}
        aria-label="Back to org chart"
        className="flex items-center gap-2 mb-4 px-4 py-2 rounded-xl text-sm font-medium transition-all"
        style={{ color: "var(--text-muted)", border: "1px solid rgba(245,158,11,0.12)" }}
      >
        <ChevronLeft className="w-4 h-4" /> {t("team.backToBlocks")}
      </motion.button>

      {/* Leader Info Card */}
      <div className="card-glow rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6" style={{ backgroundColor: "var(--bg-card)" }}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--accent-subtle)" }}>
              <Users className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "var(--accent-primary)" }} />
            </div>
            <div>
              <h2 className="page-title text-xl sm:text-2xl text-theme">{leader.name}</h2>
              {leader.phone && (
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>{leader.phone}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ backgroundColor: "var(--accent-subtle)" }}>
              <MapPin className="w-3.5 h-3.5" style={{ color: "var(--accent-primary)" }} />
              <span className="text-xs sm:text-sm font-medium text-theme">Block {plantation?.block}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl" style={{ backgroundColor: "var(--accent-subtle)" }}>
              <span className="text-xs sm:text-sm" style={{ color: "var(--text-secondary)" }}>{plantation?.rancangan}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl" style={{ backgroundColor: "var(--accent-subtle)" }}>
              <span className="text-xs sm:text-sm" style={{ color: "var(--text-secondary)" }}>Peringkat {plantation?.peringkat}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {[
          { label: t("detail.workingDays"), value: detailStats.workDays, icon: Calendar, color: "var(--accent-primary)", bg: "var(--accent-subtle)" },
          { label: t("detail.totalBunches"), value: detailStats.totalBunches, icon: TrendingUp, color: "var(--accent-purple)", bg: "rgba(139,92,246,0.12)" },
          { label: t("detail.totalTonnage"), value: `${Number(detailStats.totalTons).toFixed(2)} ton`, icon: Truck, color: "var(--accent-blue)", bg: "rgba(59,130,246,0.12)" },
          { label: t("detail.totalBacklogs"), value: detailStats.totalBacklogs, icon: AlertCircle, color: "var(--accent-amber)", bg: "rgba(245,158,11,0.12)" },
        ].map((s) => (
          <div key={s.label} className="card-glow relative rounded-2xl p-3 sm:p-5 overflow-hidden" style={{ backgroundColor: "var(--bg-card)" }}>
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-xl" style={{ backgroundColor: s.color }} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{s.label}</span>
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.bg }}>
                  <s.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: s.color }} />
                </div>
              </div>
              <div className="text-xl sm:text-3xl font-bold text-theme">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Average Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {[
          { label: t("detail.avgBunchesDay"), value: detailStats.avgBunches, color: "var(--accent-purple)" },
          { label: t("detail.avgTonsDay"), value: detailStats.avgTons, color: "var(--accent-primary)" },
          { label: t("detail.avgWorkersDay"), value: detailStats.avgWorkers, color: "var(--accent-blue)" },
        ].map((s) => (
          <div key={s.label} className="card-glow rounded-2xl p-4 sm:p-5" style={{ backgroundColor: "var(--bg-card)" }}>
            <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>{s.label}</div>
            <div className="text-xl sm:text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Month Navigation & Date Filter */}
      <div className="card-glow rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6" style={{ backgroundColor: "var(--bg-card)" }}>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => detailViewDispatch({ type: "PREV_MONTH" })}
              aria-label="Previous month"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)", border: "1px solid rgba(245,158,11,0.2)" }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="relative">
              <Calendar className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--accent-primary)" }} />
              <input
                type="month"
                value={detailView.month}
                onChange={(e) => detailViewDispatch({ type: "SET", field: "month", value: e.target.value })}
                className="pl-8 sm:pl-9 pr-2 sm:pr-3 py-2 rounded-xl border text-xs sm:text-sm text-theme outline-none cursor-pointer"
                style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)", color: "white" }}
              />
            </div>
            <button
              onClick={() => detailViewDispatch({ type: "NEXT_MONTH" })}
              aria-label="Next month"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)", border: "1px solid rgba(245,158,11,0.2)" }}
            >
              <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
            </button>
            <span className="text-xs sm:text-sm font-semibold text-theme ml-1 hidden sm:inline">
              {detailFormatMonthLabel(detailView.month)}
            </span>
          </div>
          <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)" }}>
            {detailFilteredEntries.length} {t("detail.entries")}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 sm:gap-3 pt-3" style={{ borderTop: "1px solid rgba(245,158,11,0.12)" }}>
          <div className="flex-1">
            <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>{t("entry.from")}</label>
            <input
              type="date"
              value={detailView.dateFrom}
              onChange={(e) => detailViewDispatch({ type: "SET", field: "dateFrom", value: e.target.value })}
              className="w-full px-3 py-2 rounded border text-xs sm:text-sm text-theme outline-none cursor-pointer"
              style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>{t("entry.to")}</label>
            <input
              type="date"
              value={detailView.dateTo}
              onChange={(e) => detailViewDispatch({ type: "SET", field: "dateTo", value: e.target.value })}
              className="w-full px-3 py-2 rounded border text-xs sm:text-sm text-theme outline-none cursor-pointer"
              style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}
            />
          </div>
          {(detailView.dateFrom || detailView.dateTo) && (
            <button
              onClick={() => detailViewDispatch({ type: "RESET_MONTH" })}
              aria-label="Clear date range"
              className="px-3 py-2 rounded-xl text-xs font-medium transition-colors min-h-[36px] shrink-0"
              style={{ backgroundColor: "var(--accent-red-light)", color: "var(--accent-red)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              {t("entry.clearFilter")}
            </button>
          )}
        </div>
      </div>

      {/* Entries Table */}
      <div className="card-glow rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)" }}>
        <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border-default)" }}>
          <BarChart3 className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
          <h3 className="card-title text-sm text-theme">{t("detail.allEntries")}</h3>
        </div>
        {detailFilteredEntries.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("detail.noEntriesPeriod")}</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-[var(--bg-elevated)]/50">
            {/* Desktop table */}
            <table className="w-full border-collapse hidden md:table">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border-default)" }}>
                  {[["#", "center"], ["Date", "left"], ["Status", "left"], ["Workers", "right"], ["Lot", "left"], ["Bunches", "right"], ["Tons", "right"], ["Backlogs", "right"], ["Notes", "left"], ["Actions", "center"]].map(([h, a]) => (
                    <th key={h as string} className={`text-${a} px-4 py-3 text-xs font-semibold uppercase tracking-wider`} style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detailFilteredEntries.map((e: DailyEntry, idx: number) => {
                  const isNoWork = e.work_status === "no_work";
                  const isLast = idx === detailFilteredEntries.length - 1;
                  return (
                    <tr key={e.id} style={{ borderBottom: isLast ? "none" : "1px solid rgba(245,158,11,0.08)" }}>
                      <td className="px-4 py-3 text-sm text-center" style={{ color: "var(--text-muted)" }}>{idx + 1}</td>
                      <td className="px-4 py-3 text-sm text-theme font-medium whitespace-nowrap">{e.date ? e.date.split("-").reverse().join("/") : "-"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: isNoWork ? "var(--status-no-work-bg)" : "var(--status-work-bg)", color: isNoWork ? "var(--status-no-work)" : "var(--status-work)" }}>
                          {isNoWork ? t("status.noWork") : t("status.work")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ color: "var(--text-secondary)" }}>{isNoWork ? "-" : (e.num_workers ?? "-")}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>{isNoWork ? "-" : (e.lot || "-")}</td>
                      <td className="px-4 py-3 text-sm text-right" style={{ color: "var(--text-secondary)" }}>{isNoWork ? "-" : (e.bunches ?? "-")}</td>
                      <td className="px-4 py-3 text-sm font-medium text-theme text-right">{e.tons != null && e.tons !== 0 ? Number(e.tons).toFixed(2) : "-"}</td>
                      <td className="px-4 py-3 text-sm text-right" style={{ color: "var(--text-secondary)" }}>{isNoWork ? "-" : (e.backlogs || "-")}</td>
                      <td className="px-4 py-3 text-sm truncate max-w-[200px]" style={{ color: "var(--text-muted)" }}>{e.notes || "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => onEditEntry(e)} className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10" style={{ color: "var(--accent-blue)" }} title="Edit" aria-label="Edit entry">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => onDeleteEntry(e.id)} className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10" style={{ color: "var(--accent-red)" }} title="Delete" aria-label="Delete entry">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Mobile cards */}
            <div className="md:hidden divide-y" style={{ borderColor: "rgba(245,158,11,0.08)" }}>
              {detailFilteredEntries.map((e: DailyEntry) => {
                const isNoWork = e.work_status === "no_work";
                return (
                  <div key={e.id} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-theme font-medium">{e.date ? e.date.split("-").reverse().join("/") : "-"}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: isNoWork ? "var(--status-no-work-bg)" : "var(--status-work-bg)", color: isNoWork ? "var(--status-no-work)" : "var(--status-work)" }}>
                          {isNoWork ? t("status.noWork") : t("status.work")}
                        </span>
                        <button onClick={() => onEditEntry(e)} aria-label="Edit entry" className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10" style={{ color: "var(--accent-blue)" }}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onDeleteEntry(e.id)} aria-label="Delete entry" className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10" style={{ color: "var(--accent-red)" }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                      <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>{t("entry.workers")}</span><span className="font-medium text-theme">{isNoWork ? "-" : (e.num_workers ?? "-")}</span></div>
                      <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>{t("entry.lot")}</span><span className="font-medium text-theme">{isNoWork ? "-" : (e.lot || "-")}</span></div>
                      <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>{t("entry.bunches")}</span><span className="font-medium text-theme">{isNoWork ? "-" : (e.bunches ?? "-")}</span></div>
                      <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>{t("entry.tons")}</span><span className="font-medium text-theme">{e.tons != null && e.tons !== 0 ? Number(e.tons).toFixed(2) : "-"}</span></div>
                      <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>{t("entry.backlogs")}</span><span className="font-medium text-theme">{isNoWork ? "-" : (e.backlogs || "-")}</span></div>
                      {e.notes && <div className="col-span-2 truncate mt-1" style={{ color: "var(--text-muted)" }}>{e.notes}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
