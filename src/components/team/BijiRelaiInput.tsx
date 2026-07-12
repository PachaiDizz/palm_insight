"use client";
import { motion } from "framer-motion";
import { Save, X, CheckCircle, Calendar, Truck, Loader2 } from "lucide-react";
import { Plantation, BijiRelai } from "@/types";

interface BijiRelaiInputProps {
  plantation: Plantation;
  existingEntry: BijiRelai | null;
  date: string;
  tons: string;
  saving: boolean;
  savedId: string | null;
  onDateChange: (date: string) => void;
  onTonsChange: (tons: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onNewEntry: () => void;
  onClose: () => void;
}

export default function BijiRelaiInput({
  plantation,
  existingEntry,
  date,
  tons,
  saving,
  savedId,
  onDateChange,
  onTonsChange,
  onSubmit,
  onNewEntry,
  onClose,
}: BijiRelaiInputProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
      className="rounded-3xl border overflow-hidden mt-6"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(245,158,11,0.12)", backdropFilter: "blur(20px)" }}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(59,130,246,0.12)" }}>
              <Truck className="w-5 h-5" style={{ color: "var(--accent-blue)" }} />
            </div>
            <div>
              <h3 className="section-heading text-base text-theme">Biji Relai</h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Block {plantation.block} — Seed tonnage</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {savedId && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)" }}
              >
                <CheckCircle className="w-3.5 h-3.5" /> Saved
              </motion.span>
            )}
            <motion.button
              whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.08)" }}
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all"
              style={{ color: "var(--text-muted)", border: "1px solid rgba(245,158,11,0.12)" }}
            >
              <X className="w-3.5 h-3.5" /> Close
            </motion.button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                <Calendar className="w-3.5 h-3.5" style={{ color: "var(--accent-primary)" }} />
                Date
              </label>
              <input
                type="date"
                className="w-full px-4 py-3 rounded-xl text-sm text-theme outline-none border transition-colors"
                style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}
                value={date}
                onChange={(e) => onDateChange(e.target.value)}
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                <Truck className="w-3.5 h-3.5" style={{ color: "var(--accent-blue)" }} />
                Tons (Biji Relai)
              </label>
              <input
                type="text"
                inputMode="decimal"
                className="w-full px-4 py-3 rounded-xl text-sm text-theme outline-none border transition-colors"
                style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}
                value={tons}
                onChange={(e) => onTonsChange(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Palm seed tonnage collected per block</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            {savedId && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={onNewEntry}
                className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5 min-h-[44px]"
                style={{ color: "var(--text-muted)" }}
              >
                New Entry
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(59,130,246,0.3)" }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={saving}
              className="relative flex items-center justify-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save"}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
