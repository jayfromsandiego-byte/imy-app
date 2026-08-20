# I Miss You Memorial · Dashboard Redesign Handoff

**The Sharpened Desk · design locked at v8 · August 20, 2026**
Origin thread: https://hyperagent.com/thread/cmszl6yvb09tf07ad3d19aofi
Prepared for relaunch in a new agent/thread. Everything needed to resume is in this folder.

---

## What this is

A complete redesign of the caretaker dashboard for imissyoumemorial.com, taken from research through four candidate directions to a fully clickable prototype refined across seven feedback rounds (v2–v8). The prototype is a single self-contained HTML file dressed with real data from the live example page (Eleanor Margaret Hayes, /sites/eleanor). Nothing has been built into imy-app yet — the next phase is the implementation plan and the real build.

## Files in this folder

| File | What it is |
|---|---|
| `sharpened-desk.html` | **The deliverable.** Clickable prototype, v8, design locked. Open in any browser. |
| `four-directions.html` | The four candidate directions compared side by side (B won) |
| `dashboard-study.html` | The research compendium: 23 dashboards, 12 UX laws, grief lens, anatomy |
| `dashboard-suggestions.html` | 13 prioritized feature suggestions with visual examples (Tier 1 + picks built into v8) |
| `dashboard-preview.html` | The original static recreation of the OLD production dashboard (before redesign) |
| `HANDOFF.md` | This file |

## Published links (live renders of the same files)

- Prototype v8: https://pub.hyperagent.com/p/426mc5Qj-EMAEaj8eMLbndW3w6orDO9rnPURjXJBhys
- Four directions: https://pub.hyperagent.com/p/uGMclDIFafmdvgvurCIVlHvy5xMhTm3tLEdhBRYahyM
- Research study: https://pub.hyperagent.com/p/lcDAptNpR6OEYHt43I4Q5lFrycM1C8fsOXRe8FkU4q0
- Suggestions board: https://pub.hyperagent.com/p/tHjZSwj_14sNCp_4youK1NktVWZoiW5bOWMKb-zTWpw
- Old dashboard recreation: https://pub.hyperagent.com/p/hrZq9CqbBOhPevpTuwY9UmfxqubgVQVdsIAhi7GAHbE

---

## The locked decisions (v2–v8, chronological)

### Language & tone (v2, v3)
- No comforting or wishy-washy copy anywhere on the dashboard. Plain functional language, immediately understandable for older users.
- No em dashes in sentences (dates are fine). Periods, colons, middots.
- Buttons name the action only (Delete, Restore, Archive memory). The destination is communicated in the undo toast, per the Gmail/Google Photos pattern. Confirmation dialogs only for irreversible actions.
- Action buttons are solid so they read as clickable; destructive buttons (Delete, Delete forever) are red **outline**; the solid red appears only on the final confirm inside the Are-you-sure dialog.
- The dashboard is **universally pronoun-free** in its chrome: The page, The story, Details, Share the page. Pronouns exist only as a setting (used on the public tribute page), edited in the Details modal. Helper prompts use the person's name.

### Moderation model (v2, v3, v5)
- Semantics are **Approve / Decline** (button copy: "Approve to page" / "Decline").
- Overview hosts an auto-advancing conveyor (decide → next memory rises in place, dots ● ○ ○, undo whisper on every decision, no time window).
- **Approvals** section (renamed from Waiting for you) has four tabs: Waiting, On her page → "On the page", Archive, Log.
- Archive is first-class: declined memories, taken-down memories, and deleted photos all land there with Restore and Delete forever (Delete forever requires an Are-you-sure dialog).
- Approved memories can be archived later ("Archive memory").
- The Log is a full chronological record: approvals, declines, restores, renames, invites, role changes, exports, edits.

### Pictures (v2, v3, v8)
- Every photo has a title (contributors title theirs), plus its page placement (Cover, Timeline · chapter, Board · name) and who added it.
- Clicking a photo opens management: rename (Save title), Set as cover, Delete (→ archive), see it live.
- **Photo restoration** (Plus, fal.ai pipeline exists as a skill): before/after preview, then an explicit choice — Keep the restored photo, or Keep the old one.

### The story (v3, v4, v5)
- The story = the obituary (editable, add paragraphs) + the timeline chapters.
- Timeline chapter **years are locked** (derived from photo dates); only the chapter name is editable. Chapters edit inline.
- Timeline suggestions integrate silently: a quiet dismissible row ("4 new photos match Half Moon Bay") with Add them / Not now.
- The **writing helper** ships as a visible preview until the AI API is attached: Jog my memory (name-based questions, tap to start the sentence), Start a sentence for me, Tidy what I wrote (before/after example). Helper suggests; the family decides.

### Pricing & billing (v2, v3, v4)
- **PRICING CHANGE: Plus is $197 once only. No monthly, no trial.** (Supersedes the July 26 Ladder B $29/month option — brand bible and live pricing page still need this update.)
- Billing uses the standard plan-cards pattern: current plan quiet with a "Current plan" badge and no button; Plus is the dark hero card with the single flame (#F4B860) CTA.
- Plan line items mirror the live site. Free: page online forever, up to 12 photographs and 10 memories, visitors add memories and send flowers, a shareable link. Plus: unlimited photos/videos/memories, custom address, memorial video, voicemails + visitor voice memories, AI writing tool, credit removed.
- Payment method (add/update/remove card) and billing history live on the Billing page (Stripe in the real app).
- **FEATURE CHANGE: candles are removed from the product.** Flowers only. (Live tribute pages and pricing table still show candles — same-scope update needed at build time.)

### Access & account (v4, v5, v6, v8)
- Four roles: **Owner / Admin / Editor / Viewer** (Owner: billing, ownership, delete forever; Admin: approve, archive, edit everything; Editor: adds photos and memories without approval; Viewer: sees the dashboard). Visual capability table, not a paragraph.
- Section is called **Share**, led by the share link + Copy, then Who has access, roles as dropdowns.
- Ownership transfer: small quiet "Make owner" pill LEFT of the role dropdown (accident-proof), then a dialog that **shows the email to type** and requires typing it exactly.
- **Custom address (change the URL) is a Plus feature** surfaced in Share.
- Privacy control in Share: Public / Unlisted / Password segmented control; choosing Password reveals an inline set-the-password field.
- Emails card: memory-waiting (with approve/decline from the email itself), weekly summary, anniversary reminder (off by default).
- **Export** lives in Account as a collapsible card, NOT a nav tab: checkbox list (photos, videos, memorial video, obituary+timeline, memories, page details) with All toggle; also "Create a service program". Real build note: choose the most convenient format — likely ZIP of media plus a document.
- **Danger zone**: Delete account = two-step (Are-you-sure dialog → type your full email). Deletes every owned page. (Deliberate exception to pages-never-deleted, for user control/GDPR.)
- Person details (name, dates via native date pickers with validation, pronouns, photo) edit via the identity block top-left, not Account.

### Multi-page (v5)
- "Your pages ▾" switcher under the identity block (mobile topbar opens it): lists pages with active state, switches desks, "Begin another page" (starts free), "Edit details".

### Overview composition (v7 final)
- Verdict line ("3 memories are waiting for your approval.") → week strip (This week · 26 visits · 9 flowers · 2 new memories — counts only, no charts) → conveyor → Page checklist (wall/pictures/story ✓, voice ✕ → Plus) → five minis (Pictures, Videos, The story, The anniversary, Share) → flowers vigil band.
- Desk-clear state: "Nothing is waiting." + link to the log and archive.

### Mobile
- Sidebar collapses at 840px to a top identity bar (opens the pages drawer) + four bottom tabs (Desk, Approvals+badge, Pictures, Household). 44px+ targets throughout.
- The accessibility pill row (A−/A/A+, high contrast, pause motion) bottom-left everywhere, consistent with tribute pages.

---

## Flags & open items for the build

1. **Live site inconsistencies to resolve when building:** pricing page still shows $29/month + trial; tribute pages and pricing table still show candles. Both superseded by the decisions above.
2. **Brand bible needs updating** to the new pricing (Plus $197 once only) and candle removal once Autumn confirms them as final-final.
3. The AI writing helper needs its API attached (helper UI is a working preview).
4. Export format decision deferred to build time (ZIP + document recommended).
5. Roles/archive/multi-page all need data models in Supabase — nothing exists in imy-app yet.
6. Approve-from-email needs magic-link plumbing (Resend skill exists).
7. Photo restoration pipeline exists as the imy-photo-restoration skill (fal.ai) — needs wiring into the dashboard flow.

## How to resume in a new thread

1. Attach this ZIP (or point the agent at the GitHub branch design/dashboard-2026-08, folder docs/design/dashboard-2026-08/).
2. Say: "This is the locked v8 dashboard redesign for imissyoumemorial.com. Read HANDOFF.md first. The prototype is sharpened-desk.html."
3. Natural next step: the implementation plan — mapping the prototype onto imy-app/app/dashboard (page.tsx, layout.tsx, study.css), new Supabase models (archive, roles, multi-page), Stripe changes ($197 once), candle removal scope, and a preview branch to build on.

*Prepared by I Miss You Memorial Studio · from the thread above · all click-flows in the prototype were browser-verified at each version.*
