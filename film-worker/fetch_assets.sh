#!/usr/bin/env sh
# Fetch the five immutable film assets and refuse any upstream byte drift.
set -eu

ASSETS="${1:-assets}"
BESLEY_SHA256='71f352d8859c787631a0978161d48497a72caa69dcae6996d6712a564df86c1e'  # pragma: allowlist secret
BESLEY_ITALIC_SHA256='de502a1ab6b06a63982dce8c9e58b3eee8aada175e78d5a4dc0a7b3721f26562'  # pragma: allowlist secret
MONO_SHA256='4095fd328c988392fb00ab867134e69beff0fc16de66ecdd9e7e232c16f16f25'  # pragma: allowlist secret
WREATH_SHA256='dc0ac41b25fd31b76f33e142abe31f5150663d350803497b886d37f7a0fee3ad'  # pragma: allowlist secret
MUSIC_SHA256='b284038a8bc0d7c6faf36f430cfbca965da3334f0cd2532560d864b0859c85a0'  # pragma: allowlist secret
mkdir -p "$ASSETS"

fetch() {
  curl --retry 5 --retry-all-errors --retry-delay 2 --retry-max-time 120 \
    -fsSL -o "$1" "$2"
}

fetch "$ASSETS/Besley.ttf" \
  "https://raw.githubusercontent.com/google/fonts/main/ofl/besley/Besley%5Bwght%5D.ttf"
fetch "$ASSETS/Besley-Italic.ttf" \
  "https://raw.githubusercontent.com/google/fonts/main/ofl/besley/Besley-Italic%5Bwght%5D.ttf"
fetch "$ASSETS/SometypeMono.ttf" \
  "https://raw.githubusercontent.com/google/fonts/main/ofl/sometypemono/SometypeMono%5Bwght%5D.ttf"
fetch "$ASSETS/wreath.png" \
  "https://imissyoumemorial.com/art/wreath2-64e82a.png"
fetch "$ASSETS/gymnopedie-1.flac" \
  "https://upload.wikimedia.org/wikipedia/commons/a/a6/Satie_Gymnopedie_No_1_performed_by_Michael_Laucke.flac"

(
  cd "$ASSETS"
  printf '%s  %s\n' \
    "$BESLEY_SHA256" 'Besley.ttf' \
    "$BESLEY_ITALIC_SHA256" 'Besley-Italic.ttf' \
    "$MONO_SHA256" 'SometypeMono.ttf' \
    "$WREATH_SHA256" 'wreath.png' \
    "$MUSIC_SHA256" 'gymnopedie-1.flac' \
    | sha256sum -c -
)
