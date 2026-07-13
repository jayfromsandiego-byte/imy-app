-- 0018 · the ledger never lies twice, and structure rests like every word.
-- A replayed Stripe webhook must not double-book a family's gift: the session
-- id becomes unique (Postgres allows many NULLs, so legacy rows are safe).
-- And the timeline's moments and chapters learn to rest instead of vanishing:
-- deleted_at, the same quiet mark every other kind of content already carries.

alter table public.orders
  add constraint orders_stripe_session_key unique (stripe_session_id);

alter table public.tribute_timeline
  add column if not exists deleted_at timestamptz;
alter table public.tribute_chapters
  add column if not exists deleted_at timestamptz;

notify pgrst, 'reload schema';
