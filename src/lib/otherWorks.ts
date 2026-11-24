import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabaseClient";
import { getMonthRange, toLocalDateKey } from "./date";
import { OtherWorkSchema } from "./schemas";
import type { OtherWork } from "@/types";

export interface OtherWorkCounts {
  running: number;
  completed: number;
  total: number;
}

// ── Fetching ────────────────────────────────────────────────────────────────

export async function fetchOtherWorks(
  plantationId: string
): Promise<OtherWork[]> {
  const { data, error } = await supabase
    .from("other_works")
    .select("*, team_leaders(name), plantations(block, rancangan)")
    .eq("plantation_id", plantationId)
    .order("started_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return OtherWorkSchema.array().parse(data ?? []);
}

export async function fetchOtherWorkCounts(
  plantationId: string,
  year: number,
  month: number
): Promise<OtherWorkCounts> {
  const { startDate, endDate } = getMonthRange(year, month);
  const { data } = await supabase
    .from("other_works")
    .select("status")
    .eq("plantation_id", plantationId)
    .gte("created_at", `${startDate}T00:00:00`)
    .lte("created_at", `${endDate}T23:59:59.999`);

  const rows = data ?? [];
  return {
    running: rows.filter((r) => r.status === "running").length,
    completed: rows.filter((r) => r.status === "completed").length,
    total: rows.length,
  };
}

// ── Hooks ───────────────────────────────────────────────────────────────────

export function useOtherWorks(
  userId: string | undefined,
  plantationId: string | undefined
) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["otherWorks", userId, plantationId],
    queryFn: () => fetchOtherWorks(plantationId!),
    enabled: !!userId && !!plantationId,
    staleTime: 15_000,
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`other-works-${userId}-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "other_works",
          filter: `created_by=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["otherWorks"] });
          queryClient.invalidateQueries({ queryKey: ["otherWorkCounts"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return query;
}

export function useOtherWorkCounts(
  userId: string | undefined,
  plantationId: string | undefined,
  year: number,
  month: number
) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["otherWorkCounts", userId, plantationId, year, month],
    queryFn: () => fetchOtherWorkCounts(plantationId!, year, month),
    enabled: !!userId && !!plantationId,
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });

  // Keep the dashboard card fresh even when a job is added/edited elsewhere.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`other-work-counts-${userId}-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "other_works",
          filter: `created_by=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["otherWorkCounts"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return query;
}

// ── Date / duration helpers ─────────────────────────────────────────────────

/** ISO timestamp -> `YYYY-MM-DDTHH:mm` for <input type="datetime-local">. */
export function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

/** datetime-local value -> ISO string (UTC) for storage, or null. */
export function fromLocalInput(local?: string | null): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-MY", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });
}

/** Human duration between two timestamps; open-ended ones use "now". */
export function formatDuration(
  startedAt?: string | null,
  endedAt?: string | null
): string | null {
  if (!startedAt) return null;
  const start = new Date(startedAt).getTime();
  if (Number.isNaN(start)) return null;
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const minutes = Math.max(0, Math.round((end - start) / 60_000));
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}j ${mins}m`;
  return `${mins}m`;
}

/** Local date key (YYYY-MM-DD) for a job, preferring started_at. */
export function jobDateKey(job: OtherWork): string {
  const base = job.started_at || job.created_at;
  const d = new Date(base);
  return Number.isNaN(d.getTime()) ? "" : toLocalDateKey(d);
}

export interface JobGroup {
  label: string;
  items: OtherWork[];
}

/** Group jobs into Hari Ini / Semalam / Minggu Ini / Lebih Awal buckets. */
export function groupJobsByDate(jobs: OtherWork[]): JobGroup[] {
  const now = new Date();
  const todayKey = toLocalDateKey(now);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayKey = toLocalDateKey(yesterday);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekStartKey = toLocalDateKey(weekStart);

  const buckets: Record<"today" | "yesterday" | "week" | "earlier", OtherWork[]> = {
    today: [],
    yesterday: [],
    week: [],
    earlier: [],
  };

  for (const job of jobs) {
    const key = jobDateKey(job);
    if (key === todayKey) buckets.today.push(job);
    else if (key === yesterdayKey) buckets.yesterday.push(job);
    else if (key && key >= weekStartKey) buckets.week.push(job);
    else buckets.earlier.push(job);
  }

  return [
    { label: "Hari Ini", items: buckets.today },
    { label: "Semalam", items: buckets.yesterday },
    { label: "Minggu Ini", items: buckets.week },
    { label: "Lebih Awal", items: buckets.earlier },
  ].filter((g) => g.items.length > 0);
}
