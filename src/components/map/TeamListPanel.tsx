"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Users, MapPin, ChevronUp, ChevronDown, X } from "lucide-react";
import { useState, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { getLotCoordinates } from "@/lib/lotCoordinates";

interface TeamEntry {
  id: string;
  leaderName: string;
  block: string;
  lotLabel: string | null;
  workStatus: string;
  numWorkers: number | null;
  bunches: number | null;
  tons: number | null;
  latitude: number | null;
  longitude: number | null;
  teamLeaderId: string;
  date: string;
}

interface TeamListPanelProps {
  entries: TeamEntry[];
  allLeaders: { id: string; name: string; block: string }[];
  onSelectTeam: (lat: number, lng: number) => void;
  filterTeamId: string | null;
  onFilterTeam: (teamId: string | null) => void;
}

const TEAM_COLORS = [
  "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#f97316", "#ec4899", "#14b8a6",
  "#6366f1", "#84cc16", "#e11d48", "#0ea5e9",
];

function buildTeamColorMap(entries: TeamEntry[]): Map<string, string> {
  const ids = [...new Set(entries.map((e) => e.teamLeaderId))].sort();
  const map = new Map<string, string>();
  ids.forEach((id, i) => map.set(id, TEAM_COLORS[i % TEAM_COLORS.length]));
  return map;
}

interface TeamGroup {
  teamLeaderId: string;
  name: string;
  block: string;
  color: string;
  entries: TeamEntry[];
  firstEntry: TeamEntry;
}

export default function TeamListPanel({ entries, allLeaders, onSelectTeam, filterTeamId, onFilterTeam }: TeamListPanelProps) {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  const teamColors = buildTeamColorMap(entries);

  const teamGroups = useMemo(() => {
    const groups = new Map<string, TeamGroup>();

    entries.forEach((entry) => {
      if (!groups.has(entry.teamLeaderId)) {
        groups.set(entry.teamLeaderId, {
          teamLeaderId: entry.teamLeaderId,
          name: entry.leaderName,
          block: entry.block,
          color: teamColors.get(entry.teamLeaderId) || "#6b7280",
          entries: [],
          firstEntry: entry,
        });
      }
      groups.get(entry.teamLeaderId)!.entries.push(entry);
    });

    // Add teams from allLeaders that don't have entries
    allLeaders.forEach((leader) => {
      if (!groups.has(leader.id)) {
        groups.set(leader.id, {
          teamLeaderId: leader.id,
          name: leader.name,
          block: leader.block,
          color: teamColors.get(leader.id) || "#6b7280",
          entries: [],
          firstEntry: { id: "", leaderName: leader.name, block: leader.block, latitude: null, longitude: null, teamLeaderId: leader.id, workStatus: "", lotLabel: null, numWorkers: null, bunches: null, tons: null, date: "" },
        });
      }
    });

    return Array.from(groups.values()).sort((a, b) => {
      const blockCmp = (parseInt(a.block) || 0) - (parseInt(b.block) || 0);
      if (blockCmp !== 0) return blockCmp;
      return a.name.localeCompare(b.name);
    });
  }, [entries, allLeaders, teamColors]);

  const entriesWithLocation = entries.filter((e) => e.latitude && e.longitude);

  const toggleTeamExpanded = (teamId: string) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      return next;
    });
  };

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
            {allLeaders.length}
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
              {teamGroups.length === 0 ? (
                <div className="p-6 text-center">
                  <MapPin className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {t("map.noEntries")}
                  </p>
                </div>
              ) : (
                <>
                  {/* Filter indicator */}
                  {filterTeamId && (
                    <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: "var(--accent-subtle)" }}>
                      <span className="text-xs font-medium" style={{ color: "var(--accent-primary)" }}>
                        Showing: {teamGroups.find((g) => g.teamLeaderId === filterTeamId)?.name || "Team"}
                      </span>
                      <button
                        onClick={() => onFilterTeam(null)}
                        className="p-1 rounded hover:bg-black/10"
                      >
                        <X className="w-3 h-3" style={{ color: "var(--accent-primary)" }} />
                      </button>
                    </div>
                  )}

                  {teamGroups.map((group) => {
                    const isExpanded = expandedTeams.has(group.teamLeaderId);
                    const isFiltered = filterTeamId === group.teamLeaderId;
                    const isDimmed = filterTeamId && !isFiltered;
                    const hasLocation = group.firstEntry.latitude != null && group.firstEntry.longitude != null;

                    return (
                      <div
                        key={group.teamLeaderId}
                        style={{ borderBottom: "1px solid var(--border-subtle)" }}
                      >
                        {/* Team header row */}
                        <div className="flex">
                          <button
                            onClick={() => {
                              if (!hasLocation) return;
                              onFilterTeam(isFiltered ? null : group.teamLeaderId);
                              if (group.firstEntry.latitude && group.firstEntry.longitude) {
                                onSelectTeam(group.firstEntry.latitude, group.firstEntry.longitude);
                              }
                            }}
                            className="flex-1 flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--hover-subtle)]"
                            style={{ opacity: isDimmed ? 0.4 : hasLocation ? 1 : 0.5 }}
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: isFiltered ? group.color : `${group.color}20`,
                              }}
                            >
                              <Users
                                className="w-4 h-4"
                                style={{ color: isFiltered ? "white" : group.color }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-theme truncate">
                                {group.name}
                              </div>
                              <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                                Block {group.block}
                                {group.firstEntry.lotLabel && getLotCoordinates(group.firstEntry.lotLabel)
                                  ? ` · ${group.firstEntry.lotLabel} · marker on map`
                                  : group.firstEntry.lotLabel
                                    ? ` · ${group.firstEntry.lotLabel}`
                                    : group.entries.length > 0
                                      ? ` · ${group.entries.length} marker${group.entries.length > 1 ? "s" : ""}`
                                      : " · No lot entered"}
                              </div>
                            </div>
                            {group.entries.length > 0 ? (
                              <div
                                className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                                style={{ backgroundColor: `${group.color}20`, color: group.color }}
                              >
                                {group.entries.length}
                              </div>
                            ) : (
                              <div
                                className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                                style={{ backgroundColor: "var(--hover-subtle)", color: "var(--text-muted)" }}
                              >
                                No data
                              </div>
                            )}
                          </button>
                          {group.entries.length > 1 && (
                            <button
                              onClick={() => toggleTeamExpanded(group.teamLeaderId)}
                              className="px-2"
                              style={{ opacity: isDimmed ? 0.4 : 1 }}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                              ) : (
                                <ChevronDown className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Expanded entries */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: "auto" }}
                              exit={{ height: 0 }}
                              className="overflow-hidden"
                            >
                              {group.entries.map((entry) => (
                                <button
                                  key={entry.id}
                                  onClick={() => {
                                    if (entry.latitude && entry.longitude) {
                                      onSelectTeam(entry.latitude, entry.longitude);
                                    }
                                  }}
                                  className="w-full flex items-center gap-3 pl-12 pr-4 py-2 text-left transition-colors hover:bg-[var(--hover-subtle)]"
                                  style={{ opacity: entry.latitude ? 1 : 0.5 }}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                                      {entry.date}
                                      {entry.lotLabel ? ` · ${entry.lotLabel}` : ""}
                                    </div>
                                  </div>
                                  <div
                                    className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                                    style={{ backgroundColor: `${group.color}20`, color: group.color }}
                                  >
                                    {entry.workStatus === "work" ? "Work" : entry.workStatus === "no_work" ? "No Work" : "—"}
                                  </div>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
