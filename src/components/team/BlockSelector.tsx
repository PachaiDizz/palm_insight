"use client";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin } from "lucide-react";
import { Plantation, TeamLeader } from "@/types";

interface BlockSelectorProps {
  plantations: Plantation[];
  teamLeaders: TeamLeader[];
  blockLastEntries: Record<string, string | null>;
  blockWorkersToday: Record<string, number>;
  onSelectBlock: (blockId: string) => void;
}

// Block cards: fade in + slide up, staggered 60ms per card
const blockCardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" as const, delay: i * 0.06 },
  }),
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.25, ease: "easeIn" as const },
  },
};

export default function BlockSelector({ plantations, teamLeaders, blockLastEntries, blockWorkersToday, onSelectBlock }: BlockSelectorProps) {
  if (plantations.length === 0) {
    return (
      <div className="rounded-2xl border p-12 text-center" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-default)" }}>
        <MapPin className="w-12 h-12 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.15)" }} />
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>No plantations set. Complete onboarding first.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <MapPin className="w-5 h-5" style={{ color: "var(--accent-green)" }} />
        Select Block
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <AnimatePresence mode="popLayout">
          {plantations.map((p, idx) => {
            const lCount = teamLeaders.filter((l) => l.plantation_id === p.id).length;
            return (
              <motion.button
                key={p.id}
                custom={idx}
                variants={blockCardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                whileHover={{ scale: 1.02, backgroundColor: "rgba(16,185,129,0.12)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectBlock(p.id)}
                className="rounded-2xl border p-4 sm:p-5 text-left cursor-pointer min-h-[44px]"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-default)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--accent-green-light)" }}>
                    <MapPin className="w-5 h-5" style={{ color: "var(--accent-green)" }} />
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "var(--accent-green-light)", color: "var(--accent-green)" }}>
                    {lCount} leader{lCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                  {p.rancangan}, Peringkat {p.peringkat}
                </div>
                <div className="text-2xl font-bold text-white">
                  Block {p.block}
                </div>
                <div className="mt-3 space-y-1">
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {blockLastEntries[p.id] ? `Last entry: ${blockLastEntries[p.id]}` : "No entries yet"}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Workers today: {blockWorkersToday[p.id] ?? 0}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
