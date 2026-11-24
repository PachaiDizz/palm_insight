"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";
import { otherWorkDetailsSchema } from "@/lib/schemas";
import { toLocalInput, fromLocalInput } from "@/lib/otherWorks";
import { toLocalDateKey } from "@/lib/date";
import { getJobTypeLabel, JOB_TYPES } from "./jobMeta";
import {
  Section,
  FieldLabel,
  IconTileGrid,
  SegmentedControl,
  Stepper,
  ProgressSlider,
  TextField,
  type SegOption,
} from "./form/controls";
import CreatableInput from "./form/CreatableInput";
import DateTimeField from "./form/DateTimeField";
import MencuciFields from "./fields/MencuciFields";
import MembajaFields from "./fields/MembajaFields";
import PruningFields from "./fields/PruningFields";
import CuciParitFields from "./fields/CuciParitFields";
import BaikiJalanFields from "./fields/BaikiJalanFields";
import LainFields from "./fields/LainFields";
import type { OtherWork, OtherWorkStatus, OtherWorkType, Plantation } from "@/types";

const MONTHS_SHORT = [
  "JAN", "FEB", "MAC", "APR", "MEI", "JUN",
  "JUL", "OGOS", "SEP", "OKT", "NOV", "DIS",
];

function fmtDate(key: string): string {
  const m = key.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "";
  return `${m[3]} ${MONTHS_SHORT[+m[2] - 1]} ${m[1]}`;
}

function defaultsFor(type: OtherWorkType): Record<string, string> {
  switch (type) {
    case "mencuci_merumput":
      return { method: "manual", area_hectare: "", chemical_name: "", chemical_qty_liter: "" };
    case "membaja":
      return { fertilizer_type: "npk", quantity_value: "", quantity_unit: "kg", area_hectare: "", tree_count: "", rate_per_tree_kg: "" };
    case "pruning":
      return { pruning_type: "rutin", tree_count: "", area_hectare: "" };
    case "cuci_parit":
      return { ditch_length_m: "", ditch_count: "", depth_cm: "" };
    case "baiki_jalan":
      return { road_length_m: "", material: "batu", machine: "" };
    case "lain_lain":
      return { description: "", quantity: "", unit: "" };
  }
}

function toStringRecord(d: Record<string, unknown> | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (d) {
    for (const k of Object.keys(d)) {
      const v = d[k];
      out[k] = v === null || v === undefined ? "" : String(v);
    }
  }
  return out;
}

function numOrUndef(s?: string): number | undefined {
  if (s == null || s.trim() === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}
function strOrUndef(s?: string): string | undefined {
  const t = (s ?? "").trim();
  return t ? t.toUpperCase() : undefined;
}

function buildCandidate(type: OtherWorkType, raw: Record<string, string>) {
  switch (type) {
    case "mencuci_merumput":
      return {
        type,
        method: raw.method || "manual",
        area_hectare: numOrUndef(raw.area_hectare),
        chemical_name: strOrUndef(raw.chemical_name),
        chemical_qty_liter: numOrUndef(raw.chemical_qty_liter),
      };
    case "membaja":
      return {
        type,
        fertilizer_type: raw.fertilizer_type || "npk",
        quantity_value: numOrUndef(raw.quantity_value),
        quantity_unit: raw.quantity_unit || "kg",
        area_hectare: numOrUndef(raw.area_hectare),
        tree_count: numOrUndef(raw.tree_count),
        rate_per_tree_kg: numOrUndef(raw.rate_per_tree_kg),
      };
    case "pruning":
      return {
        type,
        pruning_type: raw.pruning_type || "rutin",
        tree_count: numOrUndef(raw.tree_count),
        area_hectare: numOrUndef(raw.area_hectare),
      };
    case "cuci_parit":
      return {
        type,
        ditch_length_m: numOrUndef(raw.ditch_length_m),
        ditch_count: numOrUndef(raw.ditch_count),
        depth_cm: numOrUndef(raw.depth_cm),
      };
    case "baiki_jalan":
      return {
        type,
        road_length_m: numOrUndef(raw.road_length_m),
        material: raw.material || "batu",
        machine: strOrUndef(raw.machine),
      };
    case "lain_lain":
      return {
        type,
        description: (raw.description ?? "").trim().toUpperCase(),
        quantity: numOrUndef(raw.quantity),
        unit: (raw.unit ?? "").trim().toUpperCase(),
      };
  }
}

function buildAutoTitle(
  type: OtherWorkType,
  plantationId: string,
  startedAt: string,
  plantations: Plantation[]
): string {
  const label = getJobTypeLabel(type).toUpperCase();
  const block = plantations.find((p) => p.id === plantationId)?.block;
  const dateKey = startedAt ? startedAt.slice(0, 10) : toLocalDateKey(new Date());
  const parts = [label];
  if (block) parts.push(`BLOK ${block}`);
  const d = fmtDate(dateKey);
  if (d) parts.push(d);
  return parts.join(" - ");
}

const STATUS_OPTIONS: SegOption<OtherWorkStatus>[] = [
  { value: "scheduled", label: "Dijadualkan", bg: "var(--accent-blue-light)", color: "var(--accent-blue)" },
  { value: "running", label: "Sedang Berjalan", bg: "var(--status-work-bg)", color: "var(--status-work)" },
  { value: "completed", label: "Selesai", bg: "var(--accent-primary-light)", color: "var(--accent-primary)" },
  { value: "cancelled", label: "Dibatalkan", bg: "var(--accent-red-light)", color: "var(--accent-red)" },
];

const selectClass =
  "w-full h-12 px-3 rounded-xl text-sm outline-none border transition-colors duration-150 bg-[var(--bg-input-field)] border-[var(--border-input-field)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/30";

interface JobFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
  plantations: Plantation[];
  defaultPlantationId?: string;
  editing?: OtherWork | null;
  existingGroups?: string[];
  existingLeaders?: string[];
}

export default function JobFormDrawer({
  open,
  onClose,
  onSaved,
  plantations,
  defaultPlantationId,
  editing = null,
  existingGroups = [],
  existingLeaders = [],
}: JobFormDrawerProps) {
  const { user } = useAuth();

  const initialType: OtherWorkType = editing?.type ?? "membaja";

  const [type, setType] = useState<OtherWorkType>(initialType);
  const [status, setStatus] = useState<OtherWorkStatus>(editing?.status ?? "scheduled");
  const [plantationId, setPlantationId] = useState(
    editing?.plantation_id ?? defaultPlantationId ?? plantations[0]?.id ?? ""
  );
  const [groupName, setGroupName] = useState(editing?.group_name ?? "");
  const [leaderName, setLeaderName] = useState(editing?.leader_name ?? "");
  const [workerCount, setWorkerCount] = useState(editing?.worker_count ?? 0);
  const [progress, setProgress] = useState(editing?.progress ?? 0);
  const [startedAt, setStartedAt] = useState(
    editing ? toLocalInput(editing.started_at) : toLocalInput(new Date().toISOString())
  );
  const [endedAt, setEndedAt] = useState(toLocalInput(editing?.ended_at));
  const [notes, setNotes] = useState(editing?.notes ?? "");

  const [title, setTitle] = useState(editing?.title ?? "");
  const [titleTouched, setTitleTouched] = useState(!!editing);

  const [details, setDetails] = useState<Record<string, string>>(() => ({
    ...defaultsFor(initialType),
    ...toStringRecord(editing?.details),
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const autoTitle = buildAutoTitle(type, plantationId, startedAt, plantations);
  const displayedTitle = titleTouched ? title : autoTitle;

  const setDetail = (key: string, val: string) =>
    setDetails((prev) => ({ ...prev, [key]: val }));

  const handleTypeChange = (next: OtherWorkType) => {
    if (next === type) return;
    setType(next);
    setDetails(defaultsFor(next));
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const nextErrors: Record<string, string> = {};
    if (!plantationId) nextErrors.plantation_id = "BLOK DIPERLUKAN";

    const candidate = buildCandidate(type, details);
    const parsed = otherWorkDetailsSchema.safeParse(candidate);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (key !== "type" && !nextErrors[key]) nextErrors[key] = issue.message.toUpperCase();
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    const parsedDetails = parsed.data as Record<string, unknown>;
    const detailData: Record<string, unknown> = { ...parsedDetails };
    delete detailData.type;

    const finalTitle = (titleTouched && title.trim() ? title.trim() : autoTitle).toUpperCase();
    const finalProgress =
      status === "completed" ? 100 : status === "running" ? Math.max(0, Math.min(100, progress)) : 0;

    const payload = {
      plantation_id: plantationId,
      type,
      title: finalTitle,
      status,
      progress: finalProgress,
      worker_count: Math.max(0, Math.round(workerCount)),
      group_name: groupName.trim() ? groupName.trim().toUpperCase() : null,
      leader_name: leaderName.trim() ? leaderName.trim().toUpperCase() : null,
      details: detailData,
      started_at: fromLocalInput(startedAt),
      ended_at: fromLocalInput(endedAt),
      notes: notes.trim() ? notes.trim().toUpperCase() : null,
    };

    const { error } = editing
      ? await supabase.from("other_works").update(payload).eq("id", editing.id)
      : await supabase.from("other_works").insert({ ...payload, created_by: user.id });

    setSaving(false);

    if (error) {
      console.error("Failed to save other_work:", error);
      const msg = error.message || "GAGAL MENYIMPAN KERJA";
      const needsMigration = /does not exist|schema cache|column .* does not exist|check constraint/i.test(msg);
      const hint = needsMigration
        ? " — SILA JALANKAN SQL MIGRATION (other_works_schema.sql / other_works_v2_upgrade.sql / membaja_trips_schema.sql)"
        : "";
      setErrors({ form: `${msg}${hint}`.toUpperCase() });
      return;
    }

    onSaved(editing ? "Kerja dikemas kini" : "Kerja ditambah");
    onClose();
  };

  const renderDetails = () => {
    switch (type) {
      case "mencuci_merumput":
        return <MencuciFields value={details} onChange={setDetail} errors={errors} />;
      case "membaja":
        return <MembajaFields value={details} onChange={setDetail} errors={errors} />;
      case "pruning":
        return <PruningFields value={details} onChange={setDetail} errors={errors} />;
      case "cuci_parit":
        return <CuciParitFields value={details} onChange={setDetail} errors={errors} />;
      case "baiki_jalan":
        return <BaikiJalanFields value={details} onChange={setDetail} errors={errors} />;
      case "lain_lain":
        return <LainFields value={details} onChange={setDetail} errors={errors} />;
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "SUNTING KERJA" : "TAMBAH KERJA"}
      size="lg"
      mobileFull
      footer={
        <div style={{ textTransform: "uppercase" }}>
          {(errors.form || Object.keys(errors).some((k) => k !== "form")) && (
            <p
              className="mb-3 text-[11px] font-semibold leading-snug text-center sm:text-left"
              style={{ color: "var(--accent-red)" }}
              role="alert"
            >
              {errors.form || "SILA LENGKAPKAN MEDAN YANG DITANDAKAN"}
            </p>
          )}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" form="job-form" loading={saving}>
              {editing ? "Simpan Perubahan" : "Tambah Kerja"}
            </Button>
          </div>
        </div>
      }
    >
      <form
        id="job-form"
        onSubmit={handleSubmit}
        style={{ textTransform: "uppercase" }}
        className="space-y-6"
      >
        {/* MAKLUMAT ASAS */}
        <Section title="Maklumat Asas">
          <IconTileGrid
            ariaLabel="Jenis kerja"
            value={type}
            onChange={handleTypeChange}
            options={JOB_TYPES.map((jt) => ({ value: jt.value, label: jt.label, icon: jt.icon }))}
          />

          <TextField
            label="Tajuk Kerja (pilihan)"
            placeholder="Cth. Membaja Blok 04 Pusingan 2"
            value={displayedTitle}
            onChange={(v) => {
              setTitle(v);
              setTitleTouched(true);
            }}
          />

          <div>
            <FieldLabel required>Status</FieldLabel>
            <SegmentedControl
              ariaLabel="Status"
              value={status}
              onChange={setStatus}
              options={STATUS_OPTIONS}
            />
          </div>
        </Section>

        {/* LOKASI & KUMPULAN */}
        <Section title="Lokasi & Kumpulan">
          <label className="block">
            <FieldLabel required>Blok</FieldLabel>
            <select
              value={plantationId}
              onChange={(e) => setPlantationId(e.target.value)}
              className={selectClass}
              style={errors.plantation_id ? { borderColor: "var(--accent-red)" } : undefined}
              aria-label="Blok"
            >
              <option value="">PILIH BLOK…</option>
              {plantations.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.rancangan} · BLOK {p.block}
                </option>
              ))}
            </select>
            {errors.plantation_id && (
              <p className="mt-1 text-[11px] font-medium" style={{ color: "var(--accent-red)" }} role="alert">
                {errors.plantation_id}
              </p>
            )}
          </label>

          <CreatableInput
            label="Kumpulan"
            value={groupName}
            onChange={setGroupName}
            suggestions={existingGroups}
            placeholder="Taip nama kumpulan"
          />
          <CreatableInput
            label="Ketua"
            value={leaderName}
            onChange={setLeaderName}
            suggestions={existingLeaders}
            placeholder="Taip nama ketua"
          />

          <div>
            <FieldLabel>Bilangan Pekerja</FieldLabel>
            <Stepper value={workerCount} onChange={setWorkerCount} ariaLabel="Bilangan pekerja" />
          </div>
        </Section>

        {/* BUTIRAN KERJA (dynamic) */}
        <Section title="Butiran Kerja">
          <div key={type} className="animate-menu">
            {renderDetails()}
          </div>

          {status === "running" && (
            <div className="pt-1">
              <ProgressSlider value={progress} onChange={setProgress} />
            </div>
          )}
        </Section>

        {/* MASA */}
        <Section title="Masa">
          <DateTimeField
            label="Masa Mula"
            value={startedAt}
            onChange={setStartedAt}
            placeholder="Pilih tarikh & masa mula"
          />
          <DateTimeField
            label="Masa Tamat"
            value={endedAt}
            onChange={setEndedAt}
            placeholder="Pilih tarikh & masa tamat"
            optional
          />
        </Section>

        {/* CATATAN */}
        <Section title="Catatan">
          <Textarea
            label="Catatan (pilihan)"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Nota tambahan"
          />
        </Section>
      </form>
    </Modal>
  );
}
