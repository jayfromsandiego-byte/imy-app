# I Miss You Memorial — Questionnaire Redesign · Relaunch Brief
**Packaged: August 20, 2026 · from Hyperagent thread cmszlkr7c09qh06ade0vl9o9w**

Attach this zip to the first message of the new thread and say "resume from the relaunch brief." Everything needed is in this folder; nothing depends on the old thread.

---

## What this work is

A full redesign + first-principles rework of the onboarding questionnaire ("the letter") at `/onboarding`, done against the **preview/landing-redesign-aug18** branch of `jayfromsandiego-byte/imy-app`. All changes live in **`onboarding-preview-aug18.html`** (this folder) — a working, clickable standalone build of `imy-app/templates/onboarding.html` with every approved change applied. **None of it is committed to the app templates yet.**

## The files

| File | What it is |
|---|---|
| `onboarding-preview-aug18.html` | THE working file. The letter with all changes below. Fonts inlined as data URIs; `/art/` + `/brand/` assets pointed at production; API calls left relative (submissions inert in preview). |
| `landing-preview-aug18.html` | Reference: the redesigned landing from the same branch (source of the design language). |
| `letter-redesign-direction.html` | The approved design direction ("The Letter, Redressed") — landing token inventory, what left/arrived, progress options. |
| `letter-audit.html` | The 18-screen first-principles audit (keep/tune/rework verdicts + screen grammar + friction principles). |
| `questionnaire-research.html` | The intake-form research (8 industry examples, comparison, 7 apply-regardless items). |

## Decisions locked (in order)

1. **Hybrid direction (Approach D):** the single-session letter creates the page today; gentle drip prompts + family contributions deepen it after. Drip phase not built yet.
2. **Section one changes (built):** welcome names the count ("eighteen small questions") + "page takes shape as you answer" row; relationship moved to nº 02; the letter speaks the loved one's name from Q2 on (`st.qe` + `{n}` token, escaped, refreshed in `onShow`).
3. **Redress (built):** landing lockup (mark + full wordmark), gilded-thread progress with chapter knots (flowers/garland retired), gold small-caps eyebrows ("part i · who they were"), scrapbook props gone (tape, pin stamp, dashed borders, paper sheet, sprigs, motes), white inputs/chips/pills with warm shadows, film grain on body, landing rise motion.
4. **Aug 19 batch (built):** moments rebuilt **chapter-first** (chapter cards contain their moments: year + what happened + photo; data shape unchanged `{year,text,chapter,photoUrl}` + `A.chapters`); dates are **month/day/year selects** (no typing; year required, month/day optional — partial dates allowed); tiles step **removed**, replaced by **"What did they really love?"** builder (`A.loves = [{text, photoUrl}]`, `A.lovedThings` kept in sync); seal screen decluttered (plain hairline review, de-bolded plan cards); **type floor raised** for older users.
5. **Brand type rule:** the wordmark is **Besley 800, always** — header and title uses, `Miss` italic terracotta, Night Stone mark included. (Root cause of two rounds of feedback: `.wm` had no font-weight.)
6. **Welcome hierarchy:** "a letter for the one you miss" is a small gold small-caps whisper; the headline leads.

## Bugs found on the branch (fixed in the working file, NOT yet on the branch)

- **Garland array bug:** `kinds`/`rots` have 16 entries, loop draws 18 → blooms 17–18 render `href="undefined"` + a 404 on every production load. Fix: `kinds[i%kinds.length]`, `rots[i%rots.length]`. (Garland is retired in the redress, but main still has it.)
- **Memory-card thumbnail:** `img.src=m.photoUrl` unguarded when no photo.

## Before this ships (open work)

1. **Backend wiring:** `A.loves` is NOT in `payload()` → `/api/intake` → Airtable. Partial dates ("1937") may not fit Airtable date fields — check schema, maybe text fields or default month/day.
2. **Tribute page:** build the owner-editable "what they really loved" section (replaces "who they really were") rendering `loves` with photos.
3. **Commit path:** per the imy-app-source skill protocol — fetch live blob at HEAD, apply diffs, ship through a preview branch. Never commit mirror files.
4. **Audit items approved but not yet built:** story-screen starter chips, review-with-change-links before seal, pronoun grammar after Q4 ("her" not "them"), photo-in-arch preview, obituary paste-or-skip, email trust whisper, chip Enter-advance.

## Where things live

- **Repo:** github.com/jayfromsandiego-byte/imy-app (app in `imy-app/`) · branch `preview/landing-redesign-aug18` (newest preview) · production = `main` (~2 min deploy)
- **This bundle on GitHub:** branch `wip/questionnaire-redress-aug19`, folder `design/questionnaire-redress/`
- **Notion:** I Miss You Memorial board → handoff page (Side Quest → Side Projects → I Miss You Memorial)
- **Skills to load in the new thread:** `imy-app-source` (repo + deploy protocol + incident notes), `imy-studio-discipline` (verification before completion)

## How to resume

1. Open `onboarding-preview-aug18.html` (publish it as a webpage artifact to click through).
2. Read "Before this ships" above — that's the queue.
3. For deploys: `FetchSkillScripts('imy-app-source')` and follow the incident protocol (live blob at HEAD, preview branch first).
