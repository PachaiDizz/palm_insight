"use client";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Loader2, CheckCircle } from "lucide-react";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useI18n } from "@/lib/i18n";

export default function OfflineStatusBar() {
  const { isOnline, pendingCount, isSyncing } = useOfflineSync();
  const { t } = useI18n();

  const show = !isOnline || pendingCount > 0;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[var(--z-nav)] flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium"
          style={{
            backgroundColor: !isOnline ? "var(--accent-red)" : isSyncing ? "var(--accent-primary)" : "var(--accent-amber)",
            color: "#fff",
          }}
        >
          {!isOnline ? (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>{t("offline.title")}</span>
              {pendingCount > 0 && (
                <span className="ml-1 opacity-80">
                  — {t("offline.pending", { count: pendingCount })}
                </span>
              )}
            </>
          ) : isSyncing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{t("offline.syncing")}</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{t("offline.synced")}</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
