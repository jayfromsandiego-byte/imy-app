-- 0031 · The open sky greets first (July 30): the hero's default scene becomes
-- 'clouds' (Open sky). The scenes launched hours ago with 0028's campfire
-- default, so any row still resting on 'campfire' is the untouched launch
-- default, not a family's choice — those rows move to the sky together, and
-- the owner's picker keeps working exactly as before for everyone.
-- Additive and idempotent.
alter table public.tributes alter column hero_video_slot set default 'clouds';

update public.tributes set hero_video_slot = 'clouds' where hero_video_slot = 'campfire';

notify pgrst, 'reload schema';
