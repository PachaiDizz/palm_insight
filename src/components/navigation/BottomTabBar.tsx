"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Home, Sprout, Users, BarChart3, ClipboardList } from "lucide-react";

const tabs = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Blocks", href: "/plantations", icon: Sprout },
  { label: "Teams", href: "/team", icon: Users },
  { label: "Entries", href: "/daily-entries", icon: ClipboardList },
  { label: "Reports", href: "/reports", icon: BarChart3 },
];

export default function BottomTabBar() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-[var(--z-nav)] flex items-stretch"
      style={{
        height: 64,
        background: "var(--bg-nav)",
        borderTop: "1px solid var(--border-nav)",
        boxShadow: "0 -4px 24px rgba(0, 0, 0, 0.15)",
        paddingBottom: "calc(8px + env(safe-area-inset-bottom))",
      }}
      role="navigation"
      aria-label="Mobile navigation"
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex-1 flex flex-col items-center justify-center gap-1 relative min-h-[44px]"
            aria-label={tab.label}
            aria-current={isActive ? "page" : undefined}
          >
            {isActive && (
              <motion.div
                layoutId={reduceMotion ? undefined : "tab-indicator"}
                className="absolute top-0 left-1/2 -translate-x-1/2"
                style={{
                  width: 24,
                  height: 3,
                  borderRadius: 2,
                  background: "var(--accent-primary)",
                }}
                transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 35 }}
              />
            )}

            <motion.div
              whileTap={reduceMotion ? undefined : { scale: 0.85 }}
              transition={{ duration: 0.15 }}
            >
              <tab.icon
                className="w-[22px] h-[22px]"
                style={{ color: isActive ? "var(--accent-primary)" : "var(--icon-inactive)" }}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
            </motion.div>

            <span
              className="text-[10px] font-medium uppercase"
              style={{
                letterSpacing: "0.05em",
                color: isActive ? "var(--accent-primary)" : "var(--icon-inactive)",
              }}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
