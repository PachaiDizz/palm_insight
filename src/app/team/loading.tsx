import DashboardLayout from "@/components/DashboardLayout";
import { FadeIn, BlockCardSkeleton } from "@/components/ui/Skeleton";

export default function TeamLoading() {
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <FadeIn>
          <div className="mb-6">
            <div className="h-8 w-48 rounded-lg mb-2" style={{ backgroundColor: "var(--bg-elevated)" }} />
            <div className="h-4 w-64 rounded-lg" style={{ backgroundColor: "var(--bg-elevated)" }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <BlockCardSkeleton key={i} />
            ))}
          </div>
        </FadeIn>
      </div>
    </DashboardLayout>
  );
}
