import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title?: string;
  message: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="card-glow rounded-2xl border-dashed p-12 text-center">
      <Icon className="w-12 h-12 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.1)" }} />
      {title && <h3 className="card-title text-sm text-theme mb-1">{title}</h3>}
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
