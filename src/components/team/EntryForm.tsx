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
      style={{ backgroundColor: "rgba(17,26,17,0.8)", borderColor: "rgba(6,78,59,0.25)", backdropFilter: "blur(20px)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
        className="rounded-3xl border overflow-hidden mt-8 bg-[var(--bg-card)] border-[var(--border-default)] backdrop-blur-md"
      >
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-30 blur-2xl bg-[var(--accent-green)]" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[var(--accent-green-light)]">
              <Save className="w-5 h-5 text-[var(--accent-green)]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">New Entry</h2>
              <p className="text-xs text-[rgba(255,255,255,0.45)]">{leader.name} — Block {plantation?.block}</p>
            </div>
          </div>
          {savedId && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--accent-green-light)] text-[var(--accent-green)]"
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
              ? { background: "linear-gradient(135deg, rgba(16,185,129,0.25), rgba(16,185,129,0.15))", border: "1px solid rgba(16,185,129,0.3)" }
              : { background: "linear-gradient(135deg, rgba(239,68,68,0.25), rgba(239,68,68,0.15))", border: "1px solid rgba(239,68,68,0.3)" }
            }
          />
          <button
            type="button"
            onClick={() => onWorkStatusChange("work")}
            className="relative flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors z-10"
            style={{ color: workStatus === "work" ? "#10b981" : "rgba(255,255,255,0.35)" }}
          >
            Work Day
          </button>
          <button
            type="button"
            onClick={() => onWorkStatusChange("no_work")}
            className="relative flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors z-10"
          >
            No Work
          </button>
        </div>

        {/* Date */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2 text-[var(--text-muted)]">
            <Calendar className="w-3.5 h-3.5 text-[var(--accent-green)]" />
            Date
          </label>
          <input
            type="date"
            className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none border bg-[var(--bg-base)] transition-colors focus:border-emerald-500/50"
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
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none border bg-[var(--bg-base)] transition-colors focus:border-emerald-500/50"
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
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none border bg-[var(--bg-base)] transition-colors focus:border-emerald-500/50"
                  value={lot}
                  onChange={(e) => onLotChange(e.target.value)}
                  placeholder="e.g. A1"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2 text-[var(--text-muted)]">
                  <TrendingUp className="w-3.5 h-3.5 text-[var(--accent-green)]" />
                  Bunches
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none border bg-[var(--bg-base)] transition-colors focus:border-emerald-500/50"
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
                  type="number"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none border bg-[var(--bg-base)] transition-colors focus:border-emerald-500/50"
                  value={tons}
                  onChange={(e) => onTonsChange(e.target.value)}
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2 text-[var(--text-muted)]">
                  <AlertCircle className="w-3.5 h-3.5 text-[var(--accent-red)]" />
                  Backlogs
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none border bg-[var(--bg-base)] transition-colors focus:border-emerald-500/50"
                  value={backlogs}
                  onChange={(e) => onBacklogsChange(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </>
        )}

        {/* Notes */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2 text-[var(--text-muted)]">
            Notes
          </label>
          <textarea
            className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none border bg-[var(--bg-base)] transition-colors focus:border-emerald-500/50 min-h-15"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder={workStatus === "work" ? "Any additional notes..." : "Reason for no work..."}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-1">
          {savedId && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onNewEntry}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5 text-[var(--text-muted)]"
          >
            New Entry
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(16,185,129,0.3)" }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={saving}
            className="relative flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Entry"}
          </motion.button>
        </div>
      </motion.form>
    </motion.div>
  );
}
