"use client";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

/**
 * Fast page enter transition.
 *
 * The previous implementation used framer-motion's <AnimatePresence mode="wait">,
 * which kept the OLD page mounted until its exit animation finished (~150ms)
 * and only then mounted the new route — adding a visible blank gap to every
 * navigation on top of data fetching. This is a plain keyed wrapper with a
 * ~180ms CSS opacity fade: the new page mounts immediately, so navigation feels
 * instant. Framer-motion is also dropped from the app shell (smaller bundle).
 *
 * Intentionally opacity-only — a transform here would turn the wrapper into a
 * containing block and break `position: fixed` overlays (notification sheet).
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-fade">
      {children}
    </div>
  );
}
