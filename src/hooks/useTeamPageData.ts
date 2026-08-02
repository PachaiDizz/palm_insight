import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { hasCompletedOnboarding, getAllUserPlantations } from "@/lib/onboarding";
import { Plantation, TeamLeader, DailyEntry, BijiRelai } from "@/types";
import { toLocalDateKey } from "@/lib/date";
import { type EntryFormState, emptyEntryForm, type FilterState, type DetailViewState, type LeaderFormState, type BijiRelaiFormState } from "./useTeamPageReducers";

type FilterAction = { type: "SET"; field: keyof FilterState; value: string | boolean } | { type: "RESET" };
type DetailViewAction = { type: "SET"; field: keyof DetailViewState; value: any } | { type: "PREV_MONTH" } | { type: "NEXT_MONTH" } | { type: "OPEN_EDIT"; entry: DailyEntry } | { type: "CLOSE_EDIT" } | { type: "RESET_MONTH" };
type DetailEditAction = { type: "SET"; field: "workStatus" | "date" | "numWorkers" | "lot" | "bunches" | "tons" | "backlogs" | "notes" | "latitude" | "longitude" | "lotLabel"; value: string } | { type: "RESET" } | { type: "LOAD"; entry: DailyEntry };
type LeaderFormAction = { type: "SET"; field: keyof LeaderFormState; value: any } | { type: "OPEN" } | { type: "CLOSE" };
type BijiRelaiFormAction = { type: "SET"; field: keyof BijiRelaiFormState; value: any } | { type: "OPEN" } | { type: "CLOSE" } | { type: "SAVED" } | { type: "NEW_ENTRY" } | { type: "PREV_MONTH" } | { type: "NEXT_MONTH" };

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

interface UseTeamPageDataParams {
  user: { id: string } | null;
  router: { push: (path: string) => void };
  entryForm: EntryFormState;
  entryFormUndo: {
    setState: (newState: EntryFormState | ((prev: EntryFormState) => EntryFormState), opts?: { addToHistory?: boolean }) => void;
    clearHistory: () => void;
  };
  filters: FilterState;
  filterDispatch: React.Dispatch<FilterAction>;
  detailView: DetailViewState;
  detailViewDispatch: React.Dispatch<DetailViewAction>;
  detailDispatch: React.Dispatch<DetailEditAction>;
  leaderForm: LeaderFormState;
  leaderFormDispatch: React.Dispatch<LeaderFormAction>;
  bijiRelaiForm: BijiRelaiFormState;
  bijiRelaiFormDispatch: React.Dispatch<BijiRelaiFormAction>;
  setToast: (toast: { type: "success" | "error"; message: string } | null) => void;
  t: (key: any) => string;
}

export function useTeamPageData({
  user,
  router,
  entryForm,
  entryFormUndo,
  filters,
  filterDispatch,
  detailView,
  detailViewDispatch,
  detailDispatch,
  leaderForm,
  leaderFormDispatch,
  bijiRelaiForm,
  bijiRelaiFormDispatch,
  setToast,
  t,
}: UseTeamPageDataParams) {
  const [plantations, setPlantations] = useState<Plantation[]>([]);
  const [teamLeaders, setTeamLeaders] = useState<TeamLeader[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [selectedLeader, setSelectedLeader] = useState<TeamLeader | null>(null);
  const [leaderEntries, setLeaderEntries] = useState<DailyEntry[]>([]);
  const [leaderStats, setLeaderStats] = useState(defaultStats);
  const [leaderLatestEntries, setLeaderLatestEntries] = useState<Record<string, DailyEntry>>({});

  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [viewingLeader, setViewingLeader] = useState<TeamLeader | null>(null);
  const [detailEntries, setDetailEntries] = useState<DailyEntry[]>([]);
  const [detailFilteredEntries, setDetailFilteredEntries] = useState<DailyEntry[]>([]);
  const [detailStats, setDetailStats] = useState(defaultDetailStats);

  const [blockLastEntries, setBlockLastEntries] = useState<Record<string, string | null>>({});
  const [blockWorkersToday, setBlockWorkersToday] = useState<Record<string, number>>({});

  const [bijiRelaiEntries, setBijiRelaiEntries] = useState<BijiRelai[]>([]);

  // --- Data loading functions ---

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

    const today = toLocalDateKey(new Date());
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

  async function loadBijiRelai(blockId: string, ym?: string) {
    if (!user) return;
    const now = new Date();
    const targetYM = ym || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const [y, m] = targetYM.split("-").map(Number);
    const monthStart = `${y}-${String(m).padStart(2, "0")}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const monthEnd = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    const { data } = await supabase
      .from("biji_relai")
      .select("*")
      .eq("user_id", user.id)
      .eq("plantation_id", blockId)
      .gte("date", monthStart)
      .lte("date", monthEnd)
      .order("date", { ascending: false });
    setBijiRelaiEntries((data || []) as BijiRelai[]);
  }

  async function loadDetailData(leader: TeamLeader) {
    const { data } = await supabase.from("daily_entries").select("*").eq("team_leader_id", leader.id).order("date", { ascending: true });
    setDetailEntries((data || []) as DailyEntry[]);
  }

  // --- Derived state ---

  const getFilteredEntries = useCallback(() => {
    if (!selectedLeader) return [];
    let filtered: DailyEntry[] = leaderEntries;
    if (filters.filterMode === "single" && filters.filterDate) filtered = filtered.filter((e) => e.date === filters.filterDate);
    else if (filters.filterMode === "range" && filters.filterFrom && filters.filterTo) filtered = filtered.filter((e) => e.date >= filters.filterFrom && e.date <= filters.filterTo);
    else if (filters.filterMode === "range" && filters.filterFrom) filtered = filtered.filter((e) => e.date >= filters.filterFrom);
    else if (filters.filterMode === "range" && filters.filterTo) filtered = filtered.filter((e) => e.date <= filters.filterTo);
    return filtered;
  }, [leaderEntries, selectedLeader, filters]);

  const filteredEntries = getFilteredEntries();
  const blockLeaders = selectedBlock ? teamLeaders.filter((l) => l.plantation_id === selectedBlock) : [];
  const sortedLeaders = [...blockLeaders].sort((a, b) => a.name.localeCompare(b.name));
  const selectedP = plantations.find((p) => p.id === selectedBlock);

  // --- Mutation handlers ---

  const handleSelectLeader = (leader: TeamLeader) => {
    window.history.pushState({ blockId: leader.plantation_id, level: "leader" }, "");
    setSelectedLeader(leader);
    entryFormUndo.setState(emptyEntryForm, { addToHistory: false }); entryFormUndo.clearHistory();
    setSavedId(null);
    loadLeaderData(leader.id);
  };

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedLeader) { setToast({ type: "error", message: t("msg.noTeamSelected") }); return; }
    setSaving(true); setToast(null);
    const existingEntry = leaderEntries.find((entry) => entry.date === entryForm.date && entry.team_leader_id === selectedLeader.id);
    const entryData = {
      work_status: entryForm.workStatus, date: entryForm.date,
      num_workers: entryForm.workStatus === "work" ? parseInt(entryForm.numWorkers) || 0 : null,
      lot: entryForm.workStatus === "work" ? (entryForm.lot || null) : null,
      bunches: entryForm.workStatus === "work" ? parseInt(entryForm.bunches) || 0 : null,
      tons: parseFloat(entryForm.tons) || 0,
      backlogs: entryForm.workStatus === "work" ? parseInt(entryForm.backlogs) || 0 : null,
      notes: entryForm.notes || null,
      latitude: entryForm.latitude ? parseFloat(entryForm.latitude) : null,
      longitude: entryForm.longitude ? parseFloat(entryForm.longitude) : null,
      lot_label: entryForm.lotLabel || null,
    };
    if (existingEntry) {
      const { error } = await supabase.from("daily_entries").update(entryData).eq("id", existingEntry.id);
      if (error) { setSaving(false); setToast({ type: "error", message: error.message || t("msg.failedUpdate") }); return; }
    } else {
      const { error } = await supabase.from("daily_entries").insert({ user_id: user.id, team_leader_id: selectedLeader.id, plantation_id: selectedLeader.plantation_id, ...entryData });
      if (error) { setSaving(false); setToast({ type: "error", message: error.message || t("msg.failedSave") }); return; }
    }
    setSavedId(`de_${Date.now()}`);
    entryFormUndo.setState(emptyEntryForm, { addToHistory: false }); entryFormUndo.clearHistory();
    await loadLeaderData(selectedLeader.id);
    await loadOrgChartData(selectedLeader.plantation_id);
    setToast({ type: "success", message: existingEntry ? t("msg.entryUpdated") : t("msg.entrySaved") });
    setSaving(false);
  };

  const handleSubmitBijiRelai = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedBlock) return;
    bijiRelaiFormDispatch({ type: "SET", field: "saving", value: true });
    const entryData = {
      user_id: user.id,
      plantation_id: selectedBlock,
      date: bijiRelaiForm.date,
      tons: bijiRelaiForm.tons ? parseFloat(bijiRelaiForm.tons) : null,
    };
    const existing = bijiRelaiEntries.find((e) => e.date === bijiRelaiForm.date && e.plantation_id === selectedBlock);
    if (existing) {
      const { error } = await supabase.from("biji_relai").update(entryData).eq("id", existing.id);
      if (error) { bijiRelaiFormDispatch({ type: "SET", field: "saving", value: false }); setToast({ type: "error", message: error.message || t("msg.failedUpdate") }); return; }
    } else {
      const { error } = await supabase.from("biji_relai").insert(entryData);
      if (error) { bijiRelaiFormDispatch({ type: "SET", field: "saving", value: false }); setToast({ type: "error", message: error.message || t("msg.failedSave") }); return; }
    }
    bijiRelaiFormDispatch({ type: "SAVED" });
    loadBijiRelai(selectedBlock, bijiRelaiForm.month);
    setToast({ type: "success", message: existing ? t("msg.bijiRelaiUpdated") : t("msg.bijiRelaiSaved") });
  };

  const handleEditBijiRelai = async (entry: BijiRelai) => {
    if (!user) return;
    const { error } = await supabase.from("biji_relai").update({ date: entry.date, tons: entry.tons }).eq("id", entry.id);
    if (error) { setToast({ type: "error", message: error.message || t("msg.failedUpdate") }); return; }
    loadBijiRelai(selectedBlock!, bijiRelaiForm.month);
    setToast({ type: "success", message: t("msg.bijiRelaiUpdated") });
  };

  const handleDeleteBijiRelai = async (id: string) => {
    if (!confirm(t("confirm.deleteBijiRelai"))) return;
    setDeletingId(id);
    try {
      await supabase.from("biji_relai").delete().eq("id", id);
      if (selectedBlock) loadBijiRelai(selectedBlock, bijiRelaiForm.month);
      setToast({ type: "success", message: t("msg.bijiRelaiDeleted") });
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenBijiRelai = () => {
    if (selectedBlock) loadBijiRelai(selectedBlock);
    bijiRelaiFormDispatch({ type: "OPEN" });
  };

  const handleBijiRelaiChangeMonth = (direction: "prev" | "next") => {
    if (!selectedBlock) return;
    const [y, m] = bijiRelaiForm.month.split("-").map(Number);
    const d = new Date(y, m - 1 + (direction === "prev" ? -1 : 1), 1);
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    bijiRelaiFormDispatch({ type: direction === "prev" ? "PREV_MONTH" : "NEXT_MONTH" });
    loadBijiRelai(selectedBlock, newMonth);
  };

  const handleEditEntry = (entry: DailyEntry) => {
    detailDispatch({ type: "LOAD", entry });
    setSavedId(`de_${Date.now()}`);
    filterDispatch({ type: "SET", field: "showFilterPanel", value: false });
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm(t("confirm.deleteEntry"))) return;
    setDeletingId(id);
    try {
      await supabase.from("daily_entries").delete().eq("id", id);
      if (selectedLeader) await loadLeaderData(selectedLeader.id);
      setToast({ type: "success", message: t("msg.entryDeleted") });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const pid = selectedBlock || plantations[0]?.id;
    if (!pid) return;
    setSaving(true); setToast(null);
    const { error } = await supabase.from("team_leaders").insert({ user_id: user.id, plantation_id: pid, name: leaderForm.name, phone: leaderForm.phone || null });
    if (!error) {
      leaderFormDispatch({ type: "CLOSE" });
      await loadData();
      if (selectedBlock) await loadOrgChartData(selectedBlock);
      setToast({ type: "success", message: t("msg.leaderAdded") });
    } else {
      setToast({ type: "error", message: error.message || t("msg.failedAdd") });
    }
    setSaving(false);
  };

  const handleDeleteLeader = async (id: string) => {
    if (!confirm(t("confirm.deleteLeader"))) return;
    setDeletingId(id);
    try {
      await supabase.from("team_leaders").delete().eq("id", id);
      if (selectedLeader?.id === id) { setSelectedLeader(null); setLeaderEntries([]); setLeaderStats(defaultStats); }
      await loadData();
      if (selectedBlock) await loadOrgChartData(selectedBlock);
      setToast({ type: "success", message: t("msg.leaderRemoved") });
    } finally {
      setDeletingId(null);
    }
  };

  const handleBackToBlocks = () => {
    setSelectedBlock(null); setSelectedLeader(null); setLeaderEntries([]); setLeaderStats(defaultStats); setLeaderLatestEntries({});
    router.push("/team");
  };

  const handleBackToOrgChart = () => {
    window.history.back();
  };

  const handleClearFilter = () => { filterDispatch({ type: "RESET" }); };

  const handleViewDetails = (leader: TeamLeader) => {
    window.history.pushState({ blockId: leader.plantation_id, level: "leader" }, "");
    setViewingLeader(leader); setSelectedLeader(null);
    detailViewDispatch({ type: "RESET_MONTH" });
    loadDetailData(leader);
  };

  const handleDetailEditEntry = (entry: DailyEntry) => {
    detailDispatch({ type: "LOAD", entry });
    detailViewDispatch({ type: "OPEN_EDIT", entry });
  };

  const handleDetailSaveEdit = async (data: {
    date: string;
    workStatus: string;
    numWorkers: string;
    lot: string;
    bunches: string;
    tons: string;
    backlogs: string;
    notes: string;
    latitude: string;
    longitude: string;
    lotLabel: string;
  }) => {
    if (!detailView.editEntry || !viewingLeader) return;
    detailViewDispatch({ type: "SET", field: "saving", value: true });
    const { error } = await supabase.from("daily_entries").update({
      work_status: data.workStatus, date: data.date,
      num_workers: data.workStatus === "work" ? parseInt(data.numWorkers) || 0 : null,
      lot: data.workStatus === "work" ? (data.lot || null) : null,
      bunches: data.workStatus === "work" ? parseInt(data.bunches) || 0 : null,
      tons: parseFloat(data.tons) || 0,
      backlogs: data.workStatus === "work" ? parseInt(data.backlogs) || 0 : null,
      notes: data.notes || null,
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
      lot_label: data.lotLabel || null,
    }).eq("id", detailView.editEntry.id);
    if (!error) {
      await loadDetailData(viewingLeader); setToast({ type: "success", message: t("msg.entryUpdated") });
      detailViewDispatch({ type: "CLOSE_EDIT" });
    } else { setToast({ type: "error", message: error.message || t("msg.failedUpdate") }); }
    detailViewDispatch({ type: "SET", field: "saving", value: false });
  };

  const handleDetailDeleteEntry = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    await supabase.from("daily_entries").delete().eq("id", id);
    if (viewingLeader) await loadDetailData(viewingLeader);
    setToast({ type: "success", message: t("msg.entryDeleted") });
  };

  // --- Effects ---

  useEffect(() => { if (user) loadData(); }, [user]);

  useEffect(() => {
    if (selectedBlock) {
      loadOrgChartData(selectedBlock);
      loadBijiRelai(selectedBlock);
      const now = new Date();
      const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      bijiRelaiFormDispatch({ type: "SET", field: "month", value: currentYM });
      bijiRelaiFormDispatch({ type: "NEW_ENTRY" });
    }
  }, [selectedBlock]);

  useEffect(() => {
    if (!viewingLeader) return;
    let filtered = detailEntries.filter((e) => {
      const d = normalizeDate(e.date);
      if (!d.startsWith(detailView.month)) return false;
      if (detailView.dateFrom && d < detailView.dateFrom) return false;
      if (detailView.dateTo && d > detailView.dateTo) return false;
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
  }, [detailView.month, detailView.dateFrom, detailView.dateTo, detailEntries, viewingLeader]);

  return {
    // Data state
    plantations,
    teamLeaders,
    selectedBlock,
    setSelectedBlock,
    selectedLeader,
    setSelectedLeader,
    leaderEntries,
    leaderStats,
    leaderLatestEntries,
    blockLastEntries,
    blockWorkersToday,
    bijiRelaiEntries,
    viewingLeader,
    setViewingLeader,
    detailEntries,
    detailFilteredEntries,
    detailStats,
    saving,
    savedId,
    setSavedId,
    deletingId,
    // Derived state
    filteredEntries,
    blockLeaders,
    sortedLeaders,
    selectedP,
    // Data loading
    loadData,
    loadOrgChartData,
    loadBijiRelai,
    loadDetailData,
    // Handlers
    handleSelectLeader,
    handleSubmitEntry,
    handleSubmitBijiRelai,
    handleEditBijiRelai,
    handleDeleteBijiRelai,
    handleOpenBijiRelai,
    handleBijiRelaiChangeMonth,
    handleEditEntry,
    handleDeleteEntry,
    handleSaveLeader,
    handleDeleteLeader,
    handleBackToBlocks,
    handleBackToOrgChart,
    handleClearFilter,
    handleViewDetails,
    handleDetailEditEntry,
    handleDetailSaveEdit,
    handleDetailDeleteEntry,
  };
}
