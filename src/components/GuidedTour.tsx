"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const steps = [
  {
    icon: (
      <svg viewBox="0 0 120 120" className="w-20 h-20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="60" cy="60" r="50" stroke="#f59e0b" strokeOpacity="0.2" />
        <path d="M60 20c-3 6-10 12-16 15 6-1 11 2 14 6-7 4-11 10-11 16 2-2 5-4 8-5-2 5 0 10 4 13 1-4 3-7 6-10-2 6 0 11 5 13 1-3 2-7 1-11-4 3-8 4-11 2 4-4 6-10 5-15 5 1 9 1 12-1-6-5-12-11-15-16z" stroke="#f59e0b" fill="#f59e0b" fillOpacity="0.15" />
        <line x1="60" y1="55" x2="60" y2="95" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    title: "Welcome to PalmInsight!",
    body: "Your plantation productivity tracker is ready.\nHere's a quick tour to help you get started.",
  },
  {
    icon: (
      <svg viewBox="0 0 120 120" className="w-20 h-20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="15" y="25" width="90" height="70" rx="12" stroke="#f59e0b" strokeOpacity="0.2" />
        <rect x="25" y="35" width="35" height="18" rx="4" stroke="#f59e0b" fill="#f59e0b" fillOpacity="0.15" />
        <rect x="65" y="35" width="30" height="18" rx="4" stroke="#3b82f6" fill="#3b82f6" fillOpacity="0.15" />
        <rect x="25" y="60" width="70" height="8" rx="3" stroke="#f59e0b" strokeOpacity="0.3" />
        <rect x="25" y="75" width="50" height="8" rx="3" stroke="#f59e0b" strokeOpacity="0.2" />
      </svg>
    ),
    title: "Your Dashboard",
    body: "See today's harvest overview, total bunches,\ntonnage, active teams and recent entries —\nall at a glance.",
  },
  {
    icon: (
      <svg viewBox="0 0 120 120" className="w-20 h-20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="60" cy="35" r="12" stroke="#f59e0b" fill="#f59e0b" fillOpacity="0.15" />
        <circle cx="35" cy="80" r="10" stroke="#3b82f6" fill="#3b82f6" fillOpacity="0.15" />
        <circle cx="85" cy="80" r="10" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity="0.15" />
        <line x1="60" y1="47" x2="35" y2="70" stroke="#f59e0b" strokeOpacity="0.3" />
        <line x1="60" y1="47" x2="85" y2="70" stroke="#f59e0b" strokeOpacity="0.3" />
      </svg>
    ),
    title: "Manage Your Teams",
    body: "Go to Teams → select your block → choose a\nteam leader → log their daily harvest data.\nKeep every leader's records separate and organised.",
  },
  {
    icon: (
      <svg viewBox="0 0 120 120" className="w-20 h-20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="15" y="30" width="90" height="65" rx="10" stroke="#f59e0b" strokeOpacity="0.2" />
        <polyline points="25,80 40,60 55,70 70,45 85,55 95,38" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="40" cy="60" r="3" fill="#f59e0b" />
        <circle cx="55" cy="70" r="3" fill="#f59e0b" />
        <circle cx="70" cy="45" r="3" fill="#f59e0b" />
        <circle cx="85" cy="55" r="3" fill="#f59e0b" />
        <circle cx="95" cy="38" r="3" fill="#f59e0b" />
      </svg>
    ),
    title: "Track Performance",
    body: "View monthly production trends, filter by date\nrange, and export reports for management meetings.\n\nYou're all set — let's grow!",
  },
];

export default function GuidedTour({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const isLast = step === steps.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative w-full max-w-md rounded-2xl p-8 text-center"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid rgba(245,158,11,0.15)",
            boxShadow: "0 0 0 1px rgba(245,158,11,0.08), 0 24px 48px rgba(0,0,0,0.4)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: "var(--text-muted)" }}
            aria-label="Close tour"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-5">
            {steps[step].icon}
          </div>

          {/* Title */}
          <h2 className="section-heading text-xl text-theme mb-3">
            {steps[step].title}
          </h2>

          {/* Body */}
          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>
            {steps[step].body}
          </p>

          {/* Navigation */}
          <div className="mt-8">
            {isLast ? (
              <button
                onClick={onClose}
                className="w-full px-6 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ backgroundColor: "#f59e0b", color: "#050f05" }}
              >
                Get Started →
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep((s) => s - 1)}
                  disabled={step === 0}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-30"
                  style={{ backgroundColor: "var(--hover-subtle)", color: "var(--text-secondary)" }}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={() => setStep((s) => s + 1)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ backgroundColor: "#f59e0b", color: "#050f05" }}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  backgroundColor: i === step ? "#f59e0b" : "var(--text-muted)",
                  width: i === step ? 20 : 8,
                }}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
