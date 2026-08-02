import DashboardLayout from "@/components/DashboardLayout";
import { FadeIn, PlantationCardSkeleton } from "@/components/ui/Skeleton";

export default function PlantationsLoading() {
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <FadeIn>
          <div className="mb-6">
            <div className="h-8 w-40 rounded-lg mb-2" style={{ backgroundColor: "var(--bg-elevated)" }} />
            <div className="h-4 w-56 rounded-lg" style={{ backgroundColor: "var(--bg-elevated)" }} />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <PlantationCardSkeleton key={i} />
            ))}
          </div>
        </FadeIn>
      </div>
    </DashboardLayout>
  );
}
