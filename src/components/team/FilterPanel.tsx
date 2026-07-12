"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "lucide-react";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.03, backgroundColor: "var(--accent-subtle)" }}
          whileTap={{ scale: 0.97 }}
          onClick={onToggle}
          aria-expanded={show}
          aria-controls="filter-panel"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)" }}
        >
          <Calendar className="w-4 h-4" />
          {t("entry.filterByDate")}
        </motion.button>
      </div>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            id="filter-panel"
            className="mt-3 p-4 rounded-xl border overflow-hidden"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-default)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-theme">{t("entry.dateRange")}</span>
              <button onClick={onClear} aria-label="Clear date filter" className="text-xs px-3 py-1 rounded" style={{ backgroundColor: "var(--accent-red-light)", color: "var(--accent-red)" }}>{t("entry.clearFilter")}</button>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label htmlFor="filter-date" className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>{t("entry.filterByDate")}</label>
                <input id="filter-date" type="date" value={filterDate} onChange={(e) => onFilterDateChange(e.target.value)} className="w-full px-3 py-2 rounded border text-sm text-theme outline-none" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }} />
              </div>
              <div className="flex-1">
                <label htmlFor="filter-from" className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>{t("entry.from")}</label>
                <input id="filter-from" type="date" value={filterFrom} onChange={(e) => onFilterFromChange(e.target.value)} className="w-full px-3 py-2 rounded border text-sm text-theme outline-none" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }} />
              </div>
              <div className="flex-1">
                <label htmlFor="filter-to" className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>{t("entry.to")}</label>
                <input id="filter-to" type="date" value={filterTo} onChange={(e) => onFilterToChange(e.target.value)} className="w-full px-3 py-2 rounded border text-sm text-theme outline-none" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
