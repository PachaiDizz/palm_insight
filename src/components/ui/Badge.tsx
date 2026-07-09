interface BadgeProps {
  /** "work" or "no-work" — semantic, theme-aware. */
  status: "work" | "no-work";
  size?: "sm" | "md";
  className?: string;
}

/**
 * One status-pill treatment for every Work / No-Work indicator in the app.
 * Uses semantic --status-* tokens so light/dark adapt together.
 */
export default function Badge({ status, size = "md", className = "" }: BadgeProps) {
  const isWork = status === "work";
  const padding = size === "sm" ? "px-2 py-0.5" : "px-2 py-1";
  return (
    <span
      className={`text-xs ${padding} rounded-full whitespace-nowrap ${className}`}
      style={{
        backgroundColor: isWork ? "var(--status-work-bg)" : "var(--status-no-work-bg)",
        color: isWork ? "var(--status-work)" : "var(--status-no-work)",
      }}
    >
      {isWork ? "Work" : "No Work"}
    </span>
  );
}
