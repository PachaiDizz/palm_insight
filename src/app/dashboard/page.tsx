"use client";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { hasCompletedOnboarding, getAllUserPlantations, getUserTeamLeaders } from "@/lib/onboarding";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import { Users, Calendar, ChevronDown, ChevronLeft, ChevronRight, MapPin, Truck, AlertCircle, BarChart3, Sprout, ClipboardList, Tractor, Clock, TrendingUp, Plus, ArrowRight } from "lucide-react";
import { Plantation, TeamLeader, TodayStats } from "@/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { FadeIn } from "@/components/ui/Skeleton";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import GuidedTour from "@/components/GuidedTour";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function getFormattedDate() {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  return now.toLocaleDateString("en-MY", options);
}

function getMonthRange(year: number, month: number) {
  const mm = String(month + 1).padStart(2, "0");
  const startDate = `${year}-${mm}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${mm}-${String(lastDay).padStart(2, "0")}`;
  return { startDate, endDate };
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [plantations, setPlantations] = useState<Plantation[]>([]);
  const [selectedPlantation, setSelectedPlantation] = useState<Plantation | null>(null);
  const [teamLeaders, setTeamLeaders] = useState<TeamLeader[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<TodayStats>({ bunches: 0, transported: 0, backlogs: 0, teamsActive: 0 });
  const [todayPulse, setTodayPulse] = useState({ bunches: 0, tons: 0, teamsLogged: 0 });
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<{ date: string; day: string; bunches: number; tons: number }[]>([]);
  const [showTour, setShowTour] = useState(false);
  const [hasEntriesToday, setHasEntriesToday] = useState(true);

  // Monthly filter state — default to current month (timezone-invariant, safe for SSR)
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Date-derived display strings are computed only AFTER mount to avoid an
  // SSR/client hydration mismatch (server runs in UTC, client in local time,
  // so getHours()/toLocaleDateString() can disagree between the two).
  const [greeting, setGreeting] = useState("Welcome");
  const [todayLabel, setTodayLabel] = useState("");
  useEffect(() => {
    setGreeting(getGreeting());
    setTodayLabel(getFormattedDate());
  }, []);

  const prevMonth = useCallback(() => {
    setSelectedMonth((m) => {
      if (m === 0) { setSelectedYear((y) => y - 1); return 11; }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setSelectedMonth((m) => {
      if (m === 11) { setSelectedYear((y) => y + 1); return 0; }
      return m + 1;
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    checkOnboarding();
  }, [user]);

  async function checkOnboarding() {
    if (!user) {
      setChecking(false);
      return;
    }
    try {
      const hasPlantation = await hasCompletedOnboarding(user.id);
      if (!hasPlantation) {
        setPlantations([]);
        setChecking(false);
        return;
      }
      const allPlantations = await getAllUserPlantations(user.id);
      setPlantations(allPlantations);
      if (allPlantations.length > 0) {
        setSelectedPlantation(allPlantations[0]);
      }
      setChecking(false);

      if (allPlantations.length > 0 && !localStorage.getItem("palminsight_tour_seen")) {
        setShowTour(true);
      }
    } catch (error) {
      console.error("Onboarding check failed:", error);
      setChecking(false);
    }
  }

  // Reload data when plantation or month changes
  useEffect(() => {
    if (selectedPlantation && user) {
      loadMonthlyStats(selectedPlantation);
      loadTodayPulse(selectedPlantation);
      loadRecentEntries(selectedPlantation);
      loadMonthlyTrend(selectedPlantation);
    }
  }, [selectedPlantation, selectedMonth, selectedYear]);

  async function loadMonthlyStats(p: Plantation) {
    if (!user || !p) return;
    const { startDate, endDate } = getMonthRange(selectedYear, selectedMonth);
    const leaders = await getUserTeamLeaders(user.id, p.id);
    setTeamLeaders(leaders);

    const { data: entries } = await supabase
      .from("daily_entries")
      .select("bunches, tons, backlogs, team_leader_id, work_status")
      .eq("user_id", user.id)
      .eq("plantation_id", p.id)
      .gte("date", startDate)
      .lte("date", endDate);

    const allEntries = entries || [];
    const workEntries = allEntries.filter((e) => e.work_status === "work");
    const activeLeaders = new Set(workEntries.map((e) => e.team_leader_id));

    setHasEntriesToday(allEntries.length > 0);
    setMonthlyStats({
      bunches: workEntries.reduce((sum, e) => sum + (Number(e.bunches) || 0), 0),
      transported: allEntries.reduce((sum, e) => sum + (Number(e.tons) || 0), 0),
      backlogs: workEntries.reduce((sum, e) => sum + (Number(e.backlogs) || 0), 0),
      teamsActive: activeLeaders.size,
    });
  }

  async function loadTodayPulse(p: Plantation) {
    if (!user || !p) return;
    const today = new Date().toISOString().split("T")[0];

    const { data: todayEntries } = await supabase
      .from("daily_entries")
      .select("bunches, tons, team_leader_id, work_status")
      .eq("user_id", user.id)
      .eq("plantation_id", p.id)
      .eq("date", today);

    const allToday = todayEntries || [];
    const workToday = allToday.filter((e) => e.work_status === "work");
    const teamsLogged = new Set(workToday.map((e) => e.team_leader_id));

    setTodayPulse({
      bunches: workToday.reduce((sum, e) => sum + (Number(e.bunches) || 0), 0),
      tons: allToday.reduce((sum, e) => sum + (Number(e.tons) || 0), 0),
      teamsLogged: teamsLogged.size,
    });
  }

  async function loadRecentEntries(p: Plantation) {
    if (!user || !p) return;
    const { startDate, endDate } = getMonthRange(selectedYear, selectedMonth);

    const { data } = await supabase
      .from("daily_entries")
      .select("*, team_leaders(name), plantations(block)")
      .eq("user_id", user.id)
      .eq("plantation_id", p.id)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false })
      .limit(10);
    setRecentEntries(data || []);
  }

  async function loadMonthlyTrend(p: Plantation) {
    if (!user || !p) return;
    const { startDate, endDate } = getMonthRange(selectedYear, selectedMonth);

    const { data } = await supabase
      .from("daily_entries")
      .select("date, bunches, tons, work_status")
      .eq("user_id", user.id)
      .eq("plantation_id", p.id)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    // Build a map for every day in the month
    const dayMap: Record<string, { date: string; day: string; bunches: number; tons: number }> = {};
    const start = new Date(selectedYear, selectedMonth, 1);
    const end = new Date(selectedYear, selectedMonth + 1, 0);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split("T")[0];
      const dayNum = d.getDate();
      dayMap[key] = { date: String(dayNum), day: String(dayNum), bunches: 0, tons: 0 };
    }

    (data || []).forEach((e: any) => {
      const key = e.date;
      if (!dayMap[key]) return;
      // Tons from all entries (work + no_work) — transport delivers regardless
      dayMap[key].tons += Number(e.tons) || 0;
      // Bunches only from work days
      if (e.work_status === "work") {
        dayMap[key].bunches += Number(e.bunches) || 0;
      }
    });

    setWeeklyTrend(Object.values(dayMap));
  }

  if (checking) {
    return (
      <DashboardLayout>
        <div className="min-h-full overflow-x-hidden p-6 max-w-6xl mx-auto" style={{ backgroundColor: "var(--bg-base)" }}>
          <FadeIn><DashboardSkeleton /></FadeIn>
        </div>
      </DashboardLayout>
    );
  }

  // No Plantation Empty State
  if (plantations.length === 0) {
    return (
      <DashboardLayout>
        <div className="min-h-full overflow-x-hidden flex items-center justify-center p-6" style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="text-center max-w-md">
            <div className="flex justify-center mb-6">
              <svg viewBox="0 0 120 120" className="w-[120px] h-[120px]" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="15" y="70" width="90" height="35" rx="6" stroke="#f59e0b" strokeOpacity="0.2" fill="#f59e0b" fillOpacity="0.05" />
                <path d="M60 15c-3 6-10 12-16 15 6-1 11 2 14 6-7 4-11 10-11 16 2-2 5-4 8-5-2 5 0 10 4 13 1-4 3-7 6-10-2 6 0 11 5 13 1-3 2-7 1-11-4 3-8 4-11 2 4-4 6-10 5-15 5 1 9 1 12-1-6-5-12-11-15-16z" stroke="#f59e0b" fill="#f59e0b" fillOpacity="0.15" />
                <line x1="60" y1="55" x2="60" y2="72" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                <line x1="30" y1="78" x2="30" y2="95" stroke="#f59e0b" strokeOpacity="0.2" strokeDasharray="4 3" />
                <line x1="90" y1="78" x2="90" y2="95" stroke="#f59e0b" strokeOpacity="0.2" strokeDasharray="4 3" />
                <line x1="60" y1="78" x2="60" y2="95" stroke="#f59e0b" strokeOpacity="0.2" strokeDasharray="4 3" />
              </svg>
            </div>

            <h1 className="page-title text-2xl mb-2" style={{ color: "var(--text-primary)" }}>
              Welcome to PalmInsight
            </h1>
            <p className="text-sm leading-relaxed mb-8" style={{ color: "var(--text-secondary)" }}>
              Let&apos;s get your plantation set up. You haven&apos;t added any plantation yet.
              Start by registering your first plantation block, then add your team
              leaders to begin tracking productivity.
            </p>

            <Link
              href="/onboarding/plantation"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ backgroundColor: "var(--accent-primary)", color: "var(--text-on-accent)" }}
            >
              <Plus className="w-4 h-4" />
              Add Your First Plantation
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {showTour && <GuidedTour onClose={() => { setShowTour(false); localStorage.setItem("palminsight_tour_seen", "true"); }} />}
      <div className="min-h-full overflow-x-hidden" style={{ backgroundColor: "var(--bg-base)" }}>
        {/* Header Banner */}
        <div className="relative z-[var(--z-nav)]" style={{ background: "var(--bg-header)" }}>
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20" style={{ backgroundColor: "#f59e0b" }} />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full opacity-15" style={{ backgroundColor: "#fbbf24" }} />
          <div className="absolute top-8 right-1/3 w-32 h-32 rounded-full opacity-10" style={{ backgroundColor: "#fcd34d" }} />

          <div className="relative z-10 px-4 py-6 sm:px-6 sm:py-8 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                    Palm Plantation Manager
                  </span>
                </div>
                <div className="flex items-center gap-3 mb-1">
                  <Tractor className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: "var(--accent-primary)" }} />
                  <h1 className="page-title text-xl sm:text-2xl lg:text-3xl tracking-tight" style={{ color: "var(--text-on-gradient)" }}>
                    {greeting}, {profile?.full_name || (user?.user_metadata as Record<string, string>)?.full_name || user?.email?.split("@")[0] || ""}
                  </h1>
                </div>
                <p className="text-xs sm:text-sm" style={{ color: "var(--text-secondary)" }}>
                  {todayLabel}
                </p>
              </div>

              {/* Plantation Selector */}
              {plantations.length > 1 ? (
                <div className="relative z-[var(--z-dropdown)]">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all hover:bg-[var(--accent-primary-border)]"
                    style={{ backgroundColor: "var(--accent-primary-light)", borderColor: "var(--accent-primary-border)" }}
                  >
                    <MapPin className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
                    <div className="text-left">
                      <div className="text-xs" style={{ color: "var(--text-secondary)" }}>Current Plantation</div>
                      <div className="text-sm font-semibold" style={{ color: "var(--text-on-gradient)" }}>{selectedPlantation?.rancangan} - Block {selectedPlantation?.block}</div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-theme/50" />
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl overflow-hidden shadow-2xl bg-[var(--bg-card)] card-glow z-[var(--z-dropdown)]">
                      {plantations.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedPlantation(p); setShowDropdown(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all hover:bg-[var(--hover-subtle)] border-b last:border-b-0"
                          style={{
                            backgroundColor: selectedPlantation?.id === p.id ? "var(--accent-primary-light)" : "transparent",
                            borderColor: "var(--border-subtle)",
                          }}
                        >
                          <MapPin className="w-4 h-4 shrink-0" style={{ color: selectedPlantation?.id === p.id ? "var(--accent-primary)" : "rgba(255,255,255,0.3)" }} />
                          <div>
                            <div className="text-sm font-medium" style={{ color: selectedPlantation?.id === p.id ? "var(--accent-primary)" : "var(--text-primary)" }}>
                              {p.rancangan} - Block {p.block}
                            </div>
                            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                              Peringkat {p.peringkat}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : selectedPlantation ? (
                <div className="flex items-center gap-3 px-5 py-3 rounded-2xl" style={{ backgroundColor: "var(--accent-primary-light)" }}>
                  <MapPin className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
                  <div className="text-right">
                    <div className="text-xs" style={{ color: "var(--text-secondary)" }}>Current Plantation</div>
                    <div className="text-sm font-semibold" style={{ color: "var(--text-on-gradient)" }}>{selectedPlantation.rancangan} - Block {selectedPlantation.block}</div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 max-w-6xl mx-auto">
          {/* Today Pulse — promoted to a prominent daily signal strip */}
          {selectedPlantation && (
            <div className="card-glow rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" style={{ backgroundColor: "var(--bg-card)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--accent-subtle)" }}>
                  <Clock className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Today&apos;s Pulse</div>
                  <div className="text-sm font-semibold text-theme">Live harvest signal</div>
                </div>
              </div>
              <div className="flex items-center gap-5 sm:gap-7">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-theme">{todayPulse.bunches.toLocaleString("en-MY")}</div>
                  <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Bunches</div>
                </div>
                <div className="w-px h-9" style={{ backgroundColor: "var(--border-subtle)" }} />
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-theme">{Number(todayPulse.tons).toFixed(2)}</div>
                  <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Tons</div>
                </div>
                <div className="w-px h-9" style={{ backgroundColor: "var(--border-subtle)" }} />
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-theme">{todayPulse.teamsLogged}</div>
                  <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Teams Logged</div>
                </div>
              </div>
            </div>
          )}

          {/* Compact Plantation Summary */}
          {selectedPlantation && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm mb-4 sm:mb-6" style={{ color: "var(--text-secondary)" }}>
              <span className="font-semibold text-theme">{selectedPlantation.rancangan}</span>
              <span style={{ color: "var(--text-muted)" }}>·</span>
              <span>Block {selectedPlantation.block}</span>
              <span style={{ color: "var(--text-muted)" }}>·</span>
              <span>{selectedPlantation.area_hectare ? `${selectedPlantation.area_hectare} ha` : "—"}</span>
              <span style={{ color: "var(--text-muted)" }}>·</span>
              <span>Peringkat {selectedPlantation.peringkat || "—"}</span>
            </div>
          )}

          {/* Month Selector */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div />
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)" }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-theme min-w-[140px] text-center">
                {MONTH_NAMES[selectedMonth]} {selectedYear}
              </span>
              <button
                onClick={nextMonth}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)" }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div />
          </div>

          {/* Monthly Overview */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
              <h2 className="section-heading text-lg text-theme">Monthly Overview</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: "Total Bunches", value: monthlyStats.bunches, icon: Sprout, color: "var(--chart-bunches)", glow: true },
                { label: "Transported", value: `${Number(monthlyStats.transported).toFixed(2)} ton`, icon: Truck, color: "var(--chart-tons)", glow: false },
                { label: "Backlogs", value: monthlyStats.backlogs, icon: AlertCircle, color: "var(--accent-red)", glow: false },
                { label: "Teams Active", value: `${monthlyStats.teamsActive}/${teamLeaders.length}`, icon: Users, color: "var(--status-work)", glow: false },
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

            {/* No entries notice */}
            {!hasEntriesToday && (
              <div className="mt-3 card-glow rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3" style={{ backgroundColor: "var(--bg-card)" }}>
                <span className="text-lg">📋</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-theme">No harvest data logged for {MONTH_NAMES[selectedMonth]} {selectedYear}.</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Go to Teams to record entries.</p>
                </div>
                <Link
                  href="/team"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0"
                  style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}
                >
                  Go to Teams
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Monthly Trend Chart */}
          {weeklyTrend.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <BarChart3 className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
                <h2 className="section-heading text-base sm:text-lg text-theme">Monthly Trend</h2>
              </div>
              <div className="card-glow rounded-2xl p-3 sm:p-5" style={{ backgroundColor: "var(--bg-card)" }}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "var(--chart-bunches)" }} />
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Bunches</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "var(--chart-tons)" }} />
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Tons</span>
                  </div>
                </div>
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyTrend} barGap={2}>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 10 }} interval="preserveStartEnd" minTickGap={12} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 10 }} width={35} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)", borderRadius: 12, fontSize: 12 }}
                        cursor={{ fill: "rgba(255,255,255,0.03)" }}
                      />
                      <Bar dataKey="bunches" fill="var(--chart-bunches)" radius={[4, 4, 0, 0]} maxBarSize={20} />
                      <Bar dataKey="tons" fill="var(--chart-tons)" radius={[4, 4, 0, 0]} maxBarSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <TrendingUp className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
              <h2 className="section-heading text-base sm:text-lg text-theme">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Link
                href="/team"
                className="group card-glow flex items-center gap-3 sm:gap-4 rounded-2xl p-4 sm:p-5 transition-all hover:scale-[1.01] min-h-[44px]"
                style={{ backgroundColor: "var(--bg-card)" }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
                  <Users className="w-6 h-6 text-theme" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-theme mb-0.5">View Teams</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{teamLeaders.length} team leader{teamLeaders.length !== 1 ? "s" : ""} assigned</div>
                </div>
                <div className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>Open →</div>
              </Link>
              <Link
                href="/reports"
                className="group card-glow flex items-center gap-3 sm:gap-4 rounded-2xl p-4 sm:p-5 transition-all hover:scale-[1.01] min-h-[44px]"
                style={{ backgroundColor: "var(--bg-card)" }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
                  <BarChart3 className="w-6 h-6 text-theme" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-theme mb-0.5">View Reports</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>Analytics & productivity</div>
                </div>
                <div className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>Open →</div>
              </Link>
            </div>
          </div>

          {/* Recent Entries */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <ClipboardList className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
              <h2 className="section-heading text-base sm:text-lg text-theme">Recent Entries — {MONTH_NAMES[selectedMonth]} {selectedYear}</h2>
            </div>
            <div className="card-glow rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)" }}>
              {recentEntries.length === 0 ? (
                <div className="p-6 sm:p-8 text-center">
                  <ClipboardList className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No entries for {MONTH_NAMES[selectedMonth]} {selectedYear} — go to Teams to add one.</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                  {recentEntries.map((e) => {
                    const leader = e.team_leaders as any;
                    const plantation = e.plantations as any;
                    const isWork = e.work_status === "work";
                    return (
                      <div key={e.id} className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-3.5 hover:bg-[var(--hover-subtle)] transition-colors">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: isWork ? "var(--status-work-bg)" : "var(--status-no-work-bg)" }}>
                            <Users className="w-4 h-4" style={{ color: isWork ? "var(--status-work)" : "var(--status-no-work)" }} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-theme truncate">{leader?.name || "Unknown"}</div>
                            <div className="text-xs" style={{ color: "var(--text-muted)" }}>{plantation ? `Block ${plantation.block}` : "-"} &middot; {e.date}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
                          <div className="text-right hidden sm:block">
                            <div className="text-sm font-medium text-theme">{(e.bunches ?? 0).toLocaleString("en-MY")} <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>bunches</span></div>
                            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{e.tons != null ? Number(e.tons).toFixed(2) : "0.00"} ton</div>
                          </div>
                          <Badge status={isWork ? "work" : "no-work"} size="sm" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Click outside to close dropdown */}
        {showDropdown && (
          <div className="fixed inset-0 z-[var(--z-overlay)]" onClick={() => setShowDropdown(false)} />
        )}
      </div>
    </DashboardLayout>
  );
}
