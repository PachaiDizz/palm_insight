"use client";

import { Trash2 } from "lucide-react";

export default function RepeatableRowCard({
  header,
  onRemove,
  removeDisabled = false,
  removeLabel = "Padam",
  children,
}: {
  header: React.ReactNode;
  onRemove: () => void;
  removeDisabled?: boolean;
  removeLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border p-4 min-w-0 space-y-3"
      style={{
        borderColor: "var(--border-default)",
        backgroundColor: "var(--bg-input)",
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex-1 min-w-0">{header}</div>
        <button
          type="button"
          onClick={onRemove}
          disabled={removeDisabled}
          aria-label={removeLabel}
          className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 transition-colors duration-150 hover:bg-[var(--accent-red-light)] disabled:opacity-30"
          style={{ color: "var(--accent-red)" }}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      {children}
    </div>
  );
}
