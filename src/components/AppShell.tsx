"use client";
import PwaInstallBanner from "@/components/PwaInstallBanner";
import OfflineStatusBar from "@/components/ui/OfflineStatusBar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OfflineStatusBar />
      {children}
      <PwaInstallBanner />
    </>
  );
}
