import {
  SprayCan,
  Wheat,
  Scissors,
  Waves,
  Construction,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { OtherWorkStatus, OtherWorkType } from "@/types";

export interface JobTypeMeta {
  value: OtherWorkType;
  label: string;
  icon: LucideIcon;
}

export const JOB_TYPES: JobTypeMeta[] = [
  { value: "mencuci_merumput", label: "Mencuci / Merumput", icon: SprayCan },
  { value: "membaja", label: "Membaja", icon: Wheat },
  { value: "pruning", label: "Pruning", icon: Scissors },
  { value: "cuci_parit", label: "Cuci Parit", icon: Waves },
  { value: "baiki_jalan", label: "Baiki Jalan", icon: Construction },
  { value: "lain_lain", label: "Lain-lain", icon: Wrench },
];

const JOB_TYPE_MAP: Record<OtherWorkType, JobTypeMeta> = JOB_TYPES.reduce(
  (acc, meta) => {
    acc[meta.value] = meta;
    return acc;
  },
  {} as Record<OtherWorkType, JobTypeMeta>
);

export function getJobTypeMeta(type: OtherWorkType): JobTypeMeta {
  return JOB_TYPE_MAP[type] ?? JOB_TYPES[JOB_TYPES.length - 1];
}

export function getJobTypeLabel(type: OtherWorkType): string {
  return getJobTypeMeta(type).label;
}

export const JOB_STATUS_LABELS: Record<OtherWorkStatus, string> = {
  scheduled: "Dijadualkan",
  running: "Sedang Berjalan",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

// ── Detail chips (uppercase, for JobCard) ───────────────────────────────────

function asStr(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.toUpperCase() : undefined;
}
function asNum(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

const MONTHS_SHORT = [
  "JAN", "FEB", "MAC", "APR", "MEI", "JUN",
  "JUL", "OGOS", "SEP", "OKT", "NOV", "DIS",
];

/** `YYYY-MM-DD` → "24 NOV" (or "24 NOV 2026" when withYear). */
function shortDate(v: unknown, withYear = false): string | undefined {
  if (typeof v !== "string") return undefined;
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return undefined;
  const base = `${m[3]} ${MONTHS_SHORT[+m[2] - 1]}`;
  return withYear ? `${base} ${m[1]}` : base;
}

/** Small uppercase chips summarising the type-specific values. */
export function getDetailChips(
  type: OtherWorkType,
  details: Record<string, unknown> | null
): string[] {
  const d = details ?? {};
  const chips: string[] = [];
  const push = (v?: string | number | null) => {
    if (v === undefined || v === null || v === "") return;
    chips.push(String(v));
  };

  switch (type) {
    case "mencuci_merumput": {
      chips.push("MENCUCI / MERUMPUT");
      push(asStr(d.method));
      const rounds = asNum(d.total_rounds);
      if (rounds != null && rounds > 0) push(`${rounds} PUSINGAN`);
      const first = shortDate(d.first_work_date);
      const last = shortDate(d.last_work_date);
      if (first && last) push(`${first} - ${last}`);
      else if (first) push(first);
      break;
    }
    case "membaja": {
      chips.push("MEMBAJA");
      const round = asNum(d.round_no);
      if (round != null) push(`PUSINGAN ${round}`);
      const trips = asNum(d.trip_count);
      if (trips != null && trips > 0) push(`${trips} TRIP`);
      const bags = asNum(d.total_bags);
      if (bags != null) push(`${bags.toLocaleString("en-MY")} BAG`);
      const kg = asNum(d.total_kg);
      if (kg != null) push(`${kg.toLocaleString("en-MY")} KG`);
      break;
    }
    case "pruning": {
      chips.push("PRUNING");
      push(asStr(d.pruning_type));
      const trees = asNum(d.tree_count);
      if (trees != null) push(`${trees} POKOK`);
      break;
    }
    case "cuci_parit": {
      chips.push("CUCI PARIT");
      const value = asNum(d.ditch_length_value);
      const unit = asStr(d.ditch_length_unit);
      const legacy = asNum(d.ditch_length_m);
      if (value != null) push(`${value} ${unit ?? "M"}`);
      else if (legacy != null) push(`${legacy} M`);
      const cnt = asNum(d.ditch_count);
      if (cnt != null) push(`${cnt} PARIT`);
      break;
    }
    case "baiki_jalan": {
      chips.push("BAIKI JALAN");
      const len = asNum(d.road_length_m);
      if (len != null) push(`${len} M`);
      const material = asStr(d.material);
      const materialOther = asStr(d.material_other);
      if (material === "LAIN-LAIN" && materialOther) push(materialOther);
      else push(material);
      break;
    }
    case "lain_lain": {
      chips.push("LAIN-LAIN");
      push(asStr(d.description));
      const q = asNum(d.quantity);
      if (q != null) push(`${q} ${asStr(d.unit) ?? ""}`.trim());
      break;
    }
  }

  return chips.filter(Boolean).slice(0, 6);
}

/** Second-line summary shown on every job card: "KONTRAKTOR: X · LORI: Y". */
export function getContractorLine(
  details: Record<string, unknown> | null
): string | null {
  const d = details ?? {};
  const parts: string[] = [];
  const contractor = asStr(d.contractor);
  if (contractor) parts.push(`KONTRAKTOR: ${contractor}`);
  const lorry = asStr(d.lorry_no);
  if (lorry) parts.push(`LORI: ${lorry}`);
  return parts.length ? parts.join(" · ") : null;
}
