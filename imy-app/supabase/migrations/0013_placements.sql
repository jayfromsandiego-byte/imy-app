-- 0013 · every photograph knows its place.
-- One placements object per tribute maps each photo slot the family controls:
--   quote     · the photograph behind their words (one photo id)
--   board     · the bulletin board, owner-placed keepsakes (ordered photo ids)
--   chapters  · per-moment photos, keyed by timeline row id → [photo ids];
--               the special key _group carries the pre-placements look
-- The backfill freezes exactly what each live page shows today, so nothing
-- shifts under a family until they choose otherwise. No slot auto-fills again.

alter table public.tributes
  add column if not exists placements jsonb;

update public.tributes t
   set placements = jsonb_strip_nulls(jsonb_build_object(
     'quote', coalesce(
       (select p.id::text from public.tribute_photos p
         where p.tribute_id = t.id order by p.sort nulls last, p.id offset 1 limit 1),
       (select p.id::text from public.tribute_photos p
         where p.tribute_id = t.id order by p.sort nulls last, p.id limit 1)),
     'board', coalesce(
       (select jsonb_agg(x.id::text order by x.sort nulls last, x.id)
          from (select p.id, p.sort from public.tribute_photos p
                 where p.tribute_id = t.id order by p.sort nulls last, p.id limit 8) x),
       '[]'::jsonb),
     'chapters', coalesce(
       (select jsonb_build_object('_group', jsonb_agg(x.id::text order by x.sort nulls last, x.id))
          from (select p.id, p.sort from public.tribute_photos p
                 where p.tribute_id = t.id order by p.sort nulls last, p.id limit 3) x
         having count(*) > 0),
       '{}'::jsonb)
   ))
 where t.placements is null;

notify pgrst, 'reload schema';
