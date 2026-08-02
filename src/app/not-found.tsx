"use client";

import Link from "next/link";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "var(--bg-base)" }}>
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "var(--accent-subtle)" }}>
          <FileQuestion className="w-10 h-10" style={{ color: "var(--accent-primary)" }} />
        </div>

        <h1 className="text-6xl font-bold mb-4" style={{ color: "var(--accent-primary)" }}>404</h1>

        <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
          Page Not Found
        </h2>

        <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-theme transition-all hover:scale-[1.02]"
            style={{ background: "linear-gradient(to right, #f59e0b, #d97706)" }}
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>

          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border-default)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
