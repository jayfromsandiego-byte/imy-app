"""imy_api — the worker's line to Supabase (PostgREST + RPC), service-role only.

House quirk (ops/README.md): project APIs reject secret keys sent with a
browser-like User-Agent — always send a server UA to *.supabase.co.
"""
import os
import time
import requests


def _retry(fn, tries=3, base_wait=2):
    """Network blips never cost a finished weave: three tries, gentle backoff."""
    last = None
    for i in range(tries):
        try:
            return fn()
        except Exception as e:  # noqa: BLE001
            last = e
            if i < tries - 1:
                time.sleep(base_wait * (i + 1))
    raise last

URL = (os.environ.get("SUPABASE_URL") or "").rstrip("/")
# strip a known API suffix if the stored URL carries one
for suf in ("/rest/v1", "/storage/v1", "/auth/v1"):
    if URL.endswith(suf):
        URL = URL[: -len(suf)]
KEY = (os.environ.get("SUPABASE_SERVICE_ROLE_KEY_V2")
       or os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or "").strip()

H = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "User-Agent": "imy-film-worker/1.0",
    "Content-Type": "application/json",
}


def rpc(fn, body=None):
    def go():
        r = requests.post(f"{URL}/rest/v1/rpc/{fn}", headers=H, json=body or {}, timeout=45)
        r.raise_for_status()
        return r.json() if r.text else None
    return _retry(go)


def select(table, query):
    def go():
        r = requests.get(f"{URL}/rest/v1/{table}?{query}", headers=H, timeout=45)
        r.raise_for_status()
        return r.json()
    return _retry(go)


def patch(table, query, body):
    def go():
        r = requests.patch(f"{URL}/rest/v1/{table}?{query}",
                           headers={**H, "Prefer": "return=representation"}, json=body, timeout=45)
        r.raise_for_status()
        return r.json() if r.text else None
    return _retry(go)


def insert(table, body):
    def go():
        r = requests.post(f"{URL}/rest/v1/{table}",
                          headers={**H, "Prefer": "return=representation"}, json=body, timeout=45)
        r.raise_for_status()
        return r.json()
    return _retry(go)
