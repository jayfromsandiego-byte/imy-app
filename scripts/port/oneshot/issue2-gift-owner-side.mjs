// scripts/port/oneshot/issue2-gift-owner-side.mjs — Issue 2/6, the owner-side
// entry points of the gift path, patched into the unified bundle (one-shot;
// run once from repo root, commit the regenerated bundle):
//
//   · pg-studio, step 13 (address + plan): under the plan cards, a quiet note
//     telling the owner that family and friends can purchase the page for them
//     — the visitor-side "Give this page" door on the published page is where
//     that gift is given ($197 once, family_unlock; ownership never moves).
//   · pg-checkout: the same note under the keep-free door, so the owner who
//     reaches checkout and hesitates knows someone else can carry the cost.
//
// Voice: quiet, warm, no exclamation points, the price written only as $197 once.
//
//   node scripts/port/oneshot/issue2-gift-owner-side.mjs

import { patchBundle } from "../bundle-lib.mjs";

const STUDIO_GIFTNOTE =
  '<div class="giftnote"><b>Someone else paying?</b> Your family and friends can purchase this for you. ' +
  "Publish the free page, share it, and they&rsquo;ll find <b>Give this page</b> waiting on it — " +
  "$197 once opens everything, and the page stays yours to edit.</div>";

const CHECKOUT_GIFTNOTE =
  '<p class="giftnote2"><b>Someone else paying?</b> Your family and friends can purchase this for you — ' +
  "keep the free page for now, share it, and they can give Plus straight from the page. $197 once.</p>";

patchBundle({
  pages: {
    "pg-studio": (p) => {
      // The note rides inside the same conditional as the plan cards, so a
      // page that is already Plus never sees it.
      p.mustReplace(
        "'<ul><li>Unlimited photographs and videos</li><li>'+esc(P().C)+' voice — voicemails and recordings, kept</li><li>A chosen address · imissyoumemorial.com/theirname</li></ul></button>'+\n     '</div>';",
        "'<ul><li>Unlimited photographs and videos</li><li>'+esc(P().C)+' voice — voicemails and recordings, kept</li><li>A chosen address · imissyoumemorial.com/theirname</li></ul></button>'+\n     '</div>'+\n     '" +
          STUDIO_GIFTNOTE.replace(/'/g, "\\'") +
          "';",
        "step 13 · gift note under the plan cards"
      );
      p.mustReplace(
        ".plancard.plus.on .pc-ring::after{background:var(--gold)}",
        ".plancard.plus.on .pc-ring::after{background:var(--gold)}\n.giftnote{margin-top:14px;background:var(--cream-deep);border:1.5px dashed rgba(138,90,60,.45);border-radius:14px;padding:14px 16px;font-size:13.5px;line-height:1.65;color:var(--ink-soft)}\n.giftnote b{color:var(--ink)}",
        "giftnote styles"
      );
      p.mustContain("Someone else paying?", "owner-side copy present");
    },
    "pg-checkout": (p) => {
      p.mustReplace(
        '      <div id="freeKeep" style="display:none;text-align:center;margin-top:14px">\n        <button class="keepfree" id="keepFreeBtn">Keep the free page — see it live</button>\n      </div>',
        '      <div id="freeKeep" style="display:none;text-align:center;margin-top:14px">\n        <button class="keepfree" id="keepFreeBtn">Keep the free page — see it live</button>\n      </div>\n      ' +
          CHECKOUT_GIFTNOTE,
        "checkout · gift note under the keep-free door"
      );
      p.mustReplace(
        ".simnote{margin-top:12px;font-family:'Work Sans',sans-serif;font-size:11px;line-height:1.55;color:#5c5249;text-align:center}",
        ".simnote{margin-top:12px;font-family:'Work Sans',sans-serif;font-size:11px;line-height:1.55;color:#5c5249;text-align:center}\n  .giftnote2{margin-top:18px;border-top:1px solid rgba(44,37,32,.12);padding-top:14px;font-family:'Work Sans',sans-serif;font-size:12px;line-height:1.7;color:#5c5249;text-align:center}\n  .giftnote2 b{color:var(--ink)}",
        "giftnote2 styles"
      );
      p.mustContain("Someone else paying?", "owner-side copy present");
    },
  },
});
