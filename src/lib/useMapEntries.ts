"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "./supabaseClient";

export interface MapEntry {
  id: string;
  latitude: number;
  longitude: number;
  leaderName: string;
  block: string;
  lotLabel: string | null;
  workStatus: string;
  numWorkers: number | null;
  bunches: number | null;
  tons: number | null;
  date: string;
  teamLeaderId: string;
}

export function useMapEntries(userId: string | undefined, date: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["mapEntries", userId, date],
    queryFn: async (): Promise<MapEntry[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("daily_entries")
        .select(`
          id, latitude, longitude, lot_label, work_status, date, bunches, tons, num_workers, team_leader_id,
          team_leaders (name, plantation_id, plantations(block, rancangan))
        `)
        .eq("user_id", userId)
        .eq("date", date)
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      if (error) {
        console.error("Error fetching map entries:", error);
        return [];
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        leaderName: row.team_leaders?.name || "Unknown",
        block: row.team_leaders?.plantations?.block || "?",
        lotLabel: row.lot_label,
        workStatus: row.work_status,
        numWorkers: row.num_workers,
        bunches: row.bunches,
        tons: row.tons,
        date: row.date,
        teamLeaderId: row.team_leader_id,
      }));
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  // Subscribe to real-time changes
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("map-entries")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "daily_entries",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["mapEntries", userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return query;
}

export function useAllTeamLeaders(userId: string | undefined) {
  return useQuery({
    queryKey: ["allTeamLeaders", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from("team_leaders")
        .select("id, name, plantations(block)")
        .eq("user_id", userId);

      return (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        block: row.plantations?.block || "?",
      }));
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
}
