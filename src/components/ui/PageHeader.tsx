interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
