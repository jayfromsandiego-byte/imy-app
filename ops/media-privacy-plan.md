# Media privacy — signed/controlled reads for tribute media

Goal: tribute media (photographs, voices, films) is served only through doors
the app controls, so access can be scoped, revoked, and eventually granted on
expiring terms — instead of depending on storage buckets being publicly
readable for every key, forever.

This is a gate checklist, not a calendar. Order means dependency: each gate is
sized to be one reviewable PR (or one manual settings change), and a gate only
opens when the one before it is verified. Nothing in this plan deletes media —
pages rest, they do not disappear.

## Where media reads come from today

| Backend | Written by | Read today |
|---|---|---|
| Cloudflare R2 (`tributes/…`) | `/api/upload`, `/api/upload/presign` (lib/r2.ts) | `R2_PUBLIC_BASE_URL/<key>` stored in DB rows |
| Cloudflare R2 (`films/…`) | film worker (when R2 env present) | same public base |
| Supabase Storage `tribute-media` | dashboard video upload (signed upload URL) | `getPublicUrl` stored in DB rows |
| Supabase Storage `tribute-films` | film worker (fallback when R2 env absent) | public object URL stored in DB rows |
| Vercel Blob | `/api/upload` fallback (when R2 env absent) | public blob URL stored in DB rows |

Stored URLs in the database are absolute; changing how *new* media is addressed
never touches existing rows, which is what makes each gate below small.

## Gates

- [x] **Gate 0 — same-origin read door (this PR).**
  `app/media/r2/[...key]/route.ts` serves any `tributes/…` or `films/…` key
  with the app's own R2 credentials (Range-correct for audio/video seek, long
  immutable caching). `lib/r2.ts` addresses *new* uploads at `/media/r2/<key>`
  only when `R2_PROXY_READS=1`. Default off: zero behavior change at merge.
  Verify: fetch an existing key via `/media/r2/…` and via the public base;
  bytes and Content-Type identical; a Range request returns 206.

- [ ] **Gate 1 — flip `R2_PROXY_READS=1` in Vercel (manual, env only).**
  New uploads store same-origin URLs. Verify on a QA tribute: upload a
  photograph and a voice; both render and the voice seeks; og:image on a page
  whose cover is new media still resolves. Rollback: unset the env var (new
  uploads revert to the public base; nothing stored breaks either way).

- [ ] **Gate 2 — backfill stored R2 URLs (one SQL migration, applied manually).**
  Rewrite `R2_PUBLIC_BASE_URL/<key>` → `/media/r2/<key>` absolute-form across
  the columns that hold media URLs (tribute_photos.url, tribute_videos.url,
  tribute_audio.url, tribute_memories.photo_url/photo_urls/audio_url/
  video_url/avatar_url, tributes.sponsor_photo_url, film_jobs.film_url/
  poster_url). Ships as a numbered migration with a dry-run SELECT first
  (count per column), the UPDATEs, and the inverse rewrite as rollback.
  Verify: `/sites/eleanor` renders identically; sampled media URLs 200.

- [ ] **Gate 3 — R2 public access off (manual, Cloudflare dashboard).**
  Depends on Gate 2. Disable public bucket access; the read door (credentials)
  keeps serving. Any previously shared raw bucket URL stops resolving — that
  is the point. Verify: public-base URL 403/404, `/media/r2/…` 200, tribute
  pages unchanged.

- [ ] **Gate 4 — film worker writes land behind the door.**
  Worker output URLs (`films/…`) recorded same-origin; move the
  `tribute-films` fallback bucket to R2 or serve it through an equivalent
  door; retire the public-bucket fallback. One PR in the film-worker lane.

- [ ] **Gate 5 — Supabase `tribute-media` + Vercel Blob paths.**
  Dashboard video uploads switch their stored URL to a controlled read
  (Supabase signed URLs at render, or migrate objects to R2 behind the same
  door). `/api/upload`'s Blob fallback stops using `access: "public"` or is
  retired where R2 is configured. Sized as its own PR after Gate 3 proves the
  pattern.

- [ ] **Gate 6 — authorization at the door.**
  With all reads same-origin, teach `/media/r2` real checks: parent content
  not resting (revocation), and expiring signed grants for media whose tribute
  is not public. Requires dropping `immutable` for a shorter `s-maxage` +
  `stale-while-revalidate` so revocation propagates; that tradeoff is decided
  here, not earlier, once cache-hit data from Gates 1–3 exists.

## Invariants every gate must keep

- `/sites/eleanor` renders identically before and after (production check).
- No stored URL is ever left pointing at a door that no longer opens.
- Rollback for every gate is stated in its PR before merge.
