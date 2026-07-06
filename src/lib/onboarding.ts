import { supabase } from "./supabaseClient";

export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("plantations")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (error || !data || data.length === 0) return false;
  return true;
}

export async function getUserPlantation(userId: string) {
  const { data } = await supabase
    .from("plantations")
    .select("*")
    .eq("user_id", userId)
    .limit(1)
    .single();

  return data;
}

export async function getAllUserPlantations(userId: string) {
  const { data } = await supabase
    .from("plantations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  return data || [];
}

export async function getUserTeamLeaders(userId: string, plantationId: string) {
  const { data } = await supabase
    .from("team_leaders")
    .select("*")
    .eq("user_id", userId)
    .eq("plantation_id", plantationId);

  return data || [];
}
