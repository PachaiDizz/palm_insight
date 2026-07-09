import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  /** Icon + accent color. Defaults to the brand primary (amber). Pass a token reference
   *  e.g. "var(--accent-primary)", a hex, or a semantic token like "var(--status-work)". */
  color?: string;
  /** Optional acreage-style glow blob in the corner. Leave off for muted cards. */
  glow?: boolean;
  className?: string;
}

/**
 * One stat-card treatment for the whole app.
 * Cards that should feel "primary" pass the brand color + glow;
 * secondary metrics pass a muted/neutral color and omit the glow.
 * Tokens adapt to dark/light automatically.
 */
export default function StatCard({
  label,
  value,
  icon: Icon,
  color = "var(--accent-primary)",
  glow = false,
  className = "",
}: StatCardProps) {
  return (
    <div
      className={`card-glow relative rounded-2xl p-3 sm:p-4 overflow-hidden ${className}`}
      style={{ backgroundColor: "var(--bg-card)" }}
    >
      {glow && (
        <div
          className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-30 blur-xl pointer-events-none"
          style={{ backgroundColor: color }}
        />
      )}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span
            className="text-[10px] sm:text-xs font-medium uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            {label}
          </span>
          <Icon className="w-4 h-4 shrink-0" style={{ color }} />
        </div>
        <div className="text-xl sm:text-3xl font-bold text-theme">
          {typeof value === "number" ? value.toLocaleString("en-MY") : value}
        </div>
      </div>
    </div>
  );
}
