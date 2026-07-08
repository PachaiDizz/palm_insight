"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "palminsight_install_prompted";

export default function PwaInstallBanner() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const alreadyPrompted = localStorage.getItem(STORAGE_KEY);
    if (alreadyPrompted) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    setDeferredPrompt(null);
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 animate-slide-up">
      <div className="bg-[#13161f] border border-amber-600/20 rounded-2xl p-5 shadow-2xl shadow-black/50">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl">🌿</span>
          <div>
            <h3 className="text-theme font-bold text-sm">PalmInsight</h3>
            <p className="text-gray-400 text-xs mt-1 leading-relaxed">
              Install this app on your home screen for quick access in the field.
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-gray-400 hover:text-theme text-sm font-medium transition-colors"
          >
            Not Now
          </button>
          <button
            onClick={handleInstall}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-[#1a1200] text-sm font-medium rounded-lg transition-colors"
          >
            Install App
          </button>
        </div>
      </div>
    </div>
  );
}
