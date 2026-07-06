-- 0006_launch_features.sql · launch night (July 5, 2026)
-- Adds: Family Unlock sponsor badge · truthful flower counter (wreath ritual)
--       · referral codes (20% off Plus monthly, auto-applied at checkout)
--
-- Nothing here ever takes a tribute down. The sponsor badge is written only by
-- the Stripe webhook (service_role). Flowers follow the exact pattern the candle
-- counter proved in 0005: one atomic UPDATE, callable only by the server.

-- ── Family Unlock sponsor badge ────────────────────────────────────────────────
alter table public.tributes add column if not exists sponsor_name       text;
alter table public.tributes add column if not exists sponsor_photo_url  text;
alter table public.tributes add column if not exists sponsor_message    text;

-- ── The wreath ritual · lay a flower ──────────────────────────────────────────
alter table public.tributes add column if not exists flower_count integer not null default 0;

create or replace function public.lay_flower(p_slug text)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.tributes
     set flower_count = coalesce(flower_count, 0) + 1
   where slug = p_slug
     and status = 'published'
     and deleted_at is null
  returning flower_count;
$$;

revoke all on function public.lay_flower(text) from public;
revoke all on function public.lay_flower(text) from anon;
revoke all on function public.lay_flower(text) from authenticated;
grant execute on function public.lay_flower(text) to service_role;

-- ── Referrals · invite = 20% off Plus monthly ─────────────────────────────────
create table if not exists public.referrals (
  code                      text primary key,
  owner_id                  uuid references auth.users(id) on delete cascade,
  owner_email               text,
  uses                      integer not null default 0,
  stripe_promotion_code_id  text,
  created_at                timestamptz not null default now()
);

alter table public.referrals enable row level security;

drop policy if exists referrals_owner_read on public.referrals;
create policy referrals_owner_read on public.referrals
  for select using (auth.uid() = owner_id);
-- Writes go through the server (service_role bypasses RLS).

create index if not exists referrals_owner_idx on public.referrals(owner_id);

-- PostgREST picks up the new function/table without a restart.
notify pgrst, 'reload schema';
