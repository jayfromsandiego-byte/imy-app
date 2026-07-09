-- 0015 · the obituary — the formal notice, kept in their fullness.
-- Written in the letter or the study; rendered as its own quiet sheet on the
-- page, between who they really were and the memories wall.

alter table public.tributes
  add column if not exists obituary text;

notify pgrst, 'reload schema';
