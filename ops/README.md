# ops/

This folder holds local operational tooling for I Miss You Memorial: QA scripts and internal helper scripts used when working on the app and the film worker.

## What's here

- `qa/` — render-safety QA script and fixtures.
- `skills/` — local helper scripts used by operators/agents for routine tasks (deploys, data checks, etc.). These scripts read credentials from environment variables at runtime; no credential values live in this repo.

## Running QA

Before merging anything that touches tribute rendering (`lib/renderTribute.ts`, `lib/tributesData.ts`, `templates/tribute-template.html`), run the render-safety QA script from `imy-app/`:

```sh
sh ops/qa/run.sh
```

For film-worker changes, also run its own test suite per `film-worker/README.md` before deploying.

## Type checking

Vercel builds do not fail on type errors (`ignoreBuildErrors: true` in `next.config.js`). Run the type check locally before pushing:

```sh
cd imy-app && npx tsc --noEmit
```

This also runs automatically in CI on pull requests and on pushes to non-main branches (see `.github/workflows/ci.yml`).

## Operational runbook

Operational runbook, credentials inventory, and deployment detail live in the private team Notion (Ops Runbook).

This repository is public. Detailed deploy steps, database migration practices, credential names/formats, and internal admin endpoints are intentionally kept out of the public repo and documented privately instead.
