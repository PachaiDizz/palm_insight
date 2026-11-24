-- ============================================================================
-- KERJA-KERJA LAIN (Other Works)
-- Run this in the Supabase SQL editor.
--
-- `plantation_id` is the primary association: in this app a plantation row
-- represents one block, so the "block" selected on the dashboard == plantation.
-- `block_id` is kept as a nullable reference for future multi-block support.
-- `workers` is included so the form/card can show assigned worker count.
-- ============================================================================

create table if not exists public.other_works (
  id            uuid primary key default gen_random_uuid(),
  plantation_id uuid not null references public.plantations(id) on delete cascade,
  block_id      uuid,
  team_id       uuid references public.team_leaders(id) on delete set null,
  type          text not null default 'lain_lain'
                  check (type in ('mencuci_merumput','membaja','pruning','cuci_parit','baiki_jalan','lain_lain')),
  title         text not null,
  status        text not null default 'scheduled'
                  check (status in ('scheduled','running','completed','cancelled')),
  progress      integer not null default 0 check (progress between 0 and 100),
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

create index if not exists idx_other_works_plantation on public.other_works (plantation_id);
create index if not exists idx_other_works_status      on public.other_works (status);
create index if not exists idx_other_works_started_at  on public.other_works (started_at desc);
create index if not exists idx_other_works_created_by  on public.other_works (created_by);

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.other_works enable row level security;

drop policy if exists "other_works_select_own" on public.other_works;
create policy "other_works_select_own" on public.other_works
  for select using (
    exists (
      select 1 from public.plantations p
      where p.id = other_works.plantation_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "other_works_insert_own" on public.other_works;
create policy "other_works_insert_own" on public.other_works
  for insert with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.plantations p
      where p.id = other_works.plantation_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "other_works_update_own" on public.other_works;
create policy "other_works_update_own" on public.other_works
  for update using (
    exists (
      select 1 from public.plantations p
      where p.id = other_works.plantation_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.plantations p
      where p.id = other_works.plantation_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "other_works_delete_own" on public.other_works;
create policy "other_works_delete_own" on public.other_works
  for delete using (
    exists (
      select 1 from public.plantations p
      where p.id = other_works.plantation_id and p.user_id = auth.uid()
    )
  );

-- ── Realtime ────────────────────────────────────────────────────────────────
-- Enable Realtime for this table so new/updated jobs appear without refresh.
-- (Supabase Dashboard → Database → Replication → add `other_works`), or run:
alter publication supabase_realtime add table public.other_works;

-- ── Optional seed data ──────────────────────────────────────────────────────
-- Uncomment to insert a few example jobs for the signed-in user's first block.
--
-- insert into public.other_works
--   (plantation_id, team_id, type, title, status, progress, workers, started_at, notes, created_by)
-- select p.id, null, 'racun_rumpai', 'Racun Rumpai Blok A', 'running', 45, 4,
--        now() - interval '2 hours', 'Semburan separuh siap', auth.uid()
-- from public.plantations p
-- where p.user_id = auth.uid()
-- order by p.created_at asc
-- limit 1;
