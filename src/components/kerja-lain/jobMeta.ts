import {
  SprayCan,
  Wheat,
  Scissors,
  Construction,
  Waves,
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
  { value: "racun_rumpai", label: "Racun Rumpai", icon: SprayCan },
  { value: "baja", label: "Baja", icon: Wheat },
  { value: "pangkas", label: "Pangkas", icon: Scissors },
  { value: "baiki_jalan", label: "Baiki Jalan", icon: Construction },
  { value: "parit", label: "Parit", icon: Waves },
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

export const JOB_STATUS_LABELS: Record<OtherWorkStatus, string> = {
  scheduled: "Dijadualkan",
  running: "Sedang Berjalan",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};
