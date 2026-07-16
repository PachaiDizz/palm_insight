"use client";
import { Suspense, useEffect, useState, useCallback, useRef, useReducer } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";
import { hasCompletedOnboarding, getAllUserPlantations } from "@/lib/onboarding";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, Trash2, Users, Phone, MapPin, Edit2, AlertCircle, BarChart3, TrendingUp, ChevronLeft, Calendar, ChevronDown, Truck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Plantation, TeamLeader, DailyEntry, BijiRelai } from "@/types";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useI18n } from "@/lib/i18n";
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
import { toLocalDateKey } from "@/lib/date";

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

interface EntryFormState { workStatus: string; date: string; numWorkers: string; lot: string; bunches: string; tons: string; backlogs: string; notes: string; latitude: string; longitude: string; lotLabel: string; }
const emptyEntryForm: EntryFormState = { workStatus: "work", date: toLocalDateKey(new Date()), numWorkers: "", lot: "", bunches: "", tons: "", backlogs: "", notes: "", latitude: "", longitude: "", lotLabel: "" };
type EntryFormAction =
  | { type: "SET"; field: keyof EntryFormState; value: string }
  | { type: "RESET" }
  | { type: "LOAD"; entry: DailyEntry };
function entryFormReducer(state: EntryFormState, action: EntryFormAction): EntryFormState {
  switch (action.type) {
    case "SET": return { ...state, [action.field]: action.value };
    case "RESET": return { ...emptyEntryForm, date: toLocalDateKey(new Date()) };
    case "LOAD": {
      const e = action.entry;
      return {
        workStatus: e.work_status || "work",
        date: e.date || state.date,
        numWorkers: e.work_status === "work" ? String(e.num_workers ?? "") : "",
        lot: e.lot || "",
        bunches: e.work_status === "work" ? String(e.bunches ?? "") : "",
        tons: e.tons != null ? String(e.tons) : "",
        backlogs: e.work_status === "work" ? String(e.backlogs ?? "") : "",
        notes: e.notes || "",
        latitude: e.latitude != null ? String(e.latitude) : "",
        longitude: e.longitude != null ? String(e.longitude) : "",
        lotLabel: e.lot_label || "",
      };
    }
  }
}

type FilterState = { filterMode: "single" | "range"; filterDate: string; filterFrom: string; filterTo: string; showFilterPanel: boolean; };
const emptyFilter: FilterState = { filterMode: "single", filterDate: "", filterFrom: "", filterTo: "", showFilterPanel: false };
type FilterAction = { type: "SET"; field: keyof FilterState; value: string | boolean } | { type: "RESET" };
function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case "SET": return { ...state, [action.field]: action.value };
    case "RESET": return { ...emptyFilter };
  }
}

interface DetailEditState { workStatus: string; date: string; numWorkers: string; lot: string; bunches: string; tons: string; backlogs: string; notes: string; latitude: string; longitude: string; lotLabel: string; }
const emptyDetailEdit: DetailEditState = { workStatus: "work", date: "", numWorkers: "", lot: "", bunches: "", tons: "", backlogs: "", notes: "", latitude: "", longitude: "", lotLabel: "" };
type DetailEditAction = { type: "SET"; field: keyof DetailEditState; value: string } | { type: "RESET" } | { type: "LOAD"; entry: DailyEntry };
function detailEditReducer(state: DetailEditState, action: DetailEditAction): DetailEditState {
  switch (action.type) {
    case "SET": return { ...state, [action.field]: action.value };
    case "RESET": return emptyDetailEdit;
    case "LOAD": {
      const e = action.entry;
      return {
        workStatus: e.work_status || "work",
        date: e.date || state.date,
        numWorkers: e.work_status === "work" ? String(e.num_workers ?? "") : "",
        lot: e.lot || "",
        bunches: e.work_status === "work" ? String(e.bunches ?? "") : "",
        tons: e.tons != null ? String(e.tons) : "",
        backlogs: e.work_status === "work" ? String(e.backlogs ?? "") : "",
        notes: e.notes || "",
        latitude: e.latitude != null ? String(e.latitude) : "",
        longitude: e.longitude != null ? String(e.longitude) : "",
        lotLabel: e.lot_label || "",
      };
    }
  }
}

// --- Detail View Filters (month navigation, date range, edit modal) ---
const nowYM = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`; })();
type DetailViewState = { month: string; dateFrom: string; dateTo: string; showEditModal: boolean; editEntry: DailyEntry | null; saving: boolean; };
const emptyDetailViewState: DetailViewState = { month: nowYM, dateFrom: "", dateTo: "", showEditModal: false, editEntry: null, saving: false };
type DetailViewAction =
  | { type: "SET"; field: keyof DetailViewState; value: any }
  | { type: "PREV_MONTH" }
  | { type: "NEXT_MONTH" }
  | { type: "OPEN_EDIT"; entry: DailyEntry }
  | { type: "CLOSE_EDIT" }
  | { type: "RESET_MONTH" };
function detailViewReducer(state: DetailViewState, action: DetailViewAction): DetailViewState {
  switch (action.type) {
    case "SET": return { ...state, [action.field]: action.value };
    case "PREV_MONTH": {
      const [y, m] = state.month.split("-").map(Number);
      const d = new Date(y, m - 2, 1);
      return { ...state, month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` };
    }
    case "NEXT_MONTH": {
      const [y, m] = state.month.split("-").map(Number);
      const d = new Date(y, m, 1);
      return { ...state, month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` };
    }
    case "OPEN_EDIT": return { ...state, showEditModal: true, editEntry: action.entry };
    case "CLOSE_EDIT": return { ...state, showEditModal: false, editEntry: null };
    case "RESET_MONTH": return { ...state, month: nowYM, dateFrom: "", dateTo: "" };
  }
}

// --- Add Leader Form ---
type LeaderFormState = { showModal: boolean; name: string; phone: string; };
const emptyLeaderForm: LeaderFormState = { showModal: false, name: "", phone: "" };
type LeaderFormAction = { type: "SET"; field: keyof LeaderFormState; value: any } | { type: "OPEN" } | { type: "CLOSE" };
function leaderFormReducer(state: LeaderFormState, action: LeaderFormAction): LeaderFormState {
  switch (action.type) {
    case "SET": return { ...state, [action.field]: action.value };
    case "OPEN": return { ...state, showModal: true };
    case "CLOSE": return emptyLeaderForm;
  }
}

// --- Biji Relai Form ---
type BijiRelaiFormState = { showModal: boolean; date: string; tons: string; saving: boolean; savedId: string | null; };
const emptyBijiRelaiForm: BijiRelaiFormState = { showModal: false, date: toLocalDateKey(new Date()), tons: "", saving: false, savedId: null };
type BijiRelaiFormAction = { type: "SET"; field: keyof BijiRelaiFormState; value: any } | { type: "OPEN" } | { type: "CLOSE" } | { type: "SAVED" } | { type: "NEW_ENTRY" };
function bijiRelaiFormReducer(state: BijiRelaiFormState, action: BijiRelaiFormAction): BijiRelaiFormState {
  switch (action.type) {
    case "SET": return { ...state, [action.field]: action.value };
    case "OPEN": return { ...state, showModal: true, date: toLocalDateKey(new Date()), tons: "", savedId: null };
    case "CLOSE": return { ...state, showModal: false };
    case "SAVED": return { ...state, saving: false, savedId: "saved" };
    case "NEW_ENTRY": return { ...state, savedId: null, date: toLocalDateKey(new Date()), tons: "" };
  }
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
  const { t } = useI18n();
  const [plantations, setPlantations] = useState<Plantation[]>([]);
  const [teamLeaders, setTeamLeaders] = useState<TeamLeader[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(searchParams.get("block"));
  const [selectedLeader, setSelectedLeader] = useState<TeamLeader | null>(null);
  const [leaderEntries, setLeaderEntries] = useState<DailyEntry[]>([]);
  const [leaderStats, setLeaderStats] = useState(defaultStats);
  const [leaderLatestEntries, setLeaderLatestEntries] = useState<Record<string, DailyEntry>>({});

  const entryFormUndo = useUndoRedo(emptyEntryForm, { limit: 30 });
  const entryForm = entryFormUndo.state;
  const setEntryField = (field: keyof EntryFormState, value: string) =>
    entryFormUndo.setState((prev) => ({ ...prev, [field]: value }));
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [filters, filterDispatch] = useReducer(filterReducer, emptyFilter);

  const [viewingLeader, setViewingLeader] = useState<TeamLeader | null>(null);
  const [detailEntries, setDetailEntries] = useState<DailyEntry[]>([]);
  const [detailFilteredEntries, setDetailFilteredEntries] = useState<DailyEntry[]>([]);
  const [detailStats, setDetailStats] = useState(defaultDetailStats);
  const [detailView, detailViewDispatch] = useReducer(detailViewReducer, emptyDetailViewState);

  const [detailEdit, detailDispatch] = useReducer(detailEditReducer, emptyDetailEdit);

  const [leaderForm, leaderFormDispatch] = useReducer(leaderFormReducer, emptyLeaderForm);
  const [blockLastEntries, setBlockLastEntries] = useState<Record<string, string | null>>({});
  const [blockWorkersToday, setBlockWorkersToday] = useState<Record<string, number>>({});

  const [bijiRelaiEntries, setBijiRelaiEntries] = useState<BijiRelai[]>([]);
  const [bijiRelaiForm, bijiRelaiFormDispatch] = useReducer(bijiRelaiFormReducer, emptyBijiRelaiForm);

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

  // --- Add Entry: push history entry so back returns to org chart ---
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
    loadBijiRelai(selectedBlock);
    setToast({ type: "success", message: existing ? t("msg.bijiRelaiUpdated") : t("msg.bijiRelaiSaved") });
  };

  const handleEditBijiRelai = async (entry: BijiRelai) => {
    if (!user) return;
    const { error } = await supabase.from("biji_relai").update({ date: entry.date, tons: entry.tons }).eq("id", entry.id);
    if (error) { setToast({ type: "error", message: error.message || t("msg.failedUpdate") }); return; }
    loadBijiRelai(selectedBlock!);
    setToast({ type: "success", message: t("msg.bijiRelaiUpdated") });
  };

  const handleDeleteBijiRelai = async (id: string) => {
    if (!confirm(t("confirm.deleteBijiRelai"))) return;
    await supabase.from("biji_relai").delete().eq("id", id);
    if (selectedBlock) loadBijiRelai(selectedBlock);
    setToast({ type: "success", message: t("msg.bijiRelaiDeleted") });
  };

  const handleOpenBijiRelai = () => {
    if (selectedBlock) loadBijiRelai(selectedBlock);
    bijiRelaiFormDispatch({ type: "OPEN" });
  };

  const handleEditEntry = (entry: DailyEntry) => {
    detailDispatch({ type: "LOAD", entry });
    setSavedId(`de_${Date.now()}`);
    filterDispatch({ type: "SET", field: "showFilterPanel", value: false });
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm(t("confirm.deleteEntry"))) return;
    await supabase.from("daily_entries").delete().eq("id", id);
    if (selectedLeader) await loadLeaderData(selectedLeader.id);
    setToast({ type: "success", message: t("msg.entryDeleted") });
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
    await supabase.from("team_leaders").delete().eq("id", id);
    if (selectedLeader?.id === id) { setSelectedLeader(null); setLeaderEntries([]); setLeaderStats(defaultStats); }
    await loadData();
    if (selectedBlock) await loadOrgChartData(selectedBlock);
    setToast({ type: "success", message: t("msg.leaderRemoved") });
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

  const handleClearFilter = () => { filterDispatch({ type: "RESET" }); };

  useEffect(() => { if (toast) { const timer = setTimeout(() => setToast(null), 3000); return () => clearTimeout(timer); } }, [toast]);
  useEffect(() => {
    if (selectedBlock) {
      loadOrgChartData(selectedBlock);
      loadBijiRelai(selectedBlock);
      bijiRelaiFormDispatch({ type: "NEW_ENTRY" });
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
    detailViewDispatch({ type: "RESET_MONTH" });
    loadDetailData(leader);
  };

  const detailFormatMonthLabel = (ym: string) => { const [y, m] = ym.split("-").map(Number); return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" }); };

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

  // Determine which view level we're at for AnimatePresence
  const viewLevel = selectedLeader ? "leader" : viewingLeader ? "leader" : selectedBlock ? "org" : "blocks";

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-6 sm:mb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}>
            <h1 className="page-title text-2xl sm:text-3xl text-theme tracking-tight">{t("team.title")}</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {selectedBlock ? `${selectedP?.rancangan}, Peringkat ${selectedP?.peringkat} — Block ${selectedP?.block}` : t("team.selectBlock")}
            </p>
          </motion.div>
          {!selectedBlock && (
            <motion.button whileHover={{ scale: 1.05, boxShadow: "0 4px 20px rgba(245,158,11,0.3)" }} whileTap={{ scale: 0.95 }} onClick={() => leaderFormDispatch({ type: "OPEN" })}
              aria-label="Add team leader"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-theme transition-all w-full sm:w-auto min-h-[44px]" style={{ background: "linear-gradient(to right, #f59e0b, #d97706)" }}>
              <Plus className="w-4 h-4" /> {t("team.addLeader")}
            </motion.button>
          )}
        </motion.div>

        {/* Date Filter Bar */}
        <AnimatePresence>
          {selectedLeader && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: "easeOut" }} className="mb-4 sm:mb-6">
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                  <input type="date" className="flex-1 sm:flex-none px-3 py-2 rounded border border-[var(--border-default)] bg-[var(--bg-elevated)] text-sm text-theme outline-none min-w-0 sm:min-w-[140px]" value={entryForm.date} onChange={(e) => { setEntryField("date", e.target.value); filterDispatch({ type: "SET", field: "showFilterPanel", value: false }); }} />
                </div>
                <motion.button whileHover={{ scale: 1.03, backgroundColor: "var(--accent-subtle)" }} whileTap={{ scale: 0.97 }} onClick={() => filterDispatch({ type: "SET", field: "showFilterPanel", value: !filters.showFilterPanel })}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all min-h-[40px]" style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)" }}>
                  <Calendar className="w-4 h-4" /> {t("entry.filterByDate")}
                </motion.button>
              </motion.div>
              <FilterPanel show={filters.showFilterPanel} onToggle={() => filterDispatch({ type: "SET", field: "showFilterPanel", value: !filters.showFilterPanel })} filterDate={filters.filterDate} filterFrom={filters.filterFrom} filterTo={filters.filterTo}
                onFilterDateChange={(val) => { filterDispatch({ type: "SET", field: "filterDate", value: val }); filterDispatch({ type: "SET", field: "filterMode", value: "single" }); }}
                onFilterFromChange={(val) => { filterDispatch({ type: "SET", field: "filterFrom", value: val }); filterDispatch({ type: "SET", field: "filterMode", value: "range" }); }}
                onFilterToChange={(val) => { filterDispatch({ type: "SET", field: "filterTo", value: val }); filterDispatch({ type: "SET", field: "filterMode", value: "range" }); }}
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
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("team.noPlantations")}</p>
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
              {sortedLeaders.length === 0 && <EmptyLeaderState onAdd={() => leaderFormDispatch({ type: "OPEN" })} />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Biji Relai Modal */}
        {selectedP && (
          <BijiRelaiModal
            open={bijiRelaiForm.showModal}
            onClose={() => bijiRelaiFormDispatch({ type: "CLOSE" })}
            plantation={selectedP}
            entries={bijiRelaiEntries}
            date={bijiRelaiForm.date}
            tons={bijiRelaiForm.tons}
            saving={bijiRelaiForm.saving}
            savedId={bijiRelaiForm.savedId}
            onDateChange={(v) => bijiRelaiFormDispatch({ type: "SET", field: "date", value: v })}
            onTonsChange={(v) => bijiRelaiFormDispatch({ type: "SET", field: "tons", value: v })}
            onSubmit={handleSubmitBijiRelai}
            onNewEntry={() => bijiRelaiFormDispatch({ type: "NEW_ENTRY" })}
            onEdit={handleEditBijiRelai}
            onDelete={handleDeleteBijiRelai}
          />
        )}

        {/* Data Entry Form */}
        <AnimatePresence>
          {selectedLeader && (
            <motion.div key="entry-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.3, ease: "easeOut" }}>
              <EntryForm leader={selectedLeader} plantation={selectedP || null} workStatus={entryForm.workStatus} date={entryForm.date} numWorkers={entryForm.numWorkers} lot={entryForm.lot} bunches={entryForm.bunches} tons={entryForm.tons} backlogs={entryForm.backlogs} notes={entryForm.notes} latitude={entryForm.latitude} longitude={entryForm.longitude} lotLabel={entryForm.lotLabel} saving={saving} savedId={savedId}
                canUndo={entryFormUndo.canUndo} canRedo={entryFormUndo.canRedo} historyLength={entryFormUndo.historyLength}
                onWorkStatusChange={(v)=>setEntryField("workStatus",v)} onDateChange={(v)=>setEntryField("date",v)} onNumWorkersChange={(v)=>setEntryField("numWorkers",v)} onLotChange={(v)=>setEntryField("lot",v)} onBunchesChange={(v)=>setEntryField("bunches",v)} onTonsChange={(v)=>setEntryField("tons",v)} onBacklogsChange={(v)=>setEntryField("backlogs",v)} onNotesChange={(v)=>setEntryField("notes",v)}
                onLatitudeChange={(v)=>setEntryField("latitude",v)} onLongitudeChange={(v)=>setEntryField("longitude",v)} onLotLabelChange={(v)=>setEntryField("lotLabel",v)}
                onUseMyLocation={() => {
                  if (!navigator.geolocation) return;
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setEntryField("latitude", pos.coords.latitude.toFixed(7));
                      setEntryField("longitude", pos.coords.longitude.toFixed(7));
                    },
                    () => {}
                  );
                }}
                onSubmit={handleSubmitEntry} onNewEntry={() => { setSavedId(null); entryFormUndo.setState(emptyEntryForm, { addToHistory: false }); entryFormUndo.clearHistory(); }}
                onClose={handleBackToOrgChart}
                onUndo={entryFormUndo.undo} onRedo={entryFormUndo.redo} />
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
                  aria-label="Back to org chart"
                  className="flex items-center gap-2 mb-4 px-4 py-2 rounded-xl text-sm font-medium transition-all" style={{ color: "var(--text-muted)", border: "1px solid rgba(245,158,11,0.12)" }}>
                  <ChevronLeft className="w-4 h-4" /> {t("team.backToBlocks")}
                </motion.button>

                <div className="card-glow rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6" style={{ backgroundColor: "var(--bg-card)" }}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--accent-subtle)" }}>
                        <Users className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "var(--accent-primary)" }} />
                      </div>
                      <div>
                        <h2 className="page-title text-xl sm:text-2xl text-theme">{viewingLeader.name}</h2>
                        {viewingLeader.phone && (<div className="flex items-center gap-2 mt-1"><Phone className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} /><span className="text-sm" style={{ color: "var(--text-muted)" }}>{viewingLeader.phone}</span></div>)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ backgroundColor: "var(--accent-subtle)" }}><MapPin className="w-3.5 h-3.5" style={{ color: "var(--accent-primary)" }} /><span className="text-xs sm:text-sm font-medium text-theme">Block {plantation?.block}</span></div>
                      <div className="px-3 py-1.5 rounded-xl" style={{ backgroundColor: "var(--accent-subtle)" }}><span className="text-xs sm:text-sm" style={{ color: "var(--text-secondary)" }}>{plantation?.rancangan}</span></div>
                      <div className="px-3 py-1.5 rounded-xl" style={{ backgroundColor: "var(--accent-subtle)" }}><span className="text-xs sm:text-sm" style={{ color: "var(--text-secondary)" }}>Peringkat {plantation?.peringkat}</span></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  {[{ label: t("detail.workingDays"), value: detailStats.workDays, icon: Calendar, color: "var(--accent-primary)", bg: "var(--accent-subtle)" },
                    { label: t("detail.totalBunches"), value: detailStats.totalBunches, icon: TrendingUp, color: "var(--accent-purple)", bg: "rgba(139,92,246,0.12)" },
                    { label: t("detail.totalTonnage"), value: `${Number(detailStats.totalTons).toFixed(2)} ton`, icon: Truck, color: "var(--accent-blue)", bg: "rgba(59,130,246,0.12)" },
                    { label: t("detail.totalBacklogs"), value: detailStats.totalBacklogs, icon: AlertCircle, color: "var(--accent-amber)", bg: "rgba(245,158,11,0.12)" },
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
                  {[{ label: t("detail.avgBunchesDay"), value: detailStats.avgBunches, color: "var(--accent-purple)" },
                    { label: t("detail.avgTonsDay"), value: detailStats.avgTons, color: "var(--accent-primary)" },
                    { label: t("detail.avgWorkersDay"), value: detailStats.avgWorkers, color: "var(--accent-blue)" },
                  ].map((s) => (
                    <div key={s.label} className="card-glow rounded-2xl p-4 sm:p-5" style={{ backgroundColor: "var(--bg-card)" }}>
                      <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>{s.label}</div>
                      <div className="text-xl sm:text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                <div className="card-glow rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6" style={{ backgroundColor: "var(--bg-card)" }}>
                  <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => detailViewDispatch({ type: "PREV_MONTH" })} aria-label="Previous month" className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10" style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)", border: "1px solid rgba(245,158,11,0.2)" }}><ChevronLeft className="w-4 h-4" /></button>
                      <div className="relative">
                        <Calendar className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--accent-primary)" }} />
                        <input type="month" value={detailView.month} onChange={(e) => detailViewDispatch({ type: "SET", field: "month", value: e.target.value })} className="pl-8 sm:pl-9 pr-2 sm:pr-3 py-2 rounded-xl border text-xs sm:text-sm text-theme outline-none cursor-pointer" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)", color: "white" }} />
                      </div>
                      <button onClick={() => detailViewDispatch({ type: "NEXT_MONTH" })} aria-label="Next month" className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10" style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)", border: "1px solid rgba(245,158,11,0.2)" }}><ChevronDown className="w-4 h-4 rotate-[-90deg]" /></button>
                      <span className="text-xs sm:text-sm font-semibold text-theme ml-1 hidden sm:inline">{detailFormatMonthLabel(detailView.month)}</span>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)" }}>{detailFilteredEntries.length} {t("detail.entries")}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 sm:gap-3 pt-3" style={{ borderTop: "1px solid rgba(245,158,11,0.12)" }}>
                    <div className="flex-1"><label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>{t("entry.from")}</label><input type="date" value={detailView.dateFrom} onChange={(e) => detailViewDispatch({ type: "SET", field: "dateFrom", value: e.target.value })} className="w-full px-3 py-2 rounded border text-xs sm:text-sm text-theme outline-none cursor-pointer" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }} /></div>
                    <div className="flex-1"><label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>{t("entry.to")}</label><input type="date" value={detailView.dateTo} onChange={(e) => detailViewDispatch({ type: "SET", field: "dateTo", value: e.target.value })} className="w-full px-3 py-2 rounded border text-xs sm:text-sm text-theme outline-none cursor-pointer" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }} /></div>
                    {(detailView.dateFrom || detailView.dateTo) && (<button onClick={() => detailViewDispatch({ type: "RESET_MONTH" })} aria-label="Clear date range" className="px-3 py-2 rounded-xl text-xs font-medium transition-colors min-h-[36px] shrink-0" style={{ backgroundColor: "var(--accent-red-light)", color: "var(--accent-red)", border: "1px solid rgba(239,68,68,0.2)" }}>{t("entry.clearFilter")}</button>)}
                  </div>
                </div>

                <div className="card-glow rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)" }}>
                  <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border-default)" }}><BarChart3 className="w-4 h-4" style={{ color: "var(--accent-primary)" }} /><h3 className="card-title text-sm text-theme">{t("detail.allEntries")}</h3></div>
                  {detailFilteredEntries.length === 0 ? (
                    <div className="p-12 text-center"><Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-muted)" }} /><p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("detail.noEntriesPeriod")}</p></div>
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
                                <td className="px-4 py-3 whitespace-nowrap"><span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: isNoWork ? "var(--status-no-work-bg)" : "var(--status-work-bg)", color: isNoWork ? "var(--status-no-work)" : "var(--status-work)" }}>{isNoWork ? t("status.noWork") : t("status.work")}</span></td>
                                <td className="px-4 py-3 text-sm text-right" style={{ color: "var(--text-secondary)" }}>{isNoWork ? "-" : (e.num_workers ?? "-")}</td>
                                <td className="px-4 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>{isNoWork ? "-" : (e.lot || "-")}</td>
                                <td className="px-4 py-3 text-sm text-right" style={{ color: "var(--text-secondary)" }}>{isNoWork ? "-" : (e.bunches ?? "-")}</td>
                                <td className="px-4 py-3 text-sm font-medium text-theme text-right">{e.tons != null && e.tons !== 0 ? Number(e.tons).toFixed(2) : "-"}</td>
                                <td className="px-4 py-3 text-sm text-right" style={{ color: "var(--text-secondary)" }}>{isNoWork ? "-" : (e.backlogs || "-")}</td>
                                <td className="px-4 py-3 text-sm truncate max-w-[200px]" style={{ color: "var(--text-muted)" }}>{e.notes || "-"}</td>
                                <td className="px-4 py-3"><div className="flex items-center justify-center gap-1">
                                  <button onClick={() => handleDetailEditEntry(e)} className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10" style={{ color: "var(--accent-blue)" }} title="Edit" aria-label="Edit entry"><Edit2 className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => handleDetailDeleteEntry(e.id)} className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10" style={{ color: "var(--accent-red)" }} title="Delete" aria-label="Delete entry"><Trash2 className="w-3.5 h-3.5" /></button>
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
                            <div key={e.id} className="p-4 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-theme font-medium">{e.date ? e.date.split("-").reverse().join("/") : "-"}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: isNoWork ? "var(--status-no-work-bg)" : "var(--status-work-bg)", color: isNoWork ? "var(--status-no-work)" : "var(--status-work)" }}>{isNoWork ? t("status.noWork") : t("status.work")}</span>
                                  <button onClick={() => handleDetailEditEntry(e)} aria-label="Edit entry" className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10" style={{ color: "var(--accent-blue)" }}><Edit2 className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => handleDetailDeleteEntry(e.id)} aria-label="Delete entry" className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10" style={{ color: "var(--accent-red)" }}><Trash2 className="w-3.5 h-3.5" /></button>
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
          })()}
        </AnimatePresence>

        {/* Detail View Edit Modal */}
        <EditEntryModal show={detailView.showEditModal} entry={detailView.editEntry} saving={detailView.saving}
          onSave={handleDetailSaveEdit} onClose={() => detailViewDispatch({ type: "CLOSE_EDIT" })} />

        {/* Add Leader Modal */}
        <AddLeaderModal show={leaderForm.showModal} selectedBlockId={selectedBlock} selectedPlantation={selectedP || null} name={leaderForm.name} phone={leaderForm.phone} saving={saving}
          onNameChange={(v) => leaderFormDispatch({ type: "SET", field: "name", value: v })} onPhoneChange={(v) => leaderFormDispatch({ type: "SET", field: "phone", value: v })} onSubmit={handleSaveLeader} onClose={() => leaderFormDispatch({ type: "CLOSE" })} />

        {/* Toast */}
        <Toast toast={toast} onDismiss={() => setToast(null)} position="bottom-right" />
      </div>
    </DashboardLayout>
  );
}
