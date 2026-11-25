-- ============================================================================
-- MEMBAJA — server-side totals (V3: per-trip + grand totals)
-- Idempotent. Superseded by kerja_lain_v3_migration.sql but kept in sync.
--
-- Recomputes details.trips[].total_bags/total_kg plus details.total_bags,
-- details.total_kg and details.trip_count from details.trips on every
-- insert/update for type = 'membaja', so client totals are never trusted.
-- ============================================================================

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
