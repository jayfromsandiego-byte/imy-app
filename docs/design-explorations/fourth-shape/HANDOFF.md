# I Miss You Memorial · Fourth Shape Redesign — Relaunch Handoff
**Date:** August 20, 2026 · **From:** I Miss You Memorial Studio agent · **Owner:** Autumn
**Prior threads:** `cmt0qsb731gib06ad0w2v5orz` (Aug 19 — background/river exploration) → `cmt1s0ppa1de807adpnvy24bo` (Aug 20 — first-principles redesign)

## What this bundle is
Everything needed to resume the tribute-page redesign in a fresh thread. The working page
(`eleanor-fourth-shape.html`) is a fully functional standalone HTML — open it or republish it
and continue iterating. The other files are the design-thinking artifacts that got us here.

## Files
| File | What it is |
|---|---|
| `eleanor-fourth-shape.html` | **THE WORKING PAGE** — the Fourth Shape redesign, all features live (v5 state) |
| `hero-lab.html` | 5 hero variations: moments-as-hero with background options (awaiting Autumn's pick) |
| `formatting-lab.html` | 3 desktop problems × 5 variations (decided: A1 + B2-moments + C2) |
| `fourth-shape.html` | The Fourth Shape mockup doc (phone + desktop mocks, timeline lab, gaps) |
| `three-shapes.html` | Direction comparison: Portrait / Album / Vigil interactive phones |
| `design-brief.html` | First-principles design brief: jobs, psychology, audit, inspiration |

## Published artifacts (live, interactive)
- Working redesign: https://pub.hyperagent.com/p/8sOfp7PpDBco2zI93O10w5tp0pJkvh3H5MGPqcbtg94
- Hero lab (5 variations, undecided): https://pub.hyperagent.com/p/ebyibXdD0xT9Q2fZYvZ5c-yHMi67akrUmRRVHOH74_o
- Formatting lab: https://pub.hyperagent.com/p/scvwNDP2B2ALvv3XjxsI_E10GeAwoDHut-O_XFkhrXE
- Fourth Shape mockup doc: https://pub.hyperagent.com/p/u_yjswXk8gzyuzdfDpchmTIcUnJdCbbpDaAD-Vg0-5o
- Three shapes comparison: https://pub.hyperagent.com/p/MSEai7QiE2Rjuo-WGnD0KBB9lty6WHZGaCRU3PtdRlc
- Design brief: https://pub.hyperagent.com/p/IvHxCF2qCqQHUe_wg-GuXiFpw7LMJI7njhunSdbCHxI

## Locked decisions (July 2026 brand bible still canon; these are the Aug 20 additions)
1. **Direction D "Fourth Shape"** won: one page, four rooms behind button-tabs (Memories · Photos · Her life · Service), Memories default.
2. **Top toolbar**: landing-page toolbar (brand, Remember/Example/How it works/Pricing, Log in, Start a tribute) — transparent over the hero, solid cream on scroll (0.35s ease, mark swaps reversed↔walnut).
3. **Hero (current)**: full-bleed photo + frosted glass panel bottom-left (blur 14px, saturate 175%, fill ~25%) carrying name / dates / her quote. **Pending: Hero Lab pick** — moments-trio-as-hero with 5 background options (H1 tinted portrait is studio pick; Autumn deciding).
4. **C2 slim ribbon**: tabs left · visits count center · Share right — one sticky 56px row under the toolbar. Funeral/service card REMOVED from the fold (service lives in its room; flyer keeps the date until it passes).
5. **Share hub + flyer**: Share opens the flyer overlay (In Loving Memory, arched portrait, real QR to eleanor.imissyoumemorial.com, Send by text / Download(print) / Copy link). After the service the flyer becomes the page's permanent card.
6. **Flowers & candles fully retired** (cheesy, not gender-universal). Replaced by **total visits count** ("♥ 12,438 people have visited her page") that grows on its own. Hearts remain only on individual memories.
7. **Memories room order**: stage-and-wings moments trio (3 lined up, auto-advance 4.5s, tap wings to walk, tap stage → viewing room) → centered relation chips (Everyone/Family/Friends/Neighbors/Her students, live filter) → memory cards in old format ("together" snapshot + title + story + hearts + expandable comments) → all-ten door → river of one-liners drifting left. NOTE: if a Hero Lab variation wins, the trio moves to the hero and leaves the memories room.
8. **Memory format**: title (subject line) + story body + author/relation. Comments show "waiting for the family" tag on submit.
9. **"A moment of hers"** naming (never "on this day" — dates can't be guaranteed). Honest date language: "around 1988", "from her photographs", "placed by the family".
10. **Her life**: A1 arrow rail — 8 chapters on the golden line with ‹ › paging + edge fades; flat chapter book below (tappable year rail left, photo answering right, like the original book).
11. **Photos**: batches auto-crossfade ~2.2s (pause on hover), "All photographs" door opens full grid, click → dark viewing room (arrows, Escape, keyboard).
12. **Leave a memory**: floating pill bottom-right (desktop) / full-width bottom (mobile) → modal: name + relation, title, story, add photos, voice; submit → "It's with the family now." Moderation line under everything: "every word waits for the family before it appears."
13. **Footer**: four-column walnut (brand+pledge · Begin · Plans · Care · bottom bar © / Made with love).
14. **A11y bar**: 44px+ targets, no hover-only reveals, reduced-motion respected everywhere, glow/shadow for text over photos.

## Open questions for the next session
- **Hero Lab pick** (H1 tinted portrait / H2 open sky / H3 leaf bed / H4 gallery wall / H5 morning paper, or a blend) — then remove the trio from the memories room.
- Mobile pass on the v5 working page (ribbon wrap, trio stacking) not yet reviewed.
- Post-service flyer state designed in copy only (footnote) — needs the actual dateless variant.
- Production migration plan for imy-app (renderer tokens → Fourth Shape template) not started. REMEMBER: committing to main deploys production (~2 min); templates in imy-app/templates/ are locked HTML finals.

## Demo data notes
All content uses Eleanor's demo assets (supabase tribute-media photos + imissyoumemorial.com/art/mem-demo). Visits ticker and QR are real/live. The old production page stays untouched at imissyoumemorial.com/sites/eleanor.

## How to resume in a new thread
Upload this zip (or point the agent to the GitHub branch below), say "continue the Fourth Shape redesign from HANDOFF.md" — the working page republishes from `eleanor-fourth-shape.html` via PublishWebpage.

**GitHub backup:** branch `design/fourth-shape-handoff` in `jayfromsandiego-byte/imy-app` under `docs/design-explorations/fourth-shape/`
**Notion:** handoff page on the I Miss You Memorial board (Side Quest → Side Projects → I Miss You Memorial)
