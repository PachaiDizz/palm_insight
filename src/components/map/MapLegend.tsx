"use client";
import { useI18n } from "@/lib/i18n";

export default function MapLegend() {
  const { t } = useI18n();

  return (
    <div
      className="absolute top-4 right-4 z-[1000] rounded-xl px-4 py-3"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-default)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#10b981" }} />
          <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            {t("map.workTeams")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#6b7280", opacity: 0.7 }} />
          <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            {t("map.noWorkTeams")}
          </span>
        </div>
      </div>
    </div>
  );
}
