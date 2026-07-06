"use client";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { hasCompletedOnboarding, getAllUserPlantations, getUserTeamLeaders } from "@/lib/onboarding";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import { Users, Calendar, ChevronDown, MapPin, Truck, AlertCircle, BarChart3, Sprout, ClipboardList, Tractor, Clock, TrendingUp } from "lucide-react";
import { Plantation, TeamLeader, TodayStats } from "@/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

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
        console.log("Onboarding not completed, redirecting...");
        router.push("/onboarding/plantation");
        return;
      }
      const allPlantations = await getAllUserPlantations(user.id);
      setPlantations(allPlantations);
      if (allPlantations.length > 0) {
        setSelectedPlantation(allPlantations[0]);
      }
      setChecking(false);
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
        <div className="flex items-center justify-center h-full">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-green)", borderTopColor: "transparent" }} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-full overflow-x-hidden" style={{ backgroundColor: "var(--bg-base)" }}>
        {/* Green Header Banner */}
        <div className="relative" style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)", zIndex: 50 }}>
          {/* Decorative blobs */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20" style={{ backgroundColor: "#34d399" }} />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full opacity-15" style={{ backgroundColor: "#6ee7b7" }} />
          <div className="absolute top-8 right-1/3 w-32 h-32 rounded-full opacity-10" style={{ backgroundColor: "#a7f3d0" }} />

          <div className="relative z-10 px-6 py-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#d1fae5" }}>
                    Palm Plantation Manager
                  </span>
                </div>
                <div className="flex items-center gap-3 mb-1">
                  <Tractor className="w-8 h-8" style={{ color: "#34d399" }} />
                  <h1 className="text-3xl font-bold text-white tracking-tight">
                    {getGreeting()}, {profile?.full_name || (user?.user_metadata as Record<string, string>)?.full_name || user?.email?.split("@")[0] || ""}
                  </h1>
                </div>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
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
                    <MapPin className="w-4 h-4 text-emerald-300" />
                    <div className="text-left">
                      <div className="text-xs text-emerald-200/60">Current Plantation</div>
                      <div className="text-sm font-semibold text-white">{selectedPlantation?.rancangan} - Block {selectedPlantation?.block}</div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-white/50" />
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border overflow-hidden shadow-2xl bg-[var(--bg-card)] border-[var(--border-default)] z-[9999]" style={{ zIndex: 1000 }}>
                      {plantations.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedPlantation(p); setShowDropdown(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all hover:bg-white/5 border-b last:border-b-0"
                          style={{
                            backgroundColor: selectedPlantation?.id === p.id ? "rgba(16,185,129,0.1)" : "transparent",
                            borderColor: "var(--border-subtle)",
                          }}
                        >
                          <MapPin className="w-4 h-4 shrink-0" style={{ color: selectedPlantation?.id === p.id ? "#10b981" : "rgba(255,255,255,0.3)" }} />
                          <div>
                            <div className="text-sm font-medium" style={{ color: selectedPlantation?.id === p.id ? "#10b981" : "white" }}>
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
                  <MapPin className="w-4 h-4 text-emerald-300" />
                  <div className="text-right">
                    <div className="text-xs text-emerald-200/60">Current Plantation</div>
                    <div className="text-sm font-semibold text-white">{selectedPlantation.rancangan} - Block {selectedPlantation.block}</div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="p-6 max-w-6xl mx-auto">
          {/* Plantation Details Card */}
          {selectedPlantation && (
            <div className="rounded-2xl border p-6 mb-6 -mt-4 relative shadow-lg" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-default)" }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--accent-green-light)" }}>
                  <Sprout className="w-5 h-5" style={{ color: "var(--accent-green)" }} />
                </div>
                <h2 className="text-base font-semibold text-white">Plantation Details</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <div>
                  <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Rancangan</div>
                  <div className="text-sm font-medium text-white">{selectedPlantation.rancangan || "-"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Peringkat</div>
                  <div className="text-sm font-medium text-white">{selectedPlantation.peringkat || "-"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Block</div>
                  <div className="text-sm font-medium text-white">{selectedPlantation.block || "-"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Ketua Block</div>
                  <div className="text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>{selectedPlantation.ketua_block || "-"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Biro Ladang</div>
                  <div className="text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>{selectedPlantation.biro_ladang || "-"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Penyelia</div>
                  <div className="text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>{selectedPlantation.penyelia || "-"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Mandor</div>
                  <div className="text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>{selectedPlantation.mandor || "-"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Area</div>
                  <div className="text-sm font-medium text-white">{selectedPlantation.area_hectare ? `${selectedPlantation.area_hectare} ha` : "-"}</div>
                </div>
              </div>
            </div>
          )}

          {/* Today's Overview */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5" style={{ color: "var(--accent-green)" }} />
              <h2 className="text-lg font-semibold text-white">Today's Overview</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Bunches", value: todayStats.bunches, icon: Sprout, color: "var(--accent-purple)", bg: "rgba(139,92,246,0.12)" },
                { label: "Transported", value: `${todayStats.transported} ton`, icon: Truck, color: "var(--accent-green)", bg: "rgba(16,185,129,0.12)" },
                { label: "Backlogs", value: todayStats.backlogs, icon: AlertCircle, color: "var(--accent-amber)", bg: "rgba(245,158,11,0.12)" },
                { label: "Teams Active", value: `${todayStats.teamsActive}/${teamLeaders.length}`, icon: Users, color: "var(--accent-blue)", bg: "rgba(59,130,246,0.12)" },
              ].map((s) => (
                <div key={s.label} className="relative rounded-2xl p-5 border overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-default)" }}>
                  {/* Decorative blob */}
                  <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-30 blur-xl" style={{ backgroundColor: s.color }} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{s.label}</span>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.bg }}>
                        <s.icon className="w-4 h-4" style={{ color: s.color }} />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-white">{s.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Trend */}
          {weeklyTrend.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5" style={{ color: "var(--accent-green)" }} />
                <h2 className="text-lg font-semibold text-white">Weekly Trend</h2>
              </div>
              <div className="rounded-2xl border p-5" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-default)" }}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#10b981" }} />
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
                      <Bar dataKey="bunches" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                      <Bar dataKey="tons" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5" style={{ color: "var(--accent-green)" }} />
              <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/team"
                className="group flex items-center gap-4 rounded-2xl p-5 border transition-all hover:scale-[1.01]"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-default)" }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}>
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white mb-0.5">View Teams</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{teamLeaders.length} team leader{teamLeaders.length !== 1 ? "s" : ""} assigned</div>
                </div>
                <div className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ backgroundColor: "rgba(59,130,246,0.15)", color: "var(--accent-blue)" }}>Open →</div>
              </Link>
              <Link
                href="/reports"
                className="group flex items-center gap-4 rounded-2xl p-5 border transition-all hover:scale-[1.01]"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-default)" }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8b5cf6, #a855f7)" }}>
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white mb-0.5">View Reports</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>Analytics & productivity</div>
                </div>
                <div className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ backgroundColor: "rgba(139,92,246,0.15)", color: "var(--accent-purple)" }}>Open →</div>
              </Link>
            </div>
          </div>

          {/* Recent Entries */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="w-5 h-5" style={{ color: "var(--accent-green)" }} />
              <h2 className="text-lg font-semibold text-white">Recent Entries</h2>
            </div>
            <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-default)" }}>
              {recentEntries.length === 0 ? (
                <div className="p-8 text-center">
                  <ClipboardList className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.1)" }} />
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No entries logged yet — go to Teams to add one.</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                  {recentEntries.map((e) => {
                    const leader = e.team_leaders as any;
                    const plantation = e.plantations as any;
                    const isWork = e.work_status === "work";
                    return (
                      <div key={e.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: isWork ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)" }}>
                            <Users className="w-4 h-4" style={{ color: isWork ? "#10b981" : "#f87171" }} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-white truncate">{leader?.name || "Unknown"}</div>
                            <div className="text-xs" style={{ color: "var(--text-muted)" }}>{plantation ? `Block ${plantation.block}` : "-"} &middot; {e.date}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-sm font-medium text-white">{e.bunches ?? 0} <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>bunches</span></div>
                            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{e.tons ?? 0} ton</div>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: isWork ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: isWork ? "#10b981" : "#f87171" }}>
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
