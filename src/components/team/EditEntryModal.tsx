"use client";
import { DailyEntry } from "@/types";
import Modal from "@/components/ui/Modal";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
  if (!entry) return null;

  return (
    <Modal open={show} onClose={onClose} title={t("edit.title")}>
      <div className="space-y-4">
        <div>
          <label htmlFor="edit-date" className="block text-xs mb-1 text-[var(--text-muted)]">{t("entry.date")}</label>
          <input id="edit-date" type="date" value={date} onChange={(e) => onDateChange(e.target.value)} className="w-full px-3 py-2 rounded border bg-[var(--bg-base)] text-sm text-theme outline-none transition-colors focus:border-[#f59e0b]/50" />
        </div>
        <div className="flex items-center gap-2" role="radiogroup" aria-label="Work status">
          <button type="button" role="radio" aria-checked={workStatus === "work"} onClick={() => onWorkStatusChange("work")} className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors bg-[rgba(245,158,11,0.2)] text-theme border" style={workStatus !== "work" ? { backgroundColor: "var(--hover-subtle)", color: "var(--text-muted)", border: "1px solid rgba(245,158,11,0.12)" } : undefined}>{t("status.work")}</button>
          <button type="button" role="radio" aria-checked={workStatus === "no_work"} onClick={() => onWorkStatusChange("no_work")} className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors bg-[rgba(239,68,68,0.2)] text-theme border" style={workStatus !== "no_work" ? { backgroundColor: "var(--hover-subtle)", color: "var(--text-muted)", border: "1px solid rgba(245,158,11,0.12)" } : undefined}>{t("status.noWork")}</button>
        </div>
        <div>
          <label htmlFor="edit-workers" className="block text-xs mb-1 text-[var(--text-muted)]">{t("edit.workers")}</label>
          <input id="edit-workers" type="number" value={numWorkers} onChange={(e) => onNumWorkersChange(e.target.value)} min="0" className="w-full px-3 py-2 rounded border bg-[var(--bg-base)] text-sm text-theme outline-none transition-colors focus:border-[#f59e0b]/50" placeholder="0" />
        </div>
        <div>
          <label htmlFor="edit-lot" className="block text-xs mb-1 text-[var(--text-muted)]">{t("edit.lot")}</label>
          <input id="edit-lot" type="text" value={lot} onChange={(e) => onLotChange(e.target.value)} className="w-full px-3 py-2 rounded border bg-[var(--bg-base)] text-sm text-theme outline-none transition-colors focus:border-[#f59e0b]/50" placeholder="e.g. A1" />
        </div>
        {workStatus === "work" && (
          <>
            <div>
              <label htmlFor="edit-bunches" className="block text-xs mb-1 text-[var(--text-muted)]">{t("edit.bunches")}</label>
              <input id="edit-bunches" type="number" value={bunches} onChange={(e) => onBunchesChange(e.target.value)} min="0" className="w-full px-3 py-2 rounded border bg-[var(--bg-base)] text-sm text-theme outline-none transition-colors focus:border-[#f59e0b]/50" placeholder="0" />
            </div>
            <div>
              <label htmlFor="edit-tons" className="block text-xs mb-1 text-[var(--text-muted)]">{t("edit.tons")}</label>
              <input id="edit-tons" type="text" inputMode="decimal" value={tons} onChange={(e) => onTonsChange(e.target.value)} className="w-full px-3 py-2 rounded border bg-[var(--bg-base)] text-sm text-theme outline-none transition-colors focus:border-[#f59e0b]/50" placeholder="0.00" />
            </div>
            <div>
              <label htmlFor="edit-backlogs" className="block text-xs mb-1 text-[var(--text-muted)]">{t("edit.backlogs")}</label>
              <input id="edit-backlogs" type="number" value={backlogs} onChange={(e) => onBacklogsChange(e.target.value)} min="0" className="w-full px-3 py-2 rounded border bg-[var(--bg-base)] text-sm text-theme outline-none transition-colors focus:border-[#f59e0b]/50" placeholder="0" />
            </div>
          </>
        )}
        {workStatus === "no_work" && (
          <div>
            <label htmlFor="edit-tons-transport" className="block text-xs mb-1 text-[var(--text-muted)]">{t("edit.tons")} (Transport)</label>
            <input id="edit-tons-transport" type="text" inputMode="decimal" value={tons} onChange={(e) => onTonsChange(e.target.value)} className="w-full px-3 py-2 rounded border bg-[var(--bg-base)] text-sm text-theme outline-none transition-colors focus:border-[#f59e0b]/50" placeholder="0.00" />
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{t("edit.transportNote")}</p>
          </div>
        )}
        <div>
          <label htmlFor="edit-notes" className="block text-xs mb-1 text-[var(--text-muted)]">{t("edit.notes")}</label>
          <textarea id="edit-notes" value={notes} onChange={(e) => onNotesChange(e.target.value)} rows={2} className="w-full px-3 py-2 rounded border bg-[var(--bg-base)] text-sm text-theme outline-none resize-none transition-colors focus:border-[#f59e0b]/50 min-h-8" placeholder={t("edit.notesPlaceholder")} />
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-[var(--hover-subtle)] text-[var(--text-muted)] transition-colors hover:bg-white/5">{t("action.cancel")}</button>
          <button type="button" onClick={onSave} disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: saving ? "rgba(245,158,11,0.5)" : "#f59e0b", color: "#fff" }}>
            {saving ? t("team.saving") : t("edit.saveChanges")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
