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
  "mencuci_merumput",
  "membaja",
  "pruning",
  "cuci_parit",
  "baiki_jalan",
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
  worker_count: z.coerce.number().default(0),
  details: z.record(z.string(), z.unknown()).nullable(),
  started_at: z.string().nullable(),
  ended_at: z.string().nullable(),
  notes: z.string().nullable(),
  created_by: z.string(),
  created_at: z.string(),
  plantations: z
    .object({ block: z.string(), rancangan: z.string() })
    .nullable()
    .optional(),
});

export const otherWorkFormSchema = z.object({
  title: z.string().optional(),
  type: z.enum(OTHER_WORK_TYPES),
  status: z.enum(OTHER_WORK_STATUSES),
  plantation_id: z.string().min(1, "BLOK DIPERLUKAN"),
  worker_count: z.coerce.number().min(0),
  progress: z.coerce.number().min(0).max(100),
});

export type OtherWorkFormData = z.infer<typeof otherWorkFormSchema>;

const reqNum = z.coerce.number().gt(0, "MESTI LEBIH DARIPADA 0");
const optNum = z.coerce.number().min(0).optional();

/** Validates the type-specific `details` payload. Discriminated on `type`. */
const fertItemSchema = z.object({
  label: z.string(),
  name: z.string().min(1, "NAMA BAJA DIPERLUKAN"),
  bags: z.coerce.number().int("BAG MESTI NOMBOR BULAT").gt(0, "BAG MESTI > 0"),
  kg: z.coerce.number().gt(0, "KG MESTI > 0"),
});

const membajaTripSchema = z.object({
  trip_no: z.coerce.number().int().min(1),
  items: z.array(fertItemSchema).min(1, "SEKURANG-KURANGNYA SATU BARIS"),
});

export const otherWorkDetailsSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("mencuci_merumput"),
    contractor: z.string().optional(),
    method: z.string().optional(),
    area_ha: optNum,
    chemical_name: z.string().optional(),
    chemical_qty_l: optNum,
    first_work_date: z.string().optional(),
    last_work_date: z.string().optional(),
    rounds: z
      .array(
        z.object({
          no: z.coerce.number().int().min(1),
          start_date: z.string().min(1, "TARIKH MULA DIPERLUKAN"),
          end_date: z.string().optional(),
          area_ha: optNum,
          worker_count: optNum,
          notes: z.string().optional(),
        })
      )
      .default([]),
  }),
  z.object({
    type: z.literal("membaja"),
    contractor: z.string().min(1, "KONTRAKTOR DIPERLUKAN"),
    worker_count: z.coerce.number().min(0),
    driver_name: z.string().optional(),
    lorry_no: z.string().optional(),
    round_no: z.coerce.number().int().min(1).max(5).optional(),
    fertilizer_type: z.string().optional(),
    trips: z.array(membajaTripSchema).min(1, "SEKURANG-KURANGNYA SATU TRIP"),
    area_ha: optNum,
    rate_per_palm_kg: optNum,
  }),
  z.object({
    type: z.literal("pruning"),
    contractor: z.string().optional(),
    pruning_type: z.string().optional(),
    tree_count: reqNum,
    area_hectare: reqNum,
  }),
  z.object({
    type: z.literal("cuci_parit"),
    contractor: z.string().min(1, "KONTRAKTOR DIPERLUKAN"),
    ditch_length_value: reqNum,
    ditch_length_unit: z.enum(["M", "KM"]).default("M"),
    ditch_length_m: reqNum,
    ditch_count: reqNum,
    depth_cm: optNum,
  }),
  z.object({
    type: z.literal("baiki_jalan"),
    contractor: z.string().optional(),
    road_length_m: reqNum,
    material: z.string().optional(),
    material_other: z.string().optional(),
    machine: z.string().optional(),
  }),
  z.object({
    type: z.literal("lain_lain"),
    contractor: z.string().optional(),
    description: z.string().min(1, "HURAIAN DIPERLUKAN"),
    quantity: reqNum,
    unit: z.string().min(1, "UNIT DIPERLUKAN"),
  }),
]);

export type OtherWorkDetailsInput = z.infer<typeof otherWorkDetailsSchema>;

// ─── Membaja trips (fertilizer out of store, per day) ───────────────────────

export const BajaTripSchema = z.object({
  id: z.string(),
  other_work_id: z.string(),
  plantation_id: z.string(),
  date: z.string(),
  trips: z.coerce.number(),
  quantity_tons: z.coerce.number().nullable(),
  store: z.string().nullable(),
  notes: z.string().nullable(),
  created_by: z.string(),
  created_at: z.string(),
});

export const bajaTripFormSchema = z.object({
  date: z.string().min(1, "Tarikh diperlukan"),
  trips: z.coerce.number().min(0, "Trip tidak boleh negatif"),
  quantity_tons: z.coerce.number().min(0).optional(),
});

export type BajaTripFormData = z.infer<typeof bajaTripFormSchema>;
