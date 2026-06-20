# I Miss You Memorial — Automation App

Turns an onboarding submission into a live tribute at `{slug}.imissyoumemorial.com`,
rendered in the canonical **"Vigil"** design.

## Flow

```
Stripe payment link  →  /onboarding (form)  →  POST /api/intake
   → writes Tribute row to Airtable (reserves a unique {slug})
   → Hyperagent enriches the row (timeline, details, memories) into "Tribute Data"
   → {slug}.imissyoumemorial.com renders the Vigil template, populated
```

## Files

| Path | Purpose |
|---|---|
| `templates/tribute-template.html` | The canonical Vigil tribute (master design — do not restyle) |
| `lib/renderTribute.ts` | Injects a person's data into the template via cheerio (design untouched) |
| `lib/airtable.ts` | Tiny Airtable client (create + lookup by slug) |
| `app/api/intake/route.ts` | Onboarding form → Airtable; reserves a unique subdomain |
| `app/_sites/[slug]/route.ts` | Renders a tribute for a subdomain |
| `middleware.ts` | Rewrites `{slug}.imissyoumemorial.com` → `/_sites/{slug}` |

## Setup

1. `npm i cheerio` (plus a standard Next.js App Router project).
2. Ensure `tsconfig.json` has the `@/*` path alias mapped to the project root.
3. Environment variables:
   ```
   AIRTABLE_PAT=...            # data.records:read/write
   AIRTABLE_BASE_ID=app...     # from setup_base.py
   ```
4. Place the onboarding form at `/onboarding` and have it `POST` JSON to `/api/intake`
   (same fields as the form: fullName, slug, aka, email, relationship, birth, passing,
   place, story, quote, song, theme, coverPhoto, video, serviceDate, serviceLocation,
   charity, privacy, tier).

## Wildcard subdomains (the one infra step)

1. Add a wildcard DNS record: `*.imissyoumemorial.com  CNAME  cname.vercel-dns.com`
   (or your host's target).
2. In Vercel: Project → Domains → add `*.imissyoumemorial.com`.
3. Deploy. Every subdomain is rendered dynamically from Airtable — **no per-site deploy**.
   A new memorial is live the moment `/api/intake` writes its row.

## The enrichment step (matching the sample's richness)

The onboarding form captures raw fields. To reach the full richness of the canonical
sample (life timeline, "she loved most" detail cards, seeded memories, quote
attribution), Hyperagent reads the new Airtable row, expands the story into a
`Tribute Data` JSON blob:

```json
{
  "datesSuffix": "a sky full of those who loved her",
  "quoteAttrib": "what she said, most mornings",
  "details": [{ "k": "She loved most", "v": "…", "wide": true }],
  "timeline": [{ "year": "1942", "title": "Born in …", "text": "…", "tag": "family" }],
  "memories": [{ "text": "…", "name": "…", "rel": "Daughter" }]
}
```

`recordToTribute()` merges that JSON over the raw fields, so the renderer produces a
tribute indistinguishable in structure from the Eleanor Hayes master.
