-- 0016 · the introduction carries an email, kept private to the family.
-- Never shown publicly; never required to read, only to add.

alter table public.tribute_memories
  add column if not exists author_email text;

alter table public.tribute_memory_comments
  add column if not exists author_email text;

notify pgrst, 'reload schema';
