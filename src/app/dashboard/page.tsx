"use client";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { hasCompletedOnboarding, getAllUserPlantations, getUserTeamLeaders } from "@/lib/onboarding";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import { Users, Calendar, ChevronDown, MapPin, Truck, AlertCircle, BarChart3, Sprout, ClipboardList, Tractor, Clock, TrendingUp, Plus, ArrowRight } from "lucide-react";
import { Plantation, TeamLeader, TodayStats } from "@/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { FadeIn } from "@/components/ui/Skeleton";
import GuidedTour from "@/components/GuidedTour";

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

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [plantations, setPlantations] = useState<Plantation[]>([]);
  const [selectedPlantation, setSelectedPlantation] = useState<Plantation | null>(null);
  const [teamLeaders, setTeamLeaders] = useState<TeamLeader[]>([]);
  const [todayStats, setTodayStats] = useState<TodayStats>({ bunches: 0, transported: 0, backlogs: 0, teamsActive: 0 });
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<{ date: string; day: string; bunches: number; tons: number }[]>([]);
  const [showTour, setShowTour] = useState(false);
  const [hasEntriesToday, setHasEntriesToday] = useState(true);

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

      // Show guided tour for first-time users
      if (allPlantations.length > 0 && !localStorage.getItem("palminsight_tour_seen")) {
        setShowTour(true);
      }
    } catch (error) {
      console.error("Onboarding check failed:", error);
      setChecking(false);
    }
  }

  useEffect(() => {
    if (selectedPlantation && user) {
      loadTodayStats(selectedPlantation);
      loadRecentEntries();
      loadWeeklyTrend();
    }
  }, [selectedPlantation]);

  // Fallback: if checking never resolves, show dashboard with empty data
  useEffect(() => {
    if (!checking && !selectedPlantation && user) {
      console.log("No plantation found, showing empty dashboard");
    }
  }, [checking, selectedPlantation, user]);

  async function loadTodayStats(p: Plantation) {
    if (!user || !p) return;
    const today = getTodayString();
    const leaders = await getUserTeamLeaders(user.id, p.id);
    setTeamLeaders(leaders);

    const { data: todayEntries } = await supabase
      .from("daily_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("plantation_id", p.id)
      .eq("date", today);

    const entries = todayEntries || [];
    const activeLeaders = new Set(entries.filter((e) => e.work_status === "work").map((e) => e.team_leader_id));

    setHasEntriesToday(entries.length > 0);
    setTodayStats({
      bunches: entries.reduce((sum, e) => sum + (e.bunches || 0), 0),
      transported: entries.reduce((sum, e) => sum + (e.tons || 0), 0),
      backlogs: entries.reduce((sum, e) => sum + (e.backlogs || 0), 0),
      teamsActive: activeLeaders.size,
    });
  }

  async function loadRecentEntries() {
    if (!user) return;
    const { data } = await supabase
      .from("daily_entries")
      .select("*, team_leaders(name), plantations(block)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    setRecentEntries(data || []);
  }

  async function loadWeeklyTrend() {
    if (!user) return;
    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
    const dateStr = sixDaysAgo.toISOString().split("T")[0];

    const { data } = await supabase
      .from("daily_entries")
      .select("date, bunches, tons")
      .eq("user_id", user.id)
      .gte("date", dateStr)
      .order("date", { ascending: true });

    const dayMap: Record<string, { date: string; day: string; bunches: number; tons: number }> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
      dayMap[key] = { date: dayLabel, day: dayLabel, bunches: 0, tons: 0 };
    }

    (data || []).forEach((e: any) => {
      const key = e.date;
      if (dayMap[key]) {
        dayMap[key].bunches += e.bunches || 0;
        dayMap[key].tons += e.tons || 0;
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
            {/* SVG Illustration */}
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
              style={{ backgroundColor: "#f59e0b", color: "#050f05" }}
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
        {/* Green Header Banner */}
        <div className="relative" style={{ background: "var(--bg-header)", zIndex: 50 }}>
          {/* Decorative blobs */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20" style={{ backgroundColor: "#818cf8" }} />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full opacity-15" style={{ backgroundColor: "#a5b4fc" }} />
          <div className="absolute top-8 right-1/3 w-32 h-32 rounded-full opacity-10" style={{ backgroundColor: "#c7d2fe" }} />

          <div className="relative z-10 px-4 py-6 sm:px-6 sm:py-8 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#d1fae5" }}>
                    Palm Plantation Manager
                  </span>
                </div>
                <div className="flex items-center gap-3 mb-1">
                  <Tractor className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: "#fbbf24" }} />
                  <h1 className="page-title text-xl sm:text-2xl lg:text-3xl tracking-tight" style={{ color: "var(--text-on-gradient)" }}>
                    {getGreeting()}, {profile?.full_name || (user?.user_metadata as Record<string, string>)?.full_name || user?.email?.split("@")[0] || ""}
                  </h1>
                </div>
                <p className="text-xs sm:text-sm" style={{ color: "var(--text-secondary)" }}>
                  {getFormattedDate()}
                </p>
              </div>

          {/* Plantation Selector */}
          {plantations.length > 1 ? (
            <div className="relative z-[9999]">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all hover:bg-white/10"
                style={{ backgroundColor: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)" }}
              >
                    <MapPin className="w-4 h-4 text-amber-300" />
                    <div className="text-left">
                      <div className="text-xs text-amber-200/60">Current Plantation</div>
                      <div className="text-sm font-semibold" style={{ color: "var(--text-on-gradient)" }}>{selectedPlantation?.rancangan} - Block {selectedPlantation?.block}</div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-theme/50" />
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl overflow-hidden shadow-2xl bg-[var(--bg-card)] card-glow z-[9999]" style={{ zIndex: 1000 }}>
                      {plantations.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedPlantation(p); setShowDropdown(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all hover:bg-white/5 border-b last:border-b-0"
                          style={{
                            backgroundColor: selectedPlantation?.id === p.id ? "rgba(99,102,241,0.1)" : "transparent",
                            borderColor: "var(--border-subtle)",
                          }}
                        >
                          <MapPin className="w-4 h-4 shrink-0" style={{ color: selectedPlantation?.id === p.id ? "#f59e0b" : "rgba(255,255,255,0.3)" }} />
                          <div>
                            <div className="text-sm font-medium" style={{ color: selectedPlantation?.id === p.id ? "#f59e0b" : "var(--text-primary)" }}>
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
                <div className="flex items-center gap-3 px-5 py-3 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                  <MapPin className="w-4 h-4 text-amber-300" />
                  <div className="text-right">
                    <div className="text-xs text-amber-200/60">Current Plantation</div>
                    <div className="text-sm font-semibold" style={{ color: "var(--text-on-gradient)" }}>{selectedPlantation.rancangan} - Block {selectedPlantation.block}</div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 max-w-6xl mx-auto">
          {/* Plantation Details Card */}
          {selectedPlantation && (
            <div className="card-glow rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 -mt-4 relative shadow-lg" style={{ backgroundColor: "var(--bg-card)" }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--accent-subtle)" }}>
                  <Sprout className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
                </div>
                <h2 className="section-heading text-base" style={{ color: "var(--text-primary)" }}>Plantation Details</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
                <div>
                  <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Rancangan</div>
                  <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{selectedPlantation.rancangan || "-"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Peringkat</div>
                  <div className="text-sm font-medium text-theme">{selectedPlantation.peringkat || "-"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Block</div>
                  <div className="text-sm font-medium text-theme">{selectedPlantation.block || "-"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Ketua Block</div>
                  <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{selectedPlantation.ketua_block || "-"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Biro Ladang</div>
                  <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{selectedPlantation.biro_ladang || "-"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Penyelia</div>
                  <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{selectedPlantation.penyelia || "-"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Mandor</div>
                  <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{selectedPlantation.mandor || "-"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Area</div>
                  <div className="text-sm font-medium text-theme">{selectedPlantation.area_hectare ? `${selectedPlantation.area_hectare} ha` : "-"}</div>
                </div>
              </div>
            </div>
          )}

          {/* Today's Overview */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
              <h2 className="section-heading text-lg text-theme">Today's Overview</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { label: "Total Bunches", value: todayStats.bunches, icon: Sprout, color: "var(--accent-purple)", bg: "rgba(139,92,246,0.12)" },
                { label: "Transported", value: `${Number(todayStats.transported).toFixed(2)} ton`, icon: Truck, color: "var(--accent-primary)", bg: "var(--accent-subtle)" },
                { label: "Backlogs", value: todayStats.backlogs, icon: AlertCircle, color: "var(--accent-amber)", bg: "rgba(245,158,11,0.12)" },
                { label: "Teams Active", value: `${todayStats.teamsActive}/${teamLeaders.length}`, icon: Users, color: "var(--accent-blue)", bg: "rgba(59,130,246,0.12)" },
              ].map((s) => (
                <div key={s.label} className="card-glow relative rounded-2xl p-3 sm:p-5 overflow-hidden" style={{ backgroundColor: "var(--bg-card)" }}>
                  {/* Decorative blob */}
                  <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-30 blur-xl" style={{ backgroundColor: s.color }} />
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

            {/* No entries today notice */}
            {!hasEntriesToday && (
              <div className="mt-3 card-glow rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3" style={{ backgroundColor: "var(--bg-card)" }}>
                <span className="text-lg">📋</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-theme">No harvest data logged today.</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Go to Teams to record today&apos;s entries.</p>
                </div>
                <Link
                  href="/team"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0"
                  style={{ backgroundColor: "rgba(245,158,11,0.12)", color: "#f59e0b" }}
                >
                  Go to Teams
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Weekly Trend */}
          {weeklyTrend.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <BarChart3 className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
                <h2 className="section-heading text-base sm:text-lg text-theme">Weekly Trend</h2>
              </div>
              <div className="card-glow rounded-2xl p-3 sm:p-5" style={{ backgroundColor: "var(--bg-card)" }}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#f59e0b" }} />
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Bunches</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#3b82f6" }} />
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Tons</span>
                  </div>
                </div>
                <div style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyTrend} barGap={2}>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 11 }} width={35} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: 12, fontSize: 12 }}
                        cursor={{ fill: "rgba(255,255,255,0.03)" }}
                      />
                      <Bar dataKey="bunches" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={28} />
                      <Bar dataKey="tons" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={28} />
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
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}>
                  <Users className="w-6 h-6 text-theme" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-theme mb-0.5">View Teams</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{teamLeaders.length} team leader{teamLeaders.length !== 1 ? "s" : ""} assigned</div>
                </div>
                <div className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ backgroundColor: "rgba(59,130,246,0.15)", color: "var(--accent-blue)" }}>Open →</div>
              </Link>
              <Link
                href="/reports"
                className="group card-glow flex items-center gap-3 sm:gap-4 rounded-2xl p-4 sm:p-5 transition-all hover:scale-[1.01] min-h-[44px]"
                style={{ backgroundColor: "var(--bg-card)" }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8b5cf6, #a855f7)" }}>
                  <BarChart3 className="w-6 h-6 text-theme" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-theme mb-0.5">View Reports</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>Analytics & productivity</div>
                </div>
                <div className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ backgroundColor: "rgba(139,92,246,0.15)", color: "var(--accent-purple)" }}>Open →</div>
              </Link>
            </div>
          </div>

          {/* Recent Entries */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <ClipboardList className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
              <h2 className="section-heading text-base sm:text-lg text-theme">Recent Entries</h2>
            </div>
            <div className="card-glow rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)" }}>
              {recentEntries.length === 0 ? (
                <div className="p-6 sm:p-8 text-center">
                  <ClipboardList className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No entries logged yet — go to Teams to add one.</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                  {recentEntries.map((e) => {
                    const leader = e.team_leaders as any;
                    const plantation = e.plantations as any;
                    const isWork = e.work_status === "work";
                    return (
                      <div key={e.id} className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-3.5 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: isWork ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)" }}>
                            <Users className="w-4 h-4" style={{ color: isWork ? "#f59e0b" : "#f87171" }} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-theme truncate">{leader?.name || "Unknown"}</div>
                            <div className="text-xs" style={{ color: "var(--text-muted)" }}>{plantation ? `Block ${plantation.block}` : "-"} &middot; {e.date}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
                          <div className="text-right hidden sm:block">
                            <div className="text-sm font-medium text-theme">{e.bunches ?? 0} <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>bunches</span></div>
                            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{e.tons != null ? Number(e.tons).toFixed(2) : "0.00"} ton</div>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: isWork ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: isWork ? "#22c55e" : "#f87171" }}>
                            {isWork ? "Work" : "No Work"}
                          </span>
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
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
        )}
      </div>
    </DashboardLayout>
  );
}
