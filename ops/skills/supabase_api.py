#!/usr/bin/env python3
"""
Supabase API helper for I Miss You Memorial (imy-app).

Talks to Supabase entirely over HTTPS (the agent sandbox blocks raw Postgres
wire connections on :5432/:6543, so this uses the REST + Management HTTPS APIs).

Credentials are injected as environment variables by RunWithCredentials:
  SUPABASE_URL                e.g. https://abcdwxyz.supabase.co   (required)
  SUPABASE_SERVICE_ROLE_KEY   service_role secret key             (required)
  SUPABASE_ACCESS_TOKEN       Management API token sbp_...        (optional; needed for SQL/DDL)
  SUPABASE_PROJECT_REF        project ref (auto-derived from URL if omitted)
  SUPABASE_ANON_KEY           anon public key                     (optional)

Stdlib only — no pip installs required.

Subcommands:
  verify                              Check which credentials work and what's ready.
  sql "<SQL>"                         Run SQL via the Management API (DDL/migrations/queries).
  sql-file <path>                     Run SQL read from a file.
  rest <GET|POST|PATCH|DELETE> <table> [json] [query]
                                      PostgREST CRUD, e.g. rest GET tributes "" "slug=eq.example"
  buckets list                        List Storage buckets.
  buckets create <name> [public]      Create a Storage bucket (public = true/false).
  users list [page] [perPage]         List auth users (admin).
"""
import json
import os
import sys
import urllib.request
import urllib.error
import urllib.parse

URL = (os.environ.get("SUPABASE_URL") or "").rstrip("/")
SERVICE = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or ""
ACCESS = os.environ.get("SUPABASE_ACCESS_TOKEN") or ""
ANON = os.environ.get("SUPABASE_ANON_KEY") or ""
REF = os.environ.get("SUPABASE_PROJECT_REF") or ""
MGMT = "https://api.supabase.com"


def project_ref():
    if REF:
        return REF
    host = urllib.parse.urlparse(URL).hostname or ""
    # https://<ref>.supabase.co  -> <ref>
    return host.split(".")[0] if host else ""


def _req(method, url, headers=None, body=None):
    data = None
    headers = dict(headers or {})
    # Per-endpoint User-Agent:
    # - api.supabase.com (Management API) is behind Cloudflare, which blocks
    #   default library UAs (error 1010) -> use a browser-like UA.
    # - The project APIs (PostgREST/Storage/Auth) REJECT secret keys when the
    #   UA looks like a browser ("secret key in browser") -> use a server UA.
    _host = urllib.parse.urlparse(url).hostname or ""
    if "api.supabase.com" in _host:
        headers.setdefault("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
    else:
        headers.setdefault("User-Agent", "imy-app-server/1.0")
    headers.setdefault("Accept", "application/json")
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers.setdefault("Content-Type", "application/json")
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=45) as r:
            raw = r.read().decode("utf-8")
            try:
                return r.status, json.loads(raw) if raw else None
            except json.JSONDecodeError:
                return r.status, raw
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", "replace")
        try:
            return e.code, json.loads(raw)
        except json.JSONDecodeError:
            return e.code, raw
    except Exception as e:  # noqa: BLE001
        return 0, str(e)


def _service_headers(extra=None):
    h = {"apikey": SERVICE, "Authorization": f"Bearer {SERVICE}"}
    if extra:
        h.update(extra)
    return h


def out(status, payload):
    print(json.dumps({"status": status, "result": payload}, indent=2, default=str))


def require(cond, msg):
    if not cond:
        print(json.dumps({"error": msg}, indent=2))
        sys.exit(2)


def cmd_verify():
    report = {"SUPABASE_URL": bool(URL), "service_role_key": bool(SERVICE),
              "access_token": bool(ACCESS), "project_ref": project_ref() or None}
    checks = {}
    # 1) REST reachability (service role)
    if URL and SERVICE:
        s, _ = _req("GET", f"{URL}/rest/v1/", headers=_service_headers())
        checks["rest_data_api"] = "ok" if s in (200, 404) else f"FAIL ({s})"
        s2, b2 = _req("GET", f"{URL}/storage/v1/bucket", headers=_service_headers())
        checks["storage_api"] = "ok" if s2 == 200 else f"FAIL ({s2}): {b2}"
    else:
        checks["rest_data_api"] = "missing SUPABASE_URL or service_role key"
    # 2) Management API (DDL) reachability
    if ACCESS and project_ref():
        s, b = _req("GET", f"{MGMT}/v1/projects/{project_ref()}",
                    headers={"Authorization": f"Bearer {ACCESS}"})
        checks["management_api_ddl"] = "ok" if s == 200 else f"FAIL ({s}): {b}"
    else:
        checks["management_api_ddl"] = "not configured (need SUPABASE_ACCESS_TOKEN to run SQL/DDL)"
    ready = {
        "data_crud_storage_auth": bool(URL and SERVICE),
        "sql_ddl_migrations": bool(ACCESS and project_ref()),
    }
    out("verify", {"present": report, "checks": checks, "ready_for": ready})


def cmd_sql(sql_text):
    require(ACCESS and project_ref(),
            "SQL/DDL needs SUPABASE_ACCESS_TOKEN (Management API token) + a project ref.")
    s, b = _req("POST", f"{MGMT}/v1/projects/{project_ref()}/database/query",
                headers={"Authorization": f"Bearer {ACCESS}"}, body={"query": sql_text})
    out(s, b)


def cmd_rest(method, table, body_json="", query=""):
    require(URL and SERVICE, "REST needs SUPABASE_URL + service_role key.")
    url = f"{URL}/rest/v1/{table}"
    if query:
        url += "?" + query
    body = json.loads(body_json) if body_json else None
    headers = _service_headers({"Prefer": "return=representation"})
    s, b = _req(method.upper(), url, headers=headers, body=body)
    out(s, b)


def cmd_buckets(action, name=None, public="false"):
    require(URL and SERVICE, "Storage needs SUPABASE_URL + service_role key.")
    if action == "list":
        s, b = _req("GET", f"{URL}/storage/v1/bucket", headers=_service_headers())
        out(s, b)
    elif action == "create":
        require(name, "bucket name required")
        body = {"id": name, "name": name, "public": str(public).lower() == "true"}
        s, b = _req("POST", f"{URL}/storage/v1/bucket", headers=_service_headers(), body=body)
        out(s, b)
    else:
        require(False, f"unknown buckets action: {action}")


def cmd_users(page="1", per_page="50"):
    require(URL and SERVICE, "Auth admin needs SUPABASE_URL + service_role key.")
    url = f"{URL}/auth/v1/admin/users?page={page}&per_page={per_page}"
    s, b = _req("GET", url, headers=_service_headers())
    out(s, b)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    cmd = sys.argv[1]
    a = sys.argv[2:]
    if cmd == "verify":
        cmd_verify()
    elif cmd == "sql":
        require(a, 'usage: sql "<SQL>"')
        cmd_sql(a[0])
    elif cmd == "sql-file":
        require(a, "usage: sql-file <path>")
        with open(a[0], "r", encoding="utf-8") as f:
            cmd_sql(f.read())
    elif cmd == "rest":
        require(len(a) >= 2, "usage: rest <METHOD> <table> [json] [query]")
        cmd_rest(a[0], a[1], a[2] if len(a) > 2 else "", a[3] if len(a) > 3 else "")
    elif cmd == "buckets":
        require(a, "usage: buckets list | buckets create <name> [public]")
        cmd_buckets(a[0], a[1] if len(a) > 1 else None, a[2] if len(a) > 2 else "false")
    elif cmd == "users":
        cmd_users(a[0] if a else "1", a[1] if len(a) > 1 else "50")
    else:
        print(f"unknown command: {cmd}\n{__doc__}")
        sys.exit(1)


if __name__ == "__main__":
    main()
