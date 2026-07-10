-- 0017 · a life in chapters. The family writes the chapters; every one renders.
-- tribute_chapters holds the titles in the family's order; each timeline moment
-- may belong to one chapter (chapter_id null = not yet placed, still shown).
-- Additive only. Removing a chapter quietly releases its moments (set null);
-- the moments themselves are never touched by that release.

create table if not exists public.tribute_chapters (
  id uuid primary key default gen_random_uuid(),
  tribute_id uuid not null references public.tributes(id) on delete cascade,
  title text not null,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists chapters_tribute_idx on public.tribute_chapters(tribute_id);

alter table public.tribute_timeline
  add column if not exists chapter_id uuid references public.tribute_chapters(id) on delete set null;

-- same shape as every display child: the world may read what is public,
-- the family may do anything with what is theirs.
alter table public.tribute_chapters enable row level security;
drop policy if exists tribute_chapters_public_read on public.tribute_chapters;
create policy tribute_chapters_public_read on public.tribute_chapters
  for select using (public.tribute_is_public(tribute_id));
drop policy if exists tribute_chapters_owner_all on public.tribute_chapters;
create policy tribute_chapters_owner_all on public.tribute_chapters
  for all using (public.owns_tribute(tribute_id)) with check (public.owns_tribute(tribute_id));

notify pgrst, 'reload schema';
