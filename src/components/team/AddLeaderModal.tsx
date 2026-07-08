"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Loader2 } from "lucide-react";
import { Plantation } from "@/types";

interface AddLeaderModalProps {
  show: boolean;
  selectedBlockId: string | null;
  selectedPlantation: Plantation | null;
  plantations: Plantation[];
  name: string;
  phone: string;
  saving: boolean;
  onNameChange: (val: string) => void;
  onPhoneChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function AddLeaderModal({
  show,
  selectedBlockId,
  selectedPlantation,
  plantations,
  name,
  phone,
  saving,
  onNameChange,
  onPhoneChange,
  onSubmit,
  onClose,
}: AddLeaderModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="card-glow rounded-2xl p-6 w-full max-w-md mx-4"
            style={{ backgroundColor: "var(--bg-card)" }}
          >
            <h2 className="section-heading text-xl text-theme mb-5">Add Team Leader</h2>
            <form onSubmit={onSubmit} className="space-y-3">
              {selectedBlockId && (
                <div className="p-3 rounded-xl" style={{ backgroundColor: "rgba(245,158,11,0.08)" }}>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Adding to:</span>
                  <div className="text-sm font-medium text-theme">Block {selectedPlantation?.block} — {selectedPlantation?.rancangan}</div>
                </div>
              )}
              <input
                placeholder="Name"
                className="w-full px-4 py-2.5 rounded-xl text-sm text-theme outline-none border"
                style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                required
              />
              <input
                placeholder="Phone (optional)"
                className="w-full px-4 py-2.5 rounded-xl text-sm text-theme outline-none border"
                style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}
                value={phone}
                onChange={(e) => onPhoneChange(e.target.value)}
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm" style={{ color: "var(--text-muted)" }}>Cancel</button>
                <button type="submit" disabled={saving || !selectedBlockId} className="px-4 py-2 rounded-xl text-sm font-medium text-theme flex items-center gap-2 disabled:opacity-50" style={{ background: "linear-gradient(to right, #f59e0b, #d97706)" }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {saving ? "Saving..." : "Add"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
