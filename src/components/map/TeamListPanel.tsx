"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Users, MapPin, ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

interface TeamEntry {
  id: string;
  leaderName: string;
  block: string;
  lotLabel: string | null;
  workStatus: string;
  numWorkers: number | null;
  bunches: number | null;
  tons: number | null;
  latitude: number;
  longitude: number;
}

interface TeamListPanelProps {
  entries: TeamEntry[];
  allLeaders: { id: string; name: string; block: string }[];
  onSelectTeam: (lat: number, lng: number) => void;
}

export default function TeamListPanel({ entries, allLeaders, onSelectTeam }: TeamListPanelProps) {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);

  const entriesWithLocation = entries.filter((e) => e.latitude && e.longitude);
  const leadersWithoutLocation = allLeaders.filter(
    (l) => !entriesWithLocation.some((e) => e.id === l.id)
  );

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-default)",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-[var(--hover-subtle)]"
        style={{ borderBottom: collapsed ? "none" : "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
          <span className="text-sm font-semibold text-theme">{t("map.teamList")}</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-primary)" }}
          >
            {entriesWithLocation.length}
          </span>
        </div>
        {collapsed ? (
          <ChevronUp className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
        ) : (
          <ChevronDown className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
        )}
      </button>

      {/* Team list */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="max-h-[400px] overflow-y-auto">
              {entriesWithLocation.length === 0 && leadersWithoutLocation.length === 0 ? (
                <div className="p-6 text-center">
                  <MapPin className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {t("map.noEntries")}
                  </p>
                </div>
              ) : (
                <>
                  {entriesWithLocation.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => onSelectTeam(entry.latitude, entry.longitude)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--hover-subtle)]"
                      style={{ borderBottom: "1px solid var(--border-subtle)" }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor:
                            entry.workStatus === "work"
                              ? "rgba(16,185,129,0.12)"
                              : "rgba(107,114,128,0.12)",
                        }}
                      >
                        <Users
                          className="w-4 h-4"
                          style={{
                            color: entry.workStatus === "work" ? "#10b981" : "#6b7280",
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-theme truncate">
                          {entry.leaderName}
                        </div>
                        <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                          Block {entry.block}
                          {entry.lotLabel ? ` · ${entry.lotLabel}` : ""}
                        </div>
                      </div>
                      <div
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                        style={{
                          backgroundColor:
                            entry.workStatus === "work"
                              ? "rgba(16,185,129,0.12)"
                              : "rgba(107,114,128,0.12)",
                          color: entry.workStatus === "work" ? "#10b981" : "#6b7280",
                        }}
                      >
                        {entry.workStatus === "work" ? "Work" : "No Work"}
                      </div>
                    </button>
                  ))}

                  {leadersWithoutLocation.length > 0 && (
                    <div className="px-4 py-2">
                      <div
                        className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {t("map.noLocation")}
                      </div>
                      {leadersWithoutLocation.map((leader) => (
                        <div
                          key={leader.id}
                          className="flex items-center gap-2 py-1.5 opacity-50"
                        >
                          <div
                            className="w-6 h-6 rounded flex items-center justify-center"
                            style={{ backgroundColor: "var(--hover-subtle)" }}
                          >
                            <Users className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
                          </div>
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {leader.name} — Block {leader.block}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
