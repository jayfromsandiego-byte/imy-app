-- 0008_pronouns.sql · July 7, 2026
-- The page's words for the person: he · she · they. Null renders as they/them.
-- Taught to us by the first two families, whose fathers were called "her".
alter table public.tributes add column if not exists pronouns text
  check (pronouns in ('he','she','they') or pronouns is null);
