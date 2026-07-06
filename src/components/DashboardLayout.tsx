"use client";
import { useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import PageTransition from "@/components/PageTransition";
import { Menu } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMobileClose = useCallback(() => {
    setMobileOpen(false);
  }, []);

  return (
    <div className="flex min-h-screen bg-[var(--bg-base)]">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={handleMobileClose} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 border-b bg-[var(--bg-card)]" style={{ borderColor: "var(--border-default)" }}>
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="p-2 rounded-xl hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
          <span className="font-bold text-lg text-white tracking-tight">PalmInsight</span>
        </header>

        <main id="main-content" className="flex-1 overflow-auto" tabIndex={-1}>
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
