"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import BottomTabBar from "@/components/navigation/BottomTabBar";
import PageTransition from "@/components/PageTransition";
import NotificationBell from "@/components/notifications/NotificationBell";
import NotificationPanel from "@/components/notifications/NotificationPanel";
import { useNotifications } from "@/components/notifications/useNotifications";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismiss } = useNotifications();

  return (
    <div className="flex min-h-screen bg-[var(--bg-base)]">
      {/* Desktop sidebar only */}
      <div className="hidden lg:flex">
        <Sidebar onMobileClose={() => {}} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header with notification bell */}
        <div className="lg:hidden flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-accent-gradient-br">
              <svg className="w-4 h-4 text-[var(--text-on-accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <span className="text-sm font-bold text-theme">PalmInsight</span>
          </div>
          <div className="relative">
            <NotificationBell unreadCount={unreadCount} onClick={() => setPanelOpen(!panelOpen)} />
            {panelOpen && (
              <NotificationPanel
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onDismiss={dismiss}
                onClose={() => setPanelOpen(false)}
              />
            )}
          </div>
        </div>

        <main
          id="main-content"
          className="flex-1 overflow-auto lg:pb-0 pb-[calc(64px+env(safe-area-inset-bottom))]"
          tabIndex={-1}
        >
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <BottomTabBar />
    </div>
  );
}
