"use client";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = "", style }: SkeletonProps) {
  return (
    <div className={`animate-pulse rounded-xl ${className}`} style={{ backgroundColor: "var(--border-subtle)", ...style }} />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl p-5 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-default)" }}>
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="w-20 h-3" />
        <Skeleton className="w-9 h-9 rounded-xl" />
      </div>
      <Skeleton className="w-16 h-8" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-default)" }}>
      <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border-default)" }}>
        <Skeleton className="w-32 h-4" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-12 h-4" />
            <Skeleton className="flex-1 h-4" />
            <Skeleton className="w-20 h-4" />
            <Skeleton className="w-16 h-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
