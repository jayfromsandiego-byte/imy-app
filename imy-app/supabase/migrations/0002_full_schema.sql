-- I Miss You Memorial — schema v2: auth link, tribute children, monetization, RLS
create extension if not exists "pgcrypto";

-- 1) Link profiles to Supabase Auth (profiles.id = auth.users.id); profiles is empty so this is safe
alter table public.profiles alter column id drop default;
do $$ begin
  if not exists (select 1 from information_schema.table_constraints
    where constraint_name = 'profiles_id_fkey' and table_name = 'profiles') then
    alter table public.profiles
      add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade;
  end if;
end $$;

-- auto-create a profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) Tribute children
create table if not exists public.tribute_photos (
  id uuid primary key default gen_random_uuid(),
  tribute_id uuid not null references public.tributes(id) on delete cascade,
  storage_path text, url text, caption text, sort int not null default 0,
  created_at timestamptz not null default now(), deleted_at timestamptz);
create table if not exists public.tribute_videos (
  id uuid primary key default gen_random_uuid(),
  tribute_id uuid not null references public.tributes(id) on delete cascade,
  storage_path text, url text, caption text, duration_seconds int, sort int not null default 0,
  created_at timestamptz not null default now(), deleted_at timestamptz);
create table if not exists public.tribute_audio (
  id uuid primary key default gen_random_uuid(),
  tribute_id uuid not null references public.tributes(id) on delete cascade,
  storage_path text, url text, caption text, kind text default 'memory',
  created_at timestamptz not null default now(), deleted_at timestamptz);
create table if not exists public.tribute_memories (
  id uuid primary key default gen_random_uuid(),
  tribute_id uuid not null references public.tributes(id) on delete cascade,
  author_name text not null, relation text, body text not null, photo_url text,
  status text not null default 'pending',
  hearts int not null default 0,
  created_at timestamptz not null default now(), deleted_at timestamptz);
create table if not exists public.tribute_timeline (
  id uuid primary key default gen_random_uuid(),
  tribute_id uuid not null references public.tributes(id) on delete cascade,
  year text, title text, body text, sort int not null default 0);
create table if not exists public.tribute_detail_cards (
  id uuid primary key default gen_random_uuid(),
  tribute_id uuid not null references public.tributes(id) on delete cascade,
  label text, value text, sort int not null default 0);
create table if not exists public.tribute_loved_things (
  id uuid primary key default gen_random_uuid(),
  tribute_id uuid not null references public.tributes(id) on delete cascade,
  label text not null, motif_key text, note text, sort int not null default 0);
create table if not exists public.tribute_candles (
  id uuid primary key default gen_random_uuid(),
  tribute_id uuid not null references public.tributes(id) on delete cascade,
  ip_hash text, created_at timestamptz not null default now());
create table if not exists public.tribute_service (
  tribute_id uuid primary key references public.tributes(id) on delete cascade,
  starts_at timestamptz, venue text, address text, livestream_url text,
  charity_name text, charity_url text, notes text);

create index if not exists photos_tribute_idx   on public.tribute_photos(tribute_id);
create index if not exists videos_tribute_idx   on public.tribute_videos(tribute_id);
create index if not exists audio_tribute_idx    on public.tribute_audio(tribute_id);
create index if not exists memories_tribute_idx on public.tribute_memories(tribute_id);
create index if not exists timeline_tribute_idx on public.tribute_timeline(tribute_id);
create index if not exists details_tribute_idx  on public.tribute_detail_cards(tribute_id);
create index if not exists loved_tribute_idx    on public.tribute_loved_things(tribute_id);
create index if not exists candles_tribute_idx  on public.tribute_candles(tribute_id);

-- 3) Monetization
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  tribute_id uuid references public.tributes(id) on delete set null,
  kind text not null,
  amount_cents int, currency text default 'usd',
  stripe_session_id text, stripe_payment_intent text,
  status text not null default 'pending',
  created_at timestamptz not null default now());
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  tribute_id uuid references public.tributes(id) on delete set null,
  kind text not null,
  stripe_subscription_id text unique, status text, current_period_end timestamptz,
  created_at timestamptz not null default now());
create table if not exists public.book_orders (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  tribute_id uuid references public.tributes(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  pod_provider text, pod_order_id text, status text default 'created',
  page_count int, retail_cents int, shipping jsonb,
  created_at timestamptz not null default now());
create index if not exists orders_profile_idx on public.orders(profile_id);
create index if not exists orders_tribute_idx on public.orders(tribute_id);

-- 4) RLS helpers (security definer so they bypass RLS while checking)
create or replace function public.owns_tribute(t uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.tributes x where x.id = t and x.owner_id = auth.uid());
$$;
create or replace function public.tribute_is_public(t uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.tributes x
    where x.id = t and x.status = 'published' and x.visibility = 'public' and x.deleted_at is null);
$$;

-- tributes: owner can manage own (public read policy already exists from v1)
drop policy if exists tributes_owner_all on public.tributes;
create policy tributes_owner_all on public.tributes for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- enable RLS on all new tables
alter table public.tribute_photos       enable row level security;
alter table public.tribute_videos       enable row level security;
alter table public.tribute_audio        enable row level security;
alter table public.tribute_memories     enable row level security;
alter table public.tribute_timeline     enable row level security;
alter table public.tribute_detail_cards enable row level security;
alter table public.tribute_loved_things enable row level security;
alter table public.tribute_candles      enable row level security;
alter table public.tribute_service      enable row level security;
alter table public.orders               enable row level security;
alter table public.subscriptions        enable row level security;
alter table public.book_orders          enable row level security;

-- public-read + owner-all for the display children
do $$
declare tbl text;
begin
  foreach tbl in array array['tribute_photos','tribute_videos','tribute_audio','tribute_timeline','tribute_detail_cards','tribute_loved_things','tribute_service']
  loop
    execute format('drop policy if exists %I_public_read on public.%I', tbl, tbl);
    execute format('create policy %I_public_read on public.%I for select using (public.tribute_is_public(tribute_id))', tbl, tbl);
    execute format('drop policy if exists %I_owner_all on public.%I', tbl, tbl);
    execute format('create policy %I_owner_all on public.%I for all using (public.owns_tribute(tribute_id)) with check (public.owns_tribute(tribute_id))', tbl, tbl);
  end loop;
end $$;

-- memories: public reads APPROVED; anyone may submit (lands pending); owner manages all
drop policy if exists memories_public_read on public.tribute_memories;
create policy memories_public_read on public.tribute_memories for select
  using (status = 'approved' and deleted_at is null and public.tribute_is_public(tribute_id));
drop policy if exists memories_public_insert on public.tribute_memories;
create policy memories_public_insert on public.tribute_memories for insert
  with check (public.tribute_is_public(tribute_id));
drop policy if exists memories_owner_all on public.tribute_memories;
create policy memories_owner_all on public.tribute_memories for all
  using (public.owns_tribute(tribute_id)) with check (public.owns_tribute(tribute_id));

-- candles: public read + insert
drop policy if exists candles_public_read on public.tribute_candles;
create policy candles_public_read on public.tribute_candles for select using (public.tribute_is_public(tribute_id));
drop policy if exists candles_public_insert on public.tribute_candles;
create policy candles_public_insert on public.tribute_candles for insert with check (public.tribute_is_public(tribute_id));

-- orders / subscriptions / book_orders: owner reads own; writes happen via service_role
drop policy if exists orders_owner_read on public.orders;
create policy orders_owner_read on public.orders for select using (profile_id = auth.uid());
drop policy if exists subs_owner_read on public.subscriptions;
create policy subs_owner_read on public.subscriptions for select using (profile_id = auth.uid());
drop policy if exists book_owner_read on public.book_orders;
create policy book_owner_read on public.book_orders for select using (profile_id = auth.uid());
