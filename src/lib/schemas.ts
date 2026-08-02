import { z } from "zod";

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
