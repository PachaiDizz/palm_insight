"use client";

import type { OtherWorkStatus } from "@/types";
import { getStatusStyle } from "./statusStyles";

export default function JobStatusChip({
  status,
  size = "sm",
}: {
  status: OtherWorkStatus;
  size?: "sm" | "md";
}) {
  const style = getStatusStyle(status);
  const Icon = style.icon;
  const padding = size === "sm" ? "px-2 py-0.5" : "px-2.5 py-1";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full text-xs font-medium whitespace-nowrap border ${padding}`}
      style={{
        backgroundColor: style.bg,
        color: style.text,
        borderColor: style.border,
      }}
    >
      {style.dot ? (
        <span className="relative flex h-2 w-2" aria-hidden>
          <span
            className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
            style={{ backgroundColor: style.text }}
          />
          <span
            className="relative inline-flex h-2 w-2 rounded-full"
            style={{ backgroundColor: style.text }}
          />
        </span>
      ) : (
        <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden />
      )}
      {style.label}
    </span>
  );
}
