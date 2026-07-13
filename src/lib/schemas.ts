import { z } from "zod";

export const plantationSchema = z.object({
  rancangan: z.string().min(1, "Rancangan is required"),
  peringkat: z.string().min(1, "Peringkat is required"),
  block: z.string().min(1, "Block is required"),
  ketua_block: z.string().min(1, "Ketua Block is required"),
  biro_ladang: z.string().min(1, "Biro Ladang is required"),
  penyelia: z.string().min(1, "Penyelia is required"),
  mandor: z.string().min(1, "Mandor is required"),
  area_hectare: z.string().min(1, "Area is required").refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Area must be a positive number"),
});

export const teamLeaderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
});

export const dailyEntrySchema = z.object({
  date: z.string().min(1, "Date is required"),
  num_workers: z.string().optional(),
  lot: z.string().optional(),
  bunches: z.string().optional(),
  tons: z.string().optional(),
  backlogs: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  lot_label: z.string().optional(),
}).refine(
  (data) => {
    if (data.num_workers && parseInt(data.num_workers) < 0) return false;
    if (data.bunches && parseInt(data.bunches) < 0) return false;
    if (data.tons && parseFloat(data.tons) < 0) return false;
    if (data.backlogs && parseInt(data.backlogs) < 0) return false;
    return true;
  },
  { message: "Values cannot be negative" }
);

export type PlantationFormData = z.infer<typeof plantationSchema>;
export type TeamLeaderFormData = z.infer<typeof teamLeaderSchema>;
export type DailyEntryFormData = z.infer<typeof dailyEntrySchema>;
