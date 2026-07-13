-- 0020: search-engine discoverability is an explicit family choice.
-- Tribute pages stay reachable by link (public/unlisted/private as before);
-- only opted-in pages join sitemap.xml and the search index. Additive only.
-- Eleanor, the seeded public example, is opted in — she is the one tribute
-- meant to be found.
alter table public.tributes
  add column if not exists discoverable boolean not null default false;

comment on column public.tributes.discoverable is
  'Family opt-in: include this tribute in sitemap.xml and allow search-engine indexing. Default false — found by link, not by search.';

update public.tributes set discoverable = true where slug = 'eleanor';

notify pgrst, 'reload schema';
