-- 0025 · a visitor may leave one video with a memory.
-- It waits for family moderation like every word, photograph, and voice.
-- Free pages keep approved visitor video at rest; Plus may show it.

alter table public.tribute_memories
  add column if not exists video_url text
    check (video_url is null or video_url ~ '^https://');

-- Make "waits for family moderation" a rule the database keeps, not only the app.
-- A visitor's insert (anon/authenticated) may only ever arrive as 'pending', so a
-- direct PostgREST call with the public anon key cannot self-approve a memory or
-- its video onto a live page. The family (owner) keeps its own full authority
-- through memories_owner_all, and server code runs as service_role (bypasses RLS),
-- so the app's own inserts and approvals are unchanged. Additive hardening.
drop policy if exists memories_public_insert on public.tribute_memories;
create policy memories_public_insert on public.tribute_memories for insert
  with check (public.tribute_is_public(tribute_id) and status = 'pending');

notify pgrst, 'reload schema';
