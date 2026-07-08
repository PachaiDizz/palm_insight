"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { DailyEntry } from "@/types";

interface EditEntryModalProps {
  show: boolean;
  entry: DailyEntry | null;
  date: string;
  workStatus: string;
  numWorkers: string;
  lot: string;
  bunches: string;
  tons: string;
  backlogs: string;
  notes: string;
  saving: boolean;
  onDateChange: (val: string) => void;
  onWorkStatusChange: (val: string) => void;
  onNumWorkersChange: (val: string) => void;
  onLotChange: (val: string) => void;
  onBunchesChange: (val: string) => void;
  onTonsChange: (val: string) => void;
  onBacklogsChange: (val: string) => void;
  onNotesChange: (val: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function EditEntryModal({
  show,
  entry,
  date,
  workStatus,
  numWorkers,
  lot,
  bunches,
  tons,
  backlogs,
  notes,
  saving,
  onDateChange,
  onWorkStatusChange,
  onNumWorkersChange,
  onLotChange,
  onBunchesChange,
  onTonsChange,
  onBacklogsChange,
  onNotesChange,
  onSave,
  onClose,
}: EditEntryModalProps) {
  return (
    <AnimatePresence>
      {show && entry && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="card-glow rounded-2xl p-6 w-full max-w-md mx-4 bg-[var(--bg-card)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-heading text-lg text-theme">Edit Entry</h2>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-[var(--text-muted)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs mb-1 text-[var(--text-muted)]">Date</label>
                <input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} className="w-full px-3 py-2 rounded border bg-[var(--bg-base)] text-sm text-theme outline-none transition-colors focus:border-[#f59e0b]/50" />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onWorkStatusChange("work")} className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors bg-[rgba(245,158,11,0.2)] text-theme border" style={workStatus !== "work" ? { backgroundColor: "var(--hover-subtle)", color: "var(--text-muted)", border: "1px solid rgba(245,158,11,0.12)" } : undefined}>Work</button>
                <button onClick={() => onWorkStatusChange("no_work")} className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors bg-[rgba(239,68,68,0.2)] text-theme border" style={workStatus !== "no_work" ? { backgroundColor: "var(--hover-subtle)", color: "var(--text-muted)", border: "1px solid rgba(245,158,11,0.12)" } : undefined}>No Work</button>
              </div>
              <div>
                <label className="block text-xs mb-1 text-[var(--text-muted)]">Workers</label>
                <input type="number" value={numWorkers} onChange={(e) => onNumWorkersChange(e.target.value)} min="0" className="w-full px-3 py-2 rounded border bg-[var(--bg-base)] text-sm text-theme outline-none transition-colors focus:border-[#f59e0b]/50" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs mb-1 text-[var(--text-muted)]">Lot</label>
                <input type="text" value={lot} onChange={(e) => onLotChange(e.target.value)} className="w-full px-3 py-2 rounded border bg-[var(--bg-base)] text-sm text-theme outline-none transition-colors focus:border-[#f59e0b]/50" placeholder="e.g. A1" />
              </div>
              {workStatus === "work" && (
                <>
                  <div>
                  <label className="block text-xs mb-1 text-[var(--text-muted)]">Bunches</label>
                  <input type="number" value={bunches} onChange={(e) => onBunchesChange(e.target.value)} min="0" className="w-full px-3 py-2 rounded border bg-[var(--bg-base)] text-sm text-theme outline-none transition-colors focus:border-[#f59e0b]/50" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs mb-1 text-[var(--text-muted)]">Tons</label>
                    <input type="text" inputMode="decimal" value={tons} onChange={(e) => onTonsChange(e.target.value)} className="w-full px-3 py-2 rounded border bg-[var(--bg-base)] text-sm text-theme outline-none transition-colors focus:border-[#f59e0b]/50" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-xs mb-1 text-[var(--text-muted)]">Backlogs</label>
                    <input type="number" value={backlogs} onChange={(e) => onBacklogsChange(e.target.value)} min="0" className="w-full px-3 py-2 rounded border bg-[var(--bg-base)] text-sm text-theme outline-none transition-colors focus:border-[#f59e0b]/50" placeholder="0" />
                  </div>
                </>
              )}
              {workStatus === "no_work" && (
                <div>
                  <label className="block text-xs mb-1 text-[var(--text-muted)]">Tons (Transport)</label>
                  <input type="text" inputMode="decimal" value={tons} onChange={(e) => onTonsChange(e.target.value)} className="w-full px-3 py-2 rounded border bg-[var(--bg-base)] text-sm text-theme outline-none transition-colors focus:border-[#f59e0b]/50" placeholder="0.00" />
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Transport may still bring fruit even when workers are off.</p>
                </div>
              )}
              <div>
                <label className="block text-xs mb-1 text-[var(--text-muted)]">Notes</label>
                <textarea value={notes} onChange={(e) => onNotesChange(e.target.value)} rows={2} className="w-full px-3 py-2 rounded border bg-[var(--bg-base)] text-sm text-theme outline-none resize-none transition-colors focus:border-[#f59e0b]/50 min-h-8" placeholder="Add notes..." />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-[var(--hover-subtle)] text-[var(--text-muted)] transition-colors hover:bg-white/5">Cancel</button>
                <button onClick={onSave} disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: saving ? "rgba(245,158,11,0.5)" : "#f59e0b", color: "#fff" }}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
