#!/usr/bin/env sh
# Vercel ignores TypeScript build errors. This is the real gate.
# Four long-standing middleware implicit-any errors are the only accepted baseline.
set -eu
APP="$(cd "$(dirname "$0")/../../imy-app" && pwd)"
OUT="$(mktemp)"
set +e
(cd "$APP" && npx tsc --noEmit) >"$OUT" 2>&1
CODE=$?
set -e
if [ "$CODE" -eq 0 ]; then
  echo "TypeScript clean"
  exit 0
fi
KNOWN=$(grep -c "middleware.ts" "$OUT" || true)
NEW=$(grep -v "middleware.ts" "$OUT" || true)
if [ -n "$NEW" ] || [ "$KNOWN" -gt 4 ]; then
  echo "New TypeScript errors found:"
  cat "$OUT"
  exit 1
fi
echo "TypeScript baseline only: $KNOWN known middleware error(s)"
