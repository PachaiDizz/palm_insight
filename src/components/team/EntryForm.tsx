"use client";
import { motion } from "framer-motion";
import { Save, X, CheckCircle, Calendar, Users, MapPin, TrendingUp, Truck, AlertCircle, Loader2, Undo2, Redo2, Crosshair } from "lucide-react";
import { TeamLeader, Plantation } from "@/types";
import { useI18n } from "@/lib/i18n";

interface EntryFormProps {
  leader: TeamLeader;
  plantation: Plantation | null;
  workStatus: string;
  date: string;
  numWorkers: string;
  lot: string;
  bunches: string;
  tons: string;
  backlogs: string;
  notes: string;
  latitude: string;
  longitude: string;
  lotLabel: string;
  saving: boolean;
  savedId: string | null;
  canUndo?: boolean;
  canRedo?: boolean;
  historyLength?: number;
  onWorkStatusChange: (status: string) => void;
  onDateChange: (date: string) => void;
  onNumWorkersChange: (val: string) => void;
  onLotChange: (val: string) => void;
  onBunchesChange: (val: string) => void;
  onTonsChange: (val: string) => void;
  onBacklogsChange: (val: string) => void;
  onNotesChange: (val: string) => void;
  onLatitudeChange: (val: string) => void;
  onLongitudeChange: (val: string) => void;
  onLotLabelChange: (val: string) => void;
  onUseMyLocation: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onNewEntry: () => void;
  onClose: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export default function EntryForm({
  leader,
  plantation,
  workStatus,
  date,
  numWorkers,
  lot,
  bunches,
  tons,
  backlogs,
  notes,
  latitude,
  longitude,
  lotLabel,
  saving,
  savedId,
  canUndo = false,
  canRedo = false,
  historyLength = 0,
  onWorkStatusChange,
  onDateChange,
  onNumWorkersChange,
  onLotChange,
  onBunchesChange,
  onTonsChange,
  onBacklogsChange,
  onNotesChange,
  onLatitudeChange,
  onLongitudeChange,
  onLotLabelChange,
  onUseMyLocation,
  onSubmit,
  onNewEntry,
  onClose,
  onUndo,
  onRedo,
}: EntryFormProps) {
  const { t } = useI18n();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
      className="rounded-3xl border overflow-hidden mt-8"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(245,158,11,0.12)", backdropFilter: "blur(20px)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
        className="rounded-3xl border overflow-hidden mt-8 bg-[var(--bg-card)] border-[var(--border-default)] backdrop-blur-md"
      >
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-30 blur-2xl bg-[var(--accent-primary)]" />
        <div className="relative flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center bg-[var(--accent-subtle)] shrink-0">
              <Save className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent-primary)]" />
            </div>
            <div className="min-w-0">
              <h2 className="section-heading text-sm sm:text-base text-theme">{t("team.newEntry")}</h2>
              <p className="text-[10px] sm:text-xs text-[var(--text-muted)] truncate">{leader.name} — Block {plantation?.block}</p>
            </div>
          </div>
          {savedId && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--accent-subtle)] text-[var(--accent-primary)] shrink-0"
            >
              <CheckCircle className="w-3.5 h-3.5" /> {t("team.saved")}
            </motion.span>
          )}
          <div className="flex items-center gap-0.5 shrink-0">
            {onUndo && (
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                aria-label="Undo"
                className="p-1.5 sm:p-2 rounded-lg transition-colors hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ color: "var(--text-muted)" }}
                title={`Undo (${historyLength} steps)`}
              >
                <Undo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
            {onRedo && (
              <button
                type="button"
                onClick={onRedo}
                disabled={!canRedo}
                aria-label="Redo"
                className="p-1.5 sm:p-2 rounded-lg transition-colors hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ color: "var(--text-muted)" }}
              >
                <Redo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.08)" }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            aria-label="Close entry form"
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-medium transition-all text-[var(--text-muted)] border shrink-0"
          >
            <X className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Close</span>
          </motion.button>
        </div>
      </motion.div>

      <motion.form onSubmit={onSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
      >
        {/* Work Status Toggle */}
        <div role="radiogroup" aria-label="Work status" className="relative flex rounded-2xl p-1 bg-[var(--bg-base)]">
          <motion.div
            animate={{
              left: workStatus === "work" ? "4px" : "calc(50% + 0px)",
            }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl"
            style={workStatus === "work"
              ? { background: "linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.15))", border: "1px solid rgba(245,158,11,0.3)" }
              : { background: "linear-gradient(135deg, rgba(239,68,68,0.25), rgba(239,68,68,0.15))", border: "1px solid rgba(239,68,68,0.3)" }
            }
          />
          <button
            type="button"
            role="radio"
            aria-checked={workStatus === "work"}
            onClick={() => onWorkStatusChange("work")}
            className="relative flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors z-10 min-h-[44px]"
            style={{ color: workStatus === "work" ? "#f59e0b" : "var(--text-muted)" }}
          >
            {t("entry.workDay")}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={workStatus === "no_work"}
            onClick={() => onWorkStatusChange("no_work")}
            className="relative flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors z-10 min-h-[44px]"
          >
            {t("entry.noWork")}
          </button>
        </div>

        {/* Date */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2 text-[var(--text-muted)]">
            <Calendar className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            {t("entry.date")}
          </label>
          <input
            type="date"
            className="w-full px-4 py-3 rounded-xl text-sm text-theme outline-none border bg-[var(--bg-base)] transition-colors focus:border-[#f59e0b]/50"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </div>

        {workStatus === "work" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2 text-[var(--text-muted)]">
                  <Users className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
                  {t("entry.workers")}
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 rounded-xl text-sm text-theme outline-none border bg-[var(--bg-base)] transition-colors focus:border-[#f59e0b]/50"
                  value={numWorkers}
                  onChange={(e) => onNumWorkersChange(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2 text-[var(--text-muted)]">
                  <MapPin className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
                  {t("entry.lot")}
                </label>
                <input
                  className="w-full px-4 py-3 rounded-xl text-sm text-theme outline-none border bg-[var(--bg-base)] transition-colors focus:border-[#f59e0b]/50"
                  value={lot}
                  onChange={(e) => onLotChange(e.target.value)}
                  placeholder="e.g. A1"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2 text-[var(--text-muted)]">
                  <TrendingUp className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  {t("entry.bunches")}
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 rounded-xl text-sm text-theme outline-none border bg-[var(--bg-base)] transition-colors focus:border-[#f59e0b]/50"
                  value={bunches}
                  onChange={(e) => onBunchesChange(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2 text-[var(--text-muted)]">
                  <Truck className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                  {t("entry.tons")}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="w-full px-4 py-3 rounded-xl text-sm text-theme outline-none border bg-[var(--bg-base)] transition-colors focus:border-[#f59e0b]/50"
                  value={tons}
                  onChange={(e) => onTonsChange(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2 text-[var(--text-muted)]">
                  <AlertCircle className="w-3.5 h-3.5 text-[var(--accent-red)]" />
                  {t("entry.backlogs")}
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 rounded-xl text-sm text-theme outline-none border bg-[var(--bg-base)] transition-colors focus:border-[#f59e0b]/50"
                  value={backlogs}
                  onChange={(e) => onBacklogsChange(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </>
        )}

        {workStatus === "no_work" && (
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2 text-[var(--text-muted)]">
              <Truck className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
              {t("entry.tons")} (Transport)
            </label>
            <input
              type="text"
              inputMode="decimal"
              className="w-full px-4 py-3 rounded-xl text-sm text-theme outline-none border bg-[var(--bg-base)] transition-colors focus:border-[#f59e0b]/50"
              value={tons}
              onChange={(e) => onTonsChange(e.target.value)}
              placeholder="0.00"
            />
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Transport may still bring fruit even when workers are off.</p>
          </div>
        )}

        {/* Location (Optional) */}
        <div className="border-t pt-4 mt-2" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-3 text-[var(--text-muted)]">
            <Crosshair className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            {t("map.locationOptional")}
          </div>

          {/* Lot Label */}
          <div className="mb-3">
            <label className="block text-xs mb-1 text-[var(--text-muted)]">{t("map.lotLabel")}</label>
            <input
              type="text"
              placeholder="LOT 747"
              value={lotLabel}
              onChange={(e) => onLotLabelChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-theme outline-none border bg-[var(--bg-base)] transition-colors focus:border-[#f59e0b]/50"
            />
            <p className="text-xs mt-1 text-[var(--text-muted)]">Type the lot number shown on the map</p>
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs mb-1 text-[var(--text-muted)]">{t("map.latitude")}</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="5.1021"
                value={latitude}
                onChange={(e) => onLatitudeChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-theme outline-none border bg-[var(--bg-base)] transition-colors focus:border-[#f59e0b]/50"
              />
            </div>
            <div>
              <label className="block text-xs mb-1 text-[var(--text-muted)]">{t("map.longitude")}</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="119.0902"
                value={longitude}
                onChange={(e) => onLongitudeChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-theme outline-none border bg-[var(--bg-base)] transition-colors focus:border-[#f59e0b]/50"
              />
            </div>
          </div>

          {/* Use My GPS Location */}
          <button
            type="button"
            onClick={onUseMyLocation}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)" }}
          >
            <Crosshair className="w-4 h-4" />
            {t("map.useMyLocation")}
          </button>
          <p className="text-xs mt-2 text-[var(--text-muted)]">Open the Field Map to find your lot coordinates</p>
        </div>

        {/* Notes */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2 text-[var(--text-muted)]">
            {t("entry.notes")}
          </label>
          <textarea
            className="w-full px-4 py-3 rounded-xl text-sm text-theme outline-none border bg-[var(--bg-base)] transition-colors focus:border-[#f59e0b]/50 min-h-15"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder={workStatus === "work" ? t("entry.notesPlaceholder") : t("entry.noWorkPlaceholder")}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-1">
          {savedId && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onNewEntry}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5 text-[var(--text-muted)] min-h-[44px] order-2 sm:order-1"
          >
            {t("team.newEntry")}
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(245,158,11,0.3)" }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={saving}
            className="relative flex items-center justify-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold text-theme transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] order-1 sm:order-2"
            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? t("team.saving") : t("entry.saveEntry")}
          </motion.button>
        </div>
      </motion.form>
    </motion.div>
  );
}
