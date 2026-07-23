# Operating I Miss You Memorial — the agent's field manual

Everything an operator (human or agent, on any account) needs to work on this
product safely. The house manual for *editing* is `imy-app/docs/EDITING.md`;
this file is the *operations* layer learned across the June–July 2026 build.

## The deploy loop

- Commit to `main` → Vercel builds production (~2 min) at imissyoumemorial.com.
  Any other branch → preview deployment (previews are SSO-locked; QA on
  production fixtures instead, or use the protection-bypass secret).
- **Vercel never type-checks**: `next.config.js` sets `ignoreBuildErrors: true`.
  Run `npx tsc --noEmit` in `imy-app/` before every push — it is the only type
  gate. Baseline: 4 known implicit-any errors in `middleware.ts` are accepted;
  the bar is no NEW errors.
- Render safety: `sh ops/qa/run.sh` (32 assertions against the real template).
  Run it before merging anything that touches `lib/renderTribute.ts`,
  `lib/tributesData.ts`, or `templates/tribute-template.html`.
- A failed build never deploys — production stays on the last good build.
  Instant Rollback lives in Vercel → Deployments.

## Database changes

- Additive only, as numbered files in `imy-app/supabase/migrations/`
  (applied through **0011** as of July 8, 2026).
- Apply via the Supabase Management API (`ops/skills/supabase_api.py sql-file …`)
  or the dashboard SQL editor; end migrations with `notify pgrst, 'reload schema'`
  and allow a few seconds for PostgREST's cache.
- Soft deletes only. Public reads must select **and filter** `deleted_at` —
  service-role reads bypass RLS, so the app-side filter is the only thing
  keeping removed content off pages (learned twice, July 8).
- Most `qa-*`/`proof-*`/`verify-*` tributes are soft-deleted fixtures. For live
  QA use `eleanor` (the seeded demo) or create a throwaway tribute and retire it
  (`status: draft` + `deleted_at`).

## API quirks that will bite you

- **Cloudflare walls**: `api.supabase.com` (Management) and Resend reject the
  default Python User-Agent (error 1010) — send a browser UA.
- **The opposite wall**: the project auth admin API
  (`<ref>.supabase.co/auth/v1/admin/*`) REJECTS secret keys sent with a browser
  UA ("Forbidden use of secret API key in browser") — send a server UA there.
  Rule: browser UA for api.supabase.com and Resend; server UA for *.supabase.co.
- All data reads in the app pin `cache: "no-store"` (Next's Data Cache once froze
  pages at first render). Keep that pattern in new code.
- PostgREST query params must be URL-encoded (a space in `author_name=eq.QA Voice`
  breaks urllib).
- Tribute pages cache at the CDN for 60s (`s-maxage=60`) — cache-bust with a
  query string when verifying fresh output.

## Credentials & tooling

Scripts in `ops/skills/` are the canonical copies of the agent's skill scripts:

| Script | Purpose | Env vars it needs |
|---|---|---|
| `gh_commit.py` | GitHub commits/reads via REST (MCP-independent) | `GITHUB_TOKEN` (fine-grained PAT, Contents R/W on this repo) |
| `supabase_api.py` | Supabase REST/Storage/Auth-admin + Management SQL | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN` (sbp_… management token, for SQL/DDL), optional `SUPABASE_ANON_KEY` |

Known trap: if a stored SUPABASE_URL looks like a key rather than
`https://aozjmlbkfayaulqnxgxe.supabase.co`, override it explicitly.

Other live keys (held in Vercel env / provider dashboards, never in this repo):
Stripe live secret + webhook secret, Resend API key, `CRON_SECRET`,
Vercel Blob (`BLOB_READ_WRITE_TOKEN`), R2 (`R2_*`, pending as of July 8).

## Auth (fixed July 8)

- All three Supabase auth emails (magic link, signup confirm, recovery) emit
  `https://imissyoumemorial.com/auth/confirm?token_hash={{ .TokenHash }}&type=…`
  — token-hash verification works on any device. Never revert to
  `{{ .ConfirmationURL }}` (same-browser assumption; it stranded the first
  customers). Templates live in Supabase → Auth → Email Templates, in brand voice.
- `/auth/confirm` handles both PKCE (`?code=`) and OTP (`?token_hash=&type=`).
- Password sign-in: set at `/dashboard/account`, used at `/signin`;
  recovery emails land signed-in on the Account room.

## Their film (the memorial video — July 14, 2026)

- One external worker (`film-worker/`, Docker) weaves memorial films from each
  tribute's own photos, captions, chapters, and clips. It is NOT deployed by
  Vercel — run it on any $5 box (Railway/Fly). See `film-worker/README.md`.
- Queue: `film_jobs` (migrations 0021 + reliability layer 0022). Claim/requeue
  and the paid `ensure_full_film_for_paid` promise are service-role-only SQL.
  A partial unique index allows one active full weave per tribute, so Stripe
  retries and concurrent events cannot double-render. Intake enqueues at 3+
  photos; the keeper re-weaves from `/film/[slug]?t=…`.
- Placement: a PAID page (plus/heirloom) receives its full film automatically
  the moment the weave finishes — the $97 includes the film, no approval step
  between a family and what they paid for; the letter says it is on the page.
  Free-page films wait in the film room for the family's yes. Either way the
  room can re-weave or take a film down (`/api/film/approve`, action=remove) —
  removed films rest, never delete. On the shelf a film is a `tribute_videos`
  row with `kind='film'`, `sort=999`. The Stone's living portrait and Living
  pictures always skip `kind='film'` — the film never covers the face.
  The Stripe webhook queues the full weave the second the tier turns. It fails
  closed without its signing secret or database, and returns 500 on fulfillment
  failure so Stripe retries instead of accepting a silent loss. A full refund
  or canceled monthly trial returns the page to Free only when no other paid
  order or active subscription remains; the tribute, sponsor words, and woven
  film stay kept, at rest.
- Storage: R2 when `R2_*` keys exist (same env names as `lib/r2.ts`), the
  public `tribute-films` Supabase bucket until then. The Supabase FREE plan
  caps objects at 50 MB (verified July 14 — 402 to raise it), so the worker
  fits every film under ~48 MB (`MAX_FILM_BYTES`); R2 keys lift the ceiling.
  Free-tier films rest exactly like other free-page videos.
- Variants: `auto` resolves at render time (plus/heirloom → full ~1½–2½ min ·
  free → teaser ~35s). Eight or more photographs receive the Eleanor-showcase
  chapter-over-photo treatment. Fewer than 3 photos rest as
  `waiting_for_photos`; the page and study say so gently.
- Operations: the worker exposes `/healthz`, writes `film_worker_heartbeats`,
  updates `orders.fulfillment_status`, validates every H.264/AAC render before
  upload, and alerts the operator on a final failure. `/api/cron/film-health`
  is the outside daily backstop on Vercel Hobby. Run `sh ops/qa/run.sh` and
  `RUN_RENDER_SMOKE=1 ASSETS_DIR=film-worker/assets sh film-worker/tests/run.sh`
  before deployment.
- Music: public-domain or one-time-licensed beds baked into the worker image,
  provenance ledger in `film-worker/README.md`. Never subscription beds,
  never user uploads.

## The rules that never bend

1. Templates in `imy-app/templates/` are locked design finals — copy edits and
   `if (T)` production wiring only; never reshape markup or animation.
2. Anything not regenerated by `renderTribute` leaks Eleanor's demo content.
   The dashboard speaks `pronounSet(t.pronouns)` too — never a hardcoded "her".
3. Nothing is ever hard-deleted; pages rest, they do not disappear.
4. Prices only as $0 · $97 once or $12/month · Concierge from $499.
5. House voice: quiet, no exclamation points, em dashes sparingly.
