"use client";
import { useState, useMemo, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/components/AuthProvider";
import { useMapEntries, useAllTeamLeaders } from "@/lib/useMapEntries";
import { usePlantations } from "@/lib/queries";
import { useI18n } from "@/lib/i18n";
import { toLocalDateKey } from "@/lib/date";
import { supabase } from "@/lib/supabaseClient";
import TeamListPanel from "./TeamListPanel";
import MapControls from "./MapControls";
import { ChevronLeft, ChevronRight, Calendar, X, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

interface ClickedMarker {
  lat: number;
  lng: number;
}

export default function MapClient() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [selectedDate, setSelectedDate] = useState(toLocalDateKey(new Date()));
  const [selectedBlock, setSelectedBlock] = useState<string>("all");
  const [flyToTarget, setFlyToTarget] = useState<[number, number] | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(1.0);
  const [clickedMarker, setClickedMarker] = useState<ClickedMarker | null>(null);
  const [lotLabel, setLotLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const { data: entries = [], isLoading } = useMapEntries(user?.id, selectedDate);
  const { data: allLeaders = [] } = useAllTeamLeaders(user?.id);
  const { data: plantations = [] } = usePlantations(user?.id);

  const filteredEntries = useMemo(() => {
    if (selectedBlock === "all") return entries;
    return entries.filter((e) => e.block === selectedBlock);
  }, [entries, selectedBlock]);

  const handleSelectTeam = (lat: number, lng: number) => {
    setFlyToTarget([lat, lng]);
    setTimeout(() => setFlyToTarget(null), 100);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setClickedMarker({ lat, lng });
    setLotLabel("");
  };

  const handleSaveMarker = async () => {
    if (!user || !clickedMarker) return;
    setSaving(true);

    // Get the first team leader to associate with
    const { data: leaders } = await supabase
      .from("team_leaders")
      .select("id, plantation_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (!leaders) {
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("daily_entries").insert({
      user_id: user.id,
      team_leader_id: leaders.id,
      plantation_id: leaders.plantation_id,
      work_status: "work",
      date: selectedDate,
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
      // Refresh entries
      window.location.reload();
    }
    setSaving(false);
  };

  const handleFitAll = useCallback(() => {
    // Access the map instance through the DOM
    const mapEl = document.querySelector(".leaflet-container") as any;
    if (mapEl && mapEl.__fitAll) {
      mapEl.__fitAll();
    }
  }, []);

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

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="page-title text-2xl sm:text-3xl text-theme tracking-tight">
            {t("map.title")}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {t("map.subtitle")}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
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

      {/* Main content */}
      <div className="flex gap-4">
        {/* Team list panel — desktop sidebar */}
        <div className="hidden lg:block w-[280px] shrink-0">
          <TeamListPanel
            entries={filteredEntries}
            allLeaders={allLeaders}
            onSelectTeam={handleSelectTeam}
          />
        </div>

        {/* Map */}
        <div className="flex-1 min-w-0" ref={mapContainerRef}>
          {isLoading ? (
            <div
              className="flex items-center justify-center rounded-2xl"
              style={{
                height: "calc(100vh - 280px)",
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-default)",
              }}
            >
              <div className="text-center">
                <div
                  className="w-10 h-10 mx-auto mb-3 rounded-xl flex items-center justify-center animate-pulse"
                  style={{ backgroundColor: "var(--accent-subtle)" }}
                >
                  <svg
                    className="w-5 h-5"
                    style={{ color: "var(--accent-primary)" }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading map...</p>
              </div>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border-default)" }}>
              <MapView
                entries={filteredEntries}
                flyTo={flyToTarget}
                overlayOpacity={overlayOpacity}
                onMapClick={handleMapClick}
              />
              {/* Map Controls */}
              <MapControls
                overlayOpacity={overlayOpacity}
                onOpacityChange={setOverlayOpacity}
                onFitAll={handleFitAll}
                markerCount={filteredEntries.length}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile team list — bottom section */}
      <div className="lg:hidden mt-4">
        <TeamListPanel
          entries={filteredEntries}
          allLeaders={allLeaders}
          onSelectTeam={handleSelectTeam}
        />
      </div>

      {/* Click-to-Mark Popup */}
      <AnimatePresence>
        {clickedMarker && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md"
          >
            <div
              className="rounded-2xl p-4 shadow-2xl"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-default)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
                  <span className="text-sm font-semibold text-theme">Add Marker</span>
                </div>
                <button
                  onClick={() => setClickedMarker(null)}
                  className="p-1 rounded-lg hover:bg-white/10"
                >
                  <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                </button>
              </div>

              <div className="space-y-3">
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

                <input
                  type="text"
                  placeholder="Lot label (e.g. LOT 747)"
                  value={lotLabel}
                  onChange={(e) => setLotLabel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-theme outline-none border"
                  style={{
                    backgroundColor: "var(--bg-base)",
                    borderColor: "var(--border-default)",
                  }}
                />

                <button
                  onClick={handleSaveMarker}
                  disabled={saving}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                >
                  {saving ? "Saving..." : "Save Marker"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
