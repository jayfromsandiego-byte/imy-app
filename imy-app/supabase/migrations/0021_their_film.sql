-- 0021_their_film.sql · July 14, 2026
-- Their film — the woven memorial film. A render queue the worker claims from,
-- and a `kind` on tribute_videos so an approved film can join the tape shelf
-- without ever becoming the Stone's living portrait or a Living picture.
-- Additive only. Nothing here is ever hard-deleted; films rest like everything else.

-- The shelf learns what kind of tape it holds: 'tape' (family upload) · 'film' (woven).
alter table public.tribute_videos
  add column if not exists kind text not null default 'tape'
  check (kind in ('tape','film'));

create table if not exists public.film_jobs (
  id uuid primary key default gen_random_uuid(),
  tribute_id uuid not null references public.tributes(id),
  variant text not null default 'auto' check (variant in ('auto','full','teaser')),
  music text not null default 'gymnopedie-1',
  status text not null default 'queued'
    check (status in ('queued','rendering','ready','approved','failed','superseded')),
  attempts int not null default 0,
  error text,
  film_url text,
  poster_url text,
  duration_seconds numeric,
  rendered_variant text,                 -- what 'auto' resolved to at render time
  video_id uuid,                         -- the tribute_videos row, once approved
  approve_token text not null default md5(gen_random_uuid()::text || clock_timestamp()::text),
  requested_by text not null default 'keeper',   -- intake · keeper · ops
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  approved_at timestamptz,
  deleted_at timestamptz
);

create index if not exists film_jobs_status_idx  on public.film_jobs(status, created_at);
create index if not exists film_jobs_tribute_idx on public.film_jobs(tribute_id, created_at desc);

-- Service-role only: RLS on, no public policies, no anon RPC.
alter table public.film_jobs enable row level security;

-- The worker's claim: the oldest queued job, atomically moved to rendering.
create or replace function public.claim_film_job()
returns setof public.film_jobs
language sql security definer set search_path = public as $$
  update film_jobs
     set status = 'rendering', started_at = now(), attempts = attempts + 1
   where id = (
     select id from film_jobs
      where status = 'queued' and deleted_at is null
      order by created_at
      limit 1
      for update skip locked
   )
  returning *;
$$;

-- Second chances: a render stuck past 45 minutes returns to the queue;
-- the third stall rests as failed, quietly.
create or replace function public.requeue_stale_film_jobs()
returns int
language sql security definer set search_path = public as $$
  with stale as (
    update film_jobs
       set status = case when attempts >= 3 then 'failed' else 'queued' end,
           error  = case when attempts >= 3
                         then trim(coalesce(error, '') || ' · rested after three tries')
                         else error end
     where status = 'rendering' and deleted_at is null
       and started_at < now() - interval '45 minutes'
    returning 1
  ) select coalesce(count(*), 0)::int from stale;
$$;

revoke execute on function public.claim_film_job() from public, anon, authenticated;
revoke execute on function public.requeue_stale_film_jobs() from public, anon, authenticated;

notify pgrst, 'reload schema';
