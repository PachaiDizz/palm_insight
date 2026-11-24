"use client";

import type { OtherWorkStatus } from "@/types";
import { JOB_STATUS_LABELS } from "./jobMeta";

const STATUS_STYLES: Record<OtherWorkStatus, { bg: string; color: string }> = {
  scheduled: { bg: "var(--accent-blue-light)", color: "var(--accent-blue)" },
  running: { bg: "var(--status-work-bg)", color: "var(--status-work)" },
  completed: { bg: "var(--accent-primary-light)", color: "var(--accent-primary)" },
  cancelled: { bg: "var(--accent-red-light)", color: "var(--accent-red)" },
};

export default function JobStatusChip({
  status,
  size = "sm",
}: {
  status: OtherWorkStatus;
  size?: "sm" | "md";
}) {
  const style = STATUS_STYLES[status];
  const padding = size === "sm" ? "px-2 py-0.5" : "px-2.5 py-1";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full text-xs font-medium whitespace-nowrap ${padding}`}
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      {status === "running" && (
        <span className="relative flex h-1.5 w-1.5" aria-hidden>
          <span
            className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
            style={{ backgroundColor: style.color }}
          />
          <span
            className="relative inline-flex h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: style.color }}
          />
        </span>
      )}
      {JOB_STATUS_LABELS[status]}
    </span>
  );
}
