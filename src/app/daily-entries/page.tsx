"use client";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";
import { hasCompletedOnboarding, getAllUserPlantations } from "@/lib/onboarding";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { Calendar, Download, Upload, ChevronLeft, ChevronRight, TrendingUp, Truck, AlertCircle, Trash2, CheckSquare, Square, MinusSquare } from "lucide-react";
import { Plantation, TeamLeader, DailyEntry } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import { StatCardSkeleton, TableSkeleton, FadeIn, Skeleton } from "@/components/ui/Skeleton";
import { useI18n } from "@/lib/i18n";
import ImportDataModal from "@/components/ImportDataModal";
import Toast from "@/components/ui/Toast";

export default function DailyEntriesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [plantations, setPlantations] = useState<Plantation[]>([]);
  const [selectedPlantationId, setSelectedPlantationId] = useState<string>("all");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showImport, setShowImport] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [leaders, setLeaders] = useState<{ id: string; name: string; plantation_id: string }[]>([]);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;
    const hasPlantation = await hasCompletedOnboarding(user.id);
    if (!hasPlantation) {
      router.push("/onboarding/plantation");
      return;
    }

    const allP = await getAllUserPlantations(user.id);
    setPlantations(allP);

    const [entriesRes, leadersRes] = await Promise.all([
      supabase
        .from("daily_entries")
        .select("*, team_leaders(name, plantation_id, plantations(block, rancangan))")
        .eq("user_id", user.id)
        .order("date", { ascending: false }),
      supabase
        .from("team_leaders")
        .select("id, name, plantation_id")
        .eq("user_id", user.id),
    ]);

    setEntries((entriesRes.data || []) as DailyEntry[]);
    setLeaders(leadersRes.data || []);
    setLoading(false);
  }

  const filteredEntries = useMemo(() => entries.filter((e) => {
    const d = e.date;
    if (!d.startsWith(currentMonth)) return false;
    if (selectedPlantationId !== "all") {
      const leader = e.team_leaders as TeamLeader | undefined;
      if (leader?.plantation_id !== selectedPlantationId) return false;
    }
    return true;
  }), [entries, currentMonth, selectedPlantationId]);

  const workOnly = useMemo(() => filteredEntries.filter((e) => e.work_status === "work"), [filteredEntries]);
  const stats = useMemo(() => ({
    total: filteredEntries.length,
    workDays: workOnly.length,
    totalBunches: workOnly.reduce((sum, e) => sum + (Number(e.bunches) || 0), 0),
    totalTons: filteredEntries.reduce((sum, e) => sum + (Number(e.tons) || 0), 0),
    totalBacklogs: workOnly.reduce((sum, e) => sum + (Number(e.backlogs) || 0), 0),
  }), [filteredEntries, workOnly]);

  const allSelected = filteredEntries.length > 0 && selectedIds.size === filteredEntries.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEntries.map((e) => e.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(t("bulk.confirmDelete", { count: selectedIds.size }))) return;

    const ids = Array.from(selectedIds);
    const { error } = await supabase.from("daily_entries").delete().in("id", ids);
    if (!error) {
      setEntries((prev) => prev.filter((e) => !selectedIds.has(e.id)));
      setSelectedIds(new Set());
      setToast({ type: "success", message: t("bulk.deleted", { count: ids.length }) });
    }
  };

  const handleBulkExport = () => {
    const selected = filteredEntries.filter((e) => selectedIds.has(e.id));
    const dataToExport = selectedIds.size > 0 ? selected : filteredEntries;
    exportCSV(dataToExport);
  };

  const prevMonth = () => {
    const [y, m] = currentMonth.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    setSelectedIds(new Set());
  };

  const nextMonth = () => {
    const [y, m] = currentMonth.split("-").map(Number);
    const d = new Date(y, m, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    setSelectedIds(new Set());
  };

  const formatMonthLabel = (ym: string) => {
    const [y, m] = ym.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const exportCSV = (data: DailyEntry[]) => {
    const headers = ["Date", "Leader", "Block", "Status", "Workers", "Bunches", "Tons", "Backlogs", "Notes"];
    const rows = data.map((e) => {
      const leader = e.team_leaders as TeamLeader | undefined;
      const plantation = leader?.plantations as Plantation | undefined;
      return [e.date, leader?.name || "", `Block ${plantation?.block || ""}`, e.work_status, e.num_workers, e.bunches, e.tons, e.backlogs, e.notes || ""];
    });
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-entries-${currentMonth}${selectedIds.size > 0 ? "-selected" : ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-6 max-w-6xl mx-auto">
          <FadeIn>
            <PageHeader title={t("entries.title")} subtitle="View and export all harvest entries" action={null} />
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Skeleton className="w-9 h-9 rounded-xl" />
                <Skeleton className="w-36 h-4" />
                <Skeleton className="w-9 h-9 rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {[1,2,3,4,5].map(i => <StatCardSkeleton key={i} />)}
            </div>
            <TableSkeleton rows={5} cols={9} />
          </FadeIn>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <PageHeader
          title={t("entries.title")}
          subtitle="View and export all harvest entries"
          action={
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border text-xs sm:text-sm transition-all hover:bg-white/5 bg-[var(--bg-card)] border-[var(--border-default)] text-[var(--text-secondary)] min-h-[40px]"
              >
                <Upload className="w-4 h-4 text-[var(--accent-primary)]" />
                <span className="hidden sm:inline">{t("action.import")}</span>
                <span className="sm:hidden">{t("action.import")}</span>
              </button>
              <button
                onClick={handleBulkExport}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border text-xs sm:text-sm transition-all hover:bg-white/5 bg-[var(--bg-card)] border-[var(--border-default)] text-[var(--text-secondary)] min-h-[40px]"
              >
                <Download className="w-4 h-4 text-[var(--accent-primary)]" />
                {selectedIds.size > 0 ? t("bulk.exportSelected") : t("entries.exportCSV")}
              </button>
            </div>
          }
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10 bg-[var(--accent-subtle)] text-[var(--accent-primary)] border" style={{ borderColor: "var(--accent-subtle)" }}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-theme min-w-[140px] text-center">{formatMonthLabel(currentMonth)}</span>
            <button onClick={nextMonth} className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10 bg-[var(--accent-subtle)] text-[var(--accent-primary)] border" style={{ borderColor: "var(--accent-subtle)" }}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {plantations.length > 1 && (
            <select
              value={selectedPlantationId}
              onChange={(e) => { setSelectedPlantationId(e.target.value); setSelectedIds(new Set()); }}
              className="px-4 py-2.5 rounded-xl text-sm text-theme outline-none border appearance-none bg-[var(--bg-card)] border-[var(--border-default)] min-h-[40px]"
            >
              <option value="all">All Plantations</option>
              {plantations.map((p) => (
                <option key={p.id} value={p.id}>{p.rancangan} - Block {p.block}</option>
              ))}
            </select>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[
            { label: t("entries.totalEntries"), value: stats.total, icon: Calendar, color: "var(--accent-primary)" },
            { label: t("entries.workDays"), value: stats.workDays, icon: Calendar, color: "var(--accent-primary)" },
            { label: t("entries.totalBunches"), value: stats.totalBunches, icon: TrendingUp, color: "var(--accent-purple)" },
            { label: t("entries.totalTons"), value: stats.totalTons.toFixed(1), icon: Truck, color: "var(--accent-blue)" },
            { label: t("entries.backlogs"), value: stats.totalBacklogs, icon: AlertCircle, color: "var(--accent-amber)" },
          ].map((s) => (
            <div key={s.label} className="card-glow rounded-2xl p-4 bg-[var(--bg-card)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[var(--text-muted)]">{s.label}</span>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div className="text-2xl font-bold text-theme">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Bulk Actions Bar */}
        {filteredEntries.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-4 px-3 sm:px-4 py-2.5 rounded-xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm transition-colors min-h-[36px]"
                style={{ color: allSelected ? "var(--accent-primary)" : "var(--text-muted)" }}
                aria-label={allSelected ? t("bulk.deselectAll") : t("bulk.selectAll")}
              >
                {allSelected ? <CheckSquare className="w-4 h-4" /> : someSelected ? <MinusSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                <span>{allSelected ? t("bulk.deselectAll") : t("bulk.selectAll")}</span>
              </button>
              {selectedIds.size > 0 && (
                <span className="text-xs font-medium" style={{ color: "var(--accent-primary)" }}>
                  {selectedIds.size} {t("bulk.selected")}
                </span>
              )}
            </div>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-[36px]"
                  style={{ backgroundColor: "var(--accent-red-light)", color: "var(--accent-red)" }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t("bulk.deleteSelected")}
                </button>
                <button
                  onClick={handleBulkExport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-[36px]"
                  style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)" }}
                >
                  <Download className="w-3.5 h-3.5" />
                  {t("bulk.exportSelected")}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Entries Table */}
        <div className="card-glow rounded-2xl overflow-hidden bg-[var(--bg-card)]">
          <div className="px-5 py-3 border-b flex items-center justify-between border-[var(--border-default)]">
            <h3 className="card-title text-sm text-theme">{t("detail.allEntries")}</h3>
            <span className="text-xs px-2 py-1 rounded-full bg-[var(--accent-subtle)] text-[var(--accent-primary)]">
              {filteredEntries.length} {t("detail.entries")}
            </span>
          </div>
          {filteredEntries.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
              <p className="text-sm text-[var(--text-muted)]">{t("entries.noData")}</p>
            </div>
          ) : (
            <div className="rounded-xl">
              {/* Desktop table */}
              <table className="w-full hidden md:table">
                <thead>
                  <tr>
                    <th className="w-10 px-3 py-3">
                      <span className="sr-only">Select</span>
                    </th>
                    {[t("entry.date"), t("team.addLeader").replace("Add ",""), t("export.block"), t("status.work"), t("entry.workers"), t("entry.bunches"), t("entry.tons"), t("entry.backlogs"), t("entry.notes")].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[var(--text-muted)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((e) => {
                    const leader = e.team_leaders as TeamLeader | undefined;
                    const plantation = leader?.plantations as Plantation | undefined;
                    const isSelected = selectedIds.has(e.id);
                    return (
                      <tr key={e.id} className="border-b last:border-b-0 transition-colors" style={{ borderColor: "var(--border-subtle)", backgroundColor: isSelected ? "rgba(245,158,11,0.04)" : undefined }}>
                        <td className="px-3 py-3">
                          <button
                            onClick={() => toggleSelect(e.id)}
                            aria-label={isSelected ? "Deselect" : "Select"}
                            className="transition-colors"
                            style={{ color: isSelected ? "var(--accent-primary)" : "var(--text-muted)" }}
                          >
                            {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm">{e.date}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>{leader?.name || "-"}</td>
                        <td className="px-4 py-3 text-sm uppercase" style={{ color: "var(--text-secondary)" }}>
                          {plantation ? `Block ${plantation.block}` : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${e.work_status === "work" ? "bg-[var(--status-work-bg)] text-[var(--status-work)]" : "bg-[var(--status-no-work-bg)] text-[var(--status-no-work)]"}`}>
                            {e.work_status === "work" ? t("status.work") : t("status.noWork")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>{e.num_workers ?? "-"}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>{e.bunches ?? "-"}</td>
                        <td className="px-4 py-3 text-sm font-medium">{e.tons != null ? Number(e.tons).toFixed(2) : "-"}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>{e.backlogs ?? "-"}</td>
                        <td className="px-4 py-3 text-sm truncate max-w-[200px]" style={{ color: "var(--text-muted)" }}>{e.notes || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Mobile cards */}
              <div className="md:hidden divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                {filteredEntries.map((e) => {
                  const leader = e.team_leaders as TeamLeader | undefined;
                  const plantation = leader?.plantations as Plantation | undefined;
                  const isSelected = selectedIds.has(e.id);
                  return (
                    <div key={e.id} className="p-4 space-y-2.5" style={{ backgroundColor: isSelected ? "rgba(245,158,11,0.04)" : undefined }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            onClick={() => toggleSelect(e.id)}
                            aria-label={isSelected ? "Deselect" : "Select"}
                            style={{ color: isSelected ? "var(--accent-primary)" : "var(--text-muted)" }}
                            className="shrink-0"
                          >
                            {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          </button>
                          <span className="text-sm text-theme font-medium truncate">{e.date}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${e.work_status === "work" ? "bg-[var(--status-work-bg)] text-[var(--status-work)]" : "bg-[var(--status-no-work-bg)] text-[var(--status-no-work)]"}`}>
                          {e.work_status === "work" ? t("status.work") : t("status.noWork")}
                        </span>
                      </div>
                      <div className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>{leader?.name || "-"} &middot; {plantation ? `Block ${plantation.block}` : "-"}</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                        <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>{t("entry.workers")}</span><span className="font-medium text-theme">{e.num_workers ?? "-"}</span></div>
                        <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>{t("entry.bunches")}</span><span className="font-medium text-theme">{e.bunches ?? "-"}</span></div>
                        <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>{t("entry.tons")}</span><span className="font-medium text-theme">{e.tons != null ? Number(e.tons).toFixed(2) : "-"}</span></div>
                        <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>{t("entry.backlogs")}</span><span className="font-medium text-theme">{e.backlogs ?? "-"}</span></div>
                        {e.notes && <div className="col-span-2 truncate mt-1" style={{ color: "var(--text-muted)" }}>{e.notes}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Import Modal */}
      <ImportDataModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onImported={() => { loadData(); setShowImport(false); }}
        leaders={leaders}
        plantations={plantations}
      />

      {/* Toast */}
      <Toast toast={toast} onDismiss={() => setToast(null)} position="bottom-right" />
    </DashboardLayout>
  );
}
