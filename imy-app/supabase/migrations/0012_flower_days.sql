-- 0012 · the wreath greens again each morning — truthfully.
-- "Laid on today's wreath" was a local variable that reset on every page load.
-- Today's count now lives beside the all-time total: two columns, and a
-- lay_flower() that rolls the day each morning (America/Los_Angeles).
-- Additive only; nothing is ever deleted.

alter table public.tributes
  add column if not exists flower_day date,
  add column if not exists flower_day_count integer not null default 0;

-- Return type changes (integer -> table), so the old function goes first.
drop function if exists public.lay_flower(text);

create function public.lay_flower(p_slug text)
returns table(total integer, today integer)
language sql
security definer
set search_path = public
as $$
  update public.tributes
     set flower_count = coalesce(flower_count, 0) + 1,
         flower_day_count = case
           when flower_day = (now() at time zone 'America/Los_Angeles')::date
             then flower_day_count + 1
           else 1
         end,
         flower_day = (now() at time zone 'America/Los_Angeles')::date
   where slug = p_slug
     and status = 'published'
     and deleted_at is null
  returning flower_count, flower_day_count;
$$;

revoke all on function public.lay_flower(text) from public;
revoke all on function public.lay_flower(text) from anon;
revoke all on function public.lay_flower(text) from authenticated;
grant execute on function public.lay_flower(text) to service_role;

notify pgrst, 'reload schema';
