"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg-base)" }}>
      <div className="text-center max-w-sm">
        {/* Wifi-off SVG */}
        <svg
          className="mx-auto mb-6"
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="40" cy="40" r="38" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 4" opacity="0.3" />
          <path
            d="M16 30C24.8 21.2 31.8 17 40 17C28.2 17 21.2 21.2 16 30Z"
            fill="#f59e0b"
            opacity="0.15"
          />
          <path
            d="M24 36C29.6 30.4 34.4 28 40 28C34.4 28 29.6 30.4 24 36Z"
            fill="#f59e0b"
            opacity="0.25"
          />
          <path
            d="M32 42C35.2 38.8 37.6 37 40 37C37.6 37 35.2 38.8 32 42Z"
            fill="#f59e0b"
            opacity="0.4"
          />
          <circle cx="40" cy="48" r="3" fill="#f59e0b" />
          {/* Slash */}
          <line x1="22" y1="56" x2="58" y2="20" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
        </svg>

        <h1 className="text-2xl font-bold text-theme mb-2">You&apos;re Offline</h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          No internet connection detected.
          <br />
          Previously loaded data may still be available.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-[#1a1200] font-medium rounded-xl transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
