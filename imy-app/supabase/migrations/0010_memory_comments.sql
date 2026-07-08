-- 0010_memory_comments.sql · July 8, 2026
-- Words left under memories, kept — with the family deciding what the page shows.
--
-- The wall's comment drawers were client-side theatre: a word posted under a memory
-- vanished on refresh. Comments now persist exactly the way memories do: anyone may
-- leave one, it lands "pending", and it appears on the page only after the family
-- welcomes it in from the dashboard. Nothing is ever hard-deleted; "hidden" words
-- stay kept for the family, and deleted_at is a soft mark.

create table if not exists public.tribute_memory_comments (
  id          uuid primary key default gen_random_uuid(),
  memory_id   uuid not null references public.tribute_memories(id) on delete cascade,
  tribute_id  uuid not null references public.tributes(id) on delete cascade,
  author_name text not null,
  relation    text,
  body        text not null,
  status      text not null default 'pending',
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index if not exists mem_comments_memory_idx  on public.tribute_memory_comments(memory_id);
create index if not exists mem_comments_tribute_idx on public.tribute_memory_comments(tribute_id, status);

alter table public.tribute_memory_comments enable row level security;

-- public reads APPROVED words on public pages; anyone may submit (lands pending);
-- the family manages all of it. Mirrors tribute_memories' policies exactly.
drop policy if exists mem_comments_public_read on public.tribute_memory_comments;
create policy mem_comments_public_read on public.tribute_memory_comments for select
  using (status = 'approved' and deleted_at is null and public.tribute_is_public(tribute_id));
drop policy if exists mem_comments_public_insert on public.tribute_memory_comments;
create policy mem_comments_public_insert on public.tribute_memory_comments for insert
  with check (public.tribute_is_public(tribute_id));
drop policy if exists mem_comments_owner_all on public.tribute_memory_comments;
create policy mem_comments_owner_all on public.tribute_memory_comments for all
  using (public.owns_tribute(tribute_id)) with check (public.owns_tribute(tribute_id));

-- PostgREST picks up the new table without a restart.
notify pgrst, 'reload schema';
