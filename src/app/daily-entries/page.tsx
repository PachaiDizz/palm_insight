"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";
import { hasCompletedOnboarding, getAllUserPlantations } from "@/lib/onboarding";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { Calendar, Filter, Download, ChevronLeft, ChevronRight, Users, TrendingUp, Truck, AlertCircle } from "lucide-react";
import { Plantation, TeamLeader, DailyEntry } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import { StatCardSkeleton, TableSkeleton, FadeIn, Skeleton } from "@/components/ui/Skeleton";

export default function DailyEntriesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [plantations, setPlantations] = useState<Plantation[]>([]);
  const [selectedPlantationId, setSelectedPlantationId] = useState<string>("all");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [loading, setLoading] = useState(true);

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

    const { data } = await supabase
      .from("daily_entries")
      .select("*, team_leaders(name, plantation_id, plantations(block, rancangan))")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    setEntries((data || []) as DailyEntry[]);
    setLoading(false);
  }

  const filteredEntries = entries.filter((e) => {
    const d = e.date;
    if (!d.startsWith(currentMonth)) return false;
    if (selectedPlantationId !== "all") {
      const leader = e.team_leaders as TeamLeader | undefined;
      if (leader?.plantation_id !== selectedPlantationId) return false;
    }
    return true;
  });

  const stats = {
    total: filteredEntries.length,
    workDays: filteredEntries.filter((e) => e.work_status === "work").length,
    totalBunches: filteredEntries.reduce((sum, e) => sum + (e.bunches || 0), 0),
    totalTons: filteredEntries.reduce((sum, e) => sum + (e.tons || 0), 0),
    totalBacklogs: filteredEntries.reduce((sum, e) => sum + (e.backlogs || 0), 0),
  };

  const prevMonth = () => {
    const [y, m] = currentMonth.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const nextMonth = () => {
    const [y, m] = currentMonth.split("-").map(Number);
    const d = new Date(y, m, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const formatMonthLabel = (ym: string) => {
    const [y, m] = ym.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const exportCSV = () => {
    const headers = ["Date", "Leader", "Block", "Status", "Workers", "Bunches", "Tons", "Backlogs", "Notes"];
    const rows = filteredEntries.map((e) => {
      const leader = e.team_leaders as TeamLeader | undefined;
      const plantation = leader?.plantations as Plantation | undefined;
      return [e.date, leader?.name || "", `Block ${plantation?.block || ""}`, e.work_status, e.num_workers, e.bunches, e.tons, e.backlogs, e.notes || ""];
    });
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-entries-${currentMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <DashboardLayout>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
          <FadeIn>
            <PageHeader title="Daily Entries" subtitle="View and export all harvest entries" action={null} />
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
      <div className="p-6 max-w-6xl mx-auto">
        <PageHeader
          title="Daily Entries"
          subtitle="View and export all harvest entries"
          action={
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all hover:bg-white/5 bg-[var(--bg-card)] border-[var(--border-default)] text-[var(--text-secondary)]"
            >
              <Download className="w-4 h-4 text-[var(--accent-green)]" />
              Export CSV
            </button>
          }
        />

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          {/* Month Navigator */}
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10 bg-[var(--accent-green-light)] text-[var(--accent-green)] border" style={{ borderColor: "var(--accent-green-border)" }}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-white min-w-[140px] text-center">{formatMonthLabel(currentMonth)}</span>
            <button onClick={nextMonth} className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10 bg-[var(--accent-green-light)] text-[var(--accent-green)] border" style={{ borderColor: "var(--accent-green-border)" }}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Plantation Filter */}
          {plantations.length > 1 && (
            <select
              value={selectedPlantationId}
              onChange={(e) => setSelectedPlantationId(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-sm text-white outline-none border appearance-none bg-[var(--bg-card)] border-[var(--border-default)]"
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
            { label: "Total Entries", value: stats.total, icon: Calendar, color: "var(--accent-amber)" },
            { label: "Work Days", value: stats.workDays, icon: Calendar, color: "var(--accent-green)" },
            { label: "Total Bunches", value: stats.totalBunches, icon: TrendingUp, color: "var(--accent-purple)" },
            { label: "Total Tons", value: stats.totalTons.toFixed(1), icon: Truck, color: "var(--accent-blue)" },
            { label: "Backlogs", value: stats.totalBacklogs, icon: AlertCircle, color: "var(--accent-amber)" },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl p-4 border ${"bg-[var(--bg-card)]"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[var(--text-muted)]">{s.label}</span>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Entries Table */}
        <div className="rounded-2xl border overflow-hidden bg-[var(--bg-card)] border-[var(--border-default)]">
          <div className="px-5 py-3 border-b flex items-center justify-between border-[var(--border-default)]">
            <h3 className="text-sm font-semibold text-white">All Entries</h3>
            <span className="text-xs px-2 py-1 rounded-full bg-[var(--accent-green-light)] text-[var(--accent-green)]">
              {filteredEntries.length} entries
            </span>
          </div>
          {filteredEntries.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-[rgba(255,255,255,0.1)]" />
              <p className="text-sm text-[var(--text-muted)]">No entries for this period.</p>
            </div>
          ) : (
            <div className="rounded-xl">
              {/* Desktop table */}
              <table className="w-full hidden md:table">
                <thead>
                  {["Date", "Leader", "Block", "Status", "Workers", "Bunches", "Tons", "Backlogs", "Notes"].map((h) => (
                    <th key={h} className={`text-left px-5 py-3 text-xs font-medium ${["Date","Bunches","Tons"].includes(h) ? "text-white" : ""} text-[var(--text-muted)]`}>{h}</th>
                  ))}
                </thead>
                <tbody>
                  {filteredEntries.map((e) => {
                    const leader = e.team_leaders as TeamLeader | undefined;
                    const plantation = leader?.plantations as Plantation | undefined;
                    return (
                      <tr key={e.id} className="border-b last:border-b-0" style={{ borderColor: "var(--border-subtle)" }}>
                        <td className="px-5 py-3 text-sm">{e.date}</td>
                        <td className="px-5 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>{leader?.name || "-"}</td>
                        <td className="px-5 py-3 text-sm uppercase" style={{ color: "var(--text-secondary)" }}>
                          {plantation ? `Block ${plantation.block}` : "-"}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${e.work_status === "work" ? "bg-[var(--accent-green-light)] text-white" : "bg-[rgba(239,68,68,0.2)] text-[#f87171]"}`}>
                            {e.work_status === "work" ? "Work" : "No Work"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>{e.num_workers ?? "-"}</td>
                        <td className="px-5 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>{e.bunches ?? "-"}</td>
                        <td className="px-5 py-3 text-sm font-medium">{e.tons ?? "-"}</td>
                        <td className="px-5 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>{e.backlogs ?? "-"}</td>
                        <td className="px-5 py-3 text-sm truncate max-w-[200px]" style={{ color: "var(--text-muted)" }}>{e.notes || "-"}</td>
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
                  return (
                    <div key={e.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white font-medium">{e.date}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${e.work_status === "work" ? "bg-[var(--accent-green-light)] text-white" : "bg-[rgba(239,68,68,0.2)] text-[#f87171]"}`}>
                          {e.work_status === "work" ? "Work" : "No Work"}
                        </span>
                      </div>
                      <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{leader?.name || "-"} &middot; {plantation ? `Block ${plantation.block}` : "-"}</div>
                      <div className="grid grid-cols-3 gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                        <div>Workers: {e.num_workers ?? "-"}</div>
                        <div>Bunches: {e.bunches ?? "-"}</div>
                        <div>Tons: {e.tons ?? "-"}</div>
                        <div>Backlogs: {e.backlogs ?? "-"}</div>
                        {e.notes && <div className="col-span-2 truncate" style={{ color: "var(--text-muted)" }}>Notes: {e.notes}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
