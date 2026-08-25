# New-account setup checklist

Credential values never transfer (by design). After importing the agent on the new Hyperagent account, walk this list top to bottom. Enter every key on its **skill credential card** — never paste keys into chat.

## 1 · Integrations to reconnect (Settings → Integrations / MCP)
- [ ] **GitHub** (MCP) — the deploy path. Verify with a read of jayfromsandiego-byte/imy-app.
- [ ] **Supabase** (MCP) — project `aozjmlbkfayaulqnxgxe`.
- [ ] **Notion** (MCP) — J-Cube Consulting workspace (Autumn's account).
- [ ] **Airtable** (MCP), **Railway** (MCP), **Miro** (MCP), **Google Analytics** — as used.

## 2 · Skill credentials to re-enter
- [ ] `everlasting-stripe-payments` → **STRIPE_API_KEY** (live secret key — real charges; shared account, never bulk-operate). First actions after entry: verify with a sessions list, then mint a **single-use 100%-off test code** and walk one checkout end to end; then mint **FAMILY20** (20% off) for the second-memorial promise.
- [ ] `vercel-env` → **VERCEL_TOKEN** (account token). Verify: `python3 skills/vercel-env/vercel_env.py verify`.
- [ ] `github-repo-commit` → **GITHUB_TOKEN** (fine-grained PAT, resource owner `jayfromsandiego-byte`, Contents read/write on imy-app). Verify: `gh_commit.py whoami`. This skill is the **binary-safe** commit path (the GitHub MCP cannot push binaries).
- [ ] `imy-photo-restoration` → fal.ai key (wakes AI photo restoration work).
- [ ] `imy-resend-email-craft` → Resend key (transactional email).
- [ ] Optional helpers on `vercel-env`: ASSIST_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (the writing helper's doors).

## 3 · Verify after import
- [ ] The agent's skills all arrived (36 on the old account — the IMY set: imy-app-source, everlasting-stripe-payments, vercel-env, github-repo-commit, imy-photo-restoration, imy-resend-email-craft, imy-e2e-flow-testing, imy-accessibility-speed-audit, mkt-seo-audit, …). If any are missing, their docs for the three most critical are in `AGENT/skills/` here.
- [ ] The system prompt matches `AGENT/agent-config.json` (and note the pending brand-bible refresh listed in HANDOFF §8.5).
- [ ] A read of the live site passes the §4 verification ritual.

## 4 · Nothing else moves
The repo, Vercel, Supabase, Stripe, Google OAuth, and the live site are all outside Hyperagent and unaffected by the account move. The published pub.hyperagent.com asset URLs from old accounts have survived moves before (workspace duplication) but are listed in HANDOFF §6 for rehosting anyway.
