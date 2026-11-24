-- ============================================================================
-- PALMINSIGHT — ONE-SHOT SETUP for KERJA-KERJA LAIN (idempotent)
-- Run this ONCE in the Supabase SQL editor. Safe to re-run.
--
-- It will:
--   1. Create/upgrade `other_works` (incl. details, group_name, leader_name,
--      worker_count) and migrate old `type` values.
--   2. Create `other_work_trips` (Membaja daily trips).
--   3. Enable RLS + policies scoped to the user's plantations.
--   4. Add both tables to Supabase Realtime.
-- ============================================================================

-- ── other_works ─────────────────────────────────────────────────────────────
create table if not exists public.other_works (
  id            uuid primary key default gen_random_uuid(),
  plantation_id uuid not null references public.plantations(id) on delete cascade,
  block_id      uuid,
  team_id       uuid references public.team_leaders(id) on delete set null,
  type          text not null default 'lain_lain',
  title         text not null,
  status        text not null default 'scheduled',
  progress      integer not null default 0,
  worker_count  integer not null default 0,
  group_name    text,
  leader_name   text,
  details       jsonb,
  started_at    timestamptz,
  ended_at      timestamptz,
  notes         text,
  created_by    uuid not null default auth.uid() references auth.users(id),
  created_at    timestamptz not null default now()
);

-- Upgrade path for tables created with the original schema.
alter table public.other_works add column if not exists details      jsonb;
alter table public.other_works add column if not exists group_name   text;
alter table public.other_works add column if not exists leader_name  text;
alter table public.other_works add column if not exists worker_count integer not null default 0;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'other_works' and column_name = 'workers'
  ) then
    update public.other_works set worker_count = coalesce(workers, 0) where worker_count = 0;
  end if;
end $$;

-- Migrate legacy type values.
update public.other_works set type = 'mencuci_merumput' where type = 'racun_rumpai';
update public.other_works set type = 'membaja'          where type = 'baja';
update public.other_works set type = 'pruning'          where type = 'pangkas';
update public.other_works set type = 'cuci_parit'       where type = 'parit';

-- Enforce the new type + status sets.
alter table public.other_works drop constraint if exists other_works_type_check;
alter table public.other_works
  add constraint other_works_type_check
  check (type in ('mencuci_merumput','membaja','pruning','cuci_parit','baiki_jalan','lain_lain'));

alter table public.other_works drop constraint if exists other_works_status_check;
alter table public.other_works
  add constraint other_works_status_check
  check (status in ('scheduled','running','completed','cancelled'));

create index if not exists idx_other_works_plantation on public.other_works (plantation_id);
create index if not exists idx_other_works_status      on public.other_works (status);
create index if not exists idx_other_works_started_at  on public.other_works (started_at desc);
create index if not exists idx_other_works_created_by  on public.other_works (created_by);

alter table public.other_works enable row level security;

drop policy if exists "other_works_select_own" on public.other_works;
create policy "other_works_select_own" on public.other_works for select using (
  exists (select 1 from public.plantations p where p.id = other_works.plantation_id and p.user_id = auth.uid())
);

drop policy if exists "other_works_insert_own" on public.other_works;
create policy "other_works_insert_own" on public.other_works for insert with check (
  created_by = auth.uid()
  and exists (select 1 from public.plantations p where p.id = other_works.plantation_id and p.user_id = auth.uid())
);

drop policy if exists "other_works_update_own" on public.other_works;
create policy "other_works_update_own" on public.other_works for update using (
  exists (select 1 from public.plantations p where p.id = other_works.plantation_id and p.user_id = auth.uid())
) with check (
  exists (select 1 from public.plantations p where p.id = other_works.plantation_id and p.user_id = auth.uid())
);

drop policy if exists "other_works_delete_own" on public.other_works;
create policy "other_works_delete_own" on public.other_works for delete using (
  exists (select 1 from public.plantations p where p.id = other_works.plantation_id and p.user_id = auth.uid())
);

-- ── other_work_trips (Membaja daily trips) ──────────────────────────────────
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

alter table public.other_work_trips enable row level security;

drop policy if exists "other_work_trips_select_own" on public.other_work_trips;
create policy "other_work_trips_select_own" on public.other_work_trips for select using (
  exists (select 1 from public.plantations p where p.id = other_work_trips.plantation_id and p.user_id = auth.uid())
);

drop policy if exists "other_work_trips_insert_own" on public.other_work_trips;
create policy "other_work_trips_insert_own" on public.other_work_trips for insert with check (
  created_by = auth.uid()
  and exists (select 1 from public.plantations p where p.id = other_work_trips.plantation_id and p.user_id = auth.uid())
);

drop policy if exists "other_work_trips_update_own" on public.other_work_trips;
create policy "other_work_trips_update_own" on public.other_work_trips for update using (
  exists (select 1 from public.plantations p where p.id = other_work_trips.plantation_id and p.user_id = auth.uid())
) with check (
  exists (select 1 from public.plantations p where p.id = other_work_trips.plantation_id and p.user_id = auth.uid())
);

drop policy if exists "other_work_trips_delete_own" on public.other_work_trips;
create policy "other_work_trips_delete_own" on public.other_work_trips for delete using (
  exists (select 1 from public.plantations p where p.id = other_work_trips.plantation_id and p.user_id = auth.uid())
);

-- ── Realtime (ignore if already added) ──────────────────────────────────────
do $$
begin
  begin
    alter publication supabase_realtime add table public.other_works;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.other_work_trips;
  exception when duplicate_object then null;
  end;
end $$;

-- Refresh PostgREST schema cache so new columns are visible immediately.
notify pgrst, 'reload schema';
