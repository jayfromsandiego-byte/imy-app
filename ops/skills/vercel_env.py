#!/usr/bin/env python3
"""
Vercel environment manager for I Miss You Memorial (imy-app).

Sets project environment variables through the Vercel REST API using
credentials injected by RunWithCredentials — values never pass through chat.
Stdlib only.

Credentials (injected as env vars):
  VERCEL_TOKEN      Vercel account token (vercel.com → Account Settings → Tokens)  (required)
  OPENAI_API_KEY    the writing helper's key — pushed with: set-env OPENAI_API_KEY (optional)

Optional overrides:
  VERCEL_PROJECT    default prj_uq5TEbfHJq0gQVAs7Wd980qo7v5k
  VERCEL_TEAM       default jayfromsandiego-3997s-projects (team slug or team_… id)

Subcommands:
  verify                       Token + project reachability.
  list-env                     List env var NAMES and targets (never values).
  set-env <NAME> [targets]     Upsert env var <NAME> with the value read from the
                               injected env var of the same name.
                               targets default: production,preview,development
Redeploy afterwards (env changes need one): commit to main — Git is the button.
"""
import json
import os
import sys
import urllib.request
import urllib.error

TOKEN = os.environ.get("VERCEL_TOKEN") or ""
PROJECT = os.environ.get("VERCEL_PROJECT") or "prj_uq5TEbfHJq0gQVAs7Wd980qo7v5k"
TEAM = os.environ.get("VERCEL_TEAM") or "jayfromsandiego-3997s-projects"
BASE = "https://api.vercel.com"


def team_qs():
    if not TEAM:
        return ""
    return ("teamId=" + TEAM) if TEAM.startswith("team_") else ("slug=" + TEAM)


def req(method, path, body=None):
    url = f"{BASE}{path}{'&' if '?' in path else '?'}{team_qs()}"
    headers = {"Authorization": f"Bearer {TOKEN}", "Accept": "application/json"}
    data = None
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=45) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", "replace")
        try:
            return e.code, json.loads(raw)
        except json.JSONDecodeError:
            return e.code, raw
    except Exception as e:  # noqa: BLE001
        return 0, str(e)


def out(status, payload):
    print(json.dumps({"status": status, "result": payload}, indent=2, default=str))


def die(msg):
    print(json.dumps({"error": msg}, indent=2))
    sys.exit(2)


def cmd_verify():
    if not TOKEN:
        die("VERCEL_TOKEN missing — add it on the skill card.")
    s, b = req("GET", f"/v9/projects/{PROJECT}")
    ok = s == 200
    out("verify", {
        "token": "ok" if ok else f"FAIL ({s})",
        "project": (b or {}).get("name") if ok else b,
        "team_param": team_qs(),
    })


def cmd_list_env():
    s, b = req("GET", f"/v9/projects/{PROJECT}/env")
    if s != 200:
        out(s, b)
        return
    rows = [{"key": e.get("key"), "target": e.get("target"), "type": e.get("type")}
            for e in (b or {}).get("envs", [])]
    out(s, rows)


def cmd_set_env(name, targets):
    if not TOKEN:
        die("VERCEL_TOKEN missing — add it on the skill card.")
    value = os.environ.get(name) or ""
    if not value:
        die(f"{name} has no value on the skill card — add it there first; values never pass through chat.")
    body = {"key": name, "value": value, "type": "encrypted", "target": targets}
    s, b = req("POST", f"/v10/projects/{PROJECT}/env?upsert=true", body)
    safe = b if not isinstance(b, dict) else {k: v for k, v in b.items() if k != "value"}
    if isinstance(safe, dict) and isinstance(safe.get("created"), dict):
        safe["created"] = {k: v for k, v in safe["created"].items() if k != "value"}
    out(s, {"set": name, "targets": targets, "response": "ok" if s in (200, 201) else safe})


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    cmd = sys.argv[1]
    if cmd == "verify":
        cmd_verify()
    elif cmd == "list-env":
        cmd_list_env()
    elif cmd == "set-env":
        if len(sys.argv) < 3:
            die("usage: set-env <NAME> [targets]")
        targets = sys.argv[3].split(",") if len(sys.argv) > 3 else ["production", "preview", "development"]
        cmd_set_env(sys.argv[2], targets)
    else:
        print(f"unknown command: {cmd}\n{__doc__}")
        sys.exit(1)


if __name__ == "__main__":
    main()
