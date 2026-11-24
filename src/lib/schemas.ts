import { z } from "zod";

export const plantationSchema = z.object({
  rancangan: z.string().min(1, "Rancangan is required"),
  peringkat: z.string().min(1, "Peringkat is required"),
  block: z.string().min(1, "Block is required"),
  ketua_block: z.string().optional(),
  biro_ladang: z.string().optional(),
  penyelia: z.string().optional(),
  mandor: z.string().optional(),
  area_hectare: z.string().optional(),
});

export type PlantationFormData = z.infer<typeof plantationSchema>;

export const PlantationSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  rancangan: z.string(),
  peringkat: z.string(),
  block: z.string(),
  ketua_block: z.string().nullable(),
  biro_ladang: z.string().nullable(),
  penyelia: z.string().nullable(),
  mandor: z.string().nullable(),
  area_hectare: z.number().nullable(),
  created_at: z.string(),
});

export const TeamLeaderSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  plantation_id: z.string(),
  name: z.string(),
  phone: z.string().nullable(),
  created_at: z.string(),
  plantations: PlantationSchema.optional(),
});

export const DailyEntrySchema = z.object({
  id: z.string(),
  user_id: z.string(),
  team_leader_id: z.string(),
  plantation_id: z.string(),
  work_status: z.enum(["work", "no_work"]),
  date: z.string(),
  num_workers: z.number().nullable(),
  lot: z.string().nullable(),
  bunches: z.number().nullable(),
  tons: z.number().nullable(),
  backlogs: z.number().nullable(),
  notes: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  lot_label: z.string().nullable(),
  created_at: z.string(),
  team_leaders: TeamLeaderSchema.optional(),
});

export const DailyEntryWithRelationsSchema = DailyEntrySchema.extend({
  team_leaders: z
    .object({ name: z.string() })
    .nullable()
    .optional(),
  plantations: z
    .object({ block: z.string() })
    .nullable()
    .optional(),
});

// ─── Kerja-Kerja Lain (Other Works) ──────────────────────────────────────

export const OTHER_WORK_TYPES = [
  "racun_rumpai",
  "baja",
  "pangkas",
  "baiki_jalan",
  "parit",
  "lain_lain",
] as const;

export const OTHER_WORK_STATUSES = [
  "scheduled",
  "running",
  "completed",
  "cancelled",
] as const;

export const OtherWorkSchema = z.object({
  id: z.string(),
  plantation_id: z.string(),
  block_id: z.string().nullable(),
  team_id: z.string().nullable(),
  type: z.enum(OTHER_WORK_TYPES),
  title: z.string(),
  status: z.enum(OTHER_WORK_STATUSES),
  progress: z.coerce.number(),
  workers: z.coerce.number(),
  started_at: z.string().nullable(),
  ended_at: z.string().nullable(),
  notes: z.string().nullable(),
  created_by: z.string(),
  created_at: z.string(),
  team_leaders: z.object({ name: z.string() }).nullable().optional(),
  plantations: z
    .object({ block: z.string(), rancangan: z.string() })
    .nullable()
    .optional(),
});

export const otherWorkFormSchema = z.object({
  title: z.string().trim().min(1, "Tajuk kerja diperlukan"),
  type: z.enum(OTHER_WORK_TYPES),
  status: z.enum(OTHER_WORK_STATUSES),
  plantation_id: z.string().min(1, "Blok diperlukan"),
  progress: z.coerce.number().min(0).max(100),
  workers: z.coerce.number().min(0),
});

export type OtherWorkFormData = z.infer<typeof otherWorkFormSchema>;
