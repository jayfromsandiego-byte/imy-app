-- I Miss You Memorial — initial schema v1 (accounts + tributes)
create extension if not exists "pgcrypto";

-- Accounts / owners
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  full_name text,
  role text not null default 'owner',            -- owner | staff
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tributes (the memorial pages)
create table if not exists public.tributes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  owner_id uuid references public.profiles(id) on delete set null,
  claim_token text unique,                       -- guest-created, claimed later
  loved_one_name text not null,
  aka text,
  born_on date,
  died_on date,
  place text,
  headline text,                                 -- kicker
  portrait_quote text,
  story text,
  message_from_them text,
  theme text not null default 'the-vigil',
  motif text,                                    -- selected background motif
  tier text not null default 'free',             -- free | plus | heirloom
  status text not null default 'draft',          -- draft | published
  visibility text not null default 'public',     -- public | unlisted | private
  candle_count integer not null default 0,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz                         -- soft delete (erasure design)
);

create index if not exists tributes_owner_idx  on public.tributes(owner_id);
create index if not exists tributes_status_idx on public.tributes(status) where deleted_at is null;

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_tributes_updated on public.tributes;
create trigger trg_tributes_updated before update on public.tributes
  for each row execute function public.set_updated_at();

-- Row Level Security (service_role bypasses; anon/auth scoped below)
alter table public.profiles enable row level security;
alter table public.tributes enable row level security;

-- Anyone may read a published, public, non-deleted tribute (powers the subdomains)
drop policy if exists tributes_public_read on public.tributes;
create policy tributes_public_read on public.tributes
  for select using (status = 'published' and visibility = 'public' and deleted_at is null);
-- Owner- and auth-scoped policies are added when Auth is wired. profiles stays service-role-only for now.
