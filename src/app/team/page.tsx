"use client";
import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";
import { hasCompletedOnboarding, getAllUserPlantations } from "@/lib/onboarding";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, Trash2, Users, Phone, MapPin, Edit2, AlertCircle, BarChart3, TrendingUp, ChevronLeft, Calendar, ChevronDown, Truck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Plantation, TeamLeader, DailyEntry, BijiRelai } from "@/types";
import BlockSelector from "@/components/team/BlockSelector";
import LeaderOrgChart from "@/components/team/LeaderOrgChart";
import EntryForm from "@/components/team/EntryForm";
import FilterPanel from "@/components/team/FilterPanel";
import AddLeaderModal from "@/components/team/AddLeaderModal";
import EditEntryModal from "@/components/team/EditEntryModal";
import BijiRelaiModal from "@/components/team/BijiRelaiModal";
import EmptyLeaderState from "@/components/team/EmptyLeaderState";
import Toast from "@/components/ui/Toast";
import { BlockCardSkeleton, FadeIn } from "@/components/ui/Skeleton";

const defaultStats = { totalEntries: 0, workDays: 0, totalBunches: 0, totalTons: 0, totalBacklogs: 0, avgBunches: 0, avgTons: "0", avgWorkers: 0 };
const defaultDetailStats = { totalEntries: 0, workDays: 0, noWorkDays: 0, totalBunches: 0, totalTons: 0, totalBacklogs: 0, avgBunches: 0, avgTons: "0", avgWorkers: 0 };

function normalizeDate(dateStr: string): string {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  } catch {}
  return dateStr;
}

export default function TeamsPage() {
  return (
    <Suspense fallback={<DashboardLayout><div className="p-6 max-w-6xl mx-auto"><FadeIn><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{[1,2,3,4].map(i => <BlockCardSkeleton key={i} />)}</div></FadeIn></div></DashboardLayout>}>
      <TeamsContent />
    </Suspense>
  );
}

function TeamsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plantations, setPlantations] = useState<Plantation[]>([]);
  const [teamLeaders, setTeamLeaders] = useState<TeamLeader[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(searchParams.get("block"));
  const [selectedLeader, setSelectedLeader] = useState<TeamLeader | null>(null);
  const [leaderEntries, setLeaderEntries] = useState<DailyEntry[]>([]);
  const [leaderStats, setLeaderStats] = useState(defaultStats);
  const [leaderLatestEntries, setLeaderLatestEntries] = useState<Record<string, DailyEntry>>({});

  const [workStatus, setWorkStatus] = useState("work");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [numWorkers, setNumWorkers] = useState("");
  const [lot, setLot] = useState("");
  const [bunches, setBunches] = useState("");
  const [tons, setTons] = useState("");
  const [backlogs, setBacklogs] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterMode, setFilterMode] = useState<"single" | "range">("single");
  const [filterDate, setFilterDate] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const [viewingLeader, setViewingLeader] = useState<TeamLeader | null>(null);
  const [detailEntries, setDetailEntries] = useState<DailyEntry[]>([]);
  const [detailFilteredEntries, setDetailFilteredEntries] = useState<DailyEntry[]>([]);
  const [detailStats, setDetailStats] = useState(defaultDetailStats);
  const [detailMonth, setDetailMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [detailDateFrom, setDetailDateFrom] = useState("");
  const [detailDateTo, setDetailDateTo] = useState("");
  const [showDetailEditModal, setShowDetailEditModal] = useState(false);
  const [detailEditEntry, setDetailEditEntry] = useState<DailyEntry | null>(null);
  const [detailEditDate, setDetailEditDate] = useState("");
  const [detailEditWorkStatus, setDetailEditWorkStatus] = useState("work");
  const [detailEditNumWorkers, setDetailEditNumWorkers] = useState("");
  const [detailEditLot, setDetailEditLot] = useState("");
  const [detailEditBunches, setDetailEditBunches] = useState("");
  const [detailEditTons, setDetailEditTons] = useState("");
  const [detailEditBacklogs, setDetailEditBacklogs] = useState("");
  const [detailEditNotes, setDetailEditNotes] = useState("");
  const [detailSaving, setDetailSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [blockLastEntries, setBlockLastEntries] = useState<Record<string, string | null>>({});
  const [blockWorkersToday, setBlockWorkersToday] = useState<Record<string, number>>({});

  const [bijiRelaiEntries, setBijiRelaiEntries] = useState<BijiRelai[]>([]);
  const [bijiRelaiDate, setBijiRelaiDate] = useState(new Date().toISOString().split("T")[0]);
  const [bijiRelaiTons, setBijiRelaiTons] = useState("");
  const [bijiRelaiSaving, setBijiRelaiSaving] = useState(false);
  const [bijiRelaiSavedId, setBijiRelaiSavedId] = useState<string | null>(null);
  const [showBijiRelaiModal, setShowBijiRelaiModal] = useState(false);

  // --- Browser back-button: track previous block for popstate logic ---
  const prevBlockRef = useRef<string | null>(selectedBlock);

  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    if (!user) return;
    const hasPlantation = await hasCompletedOnboarding(user.id);
    if (!hasPlantation) { router.push("/onboarding/plantation"); return; }
    const allP = await getAllUserPlantations(user.id);
    setPlantations(allP.sort((a: Plantation, b: Plantation) => (parseInt(a.block) || 0) - (parseInt(b.block) || 0)));
    const { data } = await supabase.from("team_leaders").select("*, plantations(id, rancangan, peringkat, block)").eq("user_id", user.id).order("created_at", { ascending: false });
    setTeamLeaders((data || []) as TeamLeader[]);
    loadBlockStats(user.id);
  }

  async function loadBlockStats(userId: string) {
    // Last entry date per plantation
    const { data: lastData } = await supabase
      .from("daily_entries")
      .select("plantation_id, date")
      .eq("user_id", userId)
      .order("date", { ascending: false });
    const lastMap: Record<string, string | null> = {};
    (lastData || []).forEach((e: any) => {
      if (e.plantation_id && !lastMap[e.plantation_id]) {
        lastMap[e.plantation_id] = e.date;
      }
    });
    setBlockLastEntries(lastMap);

    // Workers today per plantation
    const today = new Date().toISOString().split("T")[0];
    const { data: todayData } = await supabase
      .from("daily_entries")
      .select("plantation_id, num_workers")
      .eq("user_id", userId)
      .eq("date", today);
    const workersMap: Record<string, number> = {};
    (todayData || []).forEach((e: any) => {
      if (e.plantation_id) {
        workersMap[e.plantation_id] = (workersMap[e.plantation_id] || 0) + (e.num_workers || 0);
      }
    });
    setBlockWorkersToday(workersMap);
  }

  async function loadLeaderData(leaderId: string) {
    const { data } = await supabase.from("daily_entries").select("*").eq("team_leader_id", leaderId).order("date", { ascending: false });
    const entries = (data || []) as DailyEntry[];
    setLeaderEntries(entries);
    const workDays = entries.filter((e) => e.work_status === "work");
    const totalBunches = workDays.reduce((sum, e) => sum + (Number(e.bunches) || 0), 0);
    const totalTons = entries.reduce((sum, e) => sum + (Number(e.tons) || 0), 0);
    const totalBacklogs = workDays.reduce((sum, e) => sum + (Number(e.backlogs) || 0), 0);
    const totalWorkers = workDays.reduce((sum, e) => sum + (Number(e.num_workers) || 0), 0);
    setLeaderStats({
      totalEntries: entries.length, workDays: workDays.length, totalBunches, totalTons, totalBacklogs,
      avgBunches: workDays.length > 0 ? Math.round(totalBunches / workDays.length) : 0,
      avgTons: workDays.length > 0 ? (totalTons / workDays.length).toFixed(2) : "0.00",
      avgWorkers: workDays.length > 0 ? Math.round(totalWorkers / workDays.length) : 0,
    });
  }

  async function loadOrgChartData(blockId: string) {
    const leaders = teamLeaders.filter((l) => l.plantation_id === blockId);
    const leaderIds = leaders.map((l) => l.id);
    if (leaderIds.length === 0) { setLeaderLatestEntries({}); return; }
    const { data } = await supabase.from("daily_entries").select("*").in("team_leader_id", leaderIds).order("date", { ascending: false });
    const latestMap: Record<string, DailyEntry> = {};
    (data || []).forEach((entry: DailyEntry) => { if (!latestMap[entry.team_leader_id]) latestMap[entry.team_leader_id] = entry; });
    setLeaderLatestEntries(latestMap);
  }

  async function loadBijiRelai(blockId: string) {
    if (!user) return;
    const { data } = await supabase
      .from("biji_relai")
      .select("*")
      .eq("user_id", user.id)
      .eq("plantation_id", blockId)
      .order("date", { ascending: false });
    setBijiRelaiEntries((data || []) as BijiRelai[]);
  }

  const getFilteredEntries = useCallback(() => {
    if (!selectedLeader) return [];
    let filtered: DailyEntry[] = leaderEntries;
    if (filterMode === "single" && filterDate) filtered = filtered.filter((e) => e.date === filterDate);
    else if (filterMode === "range" && filterFrom && filterTo) filtered = filtered.filter((e) => e.date >= filterFrom && e.date <= filterTo);
    else if (filterMode === "range" && filterFrom) filtered = filtered.filter((e) => e.date >= filterFrom);
    else if (filterMode === "range" && filterTo) filtered = filtered.filter((e) => e.date <= filterTo);
    return filtered;
  }, [leaderEntries, selectedLeader, filterMode, filterDate, filterFrom, filterTo]);

  const filteredEntries = getFilteredEntries();
  const blockLeaders = selectedBlock ? teamLeaders.filter((l) => l.plantation_id === selectedBlock) : [];
  const sortedLeaders = [...blockLeaders].sort((a, b) => a.name.localeCompare(b.name));
  const selectedP = plantations.find((p) => p.id === selectedBlock);

  // --- Add Entry: push history entry so back returns to org chart ---
  const handleSelectLeader = (leader: TeamLeader) => {
    window.history.pushState({ blockId: leader.plantation_id, level: "leader" }, "");
    setSelectedLeader(leader);
    setWorkStatus("work");
    setDate(new Date().toISOString().split("T")[0]);
    setNumWorkers(""); setLot(""); setBunches(""); setTons(""); setBacklogs(""); setNotes("");
    setSavedId(null);
    loadLeaderData(leader.id);
  };

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedLeader) { setToast({ type: "error", message: "No team leader selected." }); return; }
    setSaving(true); setToast(null);
    const existingEntry = leaderEntries.find((entry) => entry.date === date && entry.team_leader_id === selectedLeader.id);
    const entryData = {
      work_status: workStatus, date,
      num_workers: workStatus === "work" ? parseInt(numWorkers) || 0 : null,
      lot: workStatus === "work" ? (lot || null) : null,
      bunches: workStatus === "work" ? parseInt(bunches) || 0 : null,
      tons: parseFloat(tons) || 0,
      backlogs: workStatus === "work" ? parseInt(backlogs) || 0 : null,
      notes: notes || null,
    };
    if (existingEntry) {
      const { error } = await supabase.from("daily_entries").update(entryData).eq("id", existingEntry.id);
      if (error) { setSaving(false); setToast({ type: "error", message: error.message || "Failed to update entry." }); return; }
    } else {
      const { error } = await supabase.from("daily_entries").insert({ user_id: user.id, team_leader_id: selectedLeader.id, plantation_id: selectedLeader.plantation_id, ...entryData });
      if (error) { setSaving(false); setToast({ type: "error", message: error.message || "Failed to save entry." }); return; }
    }
    setSavedId(`de_${Date.now()}`);
    setNumWorkers(""); setLot(""); setBunches(""); setTons(""); setBacklogs(""); setNotes("");
    await loadLeaderData(selectedLeader.id);
    await loadOrgChartData(selectedLeader.plantation_id);
    setToast({ type: "success", message: existingEntry ? "Entry updated!" : "Entry saved successfully!" });
    setSaving(false);
  };

  const handleSubmitBijiRelai = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedBlock) return;
    setBijiRelaiSaving(true);
    const entryData = {
      user_id: user.id,
      plantation_id: selectedBlock,
      date: bijiRelaiDate,
      tons: bijiRelaiTons ? parseFloat(bijiRelaiTons) : null,
    };
    const existing = bijiRelaiEntries.find((e) => e.date === bijiRelaiDate && e.plantation_id === selectedBlock);
    if (existing) {
      const { error } = await supabase.from("biji_relai").update(entryData).eq("id", existing.id);
      if (error) { setBijiRelaiSaving(false); setToast({ type: "error", message: error.message || "Failed to update." }); return; }
    } else {
      const { error } = await supabase.from("biji_relai").insert(entryData);
      if (error) { setBijiRelaiSaving(false); setToast({ type: "error", message: error.message || "Failed to save." }); return; }
    }
    setBijiRelaiSaving(false);
    setBijiRelaiSavedId("saved");
    loadBijiRelai(selectedBlock);
    setToast({ type: "success", message: existing ? "Biji Relai updated!" : "Biji Relai saved!" });
  };

  const handleEditBijiRelai = async (entry: BijiRelai) => {
    if (!user) return;
    const { error } = await supabase.from("biji_relai").update({ date: entry.date, tons: entry.tons }).eq("id", entry.id);
    if (error) { setToast({ type: "error", message: error.message || "Failed to update." }); return; }
    loadBijiRelai(selectedBlock!);
    setToast({ type: "success", message: "Biji Relai updated." });
  };

  const handleDeleteBijiRelai = async (id: string) => {
    if (!confirm("Delete this Biji Relai entry?")) return;
    await supabase.from("biji_relai").delete().eq("id", id);
    if (selectedBlock) loadBijiRelai(selectedBlock);
    setToast({ type: "success", message: "Biji Relai entry deleted." });
  };

  const handleOpenBijiRelai = () => {
    if (selectedBlock) loadBijiRelai(selectedBlock);
    setBijiRelaiDate(new Date().toISOString().split("T")[0]);
    setBijiRelaiTons("");
    setBijiRelaiSavedId(null);
    setShowBijiRelaiModal(true);
  };

  const handleEditEntry = (entry: DailyEntry) => {
    setWorkStatus(entry.work_status || "work");
    setDate(entry.date || date);
    setNumWorkers(entry.work_status === "work" ? String(entry.num_workers || "") : "");
    setLot(entry.lot || "");
    setBunches(entry.work_status === "work" ? String(entry.bunches || "") : "");
    setTons(entry.tons != null ? String(entry.tons) : "");
    setBacklogs(entry.work_status === "work" ? String(entry.backlogs || "") : "");
    setNotes(entry.notes || "");
    setSavedId(`de_${Date.now()}`);
    setShowFilterPanel(false);
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm("Delete this entry? This action cannot be undone.")) return;
    await supabase.from("daily_entries").delete().eq("id", id);
    if (selectedLeader) await loadLeaderData(selectedLeader.id);
    setToast({ type: "success", message: "Entry deleted." });
  };

  const handleSaveLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const pid = selectedBlock || plantations[0]?.id;
    if (!pid) return;
    setSaving(true); setToast(null);
    const { error } = await supabase.from("team_leaders").insert({ user_id: user.id, plantation_id: pid, name, phone: phone || null });
    if (!error) {
      setShowModal(false); setName(""); setPhone("");
      await loadData();
      if (selectedBlock) await loadOrgChartData(selectedBlock);
      setToast({ type: "success", message: "Team leader added!" });
    } else {
      setToast({ type: "error", message: error.message || "Failed to add leader." });
    }
    setSaving(false);
  };

  const handleDeleteLeader = async (id: string) => {
    if (!confirm("Remove this team leader? This will also remove all their daily entries.")) return;
    await supabase.from("team_leaders").delete().eq("id", id);
    if (selectedLeader?.id === id) { setSelectedLeader(null); setLeaderEntries([]); setLeaderStats(defaultStats); }
    await loadData();
    if (selectedBlock) await loadOrgChartData(selectedBlock);
    setToast({ type: "success", message: "Leader removed." });
  };

  // Back from org chart → block selection page
  const handleBackToBlocks = () => {
    setSelectedBlock(null); setSelectedLeader(null); setLeaderEntries([]); setLeaderStats(defaultStats); setLeaderLatestEntries({});
    router.push("/team");
  };

  // Back from Add Entry or View Details → org chart (just pop state)
  const handleBackToOrgChart = () => {
    window.history.back();
  };

  const handleClearFilter = () => { setFilterDate(""); setFilterFrom(""); setFilterTo(""); setShowFilterPanel(false); };

  useEffect(() => { if (toast) { const timer = setTimeout(() => setToast(null), 3000); return () => clearTimeout(timer); } }, [toast]);
  useEffect(() => {
    if (selectedBlock) {
      loadOrgChartData(selectedBlock);
      loadBijiRelai(selectedBlock);
      setBijiRelaiDate(new Date().toISOString().split("T")[0]);
      setBijiRelaiTons("");
      setBijiRelaiSavedId(null);
    }
  }, [selectedBlock]);

  // --- Browser back-button handler ---
  useEffect(() => {
    const handlePopState = () => {
      const currentBlock = new URLSearchParams(window.location.search).get("block");
      const prevBlock = prevBlockRef.current;

      if (selectedLeader || viewingLeader) {
        // Was at leader level → pop back to org chart
        setSelectedLeader(null); setLeaderEntries([]); setLeaderStats(defaultStats);
        setViewingLeader(null); setDetailEntries([]); setDetailFilteredEntries([]); setDetailStats(defaultDetailStats);
        if (currentBlock) setSelectedBlock(currentBlock);
      } else if (prevBlock && !currentBlock) {
        // Was at org chart → pop back to block selection
        setSelectedBlock(null); setLeaderLatestEntries({});
      } else if (currentBlock && currentBlock !== prevBlock) {
        // URL changed to a different block or initial load
        setSelectedBlock(currentBlock); setSelectedLeader(null); setLeaderEntries([]); setLeaderStats(defaultStats);
        loadOrgChartData(currentBlock);
      }
      prevBlockRef.current = currentBlock;
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [selectedLeader, viewingLeader]);

  // Sync selectedBlock from URL (for initial load and direct URL navigation)
  useEffect(() => {
    const blockParam = searchParams.get("block");
    // Skip if this is a back-nav popstate already handled above
    if (blockParam === prevBlockRef.current) return;
    if (blockParam !== selectedBlock) {
      setSelectedBlock(blockParam); setSelectedLeader(null); setLeaderEntries([]); setLeaderStats(defaultStats);
      if (blockParam) loadOrgChartData(blockParam);
    }
    prevBlockRef.current = blockParam;
  }, [searchParams.get("block")]);

  const loadDetailData = async (leader: TeamLeader) => {
    const { data } = await supabase.from("daily_entries").select("*").eq("team_leader_id", leader.id).order("date", { ascending: true });
    setDetailEntries((data || []) as DailyEntry[]);
  };

  // View Details: push history entry so back returns to org chart
  const handleViewDetails = (leader: TeamLeader) => {
    window.history.pushState({ blockId: leader.plantation_id, level: "leader" }, "");
    setViewingLeader(leader); setSelectedLeader(null);
    setDetailMonth(() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; });
    setDetailDateFrom(""); setDetailDateTo("");
    loadDetailData(leader);
  };

  const detailPrevMonth = () => { const [y, m] = detailMonth.split("-").map(Number); const d = new Date(y, m - 2, 1); setDetailMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); };
  const detailNextMonth = () => { const [y, m] = detailMonth.split("-").map(Number); const d = new Date(y, m, 1); setDetailMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); };
  const detailFormatMonthLabel = (ym: string) => { const [y, m] = ym.split("-").map(Number); return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" }); };

  useEffect(() => {
    if (!viewingLeader) return;
    let filtered = detailEntries.filter((e) => {
      const d = normalizeDate(e.date);
      if (!d.startsWith(detailMonth)) return false;
      if (detailDateFrom && d < detailDateFrom) return false;
      if (detailDateTo && d > detailDateTo) return false;
      return true;
    });
    setDetailFilteredEntries(filtered);
    const workDays = filtered.filter((e) => e.work_status === "work");
    const totalBunches = workDays.reduce((s, e) => s + (Number(e.bunches) || 0), 0);
    const totalTons = filtered.reduce((s, e) => s + (Number(e.tons) || 0), 0);
    const totalBacklogs = workDays.reduce((s, e) => s + (Number(e.backlogs) || 0), 0);
    const totalWorkers = workDays.reduce((s, e) => s + (Number(e.num_workers) || 0), 0);
    setDetailStats({
      totalEntries: filtered.length, workDays: workDays.length, noWorkDays: filtered.length - workDays.length,
      totalBunches, totalTons, totalBacklogs,
      avgBunches: workDays.length > 0 ? Math.round(totalBunches / workDays.length) : 0,
      avgTons: workDays.length > 0 ? (totalTons / workDays.length).toFixed(2) : "0.00",
      avgWorkers: workDays.length > 0 ? Math.round(totalWorkers / workDays.length) : 0,
    });
  }, [detailMonth, detailDateFrom, detailDateTo, detailEntries, viewingLeader]);

  const handleDetailEditEntry = (entry: DailyEntry) => {
    setDetailEditEntry(entry); setDetailEditDate(normalizeDate(entry.date));
    setDetailEditWorkStatus(entry.work_status || "work");
    setDetailEditNumWorkers(entry.num_workers !== null ? String(entry.num_workers) : "");
    setDetailEditLot(entry.lot || "");
    setDetailEditBunches(entry.bunches !== null ? String(entry.bunches) : "");
    setDetailEditTons(entry.tons !== null ? String(entry.tons) : "");
    setDetailEditBacklogs(entry.backlogs !== null ? String(entry.backlogs) : "");
    setDetailEditNotes(entry.notes || "");
    setShowDetailEditModal(true);
  };

  const handleDetailSaveEdit = async () => {
    if (!detailEditEntry || !viewingLeader) return;
    setDetailSaving(true);
    const { error } = await supabase.from("daily_entries").update({
      work_status: detailEditWorkStatus, date: detailEditDate,
      num_workers: detailEditWorkStatus === "work" ? parseInt(detailEditNumWorkers) || 0 : null,
      lot: detailEditWorkStatus === "work" ? (detailEditLot || null) : null,
      bunches: detailEditWorkStatus === "work" ? parseInt(detailEditBunches) || 0 : null,
      tons: parseFloat(detailEditTons) || 0,
      backlogs: detailEditWorkStatus === "work" ? parseInt(detailEditBacklogs) || 0 : null,
      notes: detailEditNotes || null,
    }).eq("id", detailEditEntry.id);
    if (!error) {
      await loadDetailData(viewingLeader); setToast({ type: "success", message: "Entry updated." });
      setShowDetailEditModal(false); setDetailEditEntry(null);
    } else { setToast({ type: "error", message: error.message || "Failed to update." }); }
    setDetailSaving(false);
  };

  const handleDetailDeleteEntry = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    await supabase.from("daily_entries").delete().eq("id", id);
    if (viewingLeader) await loadDetailData(viewingLeader);
    setToast({ type: "success", message: "Entry deleted." });
  };

  // Determine which view level we're at for AnimatePresence
  const viewLevel = selectedLeader ? "leader" : viewingLeader ? "leader" : selectedBlock ? "org" : "blocks";

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-6 sm:mb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}>
            <h1 className="page-title text-2xl sm:text-3xl text-theme tracking-tight">Team Management</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {selectedBlock ? `${selectedP?.rancangan}, Peringkat ${selectedP?.peringkat} — Block ${selectedP?.block}` : "Select a block to manage team leaders."}
            </p>
          </motion.div>
          {!selectedBlock && (
            <motion.button whileHover={{ scale: 1.05, boxShadow: "0 4px 20px rgba(245,158,11,0.3)" }} whileTap={{ scale: 0.95 }} onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-theme transition-all" style={{ background: "linear-gradient(to right, #f59e0b, #d97706)" }}>
              <Plus className="w-4 h-4" /> Add Leader
            </motion.button>
          )}
        </motion.div>

        {/* Date Filter Bar */}
        <AnimatePresence>
          {selectedLeader && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: "easeOut" }} className="mb-6">
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }} className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <input type="date" className="px-3 py-2 rounded border text-sm text-theme outline-none" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-default)", minWidth: "140px" }} value={date} onChange={(e) => { setDate(e.target.value); setShowFilterPanel(false); }} />
                <motion.button whileHover={{ scale: 1.03, backgroundColor: "var(--accent-subtle)" }} whileTap={{ scale: 0.97 }} onClick={() => setShowFilterPanel(!showFilterPanel)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all" style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)" }}>
                  <Calendar className="w-4 h-4" /> Filter by Date
                </motion.button>
              </motion.div>
              <FilterPanel show={showFilterPanel} onToggle={() => setShowFilterPanel(!showFilterPanel)} filterDate={filterDate} filterFrom={filterFrom} filterTo={filterTo}
                onFilterDateChange={(val) => { setFilterDate(val); setFilterMode("single"); }}
                onFilterFromChange={(val) => { setFilterFrom(val); setFilterMode("range"); }}
                onFilterToChange={(val) => { setFilterTo(val); setFilterMode("range"); }}
                onClear={handleClearFilter} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Block Selection or Org Chart */}
        <AnimatePresence mode="wait">
          {plantations.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
              className="card-glow rounded-2xl p-12 text-center" style={{ backgroundColor: "var(--bg-card)" }}>
              <MapPin className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No plantations set. Complete onboarding first.</p>
            </motion.div>
          ) : !selectedBlock ? (
            <motion.div key="blocks" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3, ease: "easeOut" }}>
              <BlockSelector plantations={plantations} teamLeaders={teamLeaders} blockLastEntries={blockLastEntries} blockWorkersToday={blockWorkersToday} onSelectBlock={(id) => { router.push(`/team?block=${id}`); setSelectedBlock(id); setSelectedLeader(null); loadOrgChartData(id); }} />
            </motion.div>
          ) : (
            <motion.div key="org" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
              <LeaderOrgChart selectedPlantation={selectedP!} leaders={blockLeaders} latestEntries={leaderLatestEntries}
                onSelectLeader={handleSelectLeader} onViewDetails={handleViewDetails} onDeleteLeader={handleDeleteLeader} onBack={handleBackToBlocks}
                onBijiRelai={handleOpenBijiRelai}
                focusedLeaderId={selectedLeader?.id || viewingLeader?.id} />
              {sortedLeaders.length === 0 && <EmptyLeaderState onAdd={() => setShowModal(true)} />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Biji Relai Modal */}
        {selectedP && (
          <BijiRelaiModal
            open={showBijiRelaiModal}
            onClose={() => setShowBijiRelaiModal(false)}
            plantation={selectedP}
            entries={bijiRelaiEntries}
            date={bijiRelaiDate}
            tons={bijiRelaiTons}
            saving={bijiRelaiSaving}
            savedId={bijiRelaiSavedId}
            onDateChange={setBijiRelaiDate}
            onTonsChange={setBijiRelaiTons}
            onSubmit={handleSubmitBijiRelai}
            onNewEntry={() => { setBijiRelaiSavedId(null); setBijiRelaiDate(new Date().toISOString().split("T")[0]); setBijiRelaiTons(""); }}
            onEdit={handleEditBijiRelai}
            onDelete={handleDeleteBijiRelai}
          />
        )}

        {/* Data Entry Form */}
        <AnimatePresence>
          {selectedLeader && (
            <motion.div key="entry-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.3, ease: "easeOut" }}>
              <EntryForm leader={selectedLeader} plantation={selectedP || null} workStatus={workStatus} date={date} numWorkers={numWorkers} lot={lot} bunches={bunches} tons={tons} backlogs={backlogs} notes={notes} saving={saving} savedId={savedId}
                onWorkStatusChange={setWorkStatus} onDateChange={setDate} onNumWorkersChange={setNumWorkers} onLotChange={setLot} onBunchesChange={setBunches} onTonsChange={setTons} onBacklogsChange={setBacklogs} onNotesChange={setNotes}
                onSubmit={handleSubmitEntry} onNewEntry={() => { setSavedId(null); setDate(new Date().toISOString().split("T")[0]); setWorkStatus("work"); setNumWorkers(""); setLot(""); setBunches(""); setTons(""); setBacklogs(""); setNotes(""); }}
                onClose={handleBackToOrgChart} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inline Leader Detail View */}
        <AnimatePresence>
          {viewingLeader && (() => {
            const plantation = viewingLeader.plantations;
            return (
              <motion.div key="detail-view" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="mt-8">
                <motion.button whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.08)" }} whileTap={{ scale: 0.97 }}
                  onClick={handleBackToOrgChart}
                  className="flex items-center gap-2 mb-4 px-4 py-2 rounded-xl text-sm font-medium transition-all" style={{ color: "var(--text-muted)", border: "1px solid rgba(245,158,11,0.12)" }}>
                  <ChevronLeft className="w-4 h-4" /> Back to all blocks
                </motion.button>

                <div className="card-glow rounded-2xl p-6 mb-6" style={{ backgroundColor: "var(--bg-card)" }}>
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "var(--accent-subtle)" }}>
                        <Users className="w-7 h-7" style={{ color: "var(--accent-primary)" }} />
                      </div>
                      <div>
                        <h2 className="page-title text-2xl text-theme">{viewingLeader.name}</h2>
                        {viewingLeader.phone && (<div className="flex items-center gap-2 mt-1"><Phone className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} /><span className="text-sm" style={{ color: "var(--text-muted)" }}>{viewingLeader.phone}</span></div>)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ backgroundColor: "var(--accent-subtle)" }}><MapPin className="w-4 h-4" style={{ color: "var(--accent-primary)" }} /><span className="text-sm font-medium text-theme">Block {plantation?.block}</span></div>
                      <div className="px-4 py-2 rounded-xl" style={{ backgroundColor: "var(--accent-subtle)" }}><span className="text-sm" style={{ color: "var(--text-secondary)" }}>{plantation?.rancangan}</span></div>
                      <div className="px-4 py-2 rounded-xl" style={{ backgroundColor: "var(--accent-subtle)" }}><span className="text-sm" style={{ color: "var(--text-secondary)" }}>Peringkat {plantation?.peringkat}</span></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  {[{ label: "Working Days", value: detailStats.workDays, icon: Calendar, color: "var(--accent-primary)", bg: "var(--accent-subtle)" },
                    { label: "Total Bunches", value: detailStats.totalBunches, icon: TrendingUp, color: "var(--accent-purple)", bg: "rgba(139,92,246,0.12)" },
                    { label: "Total Tonnage", value: `${Number(detailStats.totalTons).toFixed(2)} ton`, icon: Truck, color: "var(--accent-blue)", bg: "rgba(59,130,246,0.12)" },
                    { label: "Total Backlogs", value: detailStats.totalBacklogs, icon: AlertCircle, color: "var(--accent-amber)", bg: "rgba(245,158,11,0.12)" },
                  ].map((s) => (
                    <div key={s.label} className="card-glow relative rounded-2xl p-3 sm:p-5 overflow-hidden" style={{ backgroundColor: "var(--bg-card)" }}>
                      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-xl" style={{ backgroundColor: s.color }} />
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{s.label}</span>
                          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.bg }}><s.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: s.color }} /></div>
                        </div>
                        <div className="text-xl sm:text-3xl font-bold text-theme">{s.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                  {[{ label: "Avg Bunches/Day", value: detailStats.avgBunches, color: "var(--accent-purple)" },
                    { label: "Avg Tons/Day", value: detailStats.avgTons, color: "var(--accent-primary)" },
                    { label: "Avg Workers/Day", value: detailStats.avgWorkers, color: "var(--accent-blue)" },
                  ].map((s) => (
                    <div key={s.label} className="card-glow rounded-2xl p-4 sm:p-5" style={{ backgroundColor: "var(--bg-card)" }}>
                      <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>{s.label}</div>
                      <div className="text-xl sm:text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                <div className="card-glow rounded-2xl p-4 mb-6" style={{ backgroundColor: "var(--bg-card)" }}>
                  <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <button onClick={detailPrevMonth} className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10" style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)", border: "1px solid rgba(245,158,11,0.2)" }}><ChevronLeft className="w-4 h-4" /></button>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--accent-primary)" }} />
                        <input type="month" value={detailMonth} onChange={(e) => setDetailMonth(e.target.value)} className="pl-9 pr-3 py-2 rounded-xl border text-sm text-theme outline-none cursor-pointer" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)", color: "white" }} />
                      </div>
                      <button onClick={detailNextMonth} className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10" style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)", border: "1px solid rgba(245,158,11,0.2)" }}><ChevronDown className="w-4 h-4 rotate-[-90deg]" /></button>
                      <span className="text-sm font-semibold text-theme ml-1">{detailFormatMonthLabel(detailMonth)}</span>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)" }}>{detailFilteredEntries.length} entries</span>
                  </div>
                  <div className="flex items-end gap-3 pt-3" style={{ borderTop: "1px solid rgba(245,158,11,0.12)" }}>
                    <div className="flex-1"><label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>From</label><input type="date" value={detailDateFrom} onChange={(e) => setDetailDateFrom(e.target.value)} className="w-full px-3 py-2 rounded border text-sm text-theme outline-none cursor-pointer" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }} /></div>
                    <div className="flex-1"><label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>To</label><input type="date" value={detailDateTo} onChange={(e) => setDetailDateTo(e.target.value)} className="w-full px-3 py-2 rounded border text-sm text-theme outline-none cursor-pointer" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }} /></div>
                    {(detailDateFrom || detailDateTo) && (<button onClick={() => { setDetailDateFrom(""); setDetailDateTo(""); }} className="px-3 py-2 rounded-xl text-xs font-medium transition-colors" style={{ backgroundColor: "var(--accent-red-light)", color: "var(--accent-red)", border: "1px solid rgba(239,68,68,0.2)" }}>Clear</button>)}
                  </div>
                </div>

                <div className="card-glow rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)" }}>
                  <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border-default)" }}><BarChart3 className="w-4 h-4" style={{ color: "var(--accent-primary)" }} /><h3 className="card-title text-sm text-theme">All Entries</h3></div>
                  {detailFilteredEntries.length === 0 ? (
                    <div className="p-12 text-center"><Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-muted)" }} /><p className="text-sm" style={{ color: "var(--text-muted)" }}>No entries found for this period.</p></div>
                  ) : (
                     <div className="rounded-xl border bg-[var(--bg-elevated)]/50">
                       {/* Desktop table */}
                       <table className="w-full border-collapse hidden md:table">
                        <thead><tr className="border-b" style={{ borderColor: "var(--border-default)" }}>
                          {[["#", "center"], ["Date", "left"], ["Status", "left"], ["Workers", "right"], ["Lot", "left"], ["Bunches", "right"], ["Tons", "right"], ["Backlogs", "right"], ["Notes", "left"], ["Actions", "center"]].map(([h, a]) => (
                            <th key={h as string} className={`text-${a} px-4 py-3 text-xs font-semibold uppercase tracking-wider`} style={{ color: "var(--text-muted)" }}>{h}</th>
                          ))}
                        </tr></thead>
                        <tbody>
                          {detailFilteredEntries.map((e: DailyEntry, idx: number) => {
                            const isNoWork = e.work_status === "no_work";
                            const isLast = idx === detailFilteredEntries.length - 1;
                            return (
                              <tr key={e.id} style={{ borderBottom: isLast ? "none" : "1px solid rgba(245,158,11,0.08)" }}>
                                <td className="px-4 py-3 text-sm text-center" style={{ color: "var(--text-muted)" }}>{idx + 1}</td>
                                <td className="px-4 py-3 text-sm text-theme font-medium whitespace-nowrap">{e.date ? e.date.split("-").reverse().join("/") : "-"}</td>
                                <td className="px-4 py-3 whitespace-nowrap"><span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: isNoWork ? "var(--status-no-work-bg)" : "var(--status-work-bg)", color: isNoWork ? "var(--status-no-work)" : "var(--status-work)" }}>{isNoWork ? "No Work" : "Work"}</span></td>
                                <td className="px-4 py-3 text-sm text-right" style={{ color: "var(--text-secondary)" }}>{isNoWork ? "-" : (e.num_workers ?? "-")}</td>
                                <td className="px-4 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>{isNoWork ? "-" : (e.lot || "-")}</td>
                                <td className="px-4 py-3 text-sm text-right" style={{ color: "var(--text-secondary)" }}>{isNoWork ? "-" : (e.bunches ?? "-")}</td>
                                <td className="px-4 py-3 text-sm font-medium text-theme text-right">{e.tons != null && e.tons !== 0 ? Number(e.tons).toFixed(2) : "-"}</td>
                                <td className="px-4 py-3 text-sm text-right" style={{ color: "var(--text-secondary)" }}>{isNoWork ? "-" : (e.backlogs || "-")}</td>
                                <td className="px-4 py-3 text-sm truncate max-w-[200px]" style={{ color: "var(--text-muted)" }}>{e.notes || "-"}</td>
                                <td className="px-4 py-3"><div className="flex items-center justify-center gap-1">
                                  <button onClick={() => handleDetailEditEntry(e)} className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10" style={{ color: "var(--accent-blue)" }} title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => handleDetailDeleteEntry(e.id)} className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10" style={{ color: "var(--accent-red)" }} title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {/* Mobile cards */}
                      <div className="md:hidden divide-y" style={{ borderColor: "rgba(245,158,11,0.08)" }}>
                        {detailFilteredEntries.map((e: DailyEntry, idx: number) => {
                          const isNoWork = e.work_status === "no_work";
                          return (
                            <div key={e.id} className="p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-theme font-medium">{e.date ? e.date.split("-").reverse().join("/") : "-"}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: isNoWork ? "var(--status-no-work-bg)" : "var(--status-work-bg)", color: isNoWork ? "var(--status-no-work)" : "var(--status-work)" }}>{isNoWork ? "No Work" : "Work"}</span>
                                  <button onClick={() => handleDetailEditEntry(e)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10" style={{ color: "var(--accent-blue)" }}><Edit2 className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => handleDetailDeleteEntry(e.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10" style={{ color: "var(--accent-red)" }}><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                                <div>Workers: {isNoWork ? "-" : (e.num_workers ?? "-")}</div>
                                <div>Lot: {isNoWork ? "-" : (e.lot || "-")}</div>
                                <div>Bunches: {isNoWork ? "-" : (e.bunches ?? "-")}</div>
                                <div>Tons: {e.tons != null && e.tons !== 0 ? Number(e.tons).toFixed(2) : "-"}</div>
                                <div>Backlogs: {isNoWork ? "-" : (e.backlogs || "-")}</div>
                                {e.notes && <div className="col-span-3 truncate" style={{ color: "var(--text-muted)" }}>Notes: {e.notes}</div>}
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
          })()}
        </AnimatePresence>

        {/* Detail View Edit Modal */}
        <EditEntryModal show={showDetailEditModal} entry={detailEditEntry} date={detailEditDate} workStatus={detailEditWorkStatus} numWorkers={detailEditNumWorkers} lot={detailEditLot} bunches={detailEditBunches} tons={detailEditTons} backlogs={detailEditBacklogs} notes={detailEditNotes} saving={detailSaving}
          onDateChange={setDetailEditDate} onWorkStatusChange={setDetailEditWorkStatus} onNumWorkersChange={setDetailEditNumWorkers} onLotChange={setDetailEditLot} onBunchesChange={setDetailEditBunches} onTonsChange={setDetailEditTons} onBacklogsChange={setDetailEditBacklogs} onNotesChange={setDetailEditNotes}
          onSave={handleDetailSaveEdit} onClose={() => setShowDetailEditModal(false)} />

        {/* Add Leader Modal */}
        <AddLeaderModal show={showModal} selectedBlockId={selectedBlock} selectedPlantation={selectedP || null} name={name} phone={phone} saving={saving}
          onNameChange={setName} onPhoneChange={setPhone} onSubmit={handleSaveLeader} onClose={() => setShowModal(false)} />

        {/* Toast */}
        <Toast toast={toast} onDismiss={() => setToast(null)} position="bottom-right" />
      </div>
    </DashboardLayout>
  );
}
