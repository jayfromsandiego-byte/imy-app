-- 0029 · Photos ride with memories (July 30): anyone leaving a memory may
-- attach up to four photographs. They travel on the memory's own row and wait
-- for the family's yes exactly like the words do — same status, same queue.
-- photo_url stays as the first photograph (board pins, the archive, and older
-- reads keep working); photo_urls holds the full ordered set as a JSON array.
-- Additive and idempotent.
alter table public.tribute_memories add column if not exists photo_urls jsonb;

notify pgrst, 'reload schema';
