"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Leaf, Home, Sprout, Users, BarChart3, Settings, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import NotificationBell from "@/components/notifications/NotificationBell";
import NotificationPanel from "@/components/notifications/NotificationPanel";
import { useNotifications } from "@/components/notifications/useNotifications";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Plantations", href: "/plantations", icon: Sprout },
  { label: "Teams", href: "/team", icon: Users },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismiss } = useNotifications();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside
      className={`h-screen flex-col border-r transition-all duration-300 ${collapsed ? "w-[72px]" : "w-[240px]"} bg-[var(--bg-card)] min-w-[72px]`}
      style={{ borderColor: "var(--border-default)" }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between gap-3 px-5 py-5 border-b" style={{ borderColor: "var(--border-default)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-[#f59e0b] to-[#d97706]">
            <Leaf className="w-5 h-5 text-theme" />
          </div>
          {!collapsed && <span className="font-bold text-lg text-theme tracking-tight">PalmInsight</span>}
        </div>
        {!collapsed && (
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
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] ${isActive ? "bg-[rgba(99,102,241,0.15)]" : ""}`}
              style={{ color: isActive ? "#6366f1" : "var(--icon-inactive)" }}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="px-3 py-4 border-t space-y-2" style={{ borderColor: "var(--border-default)" }}>
        {!collapsed && (
          <div className="px-3 py-2">
            <div className="text-sm font-medium text-theme truncate">{profile?.full_name || user?.email}</div>
            <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{user?.email}</div>
          </div>
        )}
        <button
          onClick={handleLogout}
          aria-label="Log out"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full hover:bg-white/5 min-h-[44px]"
          style={{ color: "var(--text-muted)" }}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="flex absolute top-1/2 -right-3 w-6 h-6 rounded-full items-center justify-center border bg-[var(--bg-card)] border-[var(--border-default)] text-[var(--text-muted)]"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
