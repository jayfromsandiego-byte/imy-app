# everlasting-stripe-payments (skill doc export · Aug 24, 2026)

Stripe live-mode access for I Miss You Memorial. The key is LIVE — real charges, real grieving families. Treat every write with care.

Pricing REPRICED July 27, 2026 (PR 13, founder decision): Plus $197 once or $29/month with a 3-day trial · Family Unlock $197 (reuses the Plus one-time price). NOTE (Aug 22, 2026, founder decision in the unified-app thread): the MONTHLY option is retired product-wide — $197 lifetime only. Grandfathered $12/month subscribers keep their price. Fulfillment: the app's webhook at /api/stripe/webhook.

## Credential
- STRIPE_API_KEY — the live secret key (scripts also accept STRIPE_SECRET_KEY).

## The live catalog (do not re-mint)
- Plus $197 once → price_1Txf6MCQ9sOzdRvOKk8cyHkE (minted July 27, 2026)
- Plus $29/month 3-day trial → price_1Txf6MCQ9sOzdRvO72IlpfZA (retired from product Aug 2026; still active in Stripe)
- Superseded but active: $97 once price_1To63SCQ9sOzdRvOtCDfjjrx · $12/month price_1To63SCQ9sOzdRvO0lqbtgfq — never attach to new checkouts.
- Other live IMY products: Funeral Homes $199/month · Remembrance Annual $49/year.
- Webhook we_1Tq6e9CQ9sOzdRvOEdRREwiV → https://imissyoumemorial.com/api/stripe/webhook (checkout.session.completed, customer.subscription.updated/deleted, charge.refunded, invoice.payment_failed). Healthy July 27.
- Promo history: FOUNDER100, IMYTEST100 expired · IMYPROOF100 spent July 27 proving one-time checkout end to end.

## CAUTION: shared Stripe account
Also carries SOLENE, SD Turf Center, Google Workspace resale, hosting, ads packages — active non-IMY subscriptions exist. Never bulk-cancel/refund/archive by list position; match exact price/product/subscription IDs. IMY revenue reporting filters by product.

## Common calls (curl via RunWithCredentials)
- Sessions: GET /v1/checkout/sessions?limit=5 · inspect one for payment_intent/customer
- Events/webhook health: GET /v1/events?limit=10 → pending_webhooks=0 everywhere means delivered
- Refund: POST /v1/refunds -d payment_intent=pi_… (webhook rests features; nothing deleted)
- Promo mint: coupon (percent_off, duration=once) → promotion code (max_redemptions, expires_at)

## House rules
- Purchases route through Stripe web checkout. Permanence Pledge: lapse or refund rests features, never deletes. Statement descriptor verified July 2026 — do not change casually.
- Script stripe_setup.py (catalog creator, NOT idempotent) — canonical copy in repo at imy-app/scripts/stripe_setup.py.
