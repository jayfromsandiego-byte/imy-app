-- 0032 · Shared keeping (August 14, 2026)
-- A tribute can be tended by more than one pair of hands, and one day be
-- passed on whole. Keepers hold a key: they add, welcome, and care for the
-- page alongside the owner. Ownership itself still lives on tributes
-- (owner_email / owner_id), so passing a page on is one quiet update there.
-- Additive only, like everything here. Nothing is ever hard-deleted.

create table if not exists tribute_keepers (
  id uuid primary key default gen_random_uuid(),
  tribute_id uuid not null references tributes(id),
  email text not null,
  status text not null default 'invited', -- invited | joined
  invited_by text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- One live key per pair of hands; a returned key can be revived, not duplicated.
create unique index if not exists tribute_keepers_live_unique
  on tribute_keepers (tribute_id, lower(email)) where deleted_at is null;

create index if not exists tribute_keepers_email_idx on tribute_keepers (lower(email));
create index if not exists tribute_keepers_tribute_idx on tribute_keepers (tribute_id);

notify pgrst, 'reload schema';
