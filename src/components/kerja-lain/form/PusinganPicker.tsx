"use client";

import { FieldLabel } from "./controls";

const ROUNDS = [1, 2, 3, 4, 5] as const;

export default function PusinganPicker({
  value,
  onChange,
}: {
  /** "1".."5" or "" when nothing selected. */
  value: string;
  onChange: (value: string) => void;
}) {
  const selected = Number(value);

  const toggle = (round: number) => {
    onChange(selected === round ? "" : String(round));
  };

  return (
    <div>
      <FieldLabel>Pusingan Ke-</FieldLabel>
      <div
        role="radiogroup"
        aria-label="Pusingan ke-"
        className="flex flex-wrap gap-1.5 p-1 rounded-xl"
        style={{ backgroundColor: "var(--bg-input)" }}
      >
        {ROUNDS.map((round) => {
          const active = selected === round;
          return (
            <button
              key={round}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => toggle(round)}
              className="flex-1 basis-[calc(20%-5px)] h-10 rounded-lg text-sm font-bold tabular-nums transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              style={{
                backgroundColor: active
                  ? "var(--accent-primary-light)"
                  : "transparent",
                color: active ? "var(--accent-primary)" : "var(--text-secondary)",
                boxShadow: active
                  ? "inset 0 0 0 1px var(--accent-primary-border)"
                  : "none",
              }}
            >
              {round}
            </button>
          );
        })}
      </div>
    </div>
  );
}
