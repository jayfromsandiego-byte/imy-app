#!/usr/bin/env python3
"""
qc_site.py — site-wide render-safety QC for I Miss You Memorial.

Static checks over the three locked templates, the renderer, and the app
layout. Run from the repo root (or anywhere — it finds the repo by its own
location):

    python3 ops/qa/qc_site.py

What it asserts, per page:
  1. Structural tag balance — <section>/<div>/<main>/<header>/<footer>/<nav>
     open and close in matched pairs (the "section tag balance check").
  2. A sane viewport meta — width=device-width present; pinch zoom is never
     disabled (no user-scalable=no, no maximum-scale=1).
  3. The double-tap-zoom kill switch — html,body{touch-action:manipulation}
     lives in every template and in app/layout.tsx (fix 2).
  4. Every modal keeps a real exit — close controls exist for the identity
     sheet, gift sheet, lightbox, share-the-date, the tape room, the plus
     checkout sheet, and the a11y panel (fix 3).
  5. The mobile QA layer (#mq-layer) is present in every template, with the
     board two-column rule (fix 7) and the compact letter pass (fix 1).
  6. File shape — doctype first, </html> last, no stray {{TOKENS}} outside
     the tribute template (whose tokens the renderer fills).

Exit code 0 when everything passes; 1 with a FAIL list otherwise.
Stdlib only, no network, no build required.
"""
import os
import re
import sys
from html.parser import HTMLParser

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
APP = os.path.join(ROOT, "imy-app")
TPL = os.path.join(APP, "templates")

PASS, FAIL = [], []


def ok(name, cond, detail=""):
    (PASS if cond else FAIL).append((name, detail))
    print(("  ok  " if cond else "FAIL  ") + name + ((" — " + detail) if (detail and not cond) else ""))


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


# ── 1 · structural tag balance ────────────────────────────────────────────────
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link",
        "meta", "param", "source", "track", "wbr"}
STRUCTURAL = ("section", "div", "main", "header", "footer", "nav", "figure", "form")


class Balance(HTMLParser):
    """Counts open/close pairs for structural tags; <script>/<style> bodies are
    CDATA to the parser, so HTML inside JS strings never skews the count."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.open = {t: 0 for t in STRUCTURAL}
        self.close = {t: 0 for t in STRUCTURAL}

    def handle_starttag(self, tag, attrs):
        if tag in self.open:
            self.open[tag] += 1

    def handle_endtag(self, tag):
        if tag in self.close:
            self.close[tag] += 1


def check_balance(label, html):
    b = Balance()
    b.feed(html)
    for t in STRUCTURAL:
        if b.open[t] or b.close[t]:
            ok(f"{label}: <{t}> balanced ({b.open[t]} open / {b.close[t]} close)",
               b.open[t] == b.close[t],
               f"{b.open[t]} open vs {b.close[t]} close")


# ── 2 · viewport meta ─────────────────────────────────────────────────────────
def check_viewport(label, html):
    m = re.search(r'<meta[^>]+name=["\']viewport["\'][^>]*>', html, re.I)
    ok(f"{label}: viewport meta present", bool(m))
    if not m:
        return
    tag = m.group(0)
    ok(f"{label}: viewport uses width=device-width", "width=device-width" in tag)
    ok(f"{label}: pinch zoom never disabled",
       "user-scalable=no" not in tag and "maximum-scale=1," not in tag
       and not re.search(r"maximum-scale=1(\.0)?\b", tag))


# ── 3 · double-tap kill switch (fix 2) ────────────────────────────────────────
TOUCH = re.compile(r"html\s*,\s*body[^{}]*\{[^}]*touch-action\s*:\s*manipulation", re.S)


def check_touch(label, text):
    ok(f"{label}: html,body touch-action:manipulation (double-tap rests, pinch stays)",
       bool(TOUCH.search(text)) or "touch-action:manipulation" in text.replace(" ", ""))


# ── run ───────────────────────────────────────────────────────────────────────
def main():
    print("qc_site · I Miss You Memorial · static site QC\n")

    pages = {
        "landing": read(os.path.join(TPL, "landing.html")),
        "onboarding": read(os.path.join(TPL, "onboarding.html")),
        "tribute": read(os.path.join(TPL, "tribute-template.html")),
    }
    renderer = read(os.path.join(APP, "lib", "renderTribute.ts"))
    layout = read(os.path.join(APP, "app", "layout.tsx"))

    for label, html in pages.items():
        print(f"— {label} —")
        check_balance(label, html)
        check_viewport(label, html)
        check_touch(label, html)
        ok(f"{label}: doctype leads", html.lstrip().lower().startswith("<!doctype"))
        ok(f"{label}: </html> closes the file", html.rstrip().lower().endswith("</html>"))
        ok(f"{label}: mobile QA layer present", 'id="mq-layer"' in html)
        print()

    print("— app shell —")
    check_touch("app/layout.tsx", layout)
    print()

    print("— modal exits (fix 3) —")
    tri = pages["tribute"]
    ok("tribute: identity sheet has its X", 'id="idmClose"' in tri)
    ok("tribute: gift sheet has its X", 'id="gsClose"' in tri)
    ok("tribute: lightbox has its X", 'id="lbClose"' in tri)
    ok("tribute: sticky exits on phone sheets", ".idm .close2{position:sticky" in tri)
    ok("renderer: share-the-date has its X", 'id="sdClose"' in renderer)
    ok("renderer: tape room has its X", 'id="tvx"' in renderer)
    ok("onboarding: plus sheet gains an X (ckx)", "className='ckx'" in pages["onboarding"] or 'class="ckx"' in pages["onboarding"] or "x.className='ckx'" in pages["onboarding"])
    ok("landing: a11y panel has its close", "imy-a11y-close" in pages["landing"])
    print()

    print("— mobile fixes in place —")
    ok("tribute: board flows two columns (fix 7)", "calc(50% - 5px)" in tri)
    ok("tribute: board batching script (fix 7)", "mqmore" in tri)
    ok("tribute: checkbox row rebuilt (fix 6)", "humantxt" in tri)
    ok("onboarding: legacy back rests (fix 1)", ".back{display:none!important}" in pages["onboarding"])
    ok("onboarding: compact letter pass (fix 1)", ".paper{padding:30px 18px 36px" in pages["onboarding"])
    ok("onboarding: iOS inputs at 16px (no focus zoom-jump)", "font-size:16px" in pages["onboarding"])
    ok("landing: hamburger panel lives on body (fix 5)", "mqpanel" in pages["landing"])
    ok("landing: the hung frame fits one screen (fix 4)", ".lp-example{padding:40px 5% 52px}" in pages["landing"])
    ok("landing: the tribute counter stands in the hero", 'id="trbNum"' in pages["landing"] and "tributes · and counting" in pages["landing"])
    ok("landing: the hero speaks the counter, not the old pledge line", "free stays free · forever" not in pages["landing"])
    ok("landing: the permanence promise still lives below", "never charge a family" in pages["landing"])
    print()

    print("— tokens —")
    for label in ("landing", "onboarding"):
        stray = re.findall(r"\{\{[A-Z_]+\}\}", pages[label])
        ok(f"{label}: no stray template tokens", not stray, ", ".join(stray[:4]))
    print()

    print(f"{len(PASS)} passed · {len(FAIL)} failed")
    if FAIL:
        print("\nFailures:")
        for name, detail in FAIL:
            print(f"  ✗ {name}" + (f" — {detail}" if detail else ""))
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
