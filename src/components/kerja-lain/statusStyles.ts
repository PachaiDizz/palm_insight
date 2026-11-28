import {
  Activity,
  CalendarClock,
  CheckCircle2,
  XCircle,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import type { OtherWorkStatus } from "@/types";

/**
 * Single source of truth for Kerja-Kerja Lain status colors.
 * Amber stays the app brand accent (buttons, section headers, focus rings)
 * and is used ONLY for the "Sedang Berjalan" (in-progress) status here.
 */
export interface StatusStyle {
  label: string;
  icon: LucideIcon;
  /** Foreground / text color. */
  text: string;
  /** Tinted background (~15% opacity). */
  bg: string;
  /** Tinted border (~30% opacity). */
  border: string;
  /** Solid fill for progress bars / indicators. */
  solid: string;
  /** Whether to render the pulsing dot indicator. */
  dot: boolean;
}

export const STATUS_STYLES: Record<OtherWorkStatus, StatusStyle> = {
  scheduled: {
    label: "Dijadualkan",
    icon: CalendarClock,
    text: "#60a5fa",
    bg: "rgba(59, 130, 246, 0.15)",
    border: "rgba(59, 130, 246, 0.30)",
    solid: "#3b82f6",
    dot: false,
  },
  running: {
    label: "Sedang Berjalan",
    icon: Activity,
    text: "#fbbf24",
    bg: "rgba(245, 158, 11, 0.15)",
    border: "rgba(245, 158, 11, 0.30)",
    solid: "#f59e0b",
    dot: true,
  },
  completed: {
    label: "Selesai",
    icon: CheckCircle2,
    text: "#34d399",
    bg: "rgba(16, 185, 129, 0.15)",
    border: "rgba(16, 185, 129, 0.30)",
    solid: "#10b981",
    dot: false,
  },
  cancelled: {
    label: "Dibatalkan",
    icon: XCircle,
    text: "#f87171",
    bg: "rgba(239, 68, 68, 0.15)",
    border: "rgba(239, 68, 68, 0.30)",
    solid: "#ef4444",
    dot: false,
  },
};

export function getStatusStyle(status: OtherWorkStatus): StatusStyle {
  return STATUS_STYLES[status] ?? STATUS_STYLES.scheduled;
}

/** The neutral "Semua" pseudo-status used by the tab bar only. */
export const ALL_STATUS_STYLE: Omit<StatusStyle, "label" | "icon" | "dot"> & {
  label: string;
  icon: LucideIcon;
} = {
  label: "Semua",
  icon: Briefcase,
  text: "var(--text-primary)",
  bg: "var(--hover-subtle)",
  border: "var(--border-default)",
  solid: "var(--text-secondary)",
};

export const STATUS_TABS = ["all", "scheduled", "running", "completed"] as const;
export type StatusTab = (typeof STATUS_TABS)[number];
