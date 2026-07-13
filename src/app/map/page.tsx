import { Suspense } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import MapClient from "@/components/map/MapClient";

export default function MapPage() {
  return (
    <DashboardLayout>
      <Suspense
        fallback={
          <div className="p-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-center h-[60vh]">
              <div className="text-center">
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl flex items-center justify-center animate-pulse" style={{ backgroundColor: "var(--accent-subtle)" }}>
                  <svg className="w-5 h-5" style={{ color: "var(--accent-primary)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading map...</p>
              </div>
            </div>
          </div>
        }
      >
        <MapClient />
      </Suspense>
    </DashboardLayout>
  );
}
