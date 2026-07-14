#!/usr/bin/env sh
# Run the render QA harness against the real tribute template.
# From the repo root:  sh ops/qa/run.sh     (needs Node 22.7+; Node 24 recommended)
#
# The harness imports lib/renderTribute.ts with its one type-only import shimmed
# away, renders the real locked template through it, and asserts 32 checks:
# identity safety (no Eleanor leaks, pronouns), tier behavior (free wall cap,
# resting voices), hearts, comments, and voice wiring. Run it before every merge
# that touches renderTribute, tributesData, or the tribute template.
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WORK="$(mktemp -d)"
sed 's|import { type LovedThing } from "./lovedThings";|type LovedThing = { label?: string; motifKey?: string; note?: string };|' \
  "$ROOT/imy-app/lib/renderTribute.ts" > "$WORK/renderTribute.gen.ts"
cp "$ROOT/ops/qa/harness.ts" "$WORK/harness.ts"
IMY_REPO_ROOT="$ROOT" node "$WORK/harness.ts"
# The film room (0021): placement, pronouns, shelf exclusivity, free invite.
IMY_REPO_ROOT="$ROOT" GEN="$WORK/renderTribute.gen.ts" node "$ROOT/ops/qa/film-section.test.mjs"
