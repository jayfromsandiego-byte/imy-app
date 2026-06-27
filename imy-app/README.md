# I Miss You Memorial — app (imy-app)

Beautiful, shareable memorial tribute pages for the people we've lost.
Live at **imissyoumemorial.com**; each tribute renders at `{slug}.imissyoumemorial.com`
in the canonical **"Vigil"** design (candle + rose hero, motif backgrounds below).

> Note: the Next.js project root is the `imy-app/` subdirectory of this repo
> (Vercel Root Directory = `imy-app`).

## Current architecture (live MVP)

```
Landing (/)  →  /onboarding (Typeform-style story)  →  POST /api/intake
   → writes a Tribute row to Airtable (reserves a unique {slug})
   → {slug}.imissyoumemorial.com renders the Vigil template, populated
```

| Path | Purpose |
|---|---|
| `app/route.ts` | Serves the marketing landing page (`templates/landing.html`) |
| `app/onboarding/route.ts` | Serves the onboarding story (`templates/onboarding.html`) |
| `app/api/intake/route.ts` | Onboarding form → Airtable; reserves a unique subdomain |
| `app/api/assist/route.ts` | AI writing helper (OpenAI; graceful fallback without a key) |
| `app/api/upload/route.ts` | Photo/video uploads (Vercel Blob; 501 until storage configured) |
| `app/sites/[slug]/route.ts` | Renders a tribute for a subdomain; slug `example` = built-in sample |
| `lib/renderTribute.ts` | Fills the template via `{{TOKEN}}` string replacement (no cheerio) |
| `lib/airtable.ts` | Minimal Airtable client (create + lookup by slug) |
| `middleware.ts` | Rewrites `{slug}.imissyoumemorial.com` → `/sites/{slug}` |

Data today is **Airtable** (base `apparEJ9ZRhjp7joc`). Uploads use **Vercel Blob**.
The AI helper uses **OpenAI**. See `.env.example` for all expected variables.

## Roadmap (planned — see the Notion runbook)

Per "Hyperagent Build Runbook — Customer Login + Client Dashboard": enhance this app
**in place** — keep the renderer and subdomain URLs, and add:

- **Auth.js (NextAuth v5)** — Google / Microsoft / Apple / email magic link.
- **Supabase Postgres via Prisma** — accounts + tributes (Airtable kept as a migration source/fallback).
- **Customer dashboard** — owners view, edit, and manage their tribute and plan.
- **Stripe checkout + webhooks** — payment success sets the tier; a lapse keeps the tribute online (Permanence Pledge in code).

All new work happens on a branch → Vercel preview → founder sign-off → merge.
Never push straight to production; never lose a tribute.

## Local dev

```bash
npm install
npm run dev      # http://localhost:3000
```

`tsconfig.json` maps `@/*` to the project root. Wildcard subdomains require a
`*.imissyoumemorial.com` DNS record and the domain added in Vercel.
