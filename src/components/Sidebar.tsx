"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { TreePalm, Home, Sprout, Users, BarChart3, Settings, LogOut, ChevronLeft, ChevronRight, ClipboardList, Map } from "lucide-react";
import { useState } from "react";
import NotificationBell from "@/components/notifications/NotificationBell";
import NotificationPanel from "@/components/notifications/NotificationPanel";
import { useNotifications } from "@/components/notifications/useNotifications";
import { useI18n } from "@/lib/i18n";

interface SidebarProps {
  onMobileClose: () => void;
}

export default function Sidebar({ onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismiss } = useNotifications();

  const navItems = [
    { label: t("nav.dashboard"), href: "/dashboard", icon: Home },
    { label: t("nav.plantations"), href: "/plantations", icon: Sprout },
    { label: t("nav.teams"), href: "/team", icon: Users },
    { label: t("nav.map"), href: "/map", icon: Map },
    { label: t("nav.entries"), href: "/daily-entries", icon: ClipboardList },
    { label: t("nav.reports"), href: "/reports", icon: BarChart3 },
    { label: t("nav.settings"), href: "/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside
      className={`h-screen flex-col border-r transition-all duration-300 ${collapsed ? "w-[72px]" : "w-[240px]"} bg-[var(--bg-card)] min-w-[72px] overflow-visible`}
      style={{ borderColor: "var(--border-default)" }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between gap-3 px-5 py-5 border-b overflow-visible" style={{ borderColor: "var(--border-default)" }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-accent-gradient-br">
            <TreePalm className="w-5 h-5 text-[var(--text-on-accent)]" />
          </div>
          {!collapsed && <span className="font-bold text-lg text-theme tracking-tight truncate">PalmInsight</span>}
        </div>
        <div className="relative shrink-0">
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

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] ${isActive ? "bg-[var(--accent-primary-light)]" : "hover:bg-[var(--hover-subtle)]"}`}
              style={{ color: isActive ? "var(--accent-primary)" : "var(--icon-inactive)" }}
              onClick={onMobileClose}
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
          aria-label={t("nav.logout")}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full hover:bg-[var(--hover-subtle)] min-h-[44px]"
          style={{ color: "var(--text-muted)" }}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>{t("nav.logout")}</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="flex absolute top-1/2 -right-3 w-6 h-6 rounded-full items-center justify-center border bg-[var(--bg-card)] border-[var(--border-default)] text-[var(--text-muted)] hover:bg-[var(--hover-subtle)]"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
