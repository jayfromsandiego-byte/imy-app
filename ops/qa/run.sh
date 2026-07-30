#!/usr/bin/env sh
# Run the render QA harness against the real tribute template.
# From the repo root:  sh ops/qa/run.sh     (needs Node 22.7+; Node 24 recommended)
#
# The harness imports lib/renderTribute.ts with its one type-only import shimmed
# away, renders the real locked template through it, and asserts the render
# contract: identity safety (no Eleanor leaks, pronouns), tier behavior (free
# wall cap, resting voices), the bulletin board, hearts, comments, and voice
# wiring. It then chains the film room, the paid contract, the mobile-review
# contracts, and the LB-1 stored-XSS regression. Run it before every merge that
# touches renderTribute, tributesData, or the tribute template.
#
# All five suites always run — a failure in one no longer masks the rest (the
# old `set -e` aborted the chain after the first failing suite and hid later
# failures). The setup is still fail-fast; the suites aggregate into one exit.
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WORK="$(mktemp -d)"
sed -e 's|import { type LovedThing } from "./lovedThings";|type LovedThing = { label?: string; motifKey?: string; note?: string };|' \
    -e 's|from "./heroBackgrounds";|from "./heroBackgrounds.ts";|' \
  "$ROOT/imy-app/lib/renderTribute.ts" > "$WORK/renderTribute.gen.ts"
# The hero-scene library (July 29) is a real runtime import: it rides along so
# the generated module resolves it under plain Node.
cp "$ROOT/imy-app/lib/heroBackgrounds.ts" "$WORK/heroBackgrounds.ts"
cp "$ROOT/ops/qa/harness.ts" "$WORK/harness.ts"
set +e
rc=0
IMY_REPO_ROOT="$ROOT" node "$WORK/harness.ts" || rc=1
# The film room (0021/0022): placement, pronouns, progress, shelf exclusivity.
IMY_REPO_ROOT="$ROOT" GEN="$WORK/renderTribute.gen.ts" node "$ROOT/ops/qa/film-section.test.mjs" || rc=1
# The paid contract: checkout identity, fail-closed webhook, atomic queue, worker health.
IMY_REPO_ROOT="$ROOT" node "$ROOT/ops/qa/film-fulfillment.test.mjs" || rc=1
# Mobile review contracts: twelve-photo cap, media moderation, navigation, and recovery.
IMY_REPO_ROOT="$ROOT" node "$ROOT/ops/qa/agnesy-review.test.mjs" || rc=1
# LB-1: a stranger's words stay words — every visitor field is escaped at its innerHTML seam.
IMY_REPO_ROOT="$ROOT" node "$ROOT/ops/qa/lb1-xss.test.mjs" || rc=1
exit $rc
