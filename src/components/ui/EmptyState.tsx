import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title?: string;
  message: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed p-12 text-center" style={{ borderColor: "var(--border-default)" }}>
      <Icon className="w-12 h-12 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.1)" }} />
      {title && <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>}
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
