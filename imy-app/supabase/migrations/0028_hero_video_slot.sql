-- 0028 · The hero wears a scene (July 29): every tribute remembers which
-- looping scenic background plays behind the wreath. The ten slot ids live in
-- lib/heroBackgrounds.ts; the default is the campfire at dusk.
-- Additive and idempotent.
alter table public.tributes add column if not exists hero_video_slot text not null default 'campfire';

notify pgrst, 'reload schema';
