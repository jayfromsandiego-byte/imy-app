# The SEO Program — Field Manual & Handoff

**Updated August 18, 2026.** This document is the account-independent record of the free-tools SEO program. It lives in the repo (canon) precisely so that no platform account migration can lose it. Companion file: `docs/seo-keyword-map.csv` (the Phase 1 keyword map, Volume/KD columns awaiting Ahrefs data).

## Status snapshot

- **56 of the planned 60 pages live** on production as of Aug 13, 2026 — roughly seven weeks ahead of the Oct 1 deadline. Deaths peak Dec–Feb; the point of the deadline was indexation aging.
- **Five free tools live**: funeral program maker, obituary writer, funeral cost calculator, cremation cost calculator, memorial card maker. All at `/tools/…`.
- **Sitemaps** (all declared in robots.txt): `/sitemaps/core.xml`, `tools.xml` (5), `templates.xml` (40), `guides.xml` (11) — segmented so Search Console reports coverage per cluster.
- **The four held pages, each with a named unblock**:
  | Page | Why held | Unblock |
  |---|---|---|
  | `/guides/how-to-write-an-obituary/` | YMYL — personal-advice guides ship only with a named human author | Kayla's bio into `lib/seo/authors.ts`, `published: true`, flip catalog entry |
  | `/guides/how-to-write-a-eulogy/` | same | same |
  | `/tools/photo-restoration/` | needs fal.ai key in Vercel env + upload wiring | `FAL_KEY` env var, wire the restore flow (skill `imy-photo-restoration` holds the API pattern) |
  | `/pet-memorials/` | must not promise pet tributes until the product story is confirmed | Kayla's product decision |

## How the system works (all in `imy-app/`)

- **One registry rules everything**: `lib/seo/catalog.ts` holds all 60 entries with `status: "queued" | "live"`. Queued entries 404 and stay out of sitemaps. Shipping a page = its content module + one status flip. The catalog IS the build tracker.
- **Content modules**: `lib/seo/content/*.ts` (51 modules), typed by `types.ts`, looked up via `registry.ts` (regenerate imports when adding files). Sections/FAQ/sources render through `app/(seo)/templates/[...parts]/page.tsx` and `guides/[...parts]/page.tsx` with FAQPage + BreadcrumbList (+ Article on guides) JSON-LD.
- **Artifact modes** (`components/seo/ArtifactDownload.tsx`): tool link (`toolSlug` names the tool, `makerVariant` prefills it) · print button (`toolSlug: "print"` — the page IS the artifact) · file downloads.
- **Tools** (`components/tools/`): ProgramMaker, ObituaryWriter, CostCalculator (one engine, two catalog entries), CardMaker. All client-side; photos never leave the browser; nothing AI-generated — every word is the family's own (fact-safety by construction).
- **The email gate law**: full output always visible BEFORE the gate; the gate unlocks print/copy/download only; a storage failure still unlocks (never block the bereaved). Leads → `POST /api/tool-leads` → Supabase `tool_leads` (RLS on + FORCE, zero policies, service-role only; migration `supabase/migrations/0021_tool_leads.sql`, applied Aug 13).
- **The noindex law** (`lib/seo/meta.ts`): user-generated outputs are never indexed. Only tool/template/guide pages and family-opted-in tributes are. Section indexes stay noindex until they have live entries.
- **Terminal action**: every tool and page ends in a quiet path to `/onboarding` — north star is memorial pages created, never tool sessions.

## Quality gate (ran before every merge; keep it)

1. Local production build green (`npm run build` in `imy-app/`).
2. axe-core WCAG 2.2 AA: zero critical/serious on every touched page type (skill `imy-accessibility-speed-audit`, script `axe_scan.mjs`, mobile viewport).
3. Playwright E2E on the tool flows, including fact-safety assertions (obituary draft contains only typed words) and arithmetic assertions (calculator sums exact).
4. Vercel branch build success → squash merge → verify production URLs + sitemap counts.
5. Lighthouse budgets: performance ≥85, accessibility ≥95, LCP ≤2.5s, CLS ≤0.1 (all pages measured have scored 100s).

**Design rule learned from the audits**: `#A87C5F` terracotta fails WCAG on cream below ~18px. Small mono labels and notes use **`#8A5F43`** (passes 4.5:1 on all cream surfaces); grays `#6B6259`/`#5F574E`. Display-size terracotta unchanged.

## Data provenance (cost pages)

- NFDA **2023** GPL Study (latest as of Aug 2026): burial w/ viewing $8,300, w/ vault $9,995, cremation w/ viewing $6,280; itemized medians in `lib/seo/content/cost-data.ts`, each with year + source. Primary PDF: `content.nfda.org/Portals/0/12-8-2023--2023%20GPL%20Survey.pdf`.
- Basic services fee: NFDA's own PDF prints both $2,459 and $2,495; we use $2,495 (arithmetically consistent with +8.5% on 2021's $2,300), footnoted on `/guides/average-funeral-cost/`.
- Direct cremation $2,455–$2,550 and cremation casket $1,310 come from the **2021** report (KFF-hosted PDF), labeled as such.
- **State-level medians do not exist** from any credible source — state pages present census-division regional medians, honestly labeled. State law facts carry statute cites (NY PHL §4140 and IL 410 ILCS 535 director requirements; CA HSC §8115 home-burial restriction; FL director requirement hedged — sources conflict).
- Yearly promise: refresh figures when NFDA publishes a new GPL study.

## Checkpoints & what's next

| When | What | Trigger |
|---|---|---|
| ~Aug 23 | Submit the four segment sitemaps in Google Search Console | manual, needs GSC access |
| Sep 12 | Day-30, W2 cohort (program pages) | ≥70% indexed + impressions on half → release that cluster's batch-2 axis. <40% indexed → stop, diagnose |
| Sep–Oct | Day-30 for later cohorts (obituary Sep 12 too — same ship date; cost/cards/rest Sep 12) — all cohorts shipped Aug 13, so one big checkpoint | same triggers |
| Nov 20+ | Day-90 | page: ≥50 impressions/mo OR ≥1 page created → keep + expand; else merge + 301 to hub |
| Any checkpoint | Tool conversion | completions→pages created ≥8% → build the white-label funeral-director version; <3% → redesign the terminal step |

**Batch 2 (pre-approved cut list, gated on data)**: more states (10), more relationships (obituary son/daughter/siblings; eulogy grandmother etc.), identity axis beyond military (police, fire, nurse, teacher, pastor), per-newspaper obituary submission pages (needs real deadline/pricing data collection), graduated-fold program, bookmark, budget worksheet, closing-accounts checklist. **Never build**: swapped-noun pages, advance directives (legal liability), growth-hack mechanics.

**Phase 3 remainder**: the delayed-conversion email sequence (day 7 / 30 / 90 / first anniversary — pacing rules live in the `imy-resend-email-craft` skill; needs the Resend key) and the white-label director track.

## Hyperagent account migration checklist

**Survives the move untouched** (lives outside the platform): this repo + production site, Supabase (incl. `tool_leads` data), Vercel, Cloudflare, Notion, Stripe, GSC/Analytics.

**Lives in the OLD Hyperagent account — re-create in the new one**:
1. **Agent config** — the brand-bible system prompt. When re-creating, append the "prompt addendum" below.
2. **Seven studio skills** (re-port name/docs/scripts; scripts also referenced in skill docs): `imy-photo-restoration` (cred: FAL_KEY), `imy-supabase-security-audit` (no creds; runs via Supabase MCP or supabase-api creds), `imy-e2e-flow-testing`, `imy-accessibility-speed-audit`, `imy-resend-email-craft` (cred: RESEND_API_KEY), `imy-seo-growth`, `imy-studio-discipline`. Plus the pre-existing ops skills (supabase-api, vercel-env, stripe, airtable, todoist, elevenlabs, imy-app-source, railway).
3. **Credential values never migrate** — re-enter on the skill cards in the new account: Supabase URL + service_role JWT (+ sbp token), Vercel API token, Stripe, FAL, Resend, Todoist, ElevenLabs. (Known trap from the July migration: the SUPABASE_SERVICE_ROLE_KEY field froze; use the V2 field.)
4. **MCP integrations** — reconnect GitHub, Supabase, Notion, Airtable, Railway, Cloudflare in the new account.
5. **Tables/artifacts** — the keyword map is `docs/seo-keyword-map.csv` here; the build tracker is `lib/seo/catalog.ts` status fields; the visual tours were point-in-time and need no migration.

### Agent prompt addendum (paste into the new agent's system prompt)

> **The SEO program is live (August 2026).** 56 of 60 free-tool pages and five tools (program maker, obituary writer, two cost calculators, card maker) ship traffic at /tools, /templates, /guides — the system is catalog-driven from imy-app/lib/seo/catalog.ts and documented in imy-app/docs/SEO-PROGRAM.md, which is canon for how pages ship, the QA gate, the noindex and email-gate laws, and the indexation checkpoints. Small text on cream uses #8A5F43 (WCAG; #A87C5F fails below 18px). Gate emails persist to Supabase tool_leads. Four pages held: two guides await Kayla's author bio, the photo restoration tool awaits FAL_KEY in Vercel, the pet landing awaits a product decision.
