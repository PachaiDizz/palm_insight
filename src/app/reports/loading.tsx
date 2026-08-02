import DashboardLayout from "@/components/DashboardLayout";
import { FadeIn, ChartSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function ReportsLoading() {
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <FadeIn>
          <div className="mb-6">
            <div className="h-8 w-40 rounded-lg mb-2" style={{ backgroundColor: "var(--bg-elevated)" }} />
            <div className="h-4 w-52 rounded-lg" style={{ backgroundColor: "var(--bg-elevated)" }} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card-glow rounded-2xl p-4" style={{ backgroundColor: "var(--bg-card)" }}>
                <div className="h-3 w-24 rounded mb-2" style={{ backgroundColor: "var(--bg-elevated)" }} />
                <div className="h-6 w-16 rounded" style={{ backgroundColor: "var(--bg-elevated)" }} />
              </div>
            ))}
          </div>
          <ChartSkeleton height={280} />
          <div className="mt-6">
            <TableSkeleton rows={6} cols={7} />
          </div>
        </FadeIn>
      </div>
    </DashboardLayout>
  );
}
