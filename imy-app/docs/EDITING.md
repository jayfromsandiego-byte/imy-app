# Editing I Miss You Memorial — the house manual

How to change the site safely, whether you write code or not. The voice is quiet,
the designs are locked, and every page stays online. Work inside those three truths.

## The one-minute mental model

- **The repo** lives at `github.com/jayfromsandiego-byte/imy-app`. The app is the
  `imy-app/` folder inside it (that's also Vercel's root directory).
- **Committing to `main` deploys production** at imissyoumemorial.com within ~2 minutes.
  Committing to any other branch builds a preview URL instead. There is no separate
  "publish" step — Git is the publish button.
- **Three big pages are plain HTML files** (the locked design finals):
  - `imy-app/templates/landing.html` — the homepage
  - `imy-app/templates/onboarding.html` — the sixteen-step keepsake letter
  - `imy-app/templates/tribute-template.html` — every memorial page (tokens like
    `{{NAME_PLAIN}}` are filled per-tribute by `lib/renderTribute.ts`)
- **Everything else is Next.js code**: API routes under `imy-app/app/api/`,
  the dashboard under `imy-app/app/dashboard/`, shared logic in `imy-app/lib/`.

## Non-developer edits (copy changes)

1. On GitHub, open the file (say `imy-app/templates/landing.html`), press `.` or the
   pencil icon to edit in the browser.
2. Find the words with Ctrl-F. Change only text between `>` and `<`. Never touch
   anything inside `<style>`, `<script>`, or a `{{TOKEN}}`.
3. Propose the change on a **branch** (GitHub offers this at commit time), open the
   pull request, and look at the Vercel preview link it produces. If the preview
   reads right, merge. Production updates itself.
4. House style: no exclamation points, em dashes sparingly, prices only as
   $0 · $97 once or $12/month · Concierge from $499.

## Where things live (fast index)

| You want to change… | Edit this |
|---|---|
| Homepage words/sections | `templates/landing.html` |
| Letter questions/copy | `templates/onboarding.html` |
| Memorial page copy/layout | `templates/tribute-template.html` (+ tokens in `lib/renderTribute.ts`) |
| What the seal saves | `app/api/intake/route.ts` |
| Prices/plans behavior | `app/api/stripe/checkout/route.ts` (+ price IDs in Vercel env) |
| What payment unlocks | `app/api/stripe/webhook/route.ts` |
| Emails to families | `lib/email.ts` |
| Dashboard rooms | `app/dashboard/…` |
| Privacy / Terms / Refunds | `app/privacy|terms|refunds/page.tsx` |
| SEO tags / tracking | `lib/seo.ts` · `lib/tracking.ts` |

## Environment switches (Vercel → Settings → Environment Variables)

Everything ships dormant and wakes when its key exists. After changing env vars,
redeploy (any commit, or Vercel's "Redeploy" button).

| Key | Wakes |
|---|---|
| `RESEND_API_KEY` + `EMAIL_FROM` | Seal email · memory-waiting nudge · trial reminder |
| `NEXT_PUBLIC_GTM_ID` (or `_GA4_ID` / `_GOOGLE_ADS_ID` / `_META_PIXEL_ID`) | Consent card + analytics + remarketing |
| `R2_*` (see `lib/r2.ts`) | Video/large uploads via presign |
| `CRON_SECRET` | Guards `/api/cron/trial-reminders` (runs daily 15:00 UTC via `vercel.json`) |
| `STRIPE_*` · `SUPABASE_*` | Already live — payments and data |

## The rules that keep this safe

1. **Designs are locked.** Copy edits yes; layout, animation, and style changes need
   a design decision first, then land as tokens/injection — never by reshaping the
   locked files casually.
2. **Never take a page down.** No deletes; tributes rest, they do not disappear
   (`deleted_at` soft-marks are for QA fixtures only).
3. **Additive database changes only**, as numbered files in `supabase/migrations/`,
   applied via the Supabase SQL editor or Management API, then `notify pgrst, 'reload schema'`.
4. **Branch → preview → merge** for anything you would not bet the homepage on.
5. **Secrets live in Vercel env and Stripe/Supabase dashboards** — never in the repo,
   never in chat.

## If something looks wrong in production

- Vercel → Deployments → open the newest one → **Instant Rollback** to the previous
  build (safe: env and data are untouched).
- Payments acting odd: Stripe Dashboard → Developers → Webhooks → check recent
  deliveries to `/api/stripe/webhook`.
- Pages serving stale data: they refresh within ~60 seconds by design; a redeploy
  forces everything fresh.
