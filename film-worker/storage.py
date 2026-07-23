"""storage — where finished films live.

R2 first (zero egress — the Permanence Pledge's economics), the moment the
R2_* keys exist; until then, Supabase Storage (public bucket `tribute-films`).
Same env names as imy-app/lib/r2.ts so one checklist configures both.
"""
import os
import requests

R2_ACCOUNT = os.environ.get("R2_ACCOUNT_ID", "")
R2_KEY = os.environ.get("R2_ACCESS_KEY_ID", "")
R2_SECRET = os.environ.get("R2_SECRET_ACCESS_KEY", "")
R2_BUCKET = os.environ.get("R2_BUCKET", "")
R2_ENDPOINT = os.environ.get("R2_ENDPOINT", f"https://{R2_ACCOUNT}.r2.cloudflarestorage.com" if R2_ACCOUNT else "")
R2_PUBLIC = (os.environ.get("R2_PUBLIC_BASE_URL", "")).rstrip("/")

r2_configured = bool(R2_KEY and R2_SECRET and R2_BUCKET and R2_ENDPOINT and R2_PUBLIC)

SB_URL = (os.environ.get("SUPABASE_URL") or "").rstrip("/")
for suf in ("/rest/v1", "/storage/v1", "/auth/v1"):
    if SB_URL.endswith(suf):
        SB_URL = SB_URL[: -len(suf)]
SB_KEY = (os.environ.get("SUPABASE_SERVICE_ROLE_KEY_V2")
          or os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
SB_BUCKET = os.environ.get("FILMS_BUCKET", "tribute-films")


def _upload_r2(local_path, key, content_type):
    import boto3
    client = boto3.client(
        "s3", region_name="auto", endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_KEY, aws_secret_access_key=R2_SECRET,
    )
    extra = {"ContentType": content_type, "CacheControl": "public, max-age=31536000, immutable"}
    client.upload_file(local_path, R2_BUCKET, key, ExtraArgs=extra)
    return f"{R2_PUBLIC}/{key}"


def _upload_supabase(local_path, key, content_type):
    with open(local_path, "rb") as f:
        body = f.read()  # bytes, not a stream: an explicit Content-Length every time
    r = requests.post(
        f"{SB_URL}/storage/v1/object/{SB_BUCKET}/{key}",
        headers={
            "apikey": SB_KEY,
            "Authorization": f"Bearer {SB_KEY}",
            "User-Agent": "imy-film-worker/1.0",
            "Content-Type": content_type,
            "x-upsert": "true",
        },
        data=body, timeout=600,
    )
    if not r.ok:
        raise RuntimeError(f"storage upload {r.status_code}: {r.text[:300]}")
    return f"{SB_URL}/storage/v1/object/public/{SB_BUCKET}/{key}"


def upload(local_path, key, content_type):
    """Upload and return the public URL. A finished weave is precious —
    transient network failures get three tries before the job goes back."""
    import time
    last = None
    for i in range(3):
        try:
            if r2_configured:
                return _upload_r2(local_path, key, content_type)
            return _upload_supabase(local_path, key, content_type)
        except Exception as e:  # noqa: BLE001
            last = e
            if i < 2:
                time.sleep(4 * (i + 1))
    raise last
