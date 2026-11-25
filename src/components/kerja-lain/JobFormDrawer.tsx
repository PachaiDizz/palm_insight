"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";
import { otherWorkDetailsSchema } from "@/lib/schemas";
import { toLocalInput, fromLocalInput } from "@/lib/otherWorks";
import { persistWorkOptions } from "@/lib/workOptions";
import { toLocalDateKey } from "@/lib/date";
import { getJobTypeLabel, JOB_TYPES } from "./jobMeta";
import {
  Section,
  FieldLabel,
  IconTileGrid,
  SegmentedControl,
  ProgressSlider,
  TextField,
  type SegOption,
} from "./form/controls";
import DateTimeField from "./form/DateTimeField";
import MencuciFields from "./fields/MencuciFields";
import MembajaFields from "./fields/MembajaFields";
import PruningFields from "./fields/PruningFields";
import CuciParitFields from "./fields/CuciParitFields";
import BaikiJalanFields from "./fields/BaikiJalanFields";
import LainFields from "./fields/LainFields";
import type { ToastData } from "@/components/ui/Toast";
import type { WorkOptionCategory } from "@/types";
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
      return {
        contractor: "",
        method: "",
        area_ha: "",
        chemical_name: "",
        chemical_qty_l: "",
        first_work_date: "",
        last_work_date: "",
        rounds: "[]",
      };
    case "membaja":
      return {
        contractor: "",
        driver_name: "",
        lorry_no: "",
        round_no: "",
        trip_count: "1",
        fertilizer_type: "",
        trips: JSON.stringify([{ items: [{ name: "", bags: "", kg: "" }] }]),
        area_ha: "",
        rate_per_palm_kg: "",
      };
    case "pruning":
      return { contractor: "", pruning_type: "", tree_count: "", area_hectare: "" };
    case "cuci_parit":
      return {
        contractor: "",
        ditch_length_value: "",
        ditch_length_unit: "M",
        ditch_count: "",
        depth_cm: "",
      };
    case "baiki_jalan":
      return { contractor: "", road_length_m: "", material: "", machine: "" };
    case "lain_lain":
      return { contractor: "", description: "", quantity: "", unit: "" };
  }
}

/** Merge saved details onto defaults, upgrading legacy MEMBAJA shapes. */
function initialDetails(
  type: OtherWorkType,
  saved: Record<string, unknown> | null | undefined
): Record<string, string> {
  const merged = { ...defaultsFor(type), ...toStringRecord(saved) };
  if (type === "membaja" && saved) {
    const hasTrips = Array.isArray(saved.trips) && saved.trips.length > 0;
    const legacyItems = saved.items;
    if (!hasTrips && Array.isArray(legacyItems) && legacyItems.length > 0) {
      merged.trips = JSON.stringify([{ items: legacyItems }]);
      merged.trip_count = "1";
    }
    if (!merged.area_ha && merged["chekar_area_ha"]) {
      merged.area_ha = merged["chekar_area_ha"];
    }
  }
  if (type === "cuci_parit" && saved) {
    if (!merged.ditch_length_value && merged["ditch_length_m"]) {
      merged.ditch_length_value = merged["ditch_length_m"];
      merged.ditch_length_unit = "M";
    }
  }
  return merged;
}

function toStringRecord(d: Record<string, unknown> | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (d) {
    for (const k of Object.keys(d)) {
      const v = d[k];
      out[k] =
        v === null || v === undefined
          ? ""
          : typeof v === "object"
            ? JSON.stringify(v)
            : String(v);
    }
  }
  return out;
}

const letterFor = (i: number) => String.fromCharCode(65 + (i % 26));

function parseTripItems(rawItems: unknown) {
  if (!Array.isArray(rawItems)) return [];
  return rawItems
    .map((r, i) => {
      const o = (r ?? {}) as Record<string, unknown>;
      return {
        label: letterFor(i),
        name: String(o.name ?? "").trim().toUpperCase(),
        bags: numOrUndef(String(o.bags ?? "")),
        kg: numOrUndef(String(o.kg ?? "")),
      };
    })
    .filter((r) => !(r.name === "" && r.bags === undefined && r.kg === undefined));
}

function parseMembajaTrips(raw?: string) {
  let arr: unknown = [];
  try {
    arr = JSON.parse(raw || "[]");
  } catch {
    arr = [];
  }
  if (!Array.isArray(arr)) return [];
  return arr.map((t, i) => {
    const o = (t ?? {}) as Record<string, unknown>;
    return { trip_no: i + 1, items: parseTripItems(o.items) };
  });
}

function parseDitchUnit(raw?: string): "M" | "KM" {
  return (raw ?? "").trim().toUpperCase() === "KM" ? "KM" : "M";
}

function parseRounds(raw?: string) {
  let arr: unknown = [];
  try {
    arr = JSON.parse(raw || "[]");
  } catch {
    arr = [];
  }
  if (!Array.isArray(arr)) return [];
  return arr.map((r, i) => {
    const o = (r ?? {}) as Record<string, unknown>;
    return {
      no: i + 1,
      start_date: String(o.start_date ?? "").trim(),
      end_date: String(o.end_date ?? "").trim() || undefined,
      area_ha: numOrUndef(String(o.area_ha ?? "")),
      worker_count: numOrUndef(String(o.worker_count ?? "")),
      notes: strOrUndef(String(o.notes ?? "")),
    };
  });
}

function numOrUndef(s?: string): number | undefined {
  if (s == null || s.trim() === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}
function strOrUndef(s?: string): string | undefined {
  const t = (s ?? "").trim().replace(/\s+/g, " ");
  return t ? t.toUpperCase() : undefined;
}

function buildCandidate(
  type: OtherWorkType,
  raw: Record<string, string>,
  workerCount = 0
) {
  switch (type) {
    case "mencuci_merumput":
      return {
        type,
        contractor: strOrUndef(raw.contractor),
        method: strOrUndef(raw.method),
        area_ha: numOrUndef(raw.area_ha),
        chemical_name: strOrUndef(raw.chemical_name),
        chemical_qty_l: numOrUndef(raw.chemical_qty_l),
        first_work_date: raw.first_work_date?.trim() || undefined,
        last_work_date: raw.last_work_date?.trim() || undefined,
        rounds: parseRounds(raw.rounds),
      };
    case "membaja": {
      const round = numOrUndef(raw.round_no);
      return {
        type,
        contractor: (raw.contractor ?? "").trim().toUpperCase(),
        worker_count: Math.max(0, Math.round(workerCount)),
        driver_name: strOrUndef(raw.driver_name),
        lorry_no: strOrUndef(raw.lorry_no),
        round_no: round != null && Number.isFinite(round) ? round : undefined,
        fertilizer_type: strOrUndef(raw.fertilizer_type),
        trips: parseMembajaTrips(raw.trips),
        area_ha: numOrUndef(raw.area_ha),
        rate_per_palm_kg: numOrUndef(raw.rate_per_palm_kg),
      };
    }
    case "pruning":
      return {
        type,
        contractor: strOrUndef(raw.contractor),
        pruning_type: strOrUndef(raw.pruning_type),
        tree_count: numOrUndef(raw.tree_count),
        area_hectare: numOrUndef(raw.area_hectare),
      };
    case "cuci_parit": {
      const unit = parseDitchUnit(raw.ditch_length_unit);
      const value = numOrUndef(raw.ditch_length_value);
      return {
        type,
        contractor: (raw.contractor ?? "").trim().toUpperCase(),
        ditch_length_value: value,
        ditch_length_unit: unit,
        ditch_length_m:
          value != null && Number.isFinite(value)
            ? unit === "KM"
              ? value * 1000
              : value
            : value,
        ditch_count: numOrUndef(raw.ditch_count),
        depth_cm: numOrUndef(raw.depth_cm),
      };
    }
    case "baiki_jalan":
      return {
        type,
        contractor: strOrUndef(raw.contractor),
        road_length_m: numOrUndef(raw.road_length_m),
        material: strOrUndef(raw.material),
        machine: strOrUndef(raw.machine),
      };
    case "lain_lain":
      return {
        type,
        contractor: strOrUndef(raw.contractor),
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
  onToast?: (toast: ToastData) => void;
}

export default function JobFormDrawer({
  open,
  onClose,
  onSaved,
  plantations,
  defaultPlantationId,
  editing = null,
  onToast,
}: JobFormDrawerProps) {
  const { user } = useAuth();

  const initialType: OtherWorkType = editing?.type ?? "membaja";

  const [type, setType] = useState<OtherWorkType>(initialType);
  const [status, setStatus] = useState<OtherWorkStatus>(editing?.status ?? "scheduled");
  const [plantationId, setPlantationId] = useState(
    editing?.plantation_id ?? defaultPlantationId ?? plantations[0]?.id ?? ""
  );
  const [workerCount, setWorkerCount] = useState(editing?.worker_count ?? 0);
  const [progress, setProgress] = useState(editing?.progress ?? 0);
  const [startedAt, setStartedAt] = useState(
    editing ? toLocalInput(editing.started_at) : toLocalInput(new Date().toISOString())
  );
  const [endedAt, setEndedAt] = useState(toLocalInput(editing?.ended_at));
  const [notes, setNotes] = useState(editing?.notes ?? "");

  const [title, setTitle] = useState(editing?.title ?? "");

  const [details, setDetails] = useState<Record<string, string>>(() =>
    initialDetails(initialType, editing?.details)
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const autoTitle = buildAutoTitle(type, plantationId, startedAt, plantations);

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

    // Cross-field date checks for MENCUCI / MERUMPUT.
    if (type === "mencuci_merumput") {
      const first = details.first_work_date?.trim();
      const last = details.last_work_date?.trim();
      if (first && last && last < first) {
        nextErrors.last_work_date = "TARIKH TAMAT TIDAK BOLEH SEBELUM TARIKH PERTAMA";
      }
      parseRounds(details.rounds).forEach((r, i) => {
        if (r.end_date && r.start_date && r.end_date < r.start_date) {
          nextErrors[`rounds.${i}.end_date`] = "TARIKH TAMAT SEBELUM TARIKH MULA";
        }
      });
    }

    const candidate = buildCandidate(type, details, workerCount);
    const parsed = otherWorkDetailsSchema.safeParse(candidate);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".") || "form";
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

    // Totals are always derived on save (never trusted from the UI).
    if (type === "membaja") {
      type TripItems = { bags: number; kg: number }[];
      const trips =
        (detailData.trips as { trip_no: number; items: TripItems }[] | undefined) ?? [];
      let grandBags = 0;
      let grandKg = 0;
      detailData.trips = trips.map((t, i) => {
        const items = t.items ?? [];
        const bags = items.reduce((s, it) => s + (Number(it.bags) || 0), 0);
        const kg = items.reduce((s, it) => s + (Number(it.kg) || 0), 0);
        grandBags += bags;
        grandKg += kg;
        return { ...t, trip_no: i + 1, total_bags: bags, total_kg: kg };
      });
      detailData.trip_count = trips.length;
      detailData.total_bags = grandBags;
      detailData.total_kg = grandKg;
      if (detailData.round_no == null) detailData.round_no = null;
    } else if (type === "mencuci_merumput") {
      const rounds = (detailData.rounds as { area_ha?: number }[] | undefined) ?? [];
      detailData.total_rounds = rounds.length;
      detailData.total_round_area_ha = rounds.reduce(
        (s, r) => s + (Number(r.area_ha) || 0),
        0
      );
    }

    const finalTitle =
      type === "lain_lain" && title.trim() ? title.trim().toUpperCase() : autoTitle;
    const finalProgress =
      status === "completed" ? 100 : status === "running" ? Math.max(0, Math.min(100, progress)) : 0;

    const payload = {
      plantation_id: plantationId,
      type,
      title: finalTitle,
      status,
      progress: finalProgress,
      worker_count: Math.max(0, Math.round(workerCount)),
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
        ? " — SILA JALANKAN SQL MIGRATION (SETUP_other_works.sql / work_options_setup.sql)"
        : "";
      setErrors({ form: `${msg}${hint}`.toUpperCase() });
      return;
    }

    // Persist any typed-but-unsaved creatable values against the block.
    const optionEntries: { category: WorkOptionCategory; value: string | null | undefined }[] = [
      { category: "contractor", value: details.contractor },
    ];
    if (type === "membaja") {
      optionEntries.push({ category: "fertilizer", value: details.fertilizer_type });
      for (const trip of parseMembajaTrips(details.trips)) {
        for (const it of trip.items) {
          optionEntries.push({ category: "fertilizer", value: it.name });
        }
      }
    } else if (type === "mencuci_merumput") {
      optionEntries.push({ category: "method", value: details.method });
      optionEntries.push({ category: "chemical_name", value: details.chemical_name });
    } else if (type === "pruning") {
      optionEntries.push({ category: "pruning_type", value: details.pruning_type });
    } else if (type === "baiki_jalan") {
      optionEntries.push({ category: "material", value: details.material });
      optionEntries.push({ category: "machine", value: details.machine });
    }
    void persistWorkOptions(optionEntries, plantationId);

    onSaved(editing ? "Kerja dikemas kini" : "Kerja ditambah");
    onClose();
  };

  const renderDetails = () => {
    switch (type) {
      case "mencuci_merumput":
        return (
          <MencuciFields
            value={details}
            onChange={setDetail}
            errors={errors}
            plantationId={plantationId}
            onToast={onToast}
          />
        );
      case "membaja":
        return (
          <MembajaFields
            value={details}
            onChange={setDetail}
            errors={errors}
            workerCount={workerCount}
            onWorkerCountChange={setWorkerCount}
            plantationId={plantationId}
            onToast={onToast}
          />
        );
      case "pruning":
        return (
          <PruningFields
            value={details}
            onChange={setDetail}
            errors={errors}
            plantationId={plantationId}
            onToast={onToast}
          />
        );
      case "cuci_parit":
        return (
          <CuciParitFields
            value={details}
            onChange={setDetail}
            errors={errors}
            plantationId={plantationId}
            onToast={onToast}
          />
        );
      case "baiki_jalan":
        return (
          <BaikiJalanFields
            value={details}
            onChange={setDetail}
            errors={errors}
            plantationId={plantationId}
            onToast={onToast}
          />
        );
      case "lain_lain":
        return (
          <LainFields
            value={details}
            onChange={setDetail}
            errors={errors}
            plantationId={plantationId}
            onToast={onToast}
          />
        );
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

          {type === "lain_lain" && (
            <TextField
              label="Tajuk Kerja (pilihan)"
              placeholder="Cth. Kerja baik pulih pagar"
              value={title}
              onChange={setTitle}
            />
          )}

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

        {/* LOKASI */}
        <Section title="Lokasi">
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
