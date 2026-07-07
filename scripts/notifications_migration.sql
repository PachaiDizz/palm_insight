-- Notifications table for PalmInsight
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'daily_reminder',
    'low_productivity',
    'checkin_reminder'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  plantation_id UUID REFERENCES public.plantations(id) ON DELETE CASCADE,
  team_leader_id UUID REFERENCES public.team_leaders(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notifications"
ON public.notifications FOR ALL
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
ON public.notifications(user_id, is_read, created_at DESC);
