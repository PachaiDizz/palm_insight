"use client";
import { useState } from "react";
import Link from "next/link";
import { Map } from "lucide-react";
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
    <div className="flex h-[100dvh] overflow-hidden bg-[var(--bg-base)]">
      {/* Desktop sidebar only */}
      <div className="hidden lg:flex h-full">
        <Sidebar
          onMobileClose={() => {}}
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDismiss={dismiss}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Mobile header — sticky, respects the notch / status-bar safe area */}
        <header
          className="lg:hidden sticky top-0 z-[var(--z-nav)] flex items-center justify-between gap-2 px-4 pb-2 border-b border-[var(--border-nav)] bg-[var(--bg-nav)]"
          style={{ paddingTop: "calc(0.5rem + env(safe-area-inset-top))" }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-accent-gradient-br">
              <svg className="w-4 h-4 text-[var(--text-on-accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <span className="text-sm font-bold text-theme truncate">PalmInsight</span>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/map"
              aria-label="Open map"
              className="flex items-center justify-center w-11 h-11 rounded-xl text-[var(--icon-inactive)] hover:bg-[var(--hover-subtle)] active:scale-95 transition"
            >
              <Map className="w-5 h-5" />
            </Link>
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
        </header>

        <main
          id="main-content"
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain lg:pb-0 pb-[calc(60px+env(safe-area-inset-bottom))]"
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
