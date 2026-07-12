"use client";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface EmptyLeaderStateProps {
  onAdd: () => void;
}

export default function EmptyLeaderState({ onAdd }: EmptyLeaderStateProps) {
  const { t } = useI18n();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      className="rounded-2xl border border-dashed p-12 text-center mt-8"
      style={{ borderColor: "var(--border-default)" }}
    >
      <Users className="w-12 h-12 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.1)" }} />
      <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>{t("team.noLeaders")}</p>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onAdd}
        className="px-4 py-2 rounded-xl text-sm font-medium text-theme transition-all"
        style={{ background: "linear-gradient(to right, #f59e0b, #d97706)" }}
      >
        {t("team.addFirstLeader")}
      </motion.button>
    </motion.div>
  );
}
