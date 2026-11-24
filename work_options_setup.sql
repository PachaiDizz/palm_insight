-- ============================================================================
-- PALMINSIGHT — ONE-SHOT SETUP for saved Kerja-Kerja Lain options (idempotent)
-- Run this ONCE in the Supabase SQL editor. Safe to re-run.
--
-- It will:
--   1. Create `work_options` (every creatable dropdown value, per plantation).
--   2. Enable RLS + policies scoped to the user's plantations.
--   3. Seed global defaults (plantation_id NULL) — never pre-selected in the UI.
--   4. Drop legacy `group_name` / `leader_name` from `other_works`.
--   5. Ensure `other_works.details` (jsonb) exists.
--   6. Recompute MENCUCI totals (total_rounds / total_round_area_ha) on the
--      server, mirroring the existing MEMBAJA totals trigger.
-- ============================================================================

-- ── work_options ─────────────────────────────────────────────────────────────
create table if not exists public.work_options (
  id            uuid primary key default gen_random_uuid(),
  plantation_id uuid references public.plantations(id) on delete cascade,
  category      text not null,
  value         text not null,
  created_by    uuid default auth.uid() references auth.users(id),
  created_at    timestamptz not null default now()
);

-- Case-insensitive uniqueness per (plantation, category, value). A NULL
-- plantation_id (global default) is folded into a sentinel uuid so globals
-- also de-duplicate correctly.
create unique index if not exists work_options_uniq on public.work_options (
  coalesce(plantation_id, '00000000-0000-0000-0000-000000000000'::uuid),
  category,
  upper(value)
);

create index if not exists idx_work_options_lookup on public.work_options (category);
create index if not exists idx_work_options_plantation on public.work_options (plantation_id);

alter table public.work_options enable row level security;

-- SELECT: global defaults (plantation NULL) plus options for plantations the
-- user owns. Reuses the same membership check as the `other_works` policies.
drop policy if exists "work_options_select_member" on public.work_options;
create policy "work_options_select_member" on public.work_options for select using (
  plantation_id is null
  or exists (
    select 1 from public.plantations p
    where p.id = work_options.plantation_id and p.user_id = auth.uid()
  )
);

-- INSERT: members of the plantation (or global rows for authenticated users).
drop policy if exists "work_options_insert_member" on public.work_options;
create policy "work_options_insert_member" on public.work_options for insert with check (
  created_by = auth.uid()
  and (
    plantation_id is null
    or exists (
      select 1 from public.plantations p
      where p.id = work_options.plantation_id and p.user_id = auth.uid()
    )
  )
);

-- DELETE: only the creator or the owner ("manager") of the plantation.
drop policy if exists "work_options_delete_owner" on public.work_options;
create policy "work_options_delete_owner" on public.work_options for delete using (
  created_by = auth.uid()
  or (
    plantation_id is not null
    and exists (
      select 1 from public.plantations p
      where p.id = work_options.plantation_id and p.user_id = auth.uid()
    )
  )
);

-- ── Global defaults (never pre-selected in the form) ──────────────────────────
insert into public.work_options (plantation_id, category, value)
select null, v.category, v.value
from (values
  ('fertilizer_type', 'FELDA COMPACT'),
  ('fertilizer_type', 'NPK'),
  ('fertilizer_type', 'UREA'),
  ('fertilizer_type', 'MOP'),
  ('fertilizer_type', 'KIESERITE'),
  ('fertilizer_name', 'FELDA COMPACT'),
  ('fertilizer_name', 'NPK'),
  ('fertilizer_name', 'UREA'),
  ('fertilizer_name', 'MOP'),
  ('fertilizer_name', 'KIESERITE'),
  ('method', 'MANUAL'),
  ('method', 'RACUN'),
  ('method', 'MESIN'),
  ('pruning_type', 'RUTIN'),
  ('pruning_type', 'SANITASI'),
  ('material', 'BATU'),
  ('material', 'TANAH MERAH')
) as v(category, value)
on conflict do nothing;

-- ── other_works upgrades ─────────────────────────────────────────────────────
alter table public.other_works add column if not exists details jsonb;
alter table public.other_works drop column if exists group_name;
alter table public.other_works drop column if exists leader_name;

-- ── MENCUCI / MERUMPUT server-side totals ────────────────────────────────────
create or replace function public.other_works_recalc_mencuci_totals()
returns trigger
language plpgsql
as $$
declare
  rounds integer;
  area   numeric;
begin
  if new.type = 'mencuci_merumput'
     and new.details is not null
     and jsonb_typeof(new.details -> 'rounds') = 'array' then

    rounds := jsonb_array_length(new.details -> 'rounds');

    select coalesce(sum(coalesce((r ->> 'area_ha')::numeric, 0)), 0)
    into area
    from jsonb_array_elements(new.details -> 'rounds') as r;

    new.details := jsonb_set(new.details, '{total_rounds}', to_jsonb(rounds), true);
    new.details := jsonb_set(new.details, '{total_round_area_ha}', to_jsonb(area), true);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_other_works_recalc_mencuci_totals on public.other_works;
create trigger trg_other_works_recalc_mencuci_totals
  before insert or update on public.other_works
  for each row execute function public.other_works_recalc_mencuci_totals();

-- ── Realtime lets dropdowns refresh for everyone in the plantation ───────────
do $$
begin
  begin
    alter publication supabase_realtime add table public.work_options;
  exception when duplicate_object then null;
  end;
end $$;

-- Refresh PostgREST schema cache so new columns/tables are visible immediately.
notify pgrst, 'reload schema';
