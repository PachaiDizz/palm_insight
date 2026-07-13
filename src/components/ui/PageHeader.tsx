interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
      <div className="min-w-0">
        <h1 className="page-title text-2xl sm:text-3xl tracking-tight" style={{ color: "var(--text-primary)" }}>{title}</h1>
        {subtitle && (
          <p className="text-xs sm:text-sm mt-1 truncate" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
