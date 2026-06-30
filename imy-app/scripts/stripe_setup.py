#!/usr/bin/env python3
"""Create the I Miss You Memorial product catalog in Stripe.
Run with the Stripe key in env (STRIPE_SECRET_KEY or STRIPE_API_KEY).
Prints the price IDs to paste into Vercel env. Idempotent-ish: creates new
products each run, so run once per environment (test, then live)."""
import os, json, urllib.request, urllib.parse

KEY = os.environ.get("STRIPE_SECRET_KEY") or os.environ.get("STRIPE_API_KEY") or ""
assert KEY, "No Stripe key in env"
MODE = "test" if KEY.startswith(("sk_test", "rk_test")) else "live"

def api(path, data):
    body = urllib.parse.urlencode(data, doseq=True).encode()
    req = urllib.request.Request("https://api.stripe.com/v1/" + path, data=body,
        headers={"Authorization": "Bearer " + KEY, "Content-Type": "application/x-www-form-urlencoded"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)

def product(name, desc):
    return api("products", {"name": name, "description": desc})["id"]

def price_once(pid, cents):
    return api("prices", {"product": pid, "unit_amount": cents, "currency": "usd"})["id"]

def price_month(pid, cents):
    return api("prices", {"product": pid, "unit_amount": cents, "currency": "usd",
        "recurring[interval]": "month"})["id"]

out = {"MODE": MODE}
plus = product("I Miss You Memorial — Plus", "Everything, made full and entirely theirs.")
out["STRIPE_PRICE_PLUS_ONCE"] = price_once(plus, 9700)
out["STRIPE_PRICE_PLUS_MONTHLY"] = price_month(plus, 1200)
heir = product("I Miss You Memorial — Heirloom", "Kept for generations.")
out["STRIPE_PRICE_HEIRLOOM"] = price_once(heir, 20000)
book = product("Keepsake Book", "A printed linen keepsake book, mailed.")
out["STRIPE_PRICE_BOOK"] = price_once(book, 9900)
print(json.dumps(out, indent=2))
