"use client";
import { Suspense, useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, MapPin, ChevronLeft, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useTeamPageReducers, emptyEntryForm, type EntryFormState } from "@/hooks/useTeamPageReducers";
import { useTeamPageData } from "@/hooks/useTeamPageData";
import { useI18n } from "@/lib/i18n";
import BlockSelector from "@/components/team/BlockSelector";
import LeaderOrgChart from "@/components/team/LeaderOrgChart";
import EntryForm from "@/components/team/EntryForm";
import FilterPanel from "@/components/team/FilterPanel";
import AddLeaderModal from "@/components/team/AddLeaderModal";
import EditEntryModal from "@/components/team/EditEntryModal";
import BijiRelaiModal from "@/components/team/BijiRelaiModal";
import LeaderDetailView from "@/components/team/LeaderDetailView";
import EmptyLeaderState from "@/components/team/EmptyLeaderState";
import Toast from "@/components/ui/Toast";
import { BlockCardSkeleton, FadeIn } from "@/components/ui/Skeleton";

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
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const entryFormUndo = useUndoRedo(emptyEntryForm, { limit: 30 });
  const entryForm = entryFormUndo.state;
  const setEntryField = (field: keyof EntryFormState, value: string) =>
    entryFormUndo.setState((prev) => ({ ...prev, [field]: value }));

  const {
    filters, filterDispatch,
    detailDispatch,
    detailView, detailViewDispatch,
    leaderForm, leaderFormDispatch,
    bijiRelaiForm, bijiRelaiFormDispatch,
  } = useTeamPageReducers();

  const {
    plantations, teamLeaders,
    selectedBlock, setSelectedBlock,
    selectedLeader, setSelectedLeader,
    leaderEntries, leaderStats, leaderLatestEntries,
    blockLastEntries, blockWorkersToday,
    bijiRelaiEntries,
    viewingLeader, setViewingLeader,
    detailFilteredEntries, detailStats,
    saving, savedId, setSavedId, deletingId,
    filteredEntries, blockLeaders, sortedLeaders, selectedP,
    loadData, loadOrgChartData,
    handleSelectLeader,     handleSubmitEntry,
    handleSubmitBijiRelai, handleEditBijiRelai, handleDeleteBijiRelai, handleOpenBijiRelai,
    handleBijiRelaiChangeMonth,
    handleEditEntry, handleDeleteEntry,
    handleSaveLeader, handleDeleteLeader,
    handleBackToBlocks, handleBackToOrgChart, handleClearFilter,
    handleViewDetails, handleDetailEditEntry, handleDetailSaveEdit, handleDetailDeleteEntry,
  } = useTeamPageData({
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
  });

  // --- Browser back-button: track previous block for popstate logic ---
  const prevBlockRef = useRef<string | null>(selectedBlock);

  useEffect(() => { if (toast) { const timer = setTimeout(() => setToast(null), 3000); return () => clearTimeout(timer); } }, [toast]);

  // --- Browser back-button handler ---
  useEffect(() => {
    const handlePopState = () => {
      const currentBlock = new URLSearchParams(window.location.search).get("block");
      const prevBlock = prevBlockRef.current;

      if (selectedLeader || viewingLeader) {
        setSelectedLeader(null);
        setViewingLeader(null);
        if (currentBlock) setSelectedBlock(currentBlock);
      } else if (prevBlock && !currentBlock) {
        setSelectedBlock(null);
      } else if (currentBlock && currentBlock !== prevBlock) {
        setSelectedBlock(currentBlock); setSelectedLeader(null);
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
    if (blockParam === prevBlockRef.current) return;
    if (blockParam !== selectedBlock) {
      setSelectedBlock(blockParam); setSelectedLeader(null);
      if (blockParam) loadOrgChartData(blockParam);
    }
    prevBlockRef.current = blockParam;
  }, [searchParams.get("block")]);

  const detailFormatMonthLabel = (ym: string) => { const [y, m] = ym.split("-").map(Number); return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" }); };

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
                focusedLeaderId={selectedLeader?.id || viewingLeader?.id}
                deletingId={deletingId} />
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
            month={bijiRelaiForm.month}
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
            onChangeMonth={handleBijiRelaiChangeMonth}
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
                  if (!navigator.geolocation) {
                    setToast({ type: "error", message: "Geolocation is not supported by your browser." });
                    return;
                  }
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setEntryField("latitude", pos.coords.latitude.toFixed(7));
                      setEntryField("longitude", pos.coords.longitude.toFixed(7));
                    },
                    (err) => {
                      if (err.code === err.PERMISSION_DENIED) {
                        setToast({ type: "error", message: "Location access denied. Please enable location permissions in your browser settings." });
                      } else if (err.code === err.POSITION_UNAVAILABLE) {
                        setToast({ type: "error", message: "Location information is unavailable." });
                      } else if (err.code === err.TIMEOUT) {
                        setToast({ type: "error", message: "Location request timed out. Please try again." });
                      } else {
                        setToast({ type: "error", message: "Failed to get location. Please try again." });
                      }
                    }
                  );
                }}
                onSubmit={handleSubmitEntry} onNewEntry={() => { setSavedId(null); entryFormUndo.setState(emptyEntryForm, { addToHistory: false }); entryFormUndo.clearHistory(); }}
                onClose={handleBackToOrgChart}
                onUndo={entryFormUndo.undo} onRedo={entryFormUndo.redo} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Leader Detail View */}
        <AnimatePresence>
          {viewingLeader && (
            <LeaderDetailView
              leader={viewingLeader}
              detailStats={detailStats}
              detailView={detailView}
              detailFilteredEntries={detailFilteredEntries}
              detailViewDispatch={detailViewDispatch}
              onBack={handleBackToOrgChart}
              onEditEntry={handleDetailEditEntry}
              onDeleteEntry={handleDetailDeleteEntry}
              detailFormatMonthLabel={detailFormatMonthLabel}
            />
          )}
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
