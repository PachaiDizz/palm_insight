"use client";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/components/AuthProvider";
import { useMapEntries, useAllTeamLeaders } from "@/lib/useMapEntries";
import { usePlantations } from "@/lib/queries";
import { useI18n } from "@/lib/i18n";
import { toLocalDateKey } from "@/lib/date";
import { supabase } from "@/lib/supabaseClient";
import { useQueryClient } from "@tanstack/react-query";
import TeamListPanel from "./TeamListPanel";
import MapRightPanel from "./MapRightPanel";
import { ChevronLeft, ChevronRight, Calendar, X, MapPin, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DEFAULT_MAP_CENTER } from "./PlantationData";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

interface ClickedMarker {
  lat: number;
  lng: number;
}

export interface Drawing {
  from: [number, number];
  to: [number, number];
  color: string;
  weight: number;
}

export type DrawMode = "select" | "draw";

export default function MapClient() {
  const { user } = useAuth();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(toLocalDateKey(new Date()));
  const [selectedBlock, setSelectedBlock] = useState<string>("all");
  const [flyToTarget, setFlyToTarget] = useState<[number, number] | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(1.0);
  const [clickedMarker, setClickedMarker] = useState<ClickedMarker | null>(null);
  const [lotLabel, setLotLabel] = useState("");
  const [selectedTeamLeader, setSelectedTeamLeader] = useState<string>("");
  const [markerDate, setMarkerDate] = useState(toLocalDateKey(new Date()));
  const [saving, setSaving] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Mobile controls panel
  const [showMobileControls, setShowMobileControls] = useState(false);

  // Draw mode state
  const [drawMode, setDrawMode] = useState<DrawMode>("select");
  const [drawStart, setDrawStart] = useState<[number, number] | null>(null);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [selectedColor, setSelectedColor] = useState("#ffffff");
  const [selectedWeight, setSelectedWeight] = useState<"thin" | "normal" | "thick">("normal");

  // Zoom level
  const [zoomLevel, setZoomLevel] = useState(14);

  // Persist drawings
  useEffect(() => {
    try {
      localStorage.setItem("palminsight_drawings", JSON.stringify(drawings));
    } catch {}
  }, [drawings]);

  // Load drawings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("palminsight_drawings");
      if (stored) setDrawings(JSON.parse(stored));
    } catch {}
  }, []);

  const { data: entries = [], isLoading } = useMapEntries(user?.id, selectedDate);
  const { data: allLeaders = [] } = useAllTeamLeaders(user?.id);
  const { data: plantations = [] } = usePlantations(user?.id);

  // Local state for entries to enable immediate updates without page refresh
  const [entriesLocal, setEntriesLocal] = useState(entries);

  // Sync with query data when it changes
  useEffect(() => {
    setEntriesLocal(entries);
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (selectedBlock === "all") return entriesLocal;
    return entriesLocal.filter((e) => e.block === selectedBlock);
  }, [entriesLocal, selectedBlock]);

  const handleSelectTeam = (lat: number, lng: number) => {
    setFlyToTarget([lat, lng]);
    setTimeout(() => setFlyToTarget(null), 100);
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (drawMode === "draw") return;
    setClickedMarker({ lat, lng });
    setLotLabel("");
    setSelectedTeamLeader(allLeaders.length > 0 ? allLeaders[0].id : "");
    setMarkerDate(selectedDate);
  };

  const handleSaveMarker = async () => {
    if (!user || !clickedMarker || !selectedTeamLeader) return;
    setSaving(true);

    const { data: leader } = await supabase
      .from("team_leaders")
      .select("id, plantation_id")
      .eq("id", selectedTeamLeader)
      .single();

    if (!leader) {
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("daily_entries").insert({
      user_id: user.id,
      team_leader_id: leader.id,
      plantation_id: leader.plantation_id,
      work_status: "work",
      date: markerDate,
      latitude: clickedMarker.lat,
      longitude: clickedMarker.lng,
      lot_label: lotLabel || null,
      num_workers: 0,
      bunches: 0,
      tons: 0,
    });

    if (!error) {
      setClickedMarker(null);
      setLotLabel("");
      setSelectedTeamLeader("");
      // Update local entries by adding the new marker
      queryClient.invalidateQueries({ queryKey: ["mapEntries", user?.id] });
    }
    setSaving(false);
  };

  const handleResetView = useCallback(() => {
    setZoomLevel(14);
    setFlyToTarget(DEFAULT_MAP_CENTER);
    setTimeout(() => setFlyToTarget(null), 100);
  }, []);

  const handleClearDrawings = useCallback(() => {
    setDrawings([]);
    setDrawStart(null);
  }, []);

  const handleDeleteMarker = useCallback(async (markerId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("daily_entries")
      .update({ latitude: null, longitude: null, lot_label: null })
      .eq("id", markerId)
      .eq("user_id", user.id);

    if (!error) {
      // Remove from local state without page refresh
      setEntriesLocal((prev) => prev.filter((e) => e.id !== markerId));
    }
  }, [user]);

  const handleClearAllMarkers = useCallback(async () => {
    if (!user) return;
    const { error } = await supabase
      .from("daily_entries")
      .update({ latitude: null, longitude: null, lot_label: null })
      .eq("user_id", user.id)
      .eq("date", selectedDate)
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (!error) {
      // Remove from local state without page refresh
      setEntriesLocal((prev) =>
        prev.filter((e) => !(e.date === selectedDate && e.latitude != null))
      );
    }
  }, [user, selectedDate]);

  const adjustDate = (offset: number) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + offset);
    setSelectedDate(toLocalDateKey(d));
  };

  const formattedDate = new Date(selectedDate + "T00:00:00").toLocaleDateString("en-MY", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Escape key to exit draw mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && drawMode === "draw") {
        setDrawMode("select");
        setDrawStart(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawMode]);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-4 sm:px-6 py-3 shrink-0" style={{ borderBottom: "1px solid var(--border-default)" }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-theme tracking-tight">
              {t("map.title")}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {t("map.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Date selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => adjustDate(-1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)" }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="relative">
                <Calendar
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "var(--accent-primary)" }}
                />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-9 pr-3 py-2 rounded-xl border text-sm text-theme outline-none cursor-pointer"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    borderColor: "var(--border-default)",
                  }}
                />
              </div>
              <button
                onClick={() => adjustDate(1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)" }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium hidden sm:inline" style={{ color: "var(--text-muted)" }}>
                {formattedDate}
              </span>
            </div>

            {/* Block filter */}
            {plantations.length > 1 && (
              <select
                value={selectedBlock}
                onChange={(e) => setSelectedBlock(e.target.value)}
                className="px-3 py-2 rounded-xl border text-sm text-theme outline-none"
                style={{
                  backgroundColor: "var(--bg-card)",
                  borderColor: "var(--border-default)",
                }}
              >
                <option value="all">{t("map.allBlocks")}</option>
                {[...new Set(plantations.map((p) => p.block))].sort().map((block) => (
                  <option key={block} value={block}>
                    Block {block}
                  </option>
                ))}
              </select>
            )}

            {/* Entry count */}
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)" }}
            >
              {filteredEntries.length} {filteredEntries.length === 1 ? "marker" : "markers"}
            </span>
          </div>
        </div>
      </div>

      {/* Main content — 3-column layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left panel — Team List */}
        <div className="hidden lg:block w-[280px] shrink-0 overflow-y-auto" style={{ borderRight: "1px solid var(--border-default)" }}>
          <TeamListPanel
            entries={filteredEntries}
            allLeaders={allLeaders}
            onSelectTeam={handleSelectTeam}
          />
        </div>

        {/* Center — Map */}
        <div
          className="flex-1 min-w-0 relative"
          ref={mapContainerRef}
          style={{
            border: drawMode === "draw" ? "2px solid rgba(16, 185, 129, 0.4)" : "none",
          }}
        >
          {isLoading ? (
            <div
              className="flex items-center justify-center h-full"
              style={{ backgroundColor: "var(--bg-card)" }}
            >
              <div className="text-center">
                <div
                  className="w-10 h-10 mx-auto mb-3 rounded-xl flex items-center justify-center animate-pulse"
                  style={{ backgroundColor: "var(--accent-subtle)" }}
                >
                  <MapPin className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
                </div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading map...</p>
              </div>
            </div>
          ) : (
            <MapView
              entries={filteredEntries}
              flyTo={flyToTarget}
              overlayOpacity={overlayOpacity}
              onMapClick={handleMapClick}
              onDeleteMarker={handleDeleteMarker}
              zoomLevel={zoomLevel}
              drawMode={drawMode}
              drawStart={drawStart}
              onDrawStartChange={setDrawStart}
              drawings={drawings}
              onDrawingComplete={(drawing) => setDrawings((prev) => [...prev, drawing])}
              selectedColor={selectedColor}
              selectedWeight={selectedWeight === "thin" ? 1.5 : selectedWeight === "thick" ? 4.0 : 2.5}
            />
          )}

          {/* Draw mode hint */}
          {drawMode === "draw" && (
            <div
              className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{
                backgroundColor: "rgba(10, 20, 10, 0.95)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                color: "#10b981",
              }}
            >
              {drawStart ? "Click to set end point" : "Click on map to set arrow start point"}
            </div>
          )}

          {/* Mobile floating controls button */}
          <button
            onClick={() => setShowMobileControls(true)}
            className="lg:hidden absolute bottom-4 right-4 z-[1000] w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
            style={{
              backgroundColor: "rgba(10, 20, 10, 0.95)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
            }}
          >
            <Settings className="w-5 h-5" style={{ color: "#10b981" }} />
          </button>
        </div>

        {/* Right panel — Controls (desktop only) */}
        <div className="hidden lg:flex w-[260px] shrink-0 flex-col overflow-y-auto" style={{ background: "#0a1505", borderLeft: "1px solid rgba(16, 185, 129, 0.1)" }}>
          <MapRightPanel
            overlayOpacity={overlayOpacity}
            onOpacityChange={setOverlayOpacity}
            zoomLevel={zoomLevel}
            onZoomChange={setZoomLevel}
            onResetView={handleResetView}
            drawMode={drawMode}
            onDrawModeChange={setDrawMode}
            drawStart={drawStart}
            drawings={drawings}
            selectedColor={selectedColor}
            onColorChange={setSelectedColor}
            selectedWeight={selectedWeight}
            onWeightChange={setSelectedWeight}
            onClearDrawings={handleClearDrawings}
            markerCount={filteredEntries.length}
            onClearAllMarkers={handleClearAllMarkers}
          />
        </div>
      </div>

      {/* Mobile team list */}
      <div className="lg:hidden shrink-0" style={{ borderTop: "1px solid var(--border-default)" }}>
        <TeamListPanel
          entries={filteredEntries}
          allLeaders={allLeaders}
          onSelectTeam={handleSelectTeam}
        />
      </div>

      {/* Mobile controls bottom sheet */}
      <AnimatePresence>
        {showMobileControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] lg:hidden"
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowMobileControls(false)} />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl"
              style={{ background: "#0a1505" }}
            >
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(16, 185, 129, 0.15)" }}>
                <span className="text-sm font-semibold" style={{ color: "#10b981" }}>Controls</span>
                <button onClick={() => setShowMobileControls(false)} className="p-1.5 rounded-lg" style={{ color: "#6b7280" }}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <MapRightPanel
                overlayOpacity={overlayOpacity}
                onOpacityChange={setOverlayOpacity}
                zoomLevel={zoomLevel}
                onZoomChange={setZoomLevel}
                onResetView={handleResetView}
                drawMode={drawMode}
                onDrawModeChange={setDrawMode}
                drawStart={drawStart}
                drawings={drawings}
                selectedColor={selectedColor}
                onColorChange={setSelectedColor}
                selectedWeight={selectedWeight}
                onWeightChange={setSelectedWeight}
                onClearDrawings={handleClearDrawings}
                markerCount={filteredEntries.length}
                onClearAllMarkers={handleClearAllMarkers}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click-to-Mark Modal */}
      <AnimatePresence>
        {clickedMarker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setClickedMarker(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-default)",
              }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-default)" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--accent-subtle)" }}>
                    <MapPin className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
                  </div>
                  <span className="text-sm font-semibold text-theme">Add Marker</span>
                </div>
                <button
                  onClick={() => setClickedMarker(null)}
                  className="p-1.5 rounded-lg transition-colors hover:bg-[var(--hover-subtle)]"
                  style={{ color: "var(--text-muted)" }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: "var(--bg-base)" }}>
                    <span style={{ color: "var(--text-muted)" }}>Lat: </span>
                    <span className="font-mono text-theme">{clickedMarker.lat.toFixed(6)}</span>
                  </div>
                  <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: "var(--bg-base)" }}>
                    <span style={{ color: "var(--text-muted)" }}>Lng: </span>
                    <span className="font-mono text-theme">{clickedMarker.lng.toFixed(6)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Date</label>
                  <input
                    type="date"
                    value={markerDate}
                    onChange={(e) => setMarkerDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-theme outline-none border"
                    style={{
                      backgroundColor: "var(--bg-base)",
                      borderColor: "var(--border-default)",
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Lot Label</label>
                  <input
                    type="text"
                    placeholder="e.g. LOT 747"
                    value={lotLabel}
                    onChange={(e) => setLotLabel(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-theme outline-none border"
                    style={{
                      backgroundColor: "var(--bg-base)",
                      borderColor: "var(--border-default)",
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>For Who (Team)</label>
                  <select
                    value={selectedTeamLeader}
                    onChange={(e) => setSelectedTeamLeader(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-theme outline-none border"
                    style={{
                      backgroundColor: "var(--bg-base)",
                      borderColor: "var(--border-default)",
                    }}
                  >
                    <option value="">Select Team Leader</option>
                    {allLeaders.map((leader, index) => (
                      <option key={leader.id} value={leader.id}>
                        Team {index + 1} - {leader.name} (Block {leader.block})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setClickedMarker(null)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    style={{ backgroundColor: "var(--hover-subtle)", color: "var(--text-muted)" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveMarker}
                    disabled={saving || !selectedTeamLeader}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                  >
                    {saving ? "Saving..." : "Save Marker"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
