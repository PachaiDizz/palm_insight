-- ============================================================================
-- PALMINSIGHT — KERJA-KERJA LAIN V3 migration (idempotent)
-- Run ONCE in the Supabase SQL editor, then hard-refresh the PWA.
--
-- It will:
--   1. Merge the fertilizer dropdown categories into a single 'fertilizer'.
--   2. Migrate legacy MEMBAJA rows: flat `items` -> `trips[0]`,
--      `chekar_area_ha` -> `area_ha`, default `round_no` (null).
--   3. Recompute MEMBAJA totals from `trips` on the server (grand + per trip).
-- ============================================================================

-- ── 1. Merge fertilizer categories ───────────────────────────────────────────
-- De-duplicate across BOTH legacy categories (and any existing 'fertilizer')
-- before re-labelling, otherwise the unique index conflicts on update.
with ranked as (
  select
    id,
    row_number() over (
      partition by
        coalesce(plantation_id, '00000000-0000-0000-0000-000000000000'::uuid),
        upper(value)
      order by created_at, id
    ) as rn
  from public.work_options
  where category in ('fertilizer_type', 'fertilizer_name', 'fertilizer')
)
delete from public.work_options w
using ranked r
where w.id = r.id and r.rn > 1;

update public.work_options
set category = 'fertilizer'
where category in ('fertilizer_type', 'fertilizer_name');

-- Global seeds (never pre-selected in the form).
insert into public.work_options (plantation_id, category, value)
select null, v.category, v.value
from (values
  ('fertilizer', 'FELDA COMPACT'),
  ('fertilizer', 'NPK'),
  ('fertilizer', 'UREA'),
  ('fertilizer', 'MOP'),
  ('fertilizer', 'KIESERITE')
) as v(category, value)
on conflict do nothing;

-- ── 2. MEMBAJA row migration ─────────────────────────────────────────────────
-- Flat items -> single trip.
update public.other_works
set details = jsonb_set(
    jsonb_set(
      details - 'items',
      '{trips}',
      jsonb_build_array(
        jsonb_build_object(
          'trip_no', 1,
          'items', coalesce(details -> 'items', '[]'::jsonb)
        )
      ),
      true
    ),
    '{trip_count}',
    '1'::jsonb,
    true
  )
where type = 'membaja'
  and details is not null
  and jsonb_typeof(details -> 'items') = 'array'
  and (details -> 'trips') is null;

-- chekar_area_ha -> area_ha.
update public.other_works
set details = jsonb_set(
    details - 'chekar_area_ha',
    '{area_ha}',
    details -> 'chekar_area_ha',
    true
  )
where type = 'membaja'
  and details is not null
  and (details ? 'chekar_area_ha');

-- ── 3. Server-side MEMBAJA totals (per trip + grand) ─────────────────────────
create or replace function public.other_works_recalc_membaja_totals()
returns trigger
language plpgsql
as $$
declare
  trip      jsonb;
  items     jsonb;
  new_trips jsonb := '[]'::jsonb;
  t_bags    numeric;
  t_kg      numeric;
  g_bags    numeric := 0;
  g_kg      numeric := 0;
begin
  if new.type = 'membaja'
     and new.details is not null
     and jsonb_typeof(new.details -> 'trips') = 'array' then

    for trip in select * from jsonb_array_elements(new.details -> 'trips') loop
      items := coalesce(trip -> 'items', '[]'::jsonb);

      select
        coalesce(sum(coalesce((it ->> 'bags')::numeric, 0)), 0),
        coalesce(sum(coalesce((it ->> 'kg')::numeric, 0)), 0)
      into t_bags, t_kg
      from jsonb_array_elements(items) as it;

      g_bags := g_bags + t_bags;
      g_kg := g_kg + t_kg;

      new_trips := new_trips || jsonb_build_array(
        jsonb_set(
          jsonb_set(trip, '{total_bags}', to_jsonb(t_bags), true),
          '{total_kg}', to_jsonb(t_kg), true
        )
      );
    end loop;

    new.details := jsonb_set(new.details, '{trips}', new_trips, true);
    new.details := jsonb_set(
      new.details, '{trip_count}', to_jsonb(jsonb_array_length(new_trips)), true
    );
    new.details := jsonb_set(new.details, '{total_bags}', to_jsonb(g_bags), true);
    new.details := jsonb_set(new.details, '{total_kg}', to_jsonb(g_kg), true);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_other_works_recalc_membaja_totals on public.other_works;
create trigger trg_other_works_recalc_membaja_totals
  before insert or update on public.other_works
  for each row execute function public.other_works_recalc_membaja_totals();

-- Refresh PostgREST schema cache.
notify pgrst, 'reload schema';
