"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Leaf, Home, Sprout, Users, BarChart3, Settings, LogOut, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState, useEffect } from "react";

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

  // Close mobile sidebar on route change
  useEffect(() => {
    onMobileClose();
  }, [pathname, onMobileClose]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onMobileClose();
    router.push("/login");
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between gap-3 px-5 py-5 border-b" style={{ borderColor: "var(--border-default)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-[#10b981] to-[#16a34a]">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          {!collapsed && <span className="font-bold text-lg text-white tracking-tight">PalmInsight</span>}
        </div>
        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5 text-white/60" />
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] ${isActive ? "bg-[rgba(16,185,129,0.15)]" : ""}`}
              style={{ color: isActive ? "#10b981" : "rgba(255,255,255,0.5)" }}
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
            <div className="text-sm font-medium text-white truncate">{profile?.full_name || user?.email}</div>
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

      {/* Collapse Toggle (desktop only) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="hidden lg:flex absolute top-1/2 -right-3 w-6 h-6 rounded-full items-center justify-center border bg-[var(--bg-card)] border-[var(--border-default)] text-[var(--text-muted)]"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex h-screen flex-col border-r transition-all duration-300 ${collapsed ? "w-[72px]" : "w-[240px]"} bg-[var(--bg-card)] min-w-[72px]`}
        style={{ borderColor: "var(--border-default)" }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity duration-300"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-[280px] bg-[var(--bg-card)] border-r transition-transform duration-300 ease-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ borderColor: "var(--border-default)" }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
