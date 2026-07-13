-- Add geolocation columns to daily_entries for the Map feature
-- Run this in your Supabase SQL editor before using the Map page

ALTER TABLE public.daily_entries
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS lot_label TEXT DEFAULT NULL;
