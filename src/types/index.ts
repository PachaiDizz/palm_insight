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
  latitude: number | null;
  longitude: number | null;
  lot_label: string | null;
  created_at: string;
  team_leaders?: TeamLeader;
}

// DailyEntry with its joined relations from dashboard/reports selects.
// Omit the base `team_leaders` so we can narrow it to just the projected fields.
export type DailyEntryWithRelations = Omit<DailyEntry, "team_leaders"> & {
  team_leaders?: { name: string } | null;
  plantations?: { block: string } | null;
};

export interface BijiRelai {
  id: string;
  user_id: string;
  plantation_id: string;
  date: string;
  tons: number | null;
  created_at: string;
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

export type NotificationType = "daily_reminder" | "low_productivity" | "checkin_reminder";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  plantation_id: string | null;
  team_leader_id: string | null;
  created_at: string;
}

export interface NotificationPrefs {
  dailyReminder: boolean;
  lowProductivity: boolean;
  checkinReminder: boolean;
  browserPush: boolean;
}

// ─── Kerja-Kerja Lain (Other Works) ──────────────────────────────────────

export type OtherWorkStatus = "scheduled" | "running" | "completed" | "cancelled";

export type OtherWorkType =
  | "mencuci_merumput"
  | "membaja"
  | "pruning"
  | "cuci_parit"
  | "baiki_jalan"
  | "lain_lain";

export interface OtherWork {
  id: string;
  plantation_id: string;
  block_id: string | null;
  /** Legacy column; no longer used by this feature. */
  team_id: string | null;
  type: OtherWorkType;
  title: string;
  status: OtherWorkStatus;
  progress: number;
  worker_count: number;
  /** Type-specific values; shape depends on `type`. */
  details: Record<string, unknown> | null;
  started_at: string | null;
  ended_at: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  // Joined relations
  plantations?: { block: string; rancangan: string } | null;
}

// ─── MEMBAJA details (stored in other_works.details) ────────────────────────

export interface MembajaItem {
  label: string;
  name: string;
  bags: number;
  kg: number;
}

export interface MembajaTrip {
  trip_no: number;
  items: MembajaItem[];
  total_bags: number;
  total_kg: number;
}

export interface MembajaDetails {
  contractor: string;
  worker_count: number;
  driver_name: string | null;
  lorry_no: string | null;
  round_no: 1 | 2 | 3 | 4 | 5 | null;
  fertilizer_type: string | null;
  trip_count: number;
  trips: MembajaTrip[];
  total_bags: number;
  total_kg: number;
  area_ha: number | null;
  rate_per_palm_kg: number | null;
}

// ─── MENCUCI / MERUMPUT details (stored in other_works.details) ─────────────

export interface MencuciRound {
  no: number;
  start_date: string;
  end_date: string | null;
  area_ha: number | null;
  worker_count: number | null;
  notes: string | null;
}

export interface MencuciDetails {
  contractor: string | null;
  method: string | null;
  area_ha: number | null;
  chemical_name: string | null;
  chemical_qty_l: number | null;
  first_work_date: string | null;
  last_work_date: string | null;
  rounds: MencuciRound[];
  total_rounds: number;
  total_round_area_ha: number;
}

// ─── Other type-specific details (stored in other_works.details) ────────────

export interface PruningDetails {
  contractor: string | null;
  pruning_type: string | null;
  tree_count: number;
  area_hectare: number;
}

export type DitchLengthUnit = "M" | "KM";

export interface CuciParitDetails {
  contractor: string;
  ditch_length_value: number;
  ditch_length_unit: DitchLengthUnit;
  ditch_length_m: number;
  ditch_count: number;
  depth_cm: number | null;
}

export interface BaikiJalanDetails {
  contractor: string | null;
  road_length_m: number;
  material: string | null;
  machine: string | null;
}

export interface LainLainDetails {
  contractor: string | null;
  description: string;
  quantity: number;
  unit: string;
}

// ─── Saved creatable dropdown options (work_options) ────────────────────────

export type WorkOptionCategory =
  | "contractor"
  | "fertilizer"
  | "method"
  | "chemical_name"
  | "pruning_type"
  | "material"
  | "machine";

export interface WorkOption {
  id: string;
  plantation_id: string | null;
  category: WorkOptionCategory;
  value: string;
  created_by: string | null;
  created_at?: string;
}

// Per-day fertilizer trips for a Membaja (baja) job.
export interface BajaTrip {
  id: string;
  other_work_id: string;
  plantation_id: string;
  date: string;
  trips: number;
  quantity_tons: number | null;
  store: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}
