-- ============================================================================
-- OTHER_WORKS v2 UPGRADE — premium form / dynamic details
-- Run this in the Supabase SQL editor if you ALREADY created `other_works`
-- with the original schema. (Fresh installs can use other_works_schema.sql.)
--
-- Adds:
--   details      jsonb   - type-specific values
--   group_name   text    - standalone group (no FK to teams)
--   leader_name  text    - standalone leader/ketua
--   worker_count integer - number of workers (replaces `workers`)
-- and migrates the job `type` values to the new categories.
-- ============================================================================

alter table public.other_works add column if not exists details      jsonb;
alter table public.other_works add column if not exists group_name   text;
alter table public.other_works add column if not exists leader_name  text;
alter table public.other_works add column if not exists worker_count integer not null default 0;

-- Backfill worker_count from the legacy `workers` column when present.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'other_works'
      and column_name = 'workers'
  ) then
    update public.other_works
    set worker_count = coalesce(workers, 0)
    where worker_count = 0;
  end if;
end $$;

-- Migrate old type values to the new categories.
update public.other_works set type = 'mencuci_merumput' where type = 'racun_rumpai';
update public.other_works set type = 'membaja'          where type = 'baja';
update public.other_works set type = 'pruning'          where type = 'pangkas';
update public.other_works set type = 'cuci_parit'       where type = 'parit';

-- Replace the type check constraint with the new set.
alter table public.other_works drop constraint if exists other_works_type_check;
alter table public.other_works
  add constraint other_works_type_check
  check (type in ('mencuci_merumput','membaja','pruning','cuci_parit','baiki_jalan','lain_lain'));
