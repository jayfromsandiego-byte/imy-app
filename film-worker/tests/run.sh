#!/usr/bin/env sh
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
python3 -m unittest discover -s "$ROOT/tests" -p "test_*.py" -v
if [ "${RUN_RENDER_SMOKE:-0}" = "1" ]; then
  rm -rf "$ROOT/qa-output"
  ASSETS_DIR="${ASSETS_DIR:-$ROOT/assets}" python3 "$ROOT/tests/render_smoke.py" "$ROOT/qa-output"
fi
