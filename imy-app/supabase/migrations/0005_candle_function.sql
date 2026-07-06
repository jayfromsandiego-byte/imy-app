-- 0005_candle_function.sql
-- Atomic "light a candle" for public tribute pages.
--
-- The hero candle count must be truthful, so it is incremented by a single
-- atomic UPDATE (no read-modify-write race). This function is called ONLY by the
-- server (service_role) from /api/tribute/[slug]/candle. EXECUTE is revoked from
-- anon/public so the public anon key cannot inflate counts directly via PostgREST.

create or replace function public.light_candle(p_slug text)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.tributes
     set candle_count = coalesce(candle_count, 0) + 1
   where slug = p_slug
     and status = 'published'
     and deleted_at is null
  returning candle_count;
$$;

revoke all on function public.light_candle(text) from public;
revoke all on function public.light_candle(text) from anon;
revoke all on function public.light_candle(text) from authenticated;
grant execute on function public.light_candle(text) to service_role;
