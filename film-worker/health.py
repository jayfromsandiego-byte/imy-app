"""Tiny health server for the external film worker.

Railway uses /healthz during deploy. The endpoint is deliberately quiet: no
tribute names, emails, URLs, or tokens ever leave the process.
"""
import json
import os
import threading
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

_state = {
    "status": "starting",
    "started_at": datetime.now(timezone.utc).isoformat(),
    "last_poll_at": None,
    "last_job_at": None,
    "current_job": None,
    "last_error": None,
}
_lock = threading.Lock()


def snapshot():
    with _lock:
        return dict(_state)


def update(**values):
    with _lock:
        _state.update(values)


def mark_poll():
    update(status="idle", last_poll_at=datetime.now(timezone.utc).isoformat(), current_job=None, last_error=None)


def mark_job(job_id):
    update(status="rendering", current_job=str(job_id or "")[:8], last_job_at=datetime.now(timezone.utc).isoformat(), last_error=None)


def mark_error(message):
    update(status="error", last_error=str(message or "worker-error")[:160], current_job=None)


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):  # noqa: N802
        if self.path not in ("/healthz", "/readyz"):
            self.send_response(404)
            self.end_headers()
            return
        body = json.dumps(snapshot(), separators=(",", ":")).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, _format, *_args):
        return


def start():
    port = int(os.environ.get("PORT", "8080"))
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    thread = threading.Thread(target=server.serve_forever, name="health-server", daemon=True)
    thread.start()
    return server
