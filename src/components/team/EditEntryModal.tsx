"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { DailyEntry } from "@/types";
import Modal from "@/components/ui/Modal";
import { useI18n } from "@/lib/i18n";

interface EditEntryModalProps {
  show: boolean;
  entry: DailyEntry | null;
  saving: boolean;
  onSave: (data: {
    date: string;
    workStatus: string;
    numWorkers: string;
    lot: string;
    bunches: string;
    tons: string;
    backlogs: string;
    notes: string;
    latitude: string;
    longitude: string;
    lotLabel: string;
  }) => void;
  onClose: () => void;
}

interface FormData {
  date: string;
  workStatus: string;
  numWorkers: string;
  lot: string;
  bunches: string;
  tons: string;
  backlogs: string;
  notes: string;
  latitude: string;
  longitude: string;
  lotLabel: string;
}

const EditEntryModal = React.memo(function EditEntryModal({
  show,
  entry,
  saving,
  onSave,
  onClose,
}: EditEntryModalProps) {
  const { t } = useI18n();
  const [formData, setFormData] = useState<FormData>({
    date: "",
    workStatus: "work",
    numWorkers: "",
    lot: "",
    bunches: "",
    tons: "",
    backlogs: "",
    notes: "",
    latitude: "",
    longitude: "",
    lotLabel: "",
  });

  // Track if we've initialized from entry
  const initializedRef = useRef(false);

  // Initialize form data from entry when modal opens
  useEffect(() => {
    if (entry && show && !initializedRef.current) {
      setFormData({
        date: entry.date || "",
        workStatus: entry.work_status || "work",
        numWorkers: entry.num_workers?.toString() || "",
        lot: entry.lot || "",
        bunches: entry.bunches?.toString() || "",
        tons: entry.tons?.toString() || "",
        backlogs: entry.backlogs?.toString() || "",
        notes: entry.notes || "",
        latitude: entry.latitude?.toString() || "",
        longitude: entry.longitude?.toString() || "",
        lotLabel: entry.lot_label || "",
      });
      initializedRef.current = true;
    }
    if (!show) {
      initializedRef.current = false;
    }
  }, [entry, show]);

  // Stable handler for all field changes
  const handleChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Stable handlers for each field
  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange("date", e.target.value);
  }, [handleChange]);

  const handleWorkStatusChange = useCallback((status: string) => {
    handleChange("workStatus", status);
  }, [handleChange]);

  const handleNumWorkersChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange("numWorkers", e.target.value);
  }, [handleChange]);

  const handleLotChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange("lot", e.target.value);
  }, [handleChange]);

  const handleBunchesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange("bunches", e.target.value);
  }, [handleChange]);

  const handleTonsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange("tons", e.target.value);
  }, [handleChange]);

  const handleBacklogsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange("backlogs", e.target.value);
  }, [handleChange]);

  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleChange("notes", e.target.value);
  }, [handleChange]);

  const handleLatitudeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange("latitude", e.target.value);
  }, [handleChange]);

  const handleLongitudeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange("longitude", e.target.value);
  }, [handleChange]);

  const handleLotLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange("lotLabel", e.target.value);
  }, [handleChange]);

  const handleSave = useCallback(() => {
    onSave(formData);
  }, [onSave, formData]);

  if (!entry) return null;

  return (
    <Modal open={show} onClose={onClose} title={t("edit.title")}>
      <div className="space-y-3 sm:space-y-4">
        <div>
          <label htmlFor="edit-date" className="block text-xs mb-1 text-[var(--text-muted)]">{t("entry.date")}</label>
          <input id="edit-date" type="date" value={formData.date} onChange={handleDateChange} className="w-full px-3 py-2 rounded border bg-[var(--bg-base)] text-sm text-theme outline-none transition-colors focus:border-[#f59e0b]/50" />
        </div>
        <div className="flex items-center gap-2" role="radiogroup" aria-label="Work status">
          <button type="button" role="radio" aria-checked={formData.workStatus === "work"} onClick={() => handleWorkStatusChange("work")} className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors bg-[rgba(245,158,11,0.2)] text-theme border" style={formData.workStatus !== "work" ? { backgroundColor: "var(--hover-subtle)", color: "var(--text-muted)", border: "1px solid rgba(245,158,11,0.12)" } : undefined}>{t("status.work")}</button>
          <button type="button" role="radio" aria-checked={formData.workStatus === "no_work"} onClick={() => handleWorkStatusChange("no_work")} className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors bg-[rgba(239,68,68,0.2)] text-theme border" style={formData.workStatus !== "no_work" ? { backgroundColor: "var(--hover-subtle)", color: "var(--text-muted)", border: "1px solid rgba(245,158,11,0.12)" } : undefined}>{t("status.noWork")}</button>
        </div>
        <div>
          <label htmlFor="edit-workers" className="block text-xs mb-1 text-[var(--text-muted)]">{t("edit.workers")}</label>
          <input id="edit-workers" type="number" value={formData.numWorkers} onChange={handleNumWorkersChange} min="0" className="w-full px-3 py-2 rounded border bg-[var(--bg-base)] text-sm text-theme outline-none transition-colors focus:border-[#f59e0b]/50" placeholder="0" />
        </div>
        <div>
          <label htmlFor="edit-lot" className="block text-xs mb-1 text-[var(--text-muted)]">{t("edit.lot")}</label>
          <input id="edit-lot" type="text" value={formData.lot} onChange={handleLotChange} className="w-full px-3 py-2 rounded border bg-[var(--bg-base)] text-sm text-theme outline-none transition-colors focus:border-[#f59e0b]/50" placeholder="e.g. A1" />
        </div>
        {formData.workStatus === "work" && (
          <>
            <div>
              <label htmlFor="edit-bunches" className="block text-xs mb-1 text-[var(--text-muted)]">{t("edit.bunches")}</label>
              <input id="edit-bunches" type="number" value={formData.bunches} onChange={handleBunchesChange} min="0" className="w-full px-3 py-2 rounded border bg-[var(--bg-base)] text-sm text-theme outline-none transition-colors focus:border-[#f59e0b]/50" placeholder="0" />
            </div>
            <div>
              <label htmlFor="edit-tons" className="block text-xs mb-1 text-[var(--text-muted)]">{t("edit.tons")}</label>
              <input id="edit-tons" type="text" inputMode="decimal" value={formData.tons} onChange={handleTonsChange} className="w-full px-3 py-2 rounded border bg-[var(--bg-base)] text-sm text-theme outline-none transition-colors focus:border-[#f59e0b]/50" placeholder="0.00" />
            </div>
            <div>
              <label htmlFor="edit-backlogs" className="block text-xs mb-1 text-[var(--text-muted)]">{t("edit.backlogs")}</label>
              <input id="edit-backlogs" type="number" value={formData.backlogs} onChange={handleBacklogsChange} min="0" className="w-full px-3 py-2 rounded border bg-[var(--bg-base)] text-sm text-theme outline-none transition-colors focus:border-[#f59e0b]/50" placeholder="0" />
            </div>
          </>
        )}
        {formData.workStatus === "no_work" && (
          <div>
            <label htmlFor="edit-tons-transport" className="block text-xs mb-1 text-[var(--text-muted)]">{t("edit.tons")} (Transport)</label>
            <input id="edit-tons-transport" type="text" inputMode="decimal" value={formData.tons} onChange={handleTonsChange} className="w-full px-3 py-2 rounded border bg-[var(--bg-base)] text-sm text-theme outline-none transition-colors focus:border-[#f59e0b]/50" placeholder="0.00" />
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{t("edit.transportNote")}</p>
          </div>
        )}
        <div>
          <label htmlFor="edit-notes" className="block text-xs mb-1 text-[var(--text-muted)]">{t("edit.notes")}</label>
          <textarea id="edit-notes" value={formData.notes} onChange={handleNotesChange} rows={2} className="w-full px-3 py-2 rounded border bg-[var(--bg-base)] text-sm text-theme outline-none resize-none transition-colors focus:border-[#f59e0b]/50 min-h-8" placeholder={t("edit.notesPlaceholder")} />
        </div>
        <div className="border-t pt-3" style={{ borderColor: "var(--border-subtle)" }}>
          <label className="block text-xs mb-2 text-[var(--text-muted)]">{t("map.locationOptional")}</label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label htmlFor="edit-lat" className="block text-[10px] mb-0.5 text-[var(--text-muted)]">{t("map.latitude")}</label>
              <input id="edit-lat" type="text" inputMode="decimal" value={formData.latitude} onChange={handleLatitudeChange} className="w-full px-3 py-2 rounded border bg-[var(--bg-base)] text-sm text-theme outline-none transition-colors focus:border-[#f59e0b]/50" placeholder="-4.123456" />
            </div>
            <div>
              <label htmlFor="edit-lng" className="block text-[10px] mb-0.5 text-[var(--text-muted)]">{t("map.longitude")}</label>
              <input id="edit-lng" type="text" inputMode="decimal" value={formData.longitude} onChange={handleLongitudeChange} className="w-full px-3 py-2 rounded border bg-[var(--bg-base)] text-sm text-theme outline-none transition-colors focus:border-[#f59e0b]/50" placeholder="117.654321" />
            </div>
          </div>
          <div>
            <label htmlFor="edit-lot-label" className="block text-[10px] mb-0.5 text-[var(--text-muted)]">{t("map.lotLabel")}</label>
            <input id="edit-lot-label" type="text" value={formData.lotLabel} onChange={handleLotLabelChange} className="w-full px-3 py-2 rounded border bg-[var(--bg-base)] text-sm text-theme outline-none transition-colors focus:border-[#f59e0b]/50" placeholder={t("map.lotLabelPlaceholder")} />
          </div>
        </div>
      </div>
      {/* Sticky action buttons */}
      <div className="sticky bottom-0 flex flex-col sm:flex-row gap-2 pt-4 mt-4" style={{ backgroundColor: "var(--bg-card)", borderTop: "1px solid var(--border-subtle)" }}>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-[var(--hover-subtle)] text-[var(--text-muted)] transition-colors hover:bg-white/5 min-h-[44px]">{t("action.cancel")}</button>
        <button type="button" onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm font-medium min-h-[44px]" style={{ backgroundColor: saving ? "rgba(245,158,11,0.5)" : "#f59e0b", color: "#fff" }}>
          {saving ? t("team.saving") : t("edit.saveChanges")}
        </button>
      </div>
    </Modal>
  );
});

export default EditEntryModal;
