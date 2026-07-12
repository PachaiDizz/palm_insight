"use client";
import { motion } from "framer-motion";
import { MapPin, Phone, Trash2, Save, Eye, ChevronLeft, Sprout } from "lucide-react";
import { Plantation, TeamLeader, DailyEntry } from "@/types";
import { useI18n } from "@/lib/i18n";

interface LeaderOrgChartProps {
  selectedPlantation: Plantation;
  leaders: TeamLeader[];
  latestEntries: Record<string, DailyEntry>;
  onSelectLeader: (leader: TeamLeader) => void;
  onViewDetails: (leader: TeamLeader) => void;
  onDeleteLeader: (id: string) => void;
  onBack: () => void;
  onBijiRelai: () => void;
  focusedLeaderId?: string | null;
}

// Block card: fade in from below
const blockCardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

// Connector lines: draw in with stroke-dashoffset
const connectorVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { pathLength: 1, opacity: 1, transition: { duration: 0.4, ease: "easeOut" as const, delay: 0.2 } },
};

// Leader cards: staggered fade-in from bottom
const leaderCardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" as const, delay: 0.3 + i * 0.08 },
  }),
};

export default function LeaderOrgChart({
  selectedPlantation,
  leaders,
  latestEntries,
  onSelectLeader,
  onViewDetails,
  onDeleteLeader,
  onBack,
  onBijiRelai,
  focusedLeaderId,
}: LeaderOrgChartProps) {
  const { t } = useI18n();
  const sortedLeaders = focusedLeaderId
    ? [...leaders].filter((l) => l.id === focusedLeaderId).sort((a, b) => a.name.localeCompare(b.name))
    : [...leaders].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col items-center mt-6">
      {/* Selected Block Card */}
      <motion.div
        variants={blockCardVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.button
          whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.08)" }}
          whileTap={{ scale: 0.97 }}
          onClick={onBack}
          aria-label="Back to all blocks"
          className="flex items-center gap-2 mb-4 px-4 py-2 rounded-xl text-sm font-medium transition-all text-[var(--text-muted)] border"
        >
          <ChevronLeft className="w-4 h-4" />
          {t("team.backToBlocks")}
        </motion.button>
          <div
            className="card-glow rounded-2xl p-8 text-center w-full max-w-[400px] bg-[rgba(245,158,11,0.08)]"
        >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 bg-[var(--accent-subtle)]">
              <MapPin className="w-6 h-6 text-[var(--accent-primary)]" />
            </div>
            <div className="text-sm uppercase tracking-wider mb-2 text-[var(--text-muted)]">
              {selectedPlantation.rancangan}, Peringkat {selectedPlantation.peringkat}
            </div>
            <div className="text-3xl font-bold text-theme">
              Block {selectedPlantation.block}
            </div>
            <div className="text-sm mt-3 text-[var(--text-muted)]">
              {sortedLeaders.length} {sortedLeaders.length !== 1 ? t("team.leaders") : t("team.leader")}
            </div>
            <motion.button
              whileHover={{ scale: 1.04, backgroundColor: "rgba(34,197,94,0.18)" }}
              whileTap={{ scale: 0.96 }}
              onClick={(e) => { e.stopPropagation(); onBijiRelai(); }}
              aria-label={t("team.bijiRelai")}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all border"
              style={{ borderColor: "rgba(34,197,94,0.3)", color: "#22c55e", backgroundColor: "rgba(34,197,94,0.08)" }}
            >
              <Sprout className="w-4 h-4" />
              {t("team.bijiRelai")}
            </motion.button>
        </div>
      </motion.div>

      {sortedLeaders.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="mt-6"
        >
          {/* Vertical connector line — hidden on mobile where cards stack */}
          <div className="hidden md:flex justify-center">
            <svg width="2" height="48" className="overflow-visible">
              <motion.line
                x1="1" y1="0" x2="1" y2="48"
                stroke="rgba(245,158,11,0.3)"
                strokeWidth="2"
                variants={connectorVariants}
                initial="hidden"
                animate="visible"
              />
            </svg>
          </div>

          <div className="relative">
            {/* Horizontal connector — only shown on desktop when multiple leaders */}
            {!focusedLeaderId && (
              <motion.div
                className="hidden md:block absolute top-0 h-px origin-center"
                style={{
                  backgroundColor: "rgba(245,158,11,0.3)",
                  left: "15%",
                  right: "15%",
                }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: 0.35 }}
              />
            )}

            <div className="pt-5 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
              {sortedLeaders.map((leader, idx) => {
                const latest = latestEntries[leader.id];
                const totalWorkers = latest?.work_status === "work" ? (latest.num_workers ?? 0) : 0;
                const totalLots = latest?.lot || "-";
                return (
                  <motion.div
                    key={leader.id}
                    custom={idx}
                    variants={leaderCardVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ scale: 1.02, backgroundColor: "rgba(245,158,11,0.06)" }}
                    className="flex flex-col items-center shrink-0 w-full max-w-full md:max-w-[420px]"
                  >
                    {/* Vertical stub from horizontal line to card — hidden on mobile */}
                    <svg width="2" height="24" className="overflow-visible hidden md:block">
                      <motion.line
                        x1="1" y1="0" x2="1" y2="24"
                        stroke="rgba(245,158,11,0.3)"
                        strokeWidth="2"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.25, ease: "easeOut", delay: 0.35 + idx * 0.08 }}
                      />
                    </svg>

                    <div className="card-glow w-full rounded-2xl p-4 sm:p-8 bg-[var(--bg-card)]">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-[rgba(245,158,11,0.12)]">
                            <svg className="w-7 h-7 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          </div>
                          <div>
                            <div className="text-base font-semibold text-theme">{leader.name}</div>
                            {leader.phone && (
                              <div className="flex items-center gap-1 mt-1">
<Phone className="w-4 h-4 text-[var(--text-muted)]" />
                                  <span className="text-sm text-[var(--text-muted)]">{leader.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        <button
                          onClick={() => onDeleteLeader(leader.id)}
                          aria-label={`Remove ${leader.name}`}
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors text-[var(--text-muted)]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
                        <div className="p-3 sm:p-4 rounded-xl bg-[rgba(245,158,11,0.08)]">
                          <div className="text-xs sm:text-sm mb-1 text-[var(--text-muted)]">{t("team.totalWorkers")}</div>
                          <div className="text-base sm:text-lg font-bold text-theme">{totalWorkers}</div>
                        </div>
                        <div className="p-3 sm:p-4 rounded-xl bg-[var(--accent-purple-light)]">
                          <div className="text-xs sm:text-sm mb-1 text-[var(--text-muted)]">{t("team.additional")}</div>
                          <div className="text-base sm:text-lg font-bold text-theme">0</div>
                        </div>
                        <div className="p-3 sm:p-4 rounded-xl bg-[var(--accent-amber-light)]">
                          <div className="text-xs sm:text-sm mb-1 text-[var(--text-muted)]">{t("team.totalLots")}</div>
                          <div className="text-base sm:text-lg font-bold text-theme uppercase">{totalLots}</div>
                        </div>
                        <div className="p-3 sm:p-4 rounded-xl bg-[var(--accent-blue-light)]">
                          <div className="text-xs sm:text-sm mb-1 text-[var(--text-muted)]">{t("team.looseFruit")}</div>
                          <div className="text-base sm:text-lg font-bold text-theme">0</div>
                        </div>
                      </div>

                      <div className="flex gap-2 sm:gap-3">
                        <motion.button
                          whileHover={{ scale: 1.03, backgroundColor: "rgba(245,158,11,0.18)" }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => onSelectLeader(leader)}
                          aria-label={`${t("team.addEntry")} ${leader.name}`}
                          className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-medium transition-all bg-[var(--accent-subtle)] text-[var(--accent-primary)] min-h-[44px]"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {t("team.addEntry")}
                        </motion.button>
                        <motion.button
                          onClick={() => onViewDetails(leader)}
                          whileHover={{ scale: 1.03, backgroundColor: "rgba(59,130,246,0.18)" }}
                          whileTap={{ scale: 0.97 }}
                          aria-label={`${t("team.viewDetails")} ${leader.name}`}
                          className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-medium transition-all bg-[var(--accent-blue-light)] text-[var(--accent-blue)] min-h-[44px]"
                        >
                          <Eye className="w-4 h-4" />
                          {t("team.viewDetails")}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
