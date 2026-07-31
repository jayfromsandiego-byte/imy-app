-- 0030 · Every posted memory shows the face of its writer (July 30): a visitor
-- who introduces themselves once keeps their photo across memories. Two pieces:
--
--   memory_authors — one row per person, keyed on lower(email) (the email is
--   the persistence key and is never displayed publicly). Holds their name,
--   relation, and avatar so a returning visitor's details come home with them.
--
--   tribute_memories.avatar_url — a denormalized copy stamped at post time, so
--   a card renders its writer's face without a join, and moderation is
--   unchanged: the avatar rides the memory through the family's queue.
--
-- Additive and idempotent. Writes go through the server (service_role); RLS is
-- enabled with no public policies, so the anon key can never read an email off
-- this table.
create table if not exists public.memory_authors (
  email text primary key check (email = lower(email)),
  name text,
  relation text,
  avatar_url text check (avatar_url is null or avatar_url ~ '^https://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.memory_authors enable row level security;

alter table public.tribute_memories
  add column if not exists avatar_url text
    check (avatar_url is null or avatar_url ~ '^https://');

notify pgrst, 'reload schema';
