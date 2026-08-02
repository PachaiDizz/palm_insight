import DashboardLayout from "@/components/DashboardLayout";
import { DashboardSkeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <DashboardSkeleton />
      </div>
    </DashboardLayout>
  );
}
