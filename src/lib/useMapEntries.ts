"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "./supabaseClient";
import { getLotCoordinates } from "./lotCoordinates";

export interface MapEntry {
  id: string;
  latitude: number | null;
  longitude: number | null;
  leaderName: string;
  block: string;
  lotLabel: string | null;
  workStatus: string;
  numWorkers: number | null;
  bunches: number | null;
  tons: number | null;
  date: string;
  teamLeaderId: string;
  coordsFromLot?: boolean;
}

export function useMapEntries(userId: string | undefined, date: string) {
  const queryClient = useQueryClient();

  // Calculate month range from selected date
  const dateObj = new Date(date + "T00:00:00");
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const query = useQuery({
    queryKey: ["mapEntries", userId, startDate, endDate],
    queryFn: async (): Promise<MapEntry[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("daily_entries")
        .select(`
          id, latitude, longitude, lot_label, lot, work_status, date, bunches, tons, num_workers, team_leader_id,
          team_leaders (name, plantation_id, plantations(block, rancangan))
        `)
        .eq("user_id", userId)
        .gte("date", startDate)
        .lte("date", endDate);

      if (error) {
        console.error("Error fetching map entries:", error);
        return [];
      }

      console.log("All entries:", data?.length);
      console.log("Entries with lot:", data?.filter((e: any) => e.lot || e.lot_label).length);

      const enrichedEntries = (data || []).map((row: any) => {
        const hasDbCoords = row.latitude && row.longitude;
        if (hasDbCoords) {
          return {
            id: row.id,
            latitude: Number(row.latitude),
            longitude: Number(row.longitude),
            leaderName: row.team_leaders?.name || "Unknown",
            block: row.team_leaders?.plantations?.block || "?",
            lotLabel: row.lot_label || row.lot,
            workStatus: row.work_status,
            numWorkers: row.num_workers,
            bunches: row.bunches,
            tons: row.tons,
            date: row.date,
            teamLeaderId: row.team_leader_id,
            coordsFromLot: false,
          };
        }

        // Try lot_label first, then lot column
        const lotValue = row.lot_label || row.lot;
        if (lotValue) {
          const coords = getLotCoordinates(lotValue.toString());
          if (coords) {
            return {
              id: row.id,
              latitude: coords[0],
              longitude: coords[1],
              leaderName: row.team_leaders?.name || "Unknown",
              block: row.team_leaders?.plantations?.block || "?",
              lotLabel: row.lot_label || row.lot,
              workStatus: row.work_status,
              numWorkers: row.num_workers,
              bunches: row.bunches,
              tons: row.tons,
              date: row.date,
              teamLeaderId: row.team_leader_id,
              coordsFromLot: true,
            };
          }
        }

        return {
          id: row.id,
          latitude: null,
          longitude: null,
          leaderName: row.team_leaders?.name || "Unknown",
          block: row.team_leaders?.plantations?.block || "?",
          lotLabel: row.lot_label || row.lot,
          workStatus: row.work_status,
          numWorkers: row.num_workers,
          bunches: row.bunches,
          tons: row.tons,
          date: row.date,
          teamLeaderId: row.team_leader_id,
          coordsFromLot: false,
        };
      });

      const markersToShow = enrichedEntries.filter((e: any) => e.latitude && e.longitude);
      console.log("Markers to show:", markersToShow.length);

      return enrichedEntries;
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
