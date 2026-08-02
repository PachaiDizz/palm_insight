import DashboardLayout from "@/components/DashboardLayout";
import { FadeIn, TableSkeleton } from "@/components/ui/Skeleton";

export default function EntriesLoading() {
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <FadeIn>
          <div className="mb-6">
            <div className="h-8 w-44 rounded-lg mb-2" style={{ backgroundColor: "var(--bg-elevated)" }} />
            <div className="h-4 w-72 rounded-lg" style={{ backgroundColor: "var(--bg-elevated)" }} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card-glow rounded-2xl p-4" style={{ backgroundColor: "var(--bg-card)" }}>
                <div className="h-3 w-20 rounded mb-2" style={{ backgroundColor: "var(--bg-elevated)" }} />
                <div className="h-6 w-12 rounded" style={{ backgroundColor: "var(--bg-elevated)" }} />
              </div>
            ))}
          </div>
          <TableSkeleton rows={8} cols={9} />
        </FadeIn>
      </div>
    </DashboardLayout>
  );
}
