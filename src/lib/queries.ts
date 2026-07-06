import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabaseClient";
import { Plantation, TeamLeader, DailyEntry } from "@/types";

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
  const totalBunches = workDays.reduce((sum, e) => sum + (e.bunches || 0), 0);
  const totalTons = workDays.reduce((sum, e) => sum + (e.tons || 0), 0);
  const totalBacklogs = workDays.reduce((sum, e) => sum + (e.backlogs || 0), 0);
  const totalWorkers = workDays.reduce((sum, e) => sum + (e.num_workers || 0), 0);

  return {
    totalEntries: entries.length,
    workDays: workDays.length,
    noWorkDays: entries.length - workDays.length,
    totalBunches,
    totalTons,
    totalBacklogs,
    avgBunches: workDays.length > 0 ? Math.round(totalBunches / workDays.length) : 0,
    avgTons: workDays.length > 0 ? (totalTons / workDays.length).toFixed(1) : "0",
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
