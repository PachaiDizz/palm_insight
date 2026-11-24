import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabaseClient";
import { BajaTripSchema } from "./schemas";
import type { BajaTrip } from "@/types";

export async function fetchBajaTrips(otherWorkId: string): Promise<BajaTrip[]> {
  const { data, error } = await supabase
    .from("other_work_trips")
    .select("*")
    .eq("other_work_id", otherWorkId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return BajaTripSchema.array().parse(data ?? []);
}

export function useBajaTrips(userId?: string, otherWorkId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["bajaTrips", otherWorkId],
    queryFn: () => fetchBajaTrips(otherWorkId!),
    enabled: !!userId && !!otherWorkId,
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!userId || !otherWorkId) return;
    const channel = supabase
      .channel(`baja-trips-${otherWorkId}-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "other_work_trips",
          filter: `other_work_id=eq.${otherWorkId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["bajaTrips", otherWorkId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, otherWorkId, queryClient]);

  return query;
}

export function summarizeTrips(trips: BajaTrip[]) {
  const totalTrips = trips.reduce((sum, t) => sum + (Number(t.trips) || 0), 0);
  const totalTons = trips.reduce((sum, t) => sum + (Number(t.quantity_tons) || 0), 0);
  return { totalTrips, totalTons, days: trips.length };
}

export function formatTripDate(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-MY", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}
