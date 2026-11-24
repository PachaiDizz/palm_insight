-- ============================================================================
-- MEMBAJA — server-side totals
-- Run this in the Supabase SQL editor. Idempotent.
--
-- Recomputes other_works.details.total_bags / total_kg from details.items on
-- every insert/update for type = 'membaja', so client totals are never trusted.
-- ============================================================================

create or replace function public.other_works_recalc_membaja_totals()
returns trigger
language plpgsql
as $$
declare
  bags integer;
  kg   numeric;
begin
  if new.type = 'membaja'
     and new.details is not null
     and jsonb_typeof(new.details -> 'items') = 'array' then
    select
      coalesce(sum((it ->> 'bags')::numeric), 0),
      coalesce(sum((it ->> 'kg')::numeric), 0)
    into bags, kg
    from jsonb_array_elements(new.details -> 'items') as it;

    new.details := jsonb_set(new.details, '{total_bags}', to_jsonb(bags), true);
    new.details := jsonb_set(new.details, '{total_kg}', to_jsonb(kg), true);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_other_works_recalc_membaja_totals on public.other_works;
create trigger trg_other_works_recalc_membaja_totals
  before insert or update on public.other_works
  for each row execute function public.other_works_recalc_membaja_totals();
