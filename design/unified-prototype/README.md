# Unified app prototype · v1 (August 2026)

One linked experience built from the four v14 design finals: landing → Before You Begin sign-in → the Studio → the tribute page → the dashboard → Plus checkout. Approved as the design source for the production port.

**Try it:** the built file is served on this branch at `/preview/unified.html`
(hash-routed: `#/` landing · `#/signin` · `#/studio` · `#/site/<slug>` · `#/dashboard` · `#/checkout`).
Demo shortcut: append `#/seed` for a signed-in account with a filled memorial (`#/seedplus` for the Plus variant).

## What this locks in

- **Pricing** — $197 lifetime only; the monthly option is retired everywhere. Second Plus memorial on a Plus account: 20% off ($157.60). AI photo restoration joins the Plus feature list.
- **Accounts** — free account keeps one memorial; a Plus purchase unlocks more (free additions allowed).
- **Addresses** — free pages get a fully random slug (10 letters); choosing the name is a Plus perk at checkout.
- **The Studio** — the letter asks only what the page renders (audit cut: nickname, story block, "what they loved", the song). Steps mirror the page's rooms and sync both ways; the preview is the real tribute in edit mode — tap anything on it to jump to its question. All date fields are pickers. Family entries carry a relationship that drives tree placement.
- **Sign-in** — name + email, or Google; no "quiet link" line. Copy earns its place or goes.
- **Eleanor** — `#/site/eleanor` renders the pristine design final; user pages hydrate the same document through `IMY_OVERRIDE`.

## How it's built

Each page stays a complete HTML document (the locked finals are never reshaped — data-array overrides and appended hydrator/bridge scripts only). `src/build.mjs` patches the pages, injects `src/*.js`, base64-embeds everything into `src/shell.html` (router + state + composer), and writes `dist/imy-unified.html`:

    node src/build.mjs
    → dist/imy-unified.html  (copy to imy-app/public/preview/unified.html to serve)

`pages/` holds the four source finals plus the two new pages (signin, checkout). `builder-ref.html` is the studio's donor shell.

## Prototype limits (by design, for this pass)

- Google sign-in and Stripe checkout are simulated; state is per-visit (no backend). The production port wires Supabase auth + Stripe and replaces the shell's state store.
- Tapes are title/when/cover entries; real video upload arrives with the port.
