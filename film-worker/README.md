# film-worker — Their film

Weaves the memorial film for a tribute: the family's photographs, captions,
chapters, and clips become a quiet 1080p film with a wreath title card, a
warm grade, and a public-domain bed. One small box renders for the whole
product. Nothing this worker does ever appears on a page by itself — every
film waits for the family's approval (`/film/[slug]?t=…`).

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
(title, five photographs, closing, ~35s). Fewer than 8 photos → the short
form without chapter cards; fewer than 3 → the job rests as
`not-enough-photos` and the app says so, gently.

## Deploy (Railway / Fly / any Docker host)

```
docker build -t imy-film-worker .
docker run -d --restart unless-stopped \
  -e SUPABASE_URL=https://<ref>.supabase.co \
  -e SUPABASE_SERVICE_ROLE_KEY=<service role key> \
  -e RESEND_API_KEY=<optional, wakes the letter> \
  -e EMAIL_FROM="I Miss You Memorial <hello@imissyoumemorial.com>" \
  imy-film-worker
```

- Railway: new service from this Dockerfile, ~$5/month, done.
- Fly.io: `fly launch` with `min_machines_running = 0` if you prefer
  scale-to-zero (a queued job waits for the next wake).
- Capacity: one 2-vCPU box weaves a film in ~4–10 minutes; ~1,000
  films/month fits with room to spare. Add boxes only if the queue says so
  (`claim_film_job` is safe under many workers).

Env (all optional beyond the first two):

| Var | Meaning |
|---|---|
| `SUPABASE_URL` · `SUPABASE_SERVICE_ROLE_KEY` | the queue and the tribute data |
| `R2_ACCOUNT_ID` `R2_ACCESS_KEY_ID` `R2_SECRET_ACCESS_KEY` `R2_BUCKET` `R2_PUBLIC_BASE_URL` | wakes R2 storage (else Supabase `tribute-films`) |
| `RESEND_API_KEY` · `EMAIL_FROM` | wakes the film-ready letter |
| `SITE_URL` | preview links, default imissyoumemorial.com |
| `POLL_SECONDS` | queue poll, default 20 |
| `RUN_ONCE=1` | weave at most one job, then exit (tests) |

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

## Local test (no Docker)

```
ASSETS_DIR=./assets RUN_ONCE=1 \
SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… \
python3 worker.py
```

Insert a job first:
`insert into film_jobs (tribute_id, requested_by) select id, 'ops' from tributes where slug='eleanor';`
