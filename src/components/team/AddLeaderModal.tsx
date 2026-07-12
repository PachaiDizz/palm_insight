"use client";
import { Loader2, Plus } from "lucide-react";
import { Plantation } from "@/types";
import Modal from "@/components/ui/Modal";
import { useI18n } from "@/lib/i18n";

interface AddLeaderModalProps {
  show: boolean;
  selectedBlockId: string | null;
  selectedPlantation: Plantation | null;
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
  name,
  phone,
  saving,
  onNameChange,
  onPhoneChange,
  onSubmit,
  onClose,
}: AddLeaderModalProps) {
  const { t } = useI18n();
  return (
    <Modal open={show} onClose={onClose} title={t("team.addLeaderTitle")}>
      <form onSubmit={onSubmit} className="space-y-3">
        {selectedBlockId && (
          <div className="p-3 rounded-xl" style={{ backgroundColor: "rgba(245,158,11,0.08)" }}>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Adding to:</span>
            <div className="text-sm font-medium text-theme">Block {selectedPlantation?.block} — {selectedPlantation?.rancangan}</div>
          </div>
        )}
        <div>
          <label htmlFor="leader-name" className="sr-only">Name</label>
          <input
            id="leader-name"
            placeholder="Name"
            className="w-full px-4 py-2.5 rounded-xl text-sm text-theme outline-none border"
            style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="leader-phone" className="sr-only">Phone (optional)</label>
          <input
            id="leader-phone"
            placeholder="Phone (optional)"
            className="w-full px-4 py-2.5 rounded-xl text-sm text-theme outline-none border"
            style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm" style={{ color: "var(--text-muted)" }}>{t("team.cancel")}</button>
          <button type="submit" disabled={saving || !selectedBlockId} className="px-4 py-2 rounded-xl text-sm font-medium text-theme flex items-center gap-2 disabled:opacity-50" style={{ background: "linear-gradient(to right, #f59e0b, #d97706)" }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {saving ? t("team.saving") : t("team.add")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
