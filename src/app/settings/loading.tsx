import DashboardLayout from "@/components/DashboardLayout";
import { FadeIn } from "@/components/ui/Skeleton";

export default function SettingsLoading() {
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 max-w-3xl mx-auto">
        <FadeIn>
          <div className="mb-6">
            <div className="h-8 w-36 rounded-lg mb-2" style={{ backgroundColor: "var(--bg-elevated)" }} />
            <div className="h-4 w-48 rounded-lg" style={{ backgroundColor: "var(--bg-elevated)" }} />
          </div>

          {/* Account section skeleton */}
          <div className="card-glow rounded-2xl p-5 sm:p-6 mb-4" style={{ backgroundColor: "var(--bg-card)" }}>
            <div className="h-5 w-24 rounded mb-4" style={{ backgroundColor: "var(--bg-elevated)" }} />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: "var(--bg-elevated)" }} />
                  <div className="flex-1">
                    <div className="h-4 w-28 rounded mb-1" style={{ backgroundColor: "var(--bg-elevated)" }} />
                    <div className="h-10 w-full rounded-xl" style={{ backgroundColor: "var(--bg-elevated)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data management section skeleton */}
          <div className="card-glow rounded-2xl p-5 sm:p-6" style={{ backgroundColor: "var(--bg-card)" }}>
            <div className="h-5 w-36 rounded mb-4" style={{ backgroundColor: "var(--bg-elevated)" }} />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: "var(--bg-elevated)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: "var(--bg-input)" }} />
                    <div>
                      <div className="h-4 w-32 rounded mb-1" style={{ backgroundColor: "var(--bg-input)" }} />
                      <div className="h-3 w-48 rounded" style={{ backgroundColor: "var(--bg-input)" }} />
                    </div>
                  </div>
                  <div className="h-9 w-20 rounded-xl" style={{ backgroundColor: "var(--bg-input)" }} />
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </DashboardLayout>
  );
}
