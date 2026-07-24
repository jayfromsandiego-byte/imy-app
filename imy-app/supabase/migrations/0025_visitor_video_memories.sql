-- 0025 · a visitor may leave one video with a memory.
-- It waits for family moderation like every word, photograph, and voice.
-- Free pages keep approved visitor video at rest; Plus may show it.

alter table public.tribute_memories
  add column if not exists video_url text
    check (video_url is null or video_url ~ '^https://');

notify pgrst, 'reload schema';
