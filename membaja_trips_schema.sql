-- ============================================================================
-- MEMBAJA — TRIP BAJA (fertilizer trips out of the store)
-- Run this in the Supabase SQL editor AFTER other_works_schema.sql.
--
-- Each row = one day's trips for a Membaja (other_works.type = 'baja') job.
-- `trips` = how many trips the fertilizer left the store that day.
-- ============================================================================

create table if not exists public.other_work_trips (
  id            uuid primary key default gen_random_uuid(),
  other_work_id uuid not null references public.other_works(id) on delete cascade,
  plantation_id uuid not null references public.plantations(id) on delete cascade,
  date          date not null,
  trips         integer not null default 0 check (trips >= 0),
  quantity_tons numeric(10,2),
  store         text,
  notes         text,
  created_by    uuid not null default auth.uid() references auth.users(id),
  created_at    timestamptz not null default now()
);

create index if not exists idx_other_work_trips_work on public.other_work_trips (other_work_id);
create index if not exists idx_other_work_trips_plantation on public.other_work_trips (plantation_id);
create index if not exists idx_other_work_trips_date on public.other_work_trips (date desc);
create index if not exists idx_other_work_trips_created_by on public.other_work_trips (created_by);

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.other_work_trips enable row level security;

drop policy if exists "other_work_trips_select_own" on public.other_work_trips;
create policy "other_work_trips_select_own" on public.other_work_trips
  for select using (
    exists (
      select 1 from public.plantations p
      where p.id = other_work_trips.plantation_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "other_work_trips_insert_own" on public.other_work_trips;
create policy "other_work_trips_insert_own" on public.other_work_trips
  for insert with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.plantations p
      where p.id = other_work_trips.plantation_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "other_work_trips_update_own" on public.other_work_trips;
create policy "other_work_trips_update_own" on public.other_work_trips
  for update using (
    exists (
      select 1 from public.plantations p
      where p.id = other_work_trips.plantation_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.plantations p
      where p.id = other_work_trips.plantation_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "other_work_trips_delete_own" on public.other_work_trips;
create policy "other_work_trips_delete_own" on public.other_work_trips
  for delete using (
    exists (
      select 1 from public.plantations p
      where p.id = other_work_trips.plantation_id and p.user_id = auth.uid()
    )
  );

-- ── Realtime ────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.other_work_trips;
