# I Miss You Memorial — Migration Handoff
**Written August 24, 2026 · from the I Miss You Memorial Studio agent · thread cmt3vk8ta03fq07ad2rxweh5d**

This package carries everything the unified-app thread built, so work resumes immediately on the new Hyperagent account. The GitHub repo is the durable source of truth; this zip is the portable copy plus the operating knowledge.

---

## 1 · What is live today (imissyoumemorial.com)

- **The homepage IS the unified app.** `vercel.json` on main 307-redirects apex `/` → `/preview/unified.html`. The redirect is **host-scoped to the apex only** — `{slug}.imissyoumemorial.com` family subdomains and every `/sites/…` path serve exactly as before. Crons preserved.
- **The unified app** (one self-contained HTML bundle, noindex): landing → Before You Begin → the live editor (studio) → the tribute page → the Sharpened Desk dashboard → checkout. Hash routes: `#/` `#/signin` `#/studio?m=&step=` `#/site/<slug>` `#/dashboard` `#/checkout?m=&post=1`. Demo doors: `#/seed`, `#/seedplus`, `#/site/eleanor` (pristine example).
- **Real Google sign-in** through the production Supabase (`aozjmlbkfayaulqnxgxe.supabase.co`, PKCE via supabase-js CDN, host-gated to imissyoumemorial.com; artifact copies fall back to a simulated panel). Sessions persist per device; sign-out signs out of Supabase too.
- **Real Stripe checkout**: the app posts same-origin to the production `POST /api/stripe/checkout` (`plan: plus_once`, $197 lifetime; Stripe's hosted page carries card/Apple/Google Pay **and the promo-code field**). Return `?upgraded=1&cs=…&m=…` marks the memorial Plus and records the receipt in Billing. **A live click charges real money** — mint a 100%-off single-use code before testing (see Stripe skill).
- **The How-It-Works films** (step 1 kitchen-table editor; step 3 three generations around one phone) are **embedded in the bundle as data URIs** — no external host can break them. Raw mp4s are in `films/`; when convenient, commit them to `imy-app/public/films/` via git CLI and flip `src/build.mjs`'s `filmSrc()` to same-origin paths.
- **State model (prototype)**: accounts/memorials persist in `localStorage` on the production origin (per device). Cross-device pages arrive with the production port (database).

**Latest commits (Aug 24):** main `fdf4b8a9` (embedded films) · branch `preview/unified` `4db96f15` · PR **#29** (open, marked not-for-merge; holds the design history).

## 2 · Repo map (github.com/jayfromsandiego-byte/imy-app)

- `imy-app/public/preview/unified.html` — the deployed bundle (what the homepage serves).
- `design/unified-prototype/` — **sources**: `pages/` (landing, tribute, desk, builder-ref, signin, checkout), `src/` (shell.html router+state+composers, bridge.js, tribute-hydrate.js, desk-hydrate.js, studio.js, build.mjs), `README.md`.
- `imy-app/vercel.json` — the host-scoped homepage redirect + crons. **Rollback = delete the redirects block** (one commit; old landing returns in ~2 min).
- The real Next.js app (auth, Stripe route, webhook, middleware, real tribute renderer) is untouched around it.

## 3 · Architecture in one breath

Every view is a complete HTML document, base64-embedded in `src/shell.html`, mounted in a full-viewport iframe. The shell owns routing, the state store, the **composer** (draft → tribute data), and the desk composer (state → dashboard data). The locked page designs are never reshaped: `build.mjs` patches their data declarations to accept `window.IMY_OVERRIDE` / `window.IMY_DESK` (spliced into srcdoc before their scripts), and appends hydrator scripts after them (static text, plan gating, edit-mode click-to-edit, live-typing patch commands `person/memtext/chaptext`, privacy gate, tape playback, owner doors). The studio is the builder-ref letter shell with a rewritten step engine; its preview is the real tribute in edit mode. Build: `cd design/unified-prototype && node src/build.mjs` → `dist/imy-unified.html` (asserts every patch; fails loud).

## 4 · The deploy loop

1. Edit sources → `node src/build.mjs` → note the md5.
2. Push `imy-app/public/preview/unified.html` to **main** (GitHub MCP `push_files`, or the github-repo-commit skill once its PAT is re-entered). Keep `design/…` sources in sync on the branch.
3. Vercel auto-deploys main in ~40–120s. Verify: `curl -sL https://imissyoumemorial.com/preview/unified.html | md5sum` matches; spot-check apex 307, `eleanor.imissyoumemorial.com` 200, `/api/stripe/checkout` answers 400 on `{}`.
4. Also publish the bundle as the thread artifact for review copies (simulation mode off-domain).

## 5 · Gotchas that cost hours (do not relearn)

- The landing has `<base href="https://imissyoumemorial.com/" target="_blank">` — **never let `#anchor` links resolve natively**; the bridge intercepts and scrolls in-document.
- The letter's footer is an absolute-positioned fade that **swallows clicks** — `.lfoot{pointer-events:none}` with buttons re-enabled. Keep it.
- The tribute page script **crashes on empty data** without the build guards (`renderMoments` with no TODAY, `renderChapter(0)` with no chapters, photo grid with <9 photos). The guards live in `build.mjs`.
- Never recompose the preview per keystroke — typing uses the hydrator patch commands; full srcdoc reloads only on discrete add/remove.
- GitHub MCP `push_files`/`create_or_update_file` are **text-only** (binaries get double-encoded). Binary assets go via git CLI or the github-repo-commit skill (its `multi` is binary-safe).
- Published-artifact iframes are CSP-sandboxed: no `contentDocument`, no localStorage — test interactively via UI, and expect per-visit state on artifact copies.
- Browser-automation quirks: buttons whose labels start with `＋` get mis-clicked; extraction misreads images-vs-initials — trust screenshots.

## 6 · Legacy assets still on pub.hyperagent.com (rehost follow-up)

The two films are embedded now. Still externally hosted (survived the last account move as duplicates; rehost into `imy-app/public/` via git CLI when convenient): **~17 URLs in `pages/landing.html`** (hero photograph, steps 2 & 4 films `728a8559….mp4` / `e88b6a69….mp4`, example-section photos, final-band background) and **3 in `pages/tribute.html`** (Eleanor cover background `pbf01M0KS…`, portrait, plus supabase-hosted photo set `aozjmlbkfayaulqnxgxe.supabase.co/storage/…` which is safe — it's your Supabase). Grep `pub.hyperagent.com` in `pages/` for the exact list.

## 7 · Keys, accounts, integrations — see AGENT/credentials-checklist.md

## 8 · Open threads (in order)

1. **Eleanor media dressing** — a portrait for every tree member (~13), real demo films on her tape shelf, chapter moments; generate, then patch her data arrays at build (era dashes already done).
2. **FAMILY20 promo** — 20% off the second Plus memorial; mint in Stripe once the key is re-entered (the dashboard copy already promises it).
3. **The production port** — the finish line: Supabase persistence for pages (cross-device), the studio writing to the database, real approvals/roles, the Sharpened Desk against real data, subdomain slugs for prototype-born pages. Design is locked; port in shippable stages behind preview deploys.
4. Landing steps 2/4 films + remaining asset rehosting (§6).
5. Brand bible refresh: $197 lifetime only (monthly retired), Concierge $1,200+ per landing, unified app live at `/`, "Dashboard" naming (never "Desk").

## 9 · Key identifiers

| Thing | Value |
|---|---|
| Repo | github.com/jayfromsandiego-byte/imy-app (app under `imy-app/`, sources under `design/unified-prototype/`) |
| PR | #29 (design history; not for merge) |
| Vercel | project `imy-app`, team `jayfromsandiego-3997s-projects`, project id `prj_uq5TEbfHJq0gQVAs7Wd980qo7v5k` |
| Supabase | ref `aozjmlbkfayaulqnxgxe` (auth + storage; anon key is public, embedded in shell) |
| Stripe | live · Plus $197 once `price_1Txf6MCQ9sOzdRvOKk8cyHkE` · webhook `/api/stripe/webhook` (healthy) · **shared account — never bulk-operate** |
| Google OAuth | client `823733758300-ghmm…apps.googleusercontent.com` (configured in Supabase) |
| Notion | J-Cube Consulting workspace · Side Quest › Side Projects › I Miss You Memorial (links in the agent prompt) |
| Old thread | hyperagent.com/thread/cmt3vk8ta03fq07ad2rxweh5d (this work's full history) |
