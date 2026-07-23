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
    update public.film_jobs
       set status = 'queued', error = null, started_at = null, finished_at = null
     where id = existing_id and status = 'waiting_for_photos';
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
grant execute on function public.ensure_full_film_for_paid(uuid) to service_role;

-- One public film row per tribute. If older work left duplicates, preserve the
-- newest and let the rest rest before installing the guard.
with ranked as (
  select id,
         row_number() over (partition by tribute_id order by created_at desc, id desc) as rn
    from public.tribute_videos
   where deleted_at is null and kind = 'film'
)
update public.tribute_videos v
   set deleted_at = now()
  from ranked r
 where v.id = r.id and r.rn > 1;

create unique index if not exists tribute_videos_one_live_film_idx
  on public.tribute_videos(tribute_id)
  where deleted_at is null and kind = 'film';

-- Paid films land on the page in one transaction. If the new shelf row cannot
-- be created, the previous film remains untouched. Retries return the same row.
create or replace function public.place_paid_film(p_job_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  j public.film_jobs%rowtype;
  t public.tributes%rowtype;
  existing_video uuid;
  placed_video uuid;
  pos text;
begin
  select * into j from public.film_jobs where id = p_job_id and deleted_at is null for update;
  if j.id is null then raise exception 'film-job-not-found'; end if;

  perform pg_advisory_xact_lock(hashtextextended(j.tribute_id::text, 0));
  select * into t from public.tributes where id = j.tribute_id and deleted_at is null;
  if t.id is null then raise exception 'tribute-not-found'; end if;
  if t.tier not in ('plus','heirloom') then raise exception 'paid-tier-required'; end if;
  if coalesce(j.rendered_variant, j.variant) <> 'full' then raise exception 'full-film-required'; end if;
  if j.status = 'approved' and j.video_id is not null then return j.video_id; end if;
  if j.status <> 'ready' or j.film_url is null then raise exception 'film-not-ready'; end if;

  select id into existing_video
    from public.tribute_videos
   where tribute_id = j.tribute_id and kind = 'film' and deleted_at is null and url = j.film_url
   limit 1;

  if existing_video is null then
    update public.tribute_videos
       set deleted_at = now()
     where tribute_id = j.tribute_id and kind = 'film' and deleted_at is null;
    pos := case t.pronouns when 'he' then 'his' when 'she' then 'her' else 'their' end;
    insert into public.tribute_videos (tribute_id, url, caption, sort, kind)
    values (j.tribute_id, j.film_url, 'The film of ' || pos || ' life', 999, 'film')
    returning id into placed_video;
  else
    placed_video := existing_video;
  end if;

  update public.film_jobs
     set status = 'superseded'
   where tribute_id = j.tribute_id and id <> j.id and status = 'approved' and deleted_at is null;
  update public.film_jobs
     set status = 'approved', approved_at = coalesce(approved_at, now()), video_id = placed_video
   where id = j.id;
  update public.orders
     set fulfillment_status = 'ready', fulfillment_error = null, fulfilled_at = now()
   where tribute_id = j.tribute_id and status = 'paid'
     and fulfillment_status in ('processing','waiting_on_family','needs_attention');
  return placed_video;
end;
$$;

revoke execute on function public.place_paid_film(uuid) from public, anon, authenticated;
grant execute on function public.place_paid_film(uuid) to service_role;

-- Any path that adds the third photograph wakes a paid film that was waiting.
-- This belongs in the database so dashboard, intake, and future upload routes
-- cannot drift apart.
create or replace function public.wake_paid_film_after_photo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*) >= 3
      from public.tribute_photos
     where tribute_id = new.tribute_id and deleted_at is null
  ) and exists (
    select 1 from public.tributes
     where id = new.tribute_id and deleted_at is null and tier in ('plus','heirloom')
  ) then
    perform public.ensure_full_film_for_paid(new.tribute_id);
  end if;
  return new;
end;
$$;
revoke execute on function public.wake_paid_film_after_photo() from public, anon, authenticated;

drop trigger if exists tribute_photos_wake_paid_film on public.tribute_photos;
create trigger tribute_photos_wake_paid_film
  after insert on public.tribute_photos
  for each row execute function public.wake_paid_film_after_photo();

notify pgrst, 'reload schema';
