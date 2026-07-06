"use client";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[var(--bg-base)]">
      <div className="relative">
        <Sidebar />
      </div>
      <main id="main-content" className="flex-1 overflow-auto" tabIndex={-1}>{children}</main>
    </div>
  );
}
