"use client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, X } from "lucide-react";

export interface ToastData {
  type: "success" | "error";
  message: string;
}

interface ToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
  duration?: number;
  position?: "top-right" | "bottom-right";
}

export default function Toast({ toast, onDismiss, duration = 3000, position = "top-right" }: ToastProps) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [toast, duration, onDismiss]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          role="alert"
          className={`fixed ${position === "top-right" ? "top-6 right-6" : "bottom-6 right-6"} z-[var(--z-nav)] flex items-center gap-3 px-5 py-3 rounded-xl border shadow-lg`}
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: toast.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
          }}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
          ) : (
            <AlertCircle className="w-5 h-5" style={{ color: "var(--accent-red)" }} />
          )}
          <span className="text-sm text-theme">{toast.message}</span>
          <button
            onClick={onDismiss}
            aria-label="Dismiss notification"
            className="ml-2 p-1 rounded hover:bg-white/10"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
