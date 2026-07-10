"use client";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import type { Variants } from "framer-motion";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  const pageVariants: Variants = reduceMotion
    ? {
        initial: { opacity: 1 },
        enter: { opacity: 1 },
        exit: { opacity: 1 },
      }
    : {
        initial: { opacity: 0, y: 8 },
        enter: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
        exit: { opacity: 0, transition: { duration: 0.15, ease: "easeIn" as const } },
      };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
