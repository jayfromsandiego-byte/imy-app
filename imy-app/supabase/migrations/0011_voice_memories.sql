-- 0011_voice_memories.sql · July 8, 2026
-- A memory can carry a voice: a voicemail kept, a story told aloud.
--
-- One nullable column; the recording itself lives in upload storage and the
-- memory keeps its address. Voice attaches on Plus pages ("Their voice" is a
-- Plus promise); if a page rests back to free, the recordings rest with it —
-- kept, never deleted, waking again with Plus. Moderation is unchanged: a
-- memory with a voice waits for the family like any other.

alter table public.tribute_memories add column if not exists audio_url text;

-- PostgREST picks up the new column without a restart.
notify pgrst, 'reload schema';
