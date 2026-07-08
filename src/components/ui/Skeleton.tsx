"use client";
import { ReactNode } from "react";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
  width?: string | number;
  height?: string | number;
}

const shimmerStyle: React.CSSProperties = {
  background: "linear-gradient(90deg, var(--bg-input) 25%, var(--bg-elevated) 50%, var(--bg-input) 75%)",
  backgroundSize: "200% 100%",
  animation: "skeleton-shimmer 1.5s ease-in-out infinite",
  borderRadius: "0.75rem",
};

export function Skeleton({ className = "", style, width, height }: SkeletonProps) {
  return (
    <div
      className={className}
      style={{ ...shimmerStyle, width, height, ...style }}
    />
  );
}

export function FadeIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <div
      style={{
        opacity: 0,
        animation: `skeleton-fade-in 300ms ease-out ${delay}ms forwards`,
      }}
    >
      {children}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card-glow relative rounded-2xl p-5 overflow-hidden" style={{ backgroundColor: "var(--bg-card)" }}>
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-xl" style={{ backgroundColor: "var(--text-muted)" }} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="w-20 h-3" />
          <Skeleton className="w-9 h-9 rounded-xl" />
        </div>
        <Skeleton className="w-16 h-8" />
      </div>
    </div>
  );
}

export function PlantationCardSkeleton() {
  return (
    <div className="card-glow rounded-2xl p-4 sm:p-5" style={{ backgroundColor: "var(--bg-card)" }}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="mb-4">
            <Skeleton className="w-32 h-2.5 mb-2" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div><Skeleton className="w-16 h-2 mb-1" /><Skeleton className="w-24 h-4" /></div>
              <div><Skeleton className="w-16 h-2 mb-1" /><Skeleton className="w-20 h-4" /></div>
              <div className="hidden sm:block"><Skeleton className="w-12 h-2 mb-1" /><Skeleton className="w-16 h-4" /></div>
            </div>
          </div>
          <div className="mb-4">
            <Skeleton className="w-36 h-2.5 mb-2" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[1,2,3,4].map(i => (
                <div key={i}><Skeleton className="w-20 h-2 mb-1" /><Skeleton className="w-28 h-4" /></div>
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="w-28 h-2.5 mb-2" />
            <Skeleton className="w-20 h-4" />
          </div>
          <div className="flex items-center gap-4 mt-4 pt-4" style={{ borderTop: "1px solid var(--border-default)" }}>
            <Skeleton className="w-28 h-6 rounded-lg" />
            <Skeleton className="w-32 h-3" />
            <Skeleton className="w-20 h-6 rounded-lg ml-auto" />
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          <Skeleton className="w-9 h-9 rounded-lg" />
          <Skeleton className="w-9 h-9 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function LeaderCardSkeleton() {
  return (
    <div className="w-full max-w-full md:max-w-[420px]">
      <Skeleton className="w-24 h-6 rounded-lg mx-auto mb-5" />
      <div className="card-glow w-full rounded-2xl p-4 sm:p-8" style={{ backgroundColor: "var(--bg-card)" }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-14 h-14 rounded-xl" />
            <div>
              <Skeleton className="w-28 h-5 mb-1.5" />
              <Skeleton className="w-20 h-3" />
            </div>
          </div>
          <Skeleton className="w-8 h-8 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="p-4 rounded-xl" style={{ backgroundColor: "rgba(99,102,241,0.08)" }}>
              <Skeleton className="w-20 h-2.5 mb-2" />
              <Skeleton className="w-12 h-5" />
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <Skeleton className="flex-1 h-12 rounded-xl" />
          <Skeleton className="flex-1 h-12 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function BlockCardSkeleton() {
  return (
    <div className="card-glow rounded-2xl p-5" style={{ backgroundColor: "var(--bg-card)" }}>
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="w-20 h-6 rounded-full" />
      </div>
      <Skeleton className="w-28 h-2.5 mb-1" />
      <Skeleton className="w-32 h-7 mb-3" />
      <div className="space-y-1.5">
        <Skeleton className="w-36 h-2.5" />
        <Skeleton className="w-24 h-2.5" />
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="card-glow rounded-2xl p-5" style={{ backgroundColor: "var(--bg-card)" }}>
      <Skeleton className="w-32 h-4 mb-4" />
      <Skeleton className="w-full h-[300px]" style={{ height }} />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 8 }: { rows?: number; cols?: number }) {
  return (
    <div className="card-glow rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)" }}>
      <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border-default)" }}>
        <Skeleton className="w-40 h-4" />
      </div>
      <div className="p-5 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className={`h-4 ${j === 0 ? "w-20" : j === cols - 1 ? "w-16" : "flex-1"}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header banner skeleton */}
      <div className="rounded-2xl p-4 sm:p-6" style={{ background: "var(--bg-header)" }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="w-36 h-5 mb-2" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />
            <Skeleton className="w-48 sm:w-72 h-6 sm:h-8 mb-1" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />
            <Skeleton className="w-48 h-3" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />
          </div>
          <Skeleton className="w-48 h-12 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />
        </div>
      </div>

      {/* Plantation details card */}
      <div className="card-glow rounded-2xl p-4 sm:p-6" style={{ backgroundColor: "var(--bg-card)" }}>
        <div className="flex items-center gap-2 mb-4 sm:mb-5">
          <Skeleton className="w-9 h-9 rounded-xl" />
          <Skeleton className="w-36 h-4" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i}>
              <Skeleton className="w-20 h-2 mb-1" />
              <Skeleton className="w-28 h-4" />
            </div>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="w-5 h-5" />
          <Skeleton className="w-40 h-5" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {[1,2,3,4].map(i => <StatCardSkeleton key={i} />)}
        </div>
      </div>

      {/* Chart area */}
      <ChartSkeleton height={180} />

      {/* Quick actions */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="w-5 h-5" />
          <Skeleton className="w-32 h-5" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {[1,2].map(i => (
            <div key={i} className="card-glow rounded-2xl p-4 sm:p-5" style={{ backgroundColor: "var(--bg-card)" }}>
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="w-28 h-4 mb-1" />
                  <Skeleton className="w-36 h-2.5" />
                </div>
                <Skeleton className="w-16 h-6 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent entries */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="w-5 h-5" />
          <Skeleton className="w-36 h-5" />
        </div>
        <div className="card-glow rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)" }}>
          <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-3.5">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                  <div className="min-w-0">
                    <Skeleton className="w-24 h-3.5 mb-1" />
                    <Skeleton className="w-32 h-2.5" />
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
                  <div className="text-right hidden sm:block">
                    <Skeleton className="w-20 h-3.5 mb-1" />
                    <Skeleton className="w-16 h-2.5" />
                  </div>
                  <Skeleton className="w-14 h-5 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
