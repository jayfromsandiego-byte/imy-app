"""email_notify — the letter that says the film is ready, via Resend.

Silent without RESEND_API_KEY, exactly like lib/email.ts. House quirk
(ops/README.md): Resend sits behind Cloudflare and rejects the default
Python User-Agent — send a browser-like UA.

Voice: short sentences. No exclamation points. No urgency.
"""
import os
import html
import requests

KEY = os.environ.get("RESEND_API_KEY", "")
FROM = os.environ.get("EMAIL_FROM", "I Miss You Memorial <hello@imissyoumemorial.com>")
SITE = (os.environ.get("SITE_URL") or "https://imissyoumemorial.com").rstrip("/")

UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")


def _shell(heading, body_html, cta_label, cta_url):
    e = html.escape
    return f"""<!DOCTYPE html><html><body style="margin:0;padding:0;background:#FAF5EC">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF5EC;padding:34px 0">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:92%">
        <tr><td style="font-family:Georgia,'Times New Roman',serif;color:#2C2520;font-size:19px;font-weight:bold;padding-bottom:26px">
          I <em style="color:#A87C5F">Miss</em> You Memorial
        </td></tr>
        <tr><td style="background:#ffffff;border:1px solid #e7dcc8;border-radius:14px;padding:36px 38px">
          <div style="font-family:Georgia,'Times New Roman',serif;color:#2C2520;font-size:24px;font-weight:bold;line-height:1.25;margin-bottom:14px">{heading}</div>
          <div style="font-family:Georgia,'Times New Roman',serif;color:#3a332b;font-size:16px;line-height:1.65">{body_html}</div>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 6px"><tr><td style="background:#A87C5F;border-radius:26px">
            <a href="{e(cta_url)}" style="display:inline-block;padding:13px 30px;color:#ffffff;text-decoration:none;font-weight:600;font-family:Georgia,'Times New Roman',serif;font-size:16px">{e(cta_label)}</a>
          </td></tr></table>
        </td></tr>
        <tr><td style="font-family:'Courier New',monospace;color:#8a7f70;font-size:11.5px;letter-spacing:.06em;padding:22px 6px;line-height:1.7">
          Every page stays online. We never charge a family to keep a memory alive.<br/>
          I Miss You Memorial · <a href="{SITE}" style="color:#A87C5F">imissyoumemorial.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>"""


def send_film_ready(to, first, pos, slug, token):
    """The film is ready. It appears on the page only when the family says so."""
    if not KEY or not to or "@" not in to:
        return False
    e = html.escape
    url = f"{SITE}/film/{slug}?t={token}"
    heading = f"The film of {e(pos)} life is ready."
    body = (f"<p style='margin:0 0 14px'>We wove {e(first)}'s photographs and memories into a short film. "
            f"The music is gentle, the words are your own.</p>"
            f"<p style='margin:0'>Watch it first, in private. It appears on the page only when you say so.</p>")
    try:
        r = requests.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json", "User-Agent": UA},
            json={"from": FROM, "to": [to], "subject": f"{first}'s film is ready",
                  "html": _shell(heading, body, "Watch the film", url)},
            timeout=30,
        )
        return r.ok
    except Exception:
        return False
