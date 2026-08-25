# github-repo-commit (skill doc export · Aug 24, 2026)

PAT-based commits to jayfromsandiego-byte/imy-app (defaults: main) — MCP-independent, BINARY-SAFE (the GitHub MCP is text-only and double-encodes binaries).

## Credential
- GITHUB_TOKEN — fine-grained PAT, resource owner jayfromsandiego-byte, Contents: Read and write on imy-app. Enter on the card, never in chat.

## Script gh_commit.py
- whoami — verify write access (run first after entering the token)
- get <repo_path> — blob sha + size
- put <repo_path> <local_path> -m "msg" — single file (binary-safe)
- multi "msg" repo=local [repo=local…] — atomic multi-file (binary-safe via base64 blob detection)

## revert_main.py
Emergency one-commit revert to the tree before a named bad commit (history preserved, no force-push); verifies HEAD first; used in the July 14 stale-mirror incident (bad70f2e → d85c321b).

## Deploy discipline (from that incident)
Before any template commit: fetch the live blob at HEAD and edit THAT, never a local mirror; compare byte sizes via get before pushing. Vercel deploys main in ~60–120s; verify with a curl of the live URL.

## First use on the new account
Use this skill to commit the two films from films/ to imy-app/public/films/ and flip src/build.mjs filmSrc() to same-origin paths (HANDOFF §1).
