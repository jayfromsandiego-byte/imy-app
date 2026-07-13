-- 0019_year_letter.sql — the Year Letter (Plus keepsake · July 12, 2026)
-- Once a year, on a day the family chooses, one quiet email: what the year held.
-- year_letter_md is the chosen month-day (MM-DD); null means their birthday
-- (born_on), falling back to the day the page began. year_letter_last_year
-- keeps the promise honest: never twice in a year.
alter table public.tributes add column if not exists year_letter_md text;
alter table public.tributes add column if not exists year_letter_last_year int;

notify pgrst, 'reload schema';
