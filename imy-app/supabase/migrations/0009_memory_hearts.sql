-- 0009_memory_hearts.sql · July 7, 2026
-- Hearts on memories, persisted truthfully.
--
-- The wall's heart counts were client-side theatre: they reset on every refresh.
-- This gives them the same guarantee the candle (0005) and flower (0006) counters
-- have — one atomic UPDATE, callable only by the server, moving only when a real
-- visitor touches a real memory. A heart can be taken back (p_delta -1), and the
-- count never goes below zero.
--
-- The memory must belong to the named tribute, be approved, and the tribute must
-- be published — a heart cannot move a hidden or waiting memory.

create or replace function public.heart_memory(p_slug text, p_memory_id uuid, p_delta integer)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.tribute_memories m
     set hearts = greatest(coalesce(m.hearts, 0) + (case when p_delta < 0 then -1 else 1 end), 0)
   where m.id = p_memory_id
     and m.status = 'approved'
     and m.deleted_at is null
     and exists (
       select 1 from public.tributes t
        where t.id = m.tribute_id
          and t.slug = p_slug
          and t.status = 'published'
          and t.deleted_at is null
     )
  returning m.hearts;
$$;

revoke all on function public.heart_memory(text, uuid, integer) from public;
revoke all on function public.heart_memory(text, uuid, integer) from anon;
revoke all on function public.heart_memory(text, uuid, integer) from authenticated;
grant execute on function public.heart_memory(text, uuid, integer) to service_role;

-- PostgREST picks up the new function without a restart.
notify pgrst, 'reload schema';
