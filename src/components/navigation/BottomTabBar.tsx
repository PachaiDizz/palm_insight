"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Sprout, Users, BarChart3, Settings } from "lucide-react";

const tabs = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Plantations", href: "/plantations", icon: Sprout },
  { label: "Teams", href: "/team", icon: Users },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] flex items-stretch"
      style={{
        height: 64,
        background: "#0a1505",
        borderTop: "1px solid rgba(16, 185, 129, 0.1)",
        boxShadow: "0 -4px 24px rgba(0, 0, 0, 0.4)",
        paddingBottom: "calc(8px + env(safe-area-inset-bottom))",
      }}
      role="navigation"
      aria-label="Mobile navigation"
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex-1 flex flex-col items-center justify-center gap-1 relative min-h-[44px]"
            aria-label={tab.label}
            aria-current={isActive ? "page" : undefined}
          >
            {/* Active indicator pill */}
            {isActive && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute top-0 left-1/2 -translate-x-1/2"
                style={{
                  width: 24,
                  height: 3,
                  borderRadius: 2,
                  background: "#10b981",
                }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}

            {/* Icon */}
            <motion.div
              animate={isActive ? { scale: 1 } : { scale: 1 }}
              whileTap={{ scale: 0.85 }}
              transition={{ duration: 0.15 }}
            >
              <tab.icon
                className="w-[22px] h-[22px]"
                style={{ color: isActive ? "#10b981" : "#4a6a4a" }}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
            </motion.div>

            {/* Label */}
            <span
              className="text-[10px] font-medium uppercase"
              style={{
                letterSpacing: "0.05em",
                color: isActive ? "#10b981" : "#4a6a4a",
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
