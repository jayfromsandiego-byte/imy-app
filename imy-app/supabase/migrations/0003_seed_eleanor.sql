-- Seed the Eleanor example as a real, published tribute (idempotent)
insert into public.tributes (slug, loved_one_name, born_on, died_on, place, story, portrait_quote, message_from_them, theme, tier, status, visibility, candle_count)
values ('eleanor', 'Eleanor Margaret Hayes', '1948-03-12', '2024-10-22', 'Half Moon Bay, CA',
  'Eleanor was born by the sea, the eldest of four. She taught third grade for thirty-eight years, kept a garden that drew the whole street to her gate, and was the kind of grandmother who always had butterscotch in her pocket. She believed the small things were the whole of a life.',
  'Find the smallest beautiful thing in the day, and tell someone about it.',
  'Don''t be sad for too long. Put the kettle on, sit in the garden, and notice something lovely. I''ll be in all of it.',
  'the-vigil', 'plus', 'published', 'public', 2850)
on conflict (slug) do update set
  loved_one_name = excluded.loved_one_name, story = excluded.story, tier = excluded.tier,
  status = excluded.status, visibility = excluded.visibility, candle_count = excluded.candle_count;

-- clear + reseed children idempotently
do $$ declare e uuid; begin
  select id into e from public.tributes where slug = 'eleanor';
  delete from public.tribute_detail_cards  where tribute_id = e;
  delete from public.tribute_timeline      where tribute_id = e;
  delete from public.tribute_photos        where tribute_id = e;
  delete from public.tribute_memories      where tribute_id = e;
  delete from public.tribute_loved_things  where tribute_id = e;
  delete from public.tribute_service       where tribute_id = e;
end $$;

insert into public.tribute_detail_cards (tribute_id, label, value, sort)
select t.id, v.label, v.value, v.sort from public.tributes t,
 (values ('She loved most','First light over her garden',0),
         ('Always carried','A handful of seeds, just in case',1),
         ('Known for','Feeding anyone who came to the door',2),
         ('Family','Two children, four grandchildren',3)) as v(label,value,sort)
where t.slug = 'eleanor';

insert into public.tribute_timeline (tribute_id, year, title, body, sort)
select t.id, v.year, v.title, v.body, v.sort from public.tributes t,
 (values ('1948','Born by the sea','The eldest of four, raised on the coast.',0),
         ('1971','Began teaching','Thirty-eight years of third graders who never forgot her.',1),
         ('1996','Planted the garden','The one the whole street still stops to admire.',2)) as v(year,title,body,sort)
where t.slug = 'eleanor';

insert into public.tribute_photos (tribute_id, url, caption, sort)
select t.id, v.url, v.caption, v.sort from public.tributes t,
 (values ('/photos/eleanor.jpg','Eleanor, in her garden',0),
         ('/photos/hands.jpg','',1),
         ('/themes/garden.jpg','',2),
         ('/photos/table.jpg','',3),
         ('/themes/ocean.jpg','',4)) as v(url,caption,sort)
where t.slug = 'eleanor';

insert into public.tribute_loved_things (tribute_id, label, motif_key, sort)
select t.id, v.label, v.motif_key, v.sort from public.tributes t,
 (values ('Her garden at dawn','gardening',0),
         ('Black coffee, no sugar','coffee',1),
         ('Letters, written by hand','knitting',2)) as v(label,motif_key,sort)
where t.slug = 'eleanor';

insert into public.tribute_memories (tribute_id, author_name, relation, body, status)
select t.id, v.author_name, v.relation, v.body, 'approved' from public.tributes t,
 (values ('Daniel','her son','She taught me that the best part of any morning was the quiet before everyone woke. I still get up early, just to feel close to her.'),
         ('Marie','a neighbour','Every child on the street learned to plant something in her garden. She made the world feel a little gentler.')) as v(author_name,relation,body)
where t.slug = 'eleanor';

insert into public.tribute_service (tribute_id, starts_at, venue, address, charity_name)
select t.id, '2026-06-13 11:00:00-07', 'Linden Community Chapel', '142 Seaside Avenue, Half Moon Bay, CA 94019', 'American Cancer Society'
from public.tributes t where t.slug = 'eleanor';
