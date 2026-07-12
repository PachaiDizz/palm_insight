-- Biji Relai (Palm Seed Tonnage) table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.biji_relai (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plantation_id UUID REFERENCES public.plantations(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  tons NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.biji_relai ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own biji relai"
ON public.biji_relai FOR ALL
USING (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_biji_relai_unique_date
ON public.biji_relai(plantation_id, date);

CREATE INDEX IF NOT EXISTS idx_biji_relai_user_block_date
ON public.biji_relai(user_id, plantation_id, date);
