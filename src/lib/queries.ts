import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabaseClient";
import { getUserTeamLeaders } from "./onboarding";
import { getMonthRange, toLocalDateKey } from "./date";
import { Plantation, TeamLeader, DailyEntry, DailyEntryWithRelations } from "@/types";

export async function fetchPlantations(userId: string): Promise<Plantation[]> {
  const { data } = await supabase
    .from("plantations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  return (data || []) as Plantation[];
}

export async function fetchTeamLeaders(userId: string): Promise<TeamLeader[]> {
  const { data } = await supabase
    .from("team_leaders")
    .select("*, plantations(id, rancangan, peringkat, block)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data || []) as TeamLeader[];
}

export async function fetchTeamLeadersForPlantation(userId: string, plantationId: string): Promise<TeamLeader[]> {
  const { data } = await supabase
    .from("team_leaders")
    .select("*")
    .eq("user_id", userId)
    .eq("plantation_id", plantationId);

  return (data || []) as TeamLeader[];
}

export async function fetchLeaderEntries(leaderId: string): Promise<DailyEntry[]> {
  const { data } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("team_leader_id", leaderId)
    .order("date", { ascending: false });

  return (data || []) as DailyEntry[];
}

export async function fetchAllUserEntries(userId: string): Promise<DailyEntry[]> {
  const { data } = await supabase
    .from("daily_entries")
    .select("*, team_leaders(name, plantation_id, plantations(block, rancangan))")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  return (data || []) as DailyEntry[];
}

export async function fetchLatestEntriesForLeaders(leaderIds: string[]): Promise<Record<string, DailyEntry>> {
  if (leaderIds.length === 0) return {};

  const { data } = await supabase
    .from("daily_entries")
    .select("*")
    .in("team_leader_id", leaderIds)
    .order("date", { ascending: false });

  const latestMap: Record<string, DailyEntry> = {};
  (data || []).forEach((entry: DailyEntry) => {
    if (!latestMap[entry.team_leader_id]) {
      latestMap[entry.team_leader_id] = entry;
    }
  });

  return latestMap;
}

export function computeLeaderStats(entries: DailyEntry[]) {
  const workDays = entries.filter((e) => e.work_status === "work");
  const totalBunches = workDays.reduce((sum, e) => sum + (Number(e.bunches) || 0), 0);
  const totalTons = entries.reduce((sum, e) => sum + (Number(e.tons) || 0), 0);
  const totalBacklogs = workDays.reduce((sum, e) => sum + (Number(e.backlogs) || 0), 0);
  const totalWorkers = workDays.reduce((sum, e) => sum + (Number(e.num_workers) || 0), 0);

  return {
    totalEntries: entries.length,
    workDays: workDays.length,
    noWorkDays: entries.length - workDays.length,
    totalBunches,
    totalTons,
    totalBacklogs,
    avgBunches: workDays.length > 0 ? Math.round(totalBunches / workDays.length) : 0,
    avgTons: workDays.length > 0 ? (totalTons / workDays.length).toFixed(2) : "0.00",
    avgWorkers: workDays.length > 0 ? Math.round(totalWorkers / workDays.length) : 0,
  };
}

// React Query hooks
export function usePlantations(userId: string | undefined) {
  return useQuery({
    queryKey: ["plantations", userId],
    queryFn: () => fetchPlantations(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function useTeamLeaders(userId: string | undefined) {
  return useQuery({
    queryKey: ["teamLeaders", userId],
    queryFn: () => fetchTeamLeaders(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function useLeaderEntries(leaderId: string | undefined) {
  return useQuery({
    queryKey: ["leaderEntries", leaderId],
    queryFn: () => fetchLeaderEntries(leaderId!),
    enabled: !!leaderId,
    staleTime: 30_000,
  });
}

export function useAllUserEntries(userId: string | undefined) {
  return useQuery({
    queryKey: ["allEntries", userId],
    queryFn: () => fetchAllUserEntries(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function useInvalidateEntries() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["leaderEntries"] });
    queryClient.invalidateQueries({ queryKey: ["allEntries"] });
  };
}

// ─── Dashboard data hooks ────────────────────────────────────────────────
// These replace the raw supabase calls that used to live in dashboard/page.tsx
// useEffect handlers, so caching / dedup / stale-while-revalidate actually apply.

export function usePlantationTeamLeaders(
  userId: string | undefined,
  plantationId: string | undefined
) {
  return useQuery({
    queryKey: ["plantationTeamLeaders", userId, plantationId],
    queryFn: () => getUserTeamLeaders(userId!, plantationId!),
    enabled: !!userId && !!plantationId,
    staleTime: 60_000,
  });
}

export function useDashboardMonthEntries(
  userId: string | undefined,
  plantationId: string | undefined,
  year: number,
  month: number
) {
  const { startDate, endDate } = getMonthRange(year, month);
  return useQuery({
    queryKey: ["dashboardMonthEntries", userId, plantationId, year, month],
    queryFn: async () => {
      const { data } = await supabase
        .from("daily_entries")
        .select("date, bunches, tons, backlogs, team_leader_id, work_status")
        .eq("user_id", userId)
        .eq("plantation_id", plantationId)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });
      return (data || []) as DailyEntry[];
    },
    enabled: !!userId && !!plantationId,
    staleTime: 30_000,
  });
}

export function useDashboardRecentEntries(
  userId: string | undefined,
  plantationId: string | undefined,
  year: number,
  month: number
) {
  const { startDate, endDate } = getMonthRange(year, month);
  return useQuery({
    queryKey: ["dashboardRecentEntries", userId, plantationId, year, month],
    queryFn: async () => {
      const { data } = await supabase
        .from("daily_entries")
        .select("*, team_leaders(name), plantations(block)")
        .eq("user_id", userId)
        .eq("plantation_id", plantationId)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false })
        .limit(10);
      return (data || []) as DailyEntryWithRelations[];
    },
    enabled: !!userId && !!plantationId,
    staleTime: 30_000,
  });
}

export function useTodayPulse(
  userId: string | undefined,
  plantationId: string | undefined
) {
  // `today` in the key means a new day triggers a fresh fetch automatically.
  const today = toLocalDateKey(new Date());
  return useQuery({
    queryKey: ["todayPulse", userId, plantationId, today],
    queryFn: async () => {
      const { data } = await supabase
        .from("daily_entries")
        .select("bunches, tons, team_leader_id, work_status")
        .eq("user_id", userId)
        .eq("plantation_id", plantationId)
        .eq("date", today);
      return (data || []) as DailyEntry[];
    },
    enabled: !!userId && !!plantationId,
    staleTime: 30_000,
  });
}

export function useReportEntries(
  userId: string | undefined,
  year: number,
  month: number
) {
  const { startDate, endDate } = getMonthRange(year, month);
  return useQuery({
    queryKey: ["reportEntries", userId, year, month],
    queryFn: async () => {
      const { data } = await supabase
        .from("daily_entries")
        .select("*, team_leaders(plantation_id, plantations(rancangan, peringkat, block))")
        .eq("user_id", userId)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });
      return (data || []) as DailyEntry[];
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}
