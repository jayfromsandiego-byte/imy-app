-- 0032 · RLS safety net (Gate 1, Aug 29): the database keeps the promises the
-- app keeps.
--
-- Three pieces, all additive. None of them touches the app's own reads or
-- writes — server code runs as service_role, which bypasses RLS and column
-- grants entirely. The public anon key (which ships in every browser) is the
-- only audience these rules speak to, and no app path reads these tables with
-- it today: tribute pages use the anon key only for Realtime presence, and
-- the browser client only for auth.
--
--   A) Resting content rests everywhere. The display children's public-read
--      policies now exclude soft-deleted rows (deleted_at is null), matching
--      what the page itself shows. The July 12 pattern — a soft-deleted
--      photograph still visible — can no longer be reproduced through the
--      public REST API either.
--
--   B) A visitor's words always arrive as 'pending'. tribute_memory_comments
--      receives the same insert rule tribute_memories received in 0025: a
--      direct PostgREST insert with the public anon key cannot self-approve
--      a comment onto a live page. The family's own authority
--      (mem_comments_owner_all) and the server's (service_role) are unchanged.
--
--   C) Private columns leave the public key's reach. Read policies are
--      row-level; they cannot hide a column of a readable row. Three columns
--      must never travel with a public row:
--
--         tributes.claim_token                    — claims a guest-created page
--         tributes.owner_email                    — the family's email
--         tribute_memories.author_email           — a writer's email (0016)
--         tribute_memory_comments.author_email    — a writer's email (0016)
--
--      anon and authenticated lose table-wide SELECT on those three tables and
--      receive an explicit column list instead: every current column except
--      the private ones. (Column-level REVOKE cannot subtract from a
--      table-level grant in Postgres — the grant must be rebuilt, which is
--      what the DO block below does, resilient to schema drift.)
--
-- NOTE for future migrations: after (C), a newly added column on tributes,
-- tribute_memories, or tribute_memory_comments is NOT readable with the public
-- key until a migration grants it. That is the right default for a memorial —
-- grant deliberately when a new column is truly meant for the public page:
--   grant select (new_column) on public.<table> to anon, authenticated;
--
-- Idempotent: safe to run repeatedly.

-- ── A · public reads exclude resting rows ────────────────────────────────────
-- Children that carry deleted_at: photos/videos/audio (0002),
-- timeline/chapters (0018). detail_cards, loved_things, and service have no
-- deleted_at column; their policies stand as they are.
do $$
declare tbl text;
begin
  foreach tbl in array array[
    'tribute_photos','tribute_videos','tribute_audio','tribute_timeline','tribute_chapters'
  ]
  loop
    execute format('drop policy if exists %I_public_read on public.%I', tbl, tbl);
    execute format(
      'create policy %I_public_read on public.%I for select
         using (public.tribute_is_public(tribute_id) and deleted_at is null)',
      tbl, tbl
    );
  end loop;
end $$;

-- tribute_memories' public read already requires status = 'approved' and
-- deleted_at is null (0002); tribute_memory_comments' likewise (0010).

-- ── B · a visitor's comment can only arrive pending ─────────────────────────
drop policy if exists mem_comments_public_insert on public.tribute_memory_comments;
create policy mem_comments_public_insert on public.tribute_memory_comments for insert
  with check (public.tribute_is_public(tribute_id) and status = 'pending');

-- ── C · private columns leave the public key's reach ────────────────────────
do $$
declare
  t record;
  cols text;
begin
  for t in
    select * from (values
      ('tributes',                array['claim_token','owner_email']),
      ('tribute_memories',        array['author_email']),
      ('tribute_memory_comments', array['author_email'])
    ) as v(tbl, hidden)
  loop
    select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
      into cols
      from information_schema.columns
     where table_schema = 'public'
       and table_name = t.tbl
       and column_name <> all (t.hidden);
    if cols is null then
      raise exception 'expected table public.% not found', t.tbl;
    end if;
    execute format('revoke select on public.%I from anon, authenticated', t.tbl);
    execute format('grant select (%s) on public.%I to anon, authenticated', cols, t.tbl);
  end loop;
end $$;

-- PostgREST picks up the new rules without a restart.
notify pgrst, 'reload schema';
