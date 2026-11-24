import DashboardLayout from "@/components/DashboardLayout";
import { Skeleton } from "@/components/ui/Skeleton";

export default function KerjaLainLoading() {
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="flex-1">
            <Skeleton className="w-48 h-6 mb-2" />
            <Skeleton className="w-32 h-3" />
          </div>
          <Skeleton className="w-32 h-10 rounded-xl" />
        </div>
        <Skeleton className="w-full h-12 rounded-xl mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="w-full h-44 rounded-2xl" />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
