-- 0034 · her family tree. The unified tribute's tree room reads a real table
-- now: one row per family member, keyed by a slug-safe member_key the family's
-- links (spouse_key, parent_keys, chosen_of_key) refer to. years_line and
-- rel_label are the family's own words ("1948–2024", "b. 1972", "her son"),
-- never derived dates — the page shows what the family wrote, nothing more.
-- Additive only; no existing table or policy changes. Pages without rows keep
-- resting exactly as before (the template hides the room).

create table if not exists public.tribute_family_members (
  id uuid primary key default gen_random_uuid(),
  tribute_id uuid not null references public.tributes(id) on delete cascade,
  member_key text not null,
  name text not null,
  years_line text,
  initials text,
  avatar_url text,
  spouse_key text,
  parent_keys text[],
  chosen_of_key text,
  rel_label text,
  is_subject boolean not null default false,
  note text,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tribute_id, member_key)
);
create index if not exists family_members_tribute_idx on public.tribute_family_members(tribute_id);

-- same shape as every display child since 0032: the world may read what is
-- public and not resting; the family may do anything with what is theirs.
alter table public.tribute_family_members enable row level security;
drop policy if exists family_members_public_read on public.tribute_family_members;
create policy family_members_public_read on public.tribute_family_members
  for select using (public.tribute_is_public(tribute_id) and deleted_at is null);
drop policy if exists family_members_owner_all on public.tribute_family_members;
create policy family_members_owner_all on public.tribute_family_members
  for all using (public.owns_tribute(tribute_id)) with check (public.owns_tribute(tribute_id));

notify pgrst, 'reload schema';
