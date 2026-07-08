#!/usr/bin/env python3
"""
gh_commit — commit files to a GitHub repo using a Personal Access Token.

A reliable, MCP-independent way to push changes (a single file, or an atomic
multi-file commit) to a repository over the GitHub REST API. Built for the
imy-app deploy loop: edit files locally, commit them to `main`, and Vercel
auto-deploys the result.

Credentials (injected by RunWithCredentials):
  GITHUB_TOKEN   Fine-grained PAT with "Contents: Read and write" on the repo.
                 Entered via the skill credential card — NEVER pasted in chat.

Optional env (sensible defaults for this project):
  GH_OWNER   default "jayfromsandiego-byte"
  GH_REPO    default "imy-app"
  GH_BRANCH  default "main"

Usage:
  python gh_commit.py whoami
      Sanity check: prints the authenticated login and the token's permission
      level on the target repo. Run this first after saving the token.

  python gh_commit.py get imy-app/templates/landing.html
      Read a file's current blob sha (confirms read access + path).

  python gh_commit.py put <repo_path> <local_path> -m "commit message"
      Create or update ONE file. Auto-resolves the existing sha.

  python gh_commit.py multi "commit message" \
      imy-app/templates/landing.html=./landing.html \
      imy-app/templates/onboarding.html=./onboarding.html
      Atomic multi-file commit (one commit, many files) via the Git Data API.
      Use this for rebuild deploys that touch several files at once.
"""
import os
import sys
import base64
import requests

TOKEN = os.environ.get("GITHUB_TOKEN")
if not TOKEN:
    sys.exit("Missing GITHUB_TOKEN")

OWNER = os.environ.get("GH_OWNER", "jayfromsandiego-byte")
REPO = os.environ.get("GH_REPO", "imy-app")
BRANCH = os.environ.get("GH_BRANCH", "main")
API = "https://api.github.com"
H = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}


def _die(r, ctx):
    sys.exit(f"{ctx} failed: {r.status_code} {r.text[:300]}")


def whoami():
    r = requests.get(f"{API}/user", headers=H, timeout=30)
    if r.status_code >= 300:
        _die(r, "whoami")
    print("Authenticated as:", r.json().get("login"))
    r2 = requests.get(f"{API}/repos/{OWNER}/{REPO}", headers=H, timeout=30)
    if r2.status_code < 300:
        print(f"Repo {OWNER}/{REPO}: permissions={r2.json().get('permissions')}")
    else:
        print(f"Repo {OWNER}/{REPO}: NOT accessible ({r2.status_code} {r2.text[:120]})")


def get_sha(path):
    r = requests.get(f"{API}/repos/{OWNER}/{REPO}/contents/{path}",
                     headers=H, params={"ref": BRANCH}, timeout=30)
    if r.status_code == 200:
        return r.json().get("sha")
    if r.status_code == 404:
        return None
    _die(r, f"get_sha {path}")


def cmd_get(path):
    r = requests.get(f"{API}/repos/{OWNER}/{REPO}/contents/{path}",
                     headers=H, params={"ref": BRANCH}, timeout=30)
    if r.status_code >= 300:
        _die(r, f"get {path}")
    d = r.json()
    print(f"path={d['path']} sha={d['sha']} size={d['size']} branch={BRANCH}")


def cmd_put(repo_path, local_path, message):
    with open(local_path, "rb") as f:
        content_b64 = base64.b64encode(f.read()).decode()
    sha = get_sha(repo_path)
    body = {"message": message, "content": content_b64, "branch": BRANCH}
    if sha:
        body["sha"] = sha
    r = requests.put(f"{API}/repos/{OWNER}/{REPO}/contents/{repo_path}",
                     headers=H, json=body, timeout=60)
    if r.status_code >= 300:
        _die(r, f"put {repo_path}")
    c = r.json().get("commit", {})
    print(f"{'updated' if sha else 'created'} {repo_path} -> commit {c.get('sha', '?')[:10]} on {BRANCH}")


def cmd_multi(message, pairs):
    r = requests.get(f"{API}/repos/{OWNER}/{REPO}/git/ref/heads/{BRANCH}", headers=H, timeout=30)
    if r.status_code >= 300:
        _die(r, "get ref")
    base_commit = r.json()["object"]["sha"]
    r = requests.get(f"{API}/repos/{OWNER}/{REPO}/git/commits/{base_commit}", headers=H, timeout=30)
    if r.status_code >= 300:
        _die(r, "get base commit")
    base_tree = r.json()["tree"]["sha"]

    tree = []
    for pair in pairs:
        if "=" not in pair:
            sys.exit(f"Bad pair (need repo_path=local_path): {pair}")
        repo_path, local_path = pair.split("=", 1)
        with open(local_path, "rb") as f:
            content = f.read().decode("utf-8")
        rb = requests.post(f"{API}/repos/{OWNER}/{REPO}/git/blobs", headers=H,
                           json={"content": content, "encoding": "utf-8"}, timeout=60)
        if rb.status_code >= 300:
            _die(rb, f"blob {repo_path}")
        tree.append({"path": repo_path, "mode": "100644", "type": "blob", "sha": rb.json()["sha"]})

    rt = requests.post(f"{API}/repos/{OWNER}/{REPO}/git/trees", headers=H,
                       json={"base_tree": base_tree, "tree": tree}, timeout=60)
    if rt.status_code >= 300:
        _die(rt, "create tree")
    rc = requests.post(f"{API}/repos/{OWNER}/{REPO}/git/commits", headers=H,
                       json={"message": message, "tree": rt.json()["sha"], "parents": [base_commit]}, timeout=60)
    if rc.status_code >= 300:
        _die(rc, "create commit")
    new_commit = rc.json()["sha"]
    ru = requests.patch(f"{API}/repos/{OWNER}/{REPO}/git/refs/heads/{BRANCH}", headers=H,
                        json={"sha": new_commit, "force": False}, timeout=30)
    if ru.status_code >= 300:
        _die(ru, "update ref")
    print(f"committed {len(tree)} file(s) -> {new_commit[:10]} on {BRANCH}")


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    cmd = sys.argv[1]
    if cmd == "whoami":
        whoami()
    elif cmd == "get":
        cmd_get(sys.argv[2])
    elif cmd == "put":
        args = sys.argv[2:]
        msg = "Update via gh_commit"
        if "-m" in args:
            i = args.index("-m")
            msg = args[i + 1]
            args = args[:i] + args[i + 2:]
        if len(args) < 2:
            sys.exit("Usage: put <repo_path> <local_path> -m \"message\"")
        cmd_put(args[0], args[1], msg)
    elif cmd == "multi":
        if len(sys.argv) < 4:
            sys.exit("Usage: multi \"message\" repo_path=local_path [...]")
        cmd_multi(sys.argv[2], sys.argv[3:])
    else:
        sys.exit("Unknown command: use whoami | get | put | multi")


if __name__ == "__main__":
    main()
