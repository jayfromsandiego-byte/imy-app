-- 0027 · Item 23: Eleanor's example page tells her life in SIX chapters,
-- the sixth being "The Last Chapter" — her final days. Content comes from the
-- design file's own seeded family copy; nothing here is invented new for her.
-- Idempotent and additive: runs only while eleanor has no chapters yet.
do $$
declare
  e uuid; c1 uuid; c2 uuid; c3 uuid; c4 uuid; c5 uuid; c6 uuid;
begin
  select id into e from public.tributes where slug = 'eleanor' and deleted_at is null;
  if e is null then return; end if;
  if exists (select 1 from public.tribute_chapters where tribute_id = e) then return; end if;

  insert into public.tribute_chapters (tribute_id, title, sort) values (e, 'The girl by the sea', 0) returning id into c1;
  insert into public.tribute_chapters (tribute_id, title, sort) values (e, 'Walter', 1) returning id into c2;
  insert into public.tribute_chapters (tribute_id, title, sort) values (e, 'The teacher', 2) returning id into c3;
  insert into public.tribute_chapters (tribute_id, title, sort) values (e, 'The garden', 3) returning id into c4;
  insert into public.tribute_chapters (tribute_id, title, sort) values (e, 'Grandmother', 4) returning id into c5;
  insert into public.tribute_chapters (tribute_id, title, sort) values (e, 'The Last Chapter', 5) returning id into c6;

  -- place the moments already seeded in 0003 into their chapters
  update public.tribute_timeline set chapter_id = c1 where tribute_id = e and year = '1948' and chapter_id is null;
  update public.tribute_timeline set chapter_id = c3 where tribute_id = e and year = '1971' and chapter_id is null;
  update public.tribute_timeline set chapter_id = c4 where tribute_id = e and year = '1996' and chapter_id is null;

  -- every chapter holds at least one moment, in the family's existing words
  insert into public.tribute_timeline (tribute_id, year, title, body, sort, chapter_id) values
    (e, '1966', 'Married Walter', 'Married the spring after they met. Never stopped dancing.', 3, c2),
    (e, '1998', 'Sofia arrives', 'Butterscotch appears in every pocket.', 4, c5),
    (e, '2024', 'Her last spring', 'Slower walks, the same garden, every rose greeted by name.', 5, c6),
    (e, '2024', 'Held by all of us', 'With the smell of roses. The street still leaves its porch lights on.', 6, c6);
end $$;

notify pgrst, 'reload schema';
