-- 0033 · Media privacy Gate 2: stored R2 media URLs move behind the door.
--
-- Every media URL stored in the database that points at the R2 public base is
-- rewritten to the same-origin read door (#45): <base>/<key> becomes
-- https://imissyoumemorial.com/media/r2/<key>. Same key, same bytes — the
-- route serves with the app's own credentials, which is what lets public
-- bucket access be switched off in Gate 3 (see ops/media-privacy-plan.md).
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ DO NOT APPLY until Gate 1 is verified:                                   │
-- │   · #45's post-merge checks passed (door serves an existing key with     │
-- │     identical bytes; Range → 206), and                                   │
-- │   · R2_PROXY_READS=1 is live in Vercel with a fresh photo + voice QA'd.  │
-- │ Merging this file is inert — nothing runs until pasted in the SQL editor.│
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- How to run (Supabase SQL editor, whole file at once):
--   1. Fill in `base` below. Leave dry_run := true. Run.
--      The run ALWAYS ends in an error on purpose — the error message IS the
--      dry-run report (per-column counts, nothing changed, all rolled back).
--   2. When the counts look right: set dry_run := false. Run again.
--      Completes normally; the per-column counts arrive as NOTICEs.
--   One flag controls everything; there is no way to half-apply — any error
--   rolls back every rewrite (a DO block is atomic).
--
-- Columns rewritten (every stored media URL in the schema):
--   tribute_photos.url · tribute_videos.url · tribute_audio.url
--   tribute_memories.photo_url / audio_url / video_url / avatar_url
--   tribute_memories.photo_urls (jsonb array of URL strings)
--   tributes.sponsor_photo_url · memory_authors.avatar_url
--   film_jobs.film_url / poster_url
--
-- Rollback: the inverse rewrite — run again with `base` set to
-- 'https://imissyoumemorial.com/media/r2' and `door` edited to the R2 public
-- base + '/'. Nothing is deleted in either direction; only URL prefixes move.

do $$
declare
  -- ── FILL THESE IN ─────────────────────────────────────────────────────────
  base text := '<<FILL-IN: R2 public base URL, https://…, no trailing slash>>';
  dry_run boolean := true;  -- true: report + roll back; false: rewrite.
  -- ──────────────────────────────────────────────────────────────────────────
  door constant text := 'https://imissyoumemorial.com/media/r2/';
  prefix text;
  n bigint;
  total bigint := 0;
  report text := '';
  r record;
begin
  if base like '<<%' or base !~ '^https://[a-z0-9.-]+' then
    raise exception 'Fill in the R2 public base URL before running (got: %)', base;
  end if;
  prefix := rtrim(base, '/') || '/';

  -- ── plain text URL columns ────────────────────────────────────────────────
  for r in
    select * from (values
      ('tributes',         'sponsor_photo_url'),
      ('tribute_photos',   'url'),
      ('tribute_videos',   'url'),
      ('tribute_audio',    'url'),
      ('tribute_memories', 'photo_url'),
      ('tribute_memories', 'audio_url'),
      ('tribute_memories', 'video_url'),
      ('tribute_memories', 'avatar_url'),
      ('memory_authors',   'avatar_url'),
      ('film_jobs',        'film_url'),
      ('film_jobs',        'poster_url')
    ) as v(tbl, col)
  loop
    if dry_run then
      execute format('select count(*) from public.%I where %I like $1', r.tbl, r.col)
        into n using prefix || '%';
    else
      execute format(
        'update public.%I set %I = overlay(%I placing $2 from 1 for $3) where %I like $1',
        r.tbl, r.col, r.col, r.col
      ) using prefix || '%', door, length(prefix);
      get diagnostics n = row_count;
    end if;
    total := total + n;
    report := report || format('%s.%s: %s · ', r.tbl, r.col, n);
    raise notice '%.% → % row(s)', r.tbl, r.col, n;
  end loop;

  -- ── tribute_memories.photo_urls (jsonb array of strings) ─────────────────
  if dry_run then
    select count(*) into n from public.tribute_memories m
     where m.photo_urls is not null
       and exists (select 1 from jsonb_array_elements_text(m.photo_urls) e
                    where e like prefix || '%');
  else
    update public.tribute_memories m
       set photo_urls = (
         select jsonb_agg(
           case when e like prefix || '%'
                then to_jsonb(door || substr(e, length(prefix) + 1))
                else to_jsonb(e) end
           order by ord  -- keep the family's photo order exactly
         )
         from jsonb_array_elements_text(m.photo_urls) with ordinality as t(e, ord)
       )
     where m.photo_urls is not null
       and exists (select 1 from jsonb_array_elements_text(m.photo_urls) e
                    where e like prefix || '%');
    get diagnostics n = row_count;
  end if;
  total := total + n;
  report := report || format('photo_urls: %s', n);
  raise notice 'tribute_memories.photo_urls → % row(s)', n;

  if dry_run then
    -- The error is the point: it prints the report AND rolls everything back.
    raise exception 'DRY RUN — % row(s) would be rewritten. [%] Nothing was changed. Set dry_run := false to apply.',
      total, report;
  end if;
  raise notice '=== REWRITE complete: % row(s) now point at the door', total;
end $$;
