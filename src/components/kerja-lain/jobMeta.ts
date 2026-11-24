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
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
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
      const area = asNum(d.area_hectare);
      if (area != null) push(`${area} HA`);
      push(asStr(d.chemical_name));
      break;
    }
    case "membaja": {
      chips.push("MEMBAJA");
      push(asStr(d.fertilizer_type));
      const q = asNum(d.quantity_value);
      if (q != null) push(`${q} ${asStr(d.quantity_unit) ?? ""}`.trim());
      const trees = asNum(d.tree_count);
      if (trees != null) push(`${trees} POKOK`);
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
      const len = asNum(d.ditch_length_m);
      if (len != null) push(`${len} M`);
      const cnt = asNum(d.ditch_count);
      if (cnt != null) push(`${cnt} PARIT`);
      break;
    }
    case "baiki_jalan": {
      chips.push("BAIKI JALAN");
      const len = asNum(d.road_length_m);
      if (len != null) push(`${len} M`);
      push(asStr(d.material));
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

  return chips.filter(Boolean).slice(0, 4);
}
