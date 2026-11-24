import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabaseClient";
import type { WorkOption, WorkOptionCategory } from "@/types";

/** Trim, collapse whitespace and force uppercase. */
export function normalizeOption(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toUpperCase();
}

function keyFor(category: WorkOptionCategory, plantationId?: string | null) {
  return ["workOptions", category, plantationId ?? "global"] as const;
}

function dedupe(options: WorkOption[]): WorkOption[] {
  const seen = new Set<string>();
  const out: WorkOption[] = [];
  for (const o of options) {
    const k = o.value.toUpperCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(o);
  }
  return out.sort((a, b) => a.value.localeCompare(b.value));
}

export async function fetchWorkOptions(
  category: WorkOptionCategory,
  plantationId?: string | null
): Promise<WorkOption[]> {
  let query = supabase
    .from("work_options")
    .select("id, plantation_id, category, value, created_by, created_at")
    .eq("category", category);

  query = plantationId
    ? query.or(`plantation_id.is.null,plantation_id.eq.${plantationId}`)
    : query.is("plantation_id", null);

  const { data, error } = await query.order("value", { ascending: true });
  if (error) throw error;
  return dedupe((data ?? []) as WorkOption[]);
}

/**
 * Insert a saved option with ON CONFLICT DO NOTHING semantics. Ignores
 * duplicates (Postgres 23505) so callers never fail when the value exists.
 */
export async function addWorkOption(
  category: WorkOptionCategory,
  raw: string,
  plantationId?: string | null
): Promise<void> {
  const value = normalizeOption(raw);
  if (!value) return;

  const { error } = await supabase
    .from("work_options")
    .upsert(
      { plantation_id: plantationId || null, category, value },
      { ignoreDuplicates: true }
    );

  if (error && error.code !== "23505") throw error;
}

/** Persist many typed-but-unsaved values at once (fire and forget). */
export async function persistWorkOptions(
  entries: { category: WorkOptionCategory; value: string | null | undefined }[],
  plantationId?: string | null
): Promise<void> {
  const seen = new Set<string>();
  const jobs: Promise<void>[] = [];
  for (const e of entries) {
    const value = normalizeOption(e.value ?? "");
    if (!value) continue;
    const k = `${e.category}:${value}`;
    if (seen.has(k)) continue;
    seen.add(k);
    jobs.push(
      addWorkOption(e.category, value, plantationId).catch((err) => {
        console.error("Failed to persist work option:", e.category, value, err);
      })
    );
  }
  await Promise.all(jobs);
}

export function useWorkOptions(
  category: WorkOptionCategory,
  plantationId?: string | null
) {
  const queryClient = useQueryClient();
  const pid = plantationId || null;
  const key = keyFor(category, pid);

  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchWorkOptions(category, pid),
    staleTime: 60_000,
    placeholderData: (previous) => previous,
  });

  const addOption = async (raw: string): Promise<string> => {
    const value = normalizeOption(raw);
    if (!value) return value;

    const previous = queryClient.getQueryData<WorkOption[]>(key) ?? [];
    if (!previous.some((o) => o.value.toUpperCase() === value)) {
      const optimistic: WorkOption = {
        id: `temp-${value}`,
        plantation_id: pid,
        category,
        value,
        created_by: null,
      };
      queryClient.setQueryData<WorkOption[]>(key, dedupe([...previous, optimistic]));
    }

    try {
      await addWorkOption(category, value, pid);
      queryClient.invalidateQueries({ queryKey: key });
      return value;
    } catch (err) {
      queryClient.setQueryData<WorkOption[]>(key, previous);
      throw err;
    }
  };

  const removeOption = async (id: string): Promise<void> => {
    const previous = queryClient.getQueryData<WorkOption[]>(key) ?? [];
    queryClient.setQueryData<WorkOption[]>(
      key,
      previous.filter((o) => o.id !== id)
    );
    const { error } = await supabase.from("work_options").delete().eq("id", id);
    if (error) {
      queryClient.setQueryData<WorkOption[]>(key, previous);
      throw error;
    }
    queryClient.invalidateQueries({ queryKey: key });
  };

  return {
    options: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    addOption,
    removeOption,
  };
}
