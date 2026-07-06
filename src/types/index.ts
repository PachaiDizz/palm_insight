export interface Plantation {
  id: string;
  user_id: string;
  rancangan: string;
  peringkat: string;
  block: string;
  ketua_block: string | null;
  biro_ladang: string | null;
  penyelia: string | null;
  mandor: string | null;
  area_hectare: number | null;
  created_at: string;
}

export interface TeamLeader {
  id: string;
  user_id: string;
  plantation_id: string;
  name: string;
  phone: string | null;
  created_at: string;
  plantations?: Plantation;
}

export interface DailyEntry {
  id: string;
  user_id: string;
  team_leader_id: string;
  plantation_id: string;
  work_status: "work" | "no_work";
  date: string;
  num_workers: number | null;
  lot: string | null;
  bunches: number | null;
  tons: number | null;
  backlogs: number | null;
  notes: string | null;
  created_at: string;
  team_leaders?: TeamLeader;
}

export interface UserProfile {
  id?: string;
  full_name: string;
}

export interface TodayStats {
  bunches: number;
  transported: number;
  backlogs: number;
  teamsActive: number;
}
