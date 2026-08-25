# vercel-env (skill doc export · Aug 24, 2026)

Manage imy-app's Vercel environment through the API. Values pushed via API never pass through chat.

Project: prj_uq5TEbfHJq0gQVAs7Wd980qo7v5k · team jayfromsandiego-3997s-projects (baked-in defaults).

## Credentials
- VERCEL_TOKEN (required) — vercel.com → Account Settings → Tokens.
- Optional: ASSIST_API_KEY (+ plain envs ASSIST_BASE_URL/ASSIST_MODEL, e.g. Groq), OPENAI_API_KEY, GEMINI_API_KEY — the /api/assist writing helper tries them in that order, then a graceful fallback.

## Commands (RunWithCredentials)
- python3 skills/vercel-env/vercel_env.py verify — token + project reachability, run first
- … list-env — names/targets only, never values
- … set-env NAME — upserts into production+preview+development from the card's field

## The one rule
Env changes only take effect on the next deployment — any commit to main redeploys (an empty chore(env) commit is the house pattern).
