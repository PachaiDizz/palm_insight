"use client";
import { motion } from "framer-motion";
import { Save, X, CheckCircle, Calendar, Users, MapPin, TrendingUp, Truck, AlertCircle, Loader2 } from "lucide-react";
import { TeamLeader, Plantation } from "@/types";

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
  saving: boolean;
  savedId: string | null;
  onWorkStatusChange: (status: string) => void;
  onDateChange: (date: string) => void;
  onNumWorkersChange: (val: string) => void;
  onLotChange: (val: string) => void;
  onBunchesChange: (val: string) => void;
  onTonsChange: (val: string) => void;
  onBacklogsChange: (val: string) => void;
  onNotesChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onNewEntry: () => void;
  onClose: () => void;
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
  saving,
  savedId,
  onWorkStatusChange,
  onDateChange,
  onNumWorkersChange,
  onLotChange,
  onBunchesChange,
  onTonsChange,
  onBacklogsChange,
  onNotesChange,
  onSubmit,
  onNewEntry,
  onClose,
}: EntryFormProps) {
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
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[var(--accent-subtle)]">
              <Save className="w-5 h-5 text-[var(--accent-primary)]" />
            </div>
            <div>
              <h2 className="section-heading text-base text-theme">New Entry</h2>
              <p className="text-xs text-[var(--text-muted)]">{leader.name} — Block {plantation?.block}</p>
            </div>
          </div>
          {savedId && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--accent-subtle)] text-[var(--accent-primary)]"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Saved
            </motion.span>
          )}
          <motion.button
            whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.08)" }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-[var(--text-muted)] border"
          >
            <X className="w-3.5 h-3.5" /> Close
          </motion.button>
        </div>
      </motion.div>

      <motion.form onSubmit={onSubmit} className="p-6 space-y-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
      >
        {/* Work Status Toggle */}
        <div className="relative flex rounded-2xl p-1 bg-[var(--bg-base)]">
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
            onClick={() => onWorkStatusChange("work")}
            className="relative flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors z-10 min-h-[44px]"
            style={{ color: workStatus === "work" ? "#f59e0b" : "var(--text-muted)" }}
          >
            Work Day
          </button>
          <button
            type="button"
            onClick={() => onWorkStatusChange("no_work")}
            className="relative flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors z-10 min-h-[44px]"
          >
            No Work
          </button>
        </div>

        {/* Date */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2 text-[var(--text-muted)]">
            <Calendar className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            Date
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
                  Workers
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
                  Lot
                </label>
                <input
                  className="w-full px-4 py-3 rounded-xl text-sm text-theme outline-none border bg-[var(--bg-base)] transition-colors focus:border-[#f59e0b]/50"
                  value={lot}
                  onChange={(e) => onLotChange(e.target.value)}
                  placeholder="e.g. A1"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2 text-[var(--text-muted)]">
                  <TrendingUp className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  Bunches
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
                  Tons
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
                  Backlogs
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
              Tons (Transport)
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

        {/* Notes */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2 text-[var(--text-muted)]">
            Notes
          </label>
          <textarea
            className="w-full px-4 py-3 rounded-xl text-sm text-theme outline-none border bg-[var(--bg-base)] transition-colors focus:border-[#f59e0b]/50 min-h-15"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder={workStatus === "work" ? "Any additional notes..." : "Reason for no work..."}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-1">
          {savedId && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onNewEntry}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5 text-[var(--text-muted)] min-h-[44px]"
          >
            New Entry
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(245,158,11,0.3)" }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={saving}
            className="relative flex items-center justify-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold text-theme transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Entry"}
          </motion.button>
        </div>
      </motion.form>
    </motion.div>
  );
}
