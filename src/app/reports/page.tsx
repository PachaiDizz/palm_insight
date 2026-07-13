"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { usePlantations, useReportEntries } from "@/lib/queries";
import DashboardLayout from "@/components/DashboardLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Calendar, TrendingUp, Filter, ChevronDown, FileText, FileSpreadsheet } from "lucide-react";
import { Plantation, DailyEntry, TeamLeader } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import { StatCardSkeleton, ChartSkeleton, TableSkeleton, FadeIn, Skeleton } from "@/components/ui/Skeleton";
import ExportHarvestingModal from "@/components/ExportHarvestingModal";
import { useI18n } from "@/lib/i18n";

const months = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December"
];

export default function ReportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const [selectedPlantationId, setSelectedPlantationId] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showPlantFilter, setShowPlantFilter] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const { data: plantations = [], isLoading: plantationsLoading } = usePlantations(user?.id);
  const { data: entries = [], isLoading } = useReportEntries(user?.id, selectedYear, selectedMonth);

  // Redirect to onboarding if the user has no plantation yet.
  useEffect(() => {
    if (user && !plantationsLoading && plantations.length === 0) {
      router.push("/onboarding/plantation");
    }
  }, [user, plantationsLoading, plantations, router]);

  // Filter by month/year/plantation
  const filteredEntries = entries.filter((e: DailyEntry) => {
    const d = new Date(e.date + "T00:00:00");
    const matchMonth = d.getMonth() === selectedMonth;
    const matchYear = d.getFullYear() === selectedYear;
    const matchPlantation = selectedPlantationId === "all" || e.team_leaders?.plantation_id === selectedPlantationId;
    return matchMonth && matchYear && matchPlantation;
  });

  // Stats
  const workOnly = filteredEntries.filter((e) => e.work_status === "work");
  const stats = {
    totalEntries: filteredEntries.length,
    totalBunches: workOnly.reduce((sum, e) => sum + (Number(e.bunches) || 0), 0),
    totalTons: filteredEntries.reduce((sum, e) => sum + (Number(e.tons) || 0), 0),
    totalBacklogs: workOnly.reduce((sum, e) => sum + (Number(e.backlogs) || 0), 0),
    workDays: workOnly.length,
    noWorkDays: filteredEntries.filter((e) => e.work_status !== "work").length,
  };

  // Daily chart data
  const dailyData = filteredEntries.reduce((acc: Record<string, { date: string; bunches: number; tons: number }>, e: DailyEntry) => {
    if (!acc[e.date]) acc[e.date] = { date: e.date, bunches: 0, tons: 0 };
    // Tons from all entries (work + no_work)
    acc[e.date].tons += Number(e.tons) || 0;
    // Bunches only from work days
    if (e.work_status === "work") {
      acc[e.date].bunches += Number(e.bunches) || 0;
    }
    return acc;
  }, {});
  const chartData = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));

  // Status pie chart
  const pieData = [
    { name: "Work Days", value: stats.workDays, color: "var(--status-work)" },
    { name: "No Work", value: stats.noWorkDays, color: "var(--status-no-work)" },
  ];

  const selectedP = plantations.find((p: Plantation) => p.id === selectedPlantationId);

  const exportCSV = () => {
    const headers = ["Date", "Leader", "Block", "Status", "Workers", "Bunches", "Tons", "Backlogs", "Notes"];
    const rows = filteredEntries.map((e: DailyEntry) => {
      const leader = e.team_leaders;
      return [e.date, leader?.name || "", `Block ${leader?.plantations?.block || ""}`, e.work_status, e.num_workers, e.bunches, e.tons, e.backlogs, e.notes || ""];
    });
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `palminsight-report-${months[selectedMonth]}-${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const data = filteredEntries.map((e: DailyEntry) => {
      const leader = e.team_leaders;
      return { date: e.date, leader: leader?.name, block: leader?.plantations?.block, status: e.work_status, workers: e.num_workers, bunches: e.bunches, tons: e.tons, backlogs: e.backlogs, notes: e.notes };
    });
    const json = JSON.stringify({ month: months[selectedMonth], year: selectedYear, stats, entries: data }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `palminsight-report-${months[selectedMonth]}-${selectedYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        {isLoading && (
          <FadeIn>
            <PageHeader title={t("reports.title")} subtitle="Loading..." action={null} />
            <div className="flex items-center gap-4 mb-6">
              <Skeleton className="w-32 h-10 rounded-xl" />
              <Skeleton className="w-32 h-10 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {[1,2,3,4,5,6].map(i => <StatCardSkeleton key={i} />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className="lg:col-span-2"><ChartSkeleton /></div>
              <ChartSkeleton />
            </div>
            <TableSkeleton rows={5} cols={8} />
          </FadeIn>
        )}

        {!isLoading && (
          <>
            <PageHeader
              title={t("reports.title")}
              subtitle={`${months[selectedMonth]} ${selectedYear}`}
              action={
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <button onClick={() => setShowExportModal(true)} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border text-xs sm:text-sm transition-all hover:bg-[var(--hover-subtle)] min-h-[40px]" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-default)", color: "var(--text-secondary)" }}>
                    <FileSpreadsheet className="w-4 h-4 shrink-0" style={{ color: "var(--accent-amber)" }} />
                    <span className="hidden sm:inline">Export Monthly</span>
                    <span className="sm:hidden">Export</span>
                  </button>
                  <button onClick={exportCSV} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border text-xs sm:text-sm transition-all hover:bg-[var(--hover-subtle)] min-h-[40px]" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-default)", color: "var(--text-secondary)" }}>
                    <FileSpreadsheet className="w-4 h-4 shrink-0" style={{ color: "var(--accent-primary)" }} />
                    CSV
                  </button>
                  <button onClick={exportJSON} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border text-xs sm:text-sm transition-all hover:bg-[var(--hover-subtle)] min-h-[40px]" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-default)", color: "var(--text-secondary)" }}>
                    <FileText className="w-4 h-4 shrink-0" style={{ color: "var(--accent-primary)" }} />
                    JSON
                  </button>
                </div>
              }
            />

            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              {/* Month Selector */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-4 py-2.5 rounded-xl text-sm text-theme outline-none border appearance-none min-h-[40px]"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-default)" }}
              >
                {months.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
              {/* Year Selector */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-4 py-2.5 rounded-xl text-sm text-theme outline-none border appearance-none min-h-[40px]"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-default)" }}
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              {/* Plantation Filter */}
              {plantations.length > 1 && (
                <div className="relative">
                  <button
                    onClick={() => setShowPlantFilter(!showPlantFilter)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm"
                    style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-default)", color: "var(--text-secondary)" }}
                  >
                    <Filter className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
                    {selectedPlantationId === "all" ? "All Plantations" : `Block ${selectedP?.block}`}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showPlantFilter && (
                    <>
                      <div className="fixed inset-0 z-[var(--z-overlay)]" onClick={() => setShowPlantFilter(false)} />
                      <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border overflow-hidden z-[var(--z-dropdown)] shadow-xl" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-default)" }}>
                        <button onClick={() => { setSelectedPlantationId("all"); setShowPlantFilter(false); }} className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--hover-subtle)] border-b" style={{ color: selectedPlantationId === "all" ? "var(--accent-primary)" : "var(--text-primary)", borderColor: "var(--border-subtle)" }}>All Plantations</button>
                        {plantations.map((p) => (
                          <button key={p.id} onClick={() => { setSelectedPlantationId(p.id); setShowPlantFilter(false); }} className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--hover-subtle)] border-b last:border-b-0" style={{ color: selectedPlantationId === p.id ? "var(--accent-primary)" : "var(--text-primary)", borderColor: "var(--border-subtle)" }}>
                            {p.rancangan} · Block {p.block}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {[
                { label: "Total Entries", value: stats.totalEntries, icon: Calendar, color: "var(--text-secondary)", glow: false },
                { label: "Total Bunches", value: stats.totalBunches, icon: TrendingUp, color: "var(--chart-bunches)", glow: true },
                { label: "Total Tons", value: stats.totalTons.toFixed(2), icon: TrendingUp, color: "var(--chart-tons)", glow: false },
                { label: "Work Days", value: stats.workDays, icon: Calendar, color: "var(--status-work)", glow: false },
                { label: "No Work Days", value: stats.noWorkDays, icon: Calendar, color: "var(--status-no-work)", glow: false },
                { label: "Total Backlogs", value: stats.totalBacklogs, icon: TrendingUp, color: "var(--accent-red)", glow: false },
              ].map((s) => (
                <StatCard
                  key={s.label}
                  label={s.label}
                  value={s.value}
                  icon={s.icon}
                  color={s.color}
                  glow={s.glow}
                />
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className="lg:col-span-2 card-glow rounded-2xl p-5" style={{ backgroundColor: "var(--bg-card)" }}>
                <h3 className="card-title text-sm text-theme mb-4">Daily Production</h3>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                      <XAxis dataKey="date" tick={{ fill: "var(--chart-axis)", fontSize: 10 }} tickFormatter={(d: string) => d.slice(5)} interval="preserveStartEnd" minTickGap={20} />
                      <YAxis tick={{ fill: "var(--chart-axis)", fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)", borderRadius: "12px" }} />
                      <Bar dataKey="bunches" fill="var(--chart-bunches)" name="Bunches" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="tons" fill="var(--chart-tons)" name="Tons" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>No data for this period</p>
                  </div>
                )}
              </div>
              <div className="card-glow rounded-2xl p-5" style={{ backgroundColor: "var(--bg-card)" }}>
                <h3 className="card-title text-sm text-theme mb-4">Work Status</h3>
                {stats.workDays + stats.noWorkDays > 0 ? (
                  <div className="relative" style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)", borderRadius: "12px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-bold text-theme">{stats.workDays + stats.noWorkDays}</span>
                      <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Total Days</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>No data</p>
                  </div>
                )}
                <div className="flex justify-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--status-work)" }} />
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Work ({stats.workDays})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--status-no-work)" }} />
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>No Work ({stats.noWorkDays})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Entries Table */}
            <div className="card-glow rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)" }}>
              <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border-default)" }}>
                <h3 className="card-title text-sm text-theme">All Entries — {months[selectedMonth]} {selectedYear}</h3>
              </div>
              {filteredEntries.length === 0 ? (
                <div className="p-12 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No entries for this period.</p>
                </div>
              ) : (
                <div className="rounded-xl">
                  {/* Desktop table */}
                  <table className="w-full hidden md:table">
                    <thead>
                      <tr className="border-b" style={{ borderColor: "var(--border-default)" }}>
                        <th className="text-left px-5 py-3 text-xs font-medium uppercase" style={{ color: "var(--text-muted)" }}>Date</th>
                        <th className="text-left px-5 py-3 text-xs font-medium uppercase" style={{ color: "var(--text-muted)" }}>Leader</th>
                        <th className="text-left px-5 py-3 text-xs font-medium uppercase" style={{ color: "var(--text-muted)" }}>Block</th>
                        <th className="text-left px-5 py-3 text-xs font-medium uppercase" style={{ color: "var(--text-muted)" }}>Status</th>
                        <th className="text-left px-5 py-3 text-xs font-medium uppercase" style={{ color: "var(--text-muted)" }}>Workers</th>
                        <th className="text-left px-5 py-3 text-xs font-medium uppercase" style={{ color: "var(--text-muted)" }}>Bunches</th>
                        <th className="text-left px-5 py-3 text-xs font-medium uppercase" style={{ color: "var(--text-muted)" }}>Tons</th>
                        <th className="text-left px-5 py-3 text-xs font-medium uppercase" style={{ color: "var(--text-muted)" }}>Backlogs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map((e: DailyEntry) => {
                        const leader = e.team_leaders as TeamLeader | undefined;
                        return (
                          <tr key={e.id} className="border-b last:border-b-0" style={{ borderColor: "var(--border-subtle)" }}>
                            <td className="px-5 py-3 text-sm text-theme">{e.date}</td>
                            <td className="px-5 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>{leader?.name || "-"}</td>
                            <td className="px-5 py-3 text-sm uppercase" style={{ color: "var(--text-secondary)" }}>
                              {leader?.plantations ? `Block ${leader.plantations.block}` : "-"}
                            </td>
                            <td className="px-5 py-3">
                              <Badge status={e.work_status === "work" ? "work" : "no-work"} size="sm" />
                            </td>
                            <td className="px-5 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>{e.num_workers}</td>
                            <td className="px-5 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>{(e.bunches ?? 0).toLocaleString("en-MY")}</td>
                            <td className="px-5 py-3 text-sm font-medium text-theme">{e.tons != null ? Number(e.tons).toFixed(2) : "-"}</td>
                            <td className="px-5 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>{e.backlogs}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {/* Mobile cards */}
                  <div className="md:hidden divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                    {filteredEntries.map((e: DailyEntry) => {
                      const leader = e.team_leaders as TeamLeader | undefined;
                      return (
                        <div key={e.id} className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-theme font-medium">{e.date}</span>
                            <Badge status={e.work_status === "work" ? "work" : "no-work"} size="sm" />
                          </div>
                          <div className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>{leader?.name || "-"} &middot; {leader?.plantations ? `Block ${leader.plantations.block}` : "-"}</div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                            <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>Workers</span><span className="font-medium text-theme">{e.num_workers ?? "-"}</span></div>
                            <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>Bunches</span><span className="font-medium text-theme">{e.bunches != null ? e.bunches.toLocaleString("en-MY") : "-"}</span></div>
                            <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>Tons</span><span className="font-medium text-theme">{e.tons != null ? Number(e.tons).toFixed(2) : "-"}</span></div>
                            <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>Backlogs</span><span className="font-medium text-theme">{e.backlogs ?? "-"}</span></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <ExportHarvestingModal
          open={showExportModal}
          onClose={() => setShowExportModal(false)}
          plantations={plantations}
          userId={user?.id || ""}
        />
      </div>
    </DashboardLayout>
  );
}
