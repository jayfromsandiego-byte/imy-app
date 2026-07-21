-- 0022 · the film promise must be observable and idempotent.
-- A paid checkout queues one full weave, the worker leaves a heartbeat, and
-- operator-visible fulfillment state replaces silent webhook failure.

alter table public.film_jobs
  drop constraint if exists film_jobs_status_check;
alter table public.film_jobs
  add constraint film_jobs_status_check
  check (status in ('queued','rendering','ready','approved','failed','superseded','waiting_for_photos'));

alter table public.film_jobs
  add column if not exists notification_status text
    check (notification_status is null or notification_status in ('sent','failed','not_configured')),
  add column if not exists notified_at timestamptz;

alter table public.orders
  add column if not exists fulfillment_status text not null default 'pending'
    check (fulfillment_status in ('pending','processing','waiting_on_family','ready','needs_attention','not_applicable')),
  add column if not exists fulfillment_error text,
  add column if not exists fulfilled_at timestamptz;

create index if not exists orders_fulfillment_attention_idx
  on public.orders(fulfillment_status, created_at desc);

-- If a race or an older replay left more than one full render active, preserve
-- the oldest and let the others rest before installing the uniqueness guard.
with ranked as (
  select id,
         row_number() over (partition by tribute_id order by created_at, id) as rn
    from public.film_jobs
   where deleted_at is null
     and status in ('queued','rendering')
     and variant = 'full'
)
update public.film_jobs j
   set status = 'superseded', error = coalesce(j.error, 'duplicate full weave rested by 0022')
  from ranked r
 where j.id = r.id and r.rn > 1;

create unique index if not exists film_jobs_one_active_full_idx
  on public.film_jobs(tribute_id)
  where deleted_at is null and status in ('queued','rendering') and variant = 'full';

create table if not exists public.film_worker_heartbeats (
  worker_id text primary key,
  state text not null check (state in ('starting','idle','rendering','queued','failed','error')),
  current_job_id uuid references public.film_jobs(id) on delete set null,
  detail text,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
alter table public.film_worker_heartbeats enable row level security;

create table if not exists public.ops_monitor_state (
  monitor_key text primary key,
  fingerprint text,
  last_alerted_at timestamptz,
  last_ok_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.ops_monitor_state enable row level security;

-- One atomic promise for Stripe and Family Unlock. Replays return the existing
-- full job. Concurrent calls are held by the partial unique index.
create or replace function public.ensure_full_film_for_paid(p_tribute_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_id uuid;
  created_id uuid;
begin
  update public.film_jobs
     set status = 'superseded'
   where tribute_id = p_tribute_id
     and deleted_at is null
     and status = 'queued'
     and variant in ('auto','teaser');

  select id into existing_id
    from public.film_jobs
   where tribute_id = p_tribute_id
     and deleted_at is null
     and (variant = 'full' or rendered_variant = 'full')
     and status in ('queued','rendering','ready','approved','waiting_for_photos')
   order by case status
              when 'approved' then 1
              when 'ready' then 2
              when 'rendering' then 3
              when 'queued' then 4
              else 5
            end,
            created_at desc
   limit 1;

  if existing_id is not null then
    return existing_id;
  end if;

  begin
    insert into public.film_jobs (tribute_id, variant, requested_by)
    values (p_tribute_id, 'full', 'stripe')
    returning id into created_id;
    return created_id;
  exception when unique_violation then
    select id into created_id
      from public.film_jobs
     where tribute_id = p_tribute_id
       and deleted_at is null
       and variant = 'full'
       and status in ('queued','rendering')
     order by created_at desc
     limit 1;
    return created_id;
  end;
end;
$$;

revoke execute on function public.ensure_full_film_for_paid(uuid) from public, anon, authenticated;

notify pgrst, 'reload schema';
