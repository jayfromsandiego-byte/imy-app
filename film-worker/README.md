# film-worker — Their film

Weaves the memorial film for a tribute: the family's photographs, captions,
chapters, and clips become a quiet 1080p film with a wreath title card, a
warm grade, and a public-domain bed. One small box renders for the whole
product. A paid full film is placed on the tribute automatically when it is
finished. The private film room remains the family's place to watch, re-weave,
or take it down. Free teaser films still wait for the family's approval.

## How it moves

1. `film_jobs` row lands (`status=queued`) — from intake, the keeper, or ops.
2. The worker claims it (`claim_film_job()` RPC, `for update skip locked`).
3. Reads the tribute + children over PostgREST (service role).
4. Builds the spec exactly the way the page does (chapters from
   `tribute_chapters` + `tribute_timeline`, photos per moment from
   `placements.chapters`, captions are the family's own words).
5. Renders (`render_film.py`) — segments one at a time, hierarchical
   assembly in groups of 5 so a 4 GB box never OOMs.
6. Uploads `films/{tribute_id}/{job_id}.mp4` + poster (R2 when `R2_*` keys
   exist, Supabase Storage `tribute-films` until then — same env names as
   `lib/r2.ts`).
7. Marks the job `ready`, supersedes older unapproved films — then, on a
   paid page (plus/heirloom) with a `full` weave, places the film on the
   tape shelf itself (the $97 promise; the letter says it is on the page,
   and the film room can re-weave or take it down any time). Free pages
   get the approval letter instead. Silent without a Resend key.

Variant `auto` resolves at render time: `plus`/`heirloom` → `full`
(chapters, up to 24 photos, up to 3 clips, ~90–150s); `free` → `teaser`
(title, five photographs, closing, ~35s). With eight or more photographs,
each chapter opens over its first photograph in the same film grammar as the
Eleanor showcase. Fewer than eight uses the short form. Fewer than three rests
as `waiting_for_photos`; the page and family study explain what is needed.

## Deploy (Railway / any durable Docker host)

Railway is the launch path. Create a service from this repository, set its root
directory to `film-worker`, and let `railway.json` own the deploy settings. The
container listens on Railway's `PORT`, exposes `/healthz`, runs as a non-root
user under `tini`, and restarts always. Keep one replica until the queue proves
it needs more.

For a plain Docker host:

```
docker build -t imy-film-worker .
docker run -d --restart unless-stopped \
  -p 8080:8080 \
  -e SUPABASE_URL=https://<ref>.supabase.co \
  -e SUPABASE_SERVICE_ROLE_KEY_V2=<legacy service-role JWT> \
  -e RESEND_API_KEY=<wakes the family and operator letters> \
  -e EMAIL_FROM="I Miss You Memorial <hello@imissyoumemorial.com>" \
  -e OPS_EMAIL=imissyoumemorial@gmail.com \
  imy-film-worker
```

A 2-vCPU box normally weaves a full film in about 4–10 minutes. The SQL claim
is safe under multiple workers, but scale only when queue age says to. Never
scale to zero: a paying family should not wait for a manual wake.

Env (all optional beyond the first two):

| Var | Meaning |
|---|---|
| `SUPABASE_URL` · `SUPABASE_SERVICE_ROLE_KEY_V2` | the queue and tribute data; V2 carries the legacy service-role JWT |
| `R2_ACCOUNT_ID` `R2_ACCESS_KEY_ID` `R2_SECRET_ACCESS_KEY` `R2_BUCKET` `R2_PUBLIC_BASE_URL` | wakes R2 storage (else Supabase `tribute-films`) |
| `RESEND_API_KEY` · `EMAIL_FROM` · `OPS_EMAIL` | wakes the family letter and final-failure operator note |
| `SITE_URL` | film-room links, default imissyoumemorial.com |
| `WORKER_ID` | stable name stored in `film_worker_heartbeats`; host name by default |
| `POLL_SECONDS` | queue poll, default 20 |
| `MAX_PHOTO_BYTES` · `MAX_CLIP_BYTES` | bounded remote media downloads; defaults 30 MB and 40 MB |
| `MAX_FILM_BYTES` | final object ceiling; defaults just below Supabase's 50 MB limit |
| `ALLOWED_MEDIA_HOSTS` | explicit comma-separated host exceptions; keep empty in production unless reviewed |
| `RUN_ONCE=1` | weave at most one job, then exit (tests) |

Do not set `ALLOW_PRIVATE_MEDIA_URLS` in production. It exists only so the
credential-free smoke test can read its own local fixtures.

## Asset provenance (the ledger)

| Asset | Source | License |
|---|---|---|
| Besley, Besley Italic | github.com/google/fonts (ofl/besley) | OFL |
| Sometype Mono | github.com/google/fonts (ofl/sometypemono) | OFL |
| Wreath art | imissyoumemorial.com/art/wreath2-64e82a.png | ours |
| Gymnopédie No. 1 (bed) | commons.wikimedia.org — "Satie Gymnopedie No 1 performed by Michael Laucke.flac" | Public Domain |

New music beds: add `assets/<name>.flac`, set `film_jobs.music = '<name>'`,
and record the row here. One-time licenses only; never subscription beds;
never user uploads (that is where licensing risk lives).

## QA and operating checks

```
# deterministic units: plan shape, pronouns, variants, download safety
python3 -m unittest discover -s tests -p 'test_*.py' -v

# the real ffmpeg/Pillow pipeline, shortened but still 1080p H.264 + AAC
RUN_RENDER_SMOKE=1 ASSETS_DIR=./assets sh tests/run.sh

# container readiness
curl -fsS http://127.0.0.1:8080/healthz
```

The renderer validates every output before upload: H.264, AAC, `yuv420p`,
1920×1080, expected duration, non-empty poster, and the configured size ceiling.
It rejects HTTP, credential-bearing, loopback, private, link-local, and oversized
media URLs. The worker records its state in `film_worker_heartbeats`; the app's
daily external check catches a dead heartbeat, an old queue, a stuck render,
failed jobs, unmatched paid orders, and failed family letters. Final worker
failures also send an immediate operator note when Resend is available.

## Local queue test (no Docker)

```
ASSETS_DIR=./assets RUN_ONCE=1 \
SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY_V2=… \
python3 worker.py
```

Use a soft-deletable QA tribute, never a real family page. Insert one job:
`insert into film_jobs (tribute_id, requested_by) select id, 'ops' from tributes where slug='qa-film';`
