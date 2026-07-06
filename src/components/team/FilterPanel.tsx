"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "lucide-react";

interface FilterPanelProps {
  show: boolean;
  onToggle: () => void;
  filterDate: string;
  filterFrom: string;
  filterTo: string;
  onFilterDateChange: (val: string) => void;
  onFilterFromChange: (val: string) => void;
  onFilterToChange: (val: string) => void;
  onClear: () => void;
}

export default function FilterPanel({
  show,
  onToggle,
  filterDate,
  filterFrom,
  filterTo,
  onFilterDateChange,
  onFilterFromChange,
  onFilterToChange,
  onClear,
}: FilterPanelProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.03, backgroundColor: "var(--accent-green-light)" }}
          whileTap={{ scale: 0.97 }}
          onClick={onToggle}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ backgroundColor: "var(--accent-green-light)", color: "var(--accent-green)" }}
        >
          <Calendar className="w-4 h-4" />
          Filter by Date
        </motion.button>
      </div>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 p-4 rounded-xl border overflow-hidden"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-default)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white">Date Range</span>
              <button onClick={onClear} className="text-xs px-3 py-1 rounded" style={{ backgroundColor: "var(--accent-red-light)", color: "var(--accent-red)" }}>Clear</button>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Filter by Date</label>
                <input type="date" value={filterDate} onChange={(e) => onFilterDateChange(e.target.value)} className="w-full px-3 py-2 rounded border text-sm text-white outline-none" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }} />
              </div>
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>From</label>
                <input type="date" value={filterFrom} onChange={(e) => onFilterFromChange(e.target.value)} className="w-full px-3 py-2 rounded border text-sm text-white outline-none" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }} />
              </div>
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>To</label>
                <input type="date" value={filterTo} onChange={(e) => onFilterToChange(e.target.value)} className="w-full px-3 py-2 rounded border text-sm text-white outline-none" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
