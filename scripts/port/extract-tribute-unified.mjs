// scripts/port/extract-tribute-unified.mjs — Gate 0 of the unified-tribute port.
//
// Decodes the design-truth unified tribute document (the base64 `pg-tribute`
// block inside imy-app/public/preview/unified.html) and freezes it into the
// production template imy-app/templates/tribute-unified.html, with:
//
//   (a) every demo fallback stripped to an EMPTY default — Eleanor's demo data
//       never reaches a real page, even from source (the same standing rule
//       renderTribute.ts:717-719 and the QA harness enforce on the wreath);
//   (b) the missing family-tree guard added — an empty PEOPLE/absent ROOT must
//       rest the tree room quietly, never throw and take the mobile bar, dots,
//       swipe, and Escape wiring in the same script block down with it (the
//       exact failure class of the wreath's "boards never ship empty-but-truthy"
//       lesson, renderTribute.ts:351-357);
//   (c) the head tokenized ({{TITLE}}, {{META_DESCRIPTION}}, OG block) so
//       crawlers and link previews see the real person — the hydrator only
//       runs client-side;
//   (d) every static Eleanor string genericized into tokens or house copy;
//   (e) the flyer QR moved off api.qrserver.com onto the self-hosted
//       qr-creator pattern already proven by share-the-date (no visitor URL
//       ever leaks to a third party);
//   (f) the fabricated visits count-up removed — production speaks real
//       counts or stays silent (the presence-truthfulness principle).
//
// Every patch is FAIL-LOUD: if the source document's shape drifts (design
// re-embeds a new pg-tribute), the exact missing anchor is named and the
// script exits non-zero — it never writes a silently mispatched template.
//
// Run from repo root:  node scripts/port/extract-tribute-unified.mjs
// Re-run whenever design updates the embedded document; commit the output.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const ROOT = process.env.IMY_REPO_ROOT || process.cwd();
const SRC = path.join(ROOT, "imy-app/public/preview/unified.html");
const OUT = path.join(ROOT, "imy-app/templates/tribute-unified.html");

const fatal = (msg) => {
  console.error(`\nextract-tribute-unified: FAIL — ${msg}`);
  process.exit(1);
};

// ── decode ────────────────────────────────────────────────────────────────────
const shell = readFileSync(SRC, "utf8");
const m = shell.match(/<script type="text\/plain" id="pg-tribute">([\s\S]*?)<\/script>/);
if (!m) fatal(`no <script type="text/plain" id="pg-tribute"> block in ${SRC}`);
let doc = Buffer.from(m[1].trim(), "base64").toString("utf8");
if (!doc.startsWith("<!DOCTYPE html>")) fatal("decoded pg-tribute does not start with <!DOCTYPE html> — encoding drift?");
if (!doc.includes("<!--IMY_OVERRIDE_SLOT-->")) fatal("decoded document carries no <!--IMY_OVERRIDE_SLOT--> — the injection contract is gone");

// ── fail-loud patch helpers ───────────────────────────────────────────────────
let patches = 0;
/** Replace an exact string exactly once. Loud when absent or ambiguous. */
function mustReplace(from, to, label) {
  const i = doc.indexOf(from);
  if (i === -1) fatal(`anchor not found (${label}): ${JSON.stringify(from.slice(0, 90))}`);
  if (doc.indexOf(from, i + 1) !== -1) fatal(`anchor is ambiguous (${label}): ${JSON.stringify(from.slice(0, 90))}`);
  doc = doc.slice(0, i) + to + doc.slice(i + from.length);
  patches++;
}
/** Replace from an exact start anchor through an exact end anchor (inclusive). */
function mustSpan(start, end, to, label) {
  const i = doc.indexOf(start);
  if (i === -1) fatal(`span start not found (${label}): ${JSON.stringify(start.slice(0, 90))}`);
  const j = doc.indexOf(end, i + start.length);
  if (j === -1) fatal(`span end not found (${label}): ${JSON.stringify(end)}`);
  doc = doc.slice(0, i) + to + doc.slice(j + end.length);
  patches++;
}

// ═══ (c) the head — SSR tokens for crawlers, previews, and JS-off readers ═════
mustReplace(
  "<title>Eleanor Margaret Hayes · 1948–2024 · I Miss You Memorial</title>",
  `<title>{{TITLE}}</title>
<meta name="description" content="{{META_DESCRIPTION}}"/>
<meta property="og:type" content="profile"/>
<meta property="og:title" content="{{TITLE}}"/>
<meta property="og:description" content="{{META_DESCRIPTION}}"/>
<meta property="og:image" content="{{COVER_URL}}"/>`,
  "head title + meta/OG block"
);

// The topbar's log-in door points at a real route (/login does not exist).
mustReplace(
  '<a class="login" href="https://imissyoumemorial.com/login" target="_blank" rel="noopener noreferrer">Log in</a>',
  '<a class="login" href="https://imissyoumemorial.com/signin" target="_blank" rel="noopener noreferrer">Log in</a>',
  "topbar log-in href"
);

// ═══ (d) static Eleanor markup → tokens ═══════════════════════════════════════
mustReplace(
  '<img class="cbg" src="https://pub.hyperagent.com/api/published/pbf01M0KS2ETR_SJ09R1SEHPY8PJ8R/fd070068-b679-4d1b-9b8d-4dc1ab9cdfbb.png" alt="The whole family on the beach — Eleanor with her sons, their wives and her grandchildren"/>',
  '<img class="cbg" src="{{COVER_URL}}" alt=""/>',
  "cover backdrop"
);
mustReplace(
  '<div class="cface"><img src="https://pub.hyperagent.com/api/published/pbf01M0KS2PQC_EPCP85QYSFVH4EFH/f21c67de-4294-4079-b7e9-785ec297ea82.png" alt="Eleanor Margaret Hayes"/></div>',
  '<div class="cface"><img src="{{PORTRAIT_URL}}" alt="{{NAME_PLAIN}}"/></div>',
  "cover portrait"
);
mustReplace(
  "<h1>Eleanor Margaret <em>Hayes</em></h1>",
  "<h1>{{NAME_HTML}}</h1>",
  "cover h1"
);
mustReplace(
  '<div class="dates">MARCH 12, 1948 — OCTOBER 22, 2024 · <span style="white-space:nowrap">HALF MOON BAY, CA</span></div>',
  '<div class="dates">{{DATES_LINE}}</div>',
  "cover dates"
);
mustReplace(
  '<div class="qt">&ldquo;Put the kettle on, sit in the garden, and notice something lovely. I&rsquo;ll be in all of it.&rdquo;</div>',
  "{{QUOTE_DIV}}",
  "cover quote"
);
mustReplace(
  '<div class="mvisits"><span>♥</span> <b id="visN2">12,438</b> people have visited her page</div>',
  '<div class="mvisits"><span>♥</span> <b id="visN2">0</b> people have visited {{THEIR}} page</div>',
  "cover visits line"
);
mustReplace(
  '<div class="visits"><span class="vh">♥</span> <b id="visN">12,438</b> <span class="vt">people have visited her page</span></div>',
  '<div class="visits"><span class="vh">♥</span> <b id="visN">0</b> <span class="vt">people have visited {{THEIR}} page</span></div>',
  "ribbon visits line"
);
mustReplace(
  '<button class="tbtn" id="tHome" type="button"><span class="lg">Back to Eleanor</span><span class="sm">↺ Eleanor</span></button>',
  '<button class="tbtn" id="tHome" type="button"><span class="lg">Back to {{FIRST_NAME}}</span><span class="sm">↺ {{FIRST_NAME}}</span></button>',
  "tree home button"
);
mustReplace(
  "<h3>Leave a memory of Eleanor</h3>",
  "<h3>Leave a memory of {{FIRST_NAME}}</h3>",
  "leave-a-memory heading"
);
mustReplace(
  '<input type="text" id="lmName" placeholder="Ruth Alvarez" required/>',
  '<input type="text" id="lmName" placeholder="Your name" required/>',
  "leave-a-memory name placeholder"
);
mustReplace(
  '<input type="text" id="lmTitle" placeholder="Fifty years of Tuesdays" required/>',
  '<input type="text" id="lmTitle" placeholder="A title, like a line from a letter" required/>',
  "leave-a-memory title placeholder"
);
// The flyer — the person, the years, the service block, and a first-party QR.
mustReplace(
  '<div class="arch"><img src="https://pub.hyperagent.com/api/published/pbf01M0KS2PQC_EPCP85QYSFVH4EFH/f21c67de-4294-4079-b7e9-785ec297ea82.png" alt="Eleanor"/></div>',
  '<div class="arch"><img src="{{PORTRAIT_URL}}" alt="{{FIRST_NAME}}"/></div>',
  "flyer portrait"
);
mustReplace("<h5>Eleanor Margaret Hayes</h5>", "<h5>{{NAME_PLAIN}}</h5>", "flyer name");
mustReplace('<div class="fd">1948 · 2024</div>', '<div class="fd">{{FLYER_YEARS}}</div>', "flyer years");
mustSpan(
  '<div class="join">Join us to remember</div>',
  '<div class="fnote">parking behind the chapel · the family gathers at 5:30 · the garden gate stays open after</div>',
  "{{SVC_BLOCK}}",
  "flyer service block"
);
mustReplace(
  '<img src="https://api.qrserver.com/v1/create-qr-code/?size=172x172&color=2C2520&bgcolor=FBF6EC&data=https%3A%2F%2Feleanor.imissyoumemorial.com" alt="QR code to her page"/>',
  '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" alt="QR code to this page"/>',
  "flyer QR image (third-party demo src removed; drawn first-party at runtime)"
);
mustReplace(">See Eleanor's page</a>", ">See an example</a>", "footer example link");

// ═══ (a) demo fallbacks → empty defaults, never Eleanor, even from source ═════
// Demo asset URL prefixes go first (nothing may reference them afterwards).
mustSpan(
  "var P='https://aozjmlbkfayaulqnxgxe.supabase.co/storage/v1/object/public/tribute-media/photos/",
  "var M='https://imissyoumemorial.com/art/mem-demo/';",
  "var P='',M='';",
  "demo asset prefixes"
);
mustSpan("var TODAY=(window.IMY_OVERRIDE||{}).TODAY||[\n", "\n];", "var TODAY=(window.IMY_OVERRIDE||{}).TODAY||[];", "TODAY fallback");
mustSpan("var MEMS=(window.IMY_OVERRIDE||{}).MEMS||[\n", "\n];", "var MEMS=(window.IMY_OVERRIDE||{}).MEMS||[];", "MEMS fallback");
mustReplace(
  "var CHIPS=(window.IMY_OVERRIDE||{}).CHIPS||[['everyone','Everyone'],['family','Family'],['friends','Friends'],['neighbors','Neighbors'],['students','Her students']];",
  "var CHIPS=(window.IMY_OVERRIDE||{}).CHIPS||[];",
  "CHIPS fallback"
);
mustSpan("var PHOTOS=(window.IMY_OVERRIDE||{}).PHOTOS||[\n", "\n];", "var PHOTOS=(window.IMY_OVERRIDE||{}).PHOTOS||[];", "PHOTOS fallback");
mustSpan("var CH=(window.IMY_OVERRIDE||{}).CH||[\n", "\n];", "var CH=(window.IMY_OVERRIDE||{}).CH||[];", "CH fallback");
mustSpan("var TAPES=(window.IMY_OVERRIDE||{}).TAPES||[\n", "\n];", "var TAPES=(window.IMY_OVERRIDE||{}).TAPES||[];", "TAPES fallback");
mustReplace(
  "var SHURL=(window.IMY_OVERRIDE||{}).SHURL||'https://eleanor.imissyoumemorial.com';",
  "var SHURL=(window.IMY_OVERRIDE||{}).SHURL||'';",
  "SHURL fallback"
);
mustReplace(
  "var SHTXT=(window.IMY_OVERRIDE||{}).SHTXT||'Remembering Eleanor Margaret Hayes · leave a memory, a photo, a kind word · '+SHURL;",
  "var SHTXT=(window.IMY_OVERRIDE||{}).SHTXT||'';",
  "SHTXT fallback"
);
mustReplace(
  "title:((window.IMY_OVERRIDE||{}).person||{}).name||'Eleanor Margaret Hayes'",
  "title:((window.IMY_OVERRIDE||{}).person||{}).name||''",
  "navigator.share title fallback"
);
mustSpan(
  "var PEOPLE=(window.IMY_OVERRIDE||{}).PEOPLE||{\n",
  "\n  };",
  "var PEOPLE=(window.IMY_OVERRIDE||{}).PEOPLE||{};",
  "PEOPLE fallback"
);
mustReplace(
  "((window.IMY_OVERRIDE||{}).treeOwnLabel||'this page is hers')",
  "((window.IMY_OVERRIDE||{}).treeOwnLabel||'')",
  "treeOwnLabel fallback"
);
mustReplace(
  "if(id===ROOT)return 'this page is hers';",
  "if(id===ROOT)return ((window.IMY_OVERRIDE||{}).treeOwnLabel||'');",
  "relTo ROOT literal"
);
mustReplace(
  "(((PEOPLE[ROOT]||{}).n||'Eleanor').split(' ')[0])",
  "(((PEOPLE[ROOT]||{}).n||'').split(' ')[0])",
  "tree crumb name fallback"
);

// ═══ (b) the family-tree guard — an empty tree rests, it never throws ═════════
// The clean `return` exits only the tree IIFE, so the mobile-bar/dots/swipe/
// Escape wiring in the following IIFE keeps running (an uncaught throw here
// would abort the rest of the script block and take them all down).
mustReplace(
  "var ROOT=(window.IMY_OVERRIDE||{}).ROOT||'eleanor',focus=ROOT,sel=null,hidden={};",
  `var ROOT=(window.IMY_OVERRIDE||{}).ROOT||'',focus=ROOT,sel=null,hidden={};
  if(!ROOT||!PEOPLE[ROOT]){var _troom=document.getElementById('room-tree');if(_troom)_troom.style.display='none';var _ttab=document.querySelector('.tab[data-room="tree"]');if(_ttab)_ttab.style.display='none';return;}`,
  "ROOT fallback + tree empty guard"
);

// ═══ (f) the fabricated visits count-up leaves the page entirely ══════════════
mustSpan(
  "if(!REDUCE&&!window.IMY_OVERRIDE){var vN=document.getElementById('visN'),vN2=document.getElementById('visN2'),vv=12438;",
  "},6000);}",
  "/* the visits simulation is retired — production speaks a real count or stays silent */",
  "visits simulation"
);

// ═══ (e) the flyer QR is drawn first-party (qr-creator, like share-the-date) ══
mustReplace(
  "var qr=$('#flyer .qrrow img'); if(qr&&ov.SHURL)qr.src='https://api.qrserver.com/v1/create-qr-code/?size=120x120&data='+encodeURIComponent(ov.SHURL);",
  `var qr=$('#flyer .qrrow img');
    if(qr&&ov.SHURL){(function(){
      function draw(){try{var c=document.createElement('canvas');window.QrCreator.render({text:ov.SHURL,radius:0,ecLevel:'M',fill:'#2C2520',background:'#FBF6EC',size:344},c);qr.src=c.toDataURL('image/png')}catch(e){}}
      if(window.QrCreator)draw();
      else{var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/qr-creator@1.0.0/dist/qr-creator.min.js';s.onload=draw;document.head.appendChild(s)}
    })()}`,
  "flyer QR draw"
);

// ═══ the gift door (Issue 2/6) — a visitor opens the whole page for the ═══════
// family. $197 once, plan `family_unlock`: the webhook sets tier=plus and the
// sponsor_* columns; owner_email/owner_id are never touched — the family keeps
// the page. Ported from the wreath template's gift sheet (tribute-template.html
// giftSheet/gsGive), restyled to the unified design system. Compliance: the
// checkout payload carries slug and sponsorName only — never the person's name.

// (2a) the footer's dead link becomes a real door.
mustReplace(
  '<a href="#" onclick="return false">Give this page</a>',
  '<a href="#" id="footGive">Give this page</a>',
  "footer give-this-page door"
);

// (2b) a quiet standing invitation directly beside the wall — the room where
// memories are left (the Leave-a-memory buttons float over this section).
mustReplace(
  `    <button class="pgb" id="memNext" type="button" aria-label="More memories">›</button>
  </div>
</section>`,
  `    <button class="pgb" id="memNext" type="button" aria-label="More memories">›</button>
  </div>
  <div class="giftline" id="giftLine">
    <div class="gk">A gift to the whole family</div>
    <p>Anyone can open {{FIRST_NAME}}&rsquo;s whole page for the family — every memory and photograph, home for good. $197 once, and it never needs to be given again.</p>
    <button class="gbtn" id="giftLineBtn" type="button">Give this to the family</button>
  </div>
</section>`,
  "the wall's gift line"
);

// (2c) a whisper inside the leave-a-memory letter itself.
mustReplace(
  '<div class="modnote">every word waits for the family before it appears ·<br/>nothing is ever taken down without them</div>',
  `<div class="modnote">every word waits for the family before it appears ·<br/>nothing is ever taken down without them</div>
      <button class="lmgift" type="button" id="lmGift">or do something bigger — one gift opens the whole wall for the family · $197 once</button>`,
  "leave-a-memory gift whisper"
);

// (2d) the wall-gate hold note becomes actionable — same words, now a door.
mustReplace(
  `    if(ov.gates&&ov.gates.memsTotal>ov.MEMS.length&&mem){
      note(mem,(ov.gates.memsTotal-ov.MEMS.length)+' more '+plural(ov.gates.memsTotal-ov.MEMS.length,'memory waits','memories wait')+', safe · Plus opens the whole wall');
    }`,
  `    if(ov.gates&&ov.gates.memsTotal>ov.MEMS.length&&mem){
      var gw=ov.gates.memsTotal-ov.MEMS.length;
      if(ov.mode!=='edit'&&window.IMYGift){
        var gd=document.createElement('button');gd.type='button';gd.className='gatedoor';
        gd.innerHTML='<i>'+gw+' more '+plural(gw,'memory waits','memories wait')+', safe.</i> <u>Open the whole wall for everyone · a gift, $197 once</u>';
        gd.addEventListener('click',function(){window.IMYGift.open()});
        mem.appendChild(gd);
      }else{
        note(mem,gw+' more '+plural(gw,'memory waits','memories wait')+', safe · Plus opens the whole wall');
      }
    }`,
  "wall-gate note becomes a door"
);

// (2e) the gift sheet itself — markup, styles, and wiring, after the override
// slot so the sheet can read the page's plan and slug the moment it binds.
mustReplace(
  "<!--IMY_OVERRIDE_SLOT-->",
  `<!-- A GIFT TO THE WHOLE FAMILY · $197 once · family_unlock -->
<style>
.gsheet{position:fixed;inset:0;z-index:120;display:none;align-items:center;justify-content:center;padding:22px;background:rgba(20,13,8,.62);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)}
.gsheet.open{display:flex}
.gs-card{position:relative;width:100%;max-width:480px;max-height:92vh;overflow:auto;background:var(--cream);border:1.5px solid rgba(138,90,60,.4);border-radius:20px;padding:clamp(24px,4vw,34px);color:var(--ink);box-shadow:0 44px 100px -30px rgba(26,19,13,.7)}
.gs-x{position:absolute;top:10px;right:12px;background:none;border:none;color:var(--terra-deep);font-size:19px;padding:8px;line-height:1}
.gs-kick{font-family:'Work Sans',sans-serif;font-weight:600;font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--terra-deep)}
.gs-head{font-weight:800;font-size:clamp(21px,2.6vw,26px);margin:10px 0 14px;line-height:1.2}
.gs-price{display:flex;align-items:baseline;gap:12px;border-top:1.5px solid rgba(138,90,60,.3);border-bottom:1.5px solid rgba(138,90,60,.3);padding:13px 0;margin-bottom:15px}
.gs-price .gp{font-weight:800;font-size:40px;line-height:1}
.gs-price .gper{font-family:'Work Sans',sans-serif;font-weight:600;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--terra-deep)}
.gs-opens{list-style:none;margin:0 0 16px;padding:0;display:grid;gap:8px}
.gs-opens li{display:flex;gap:10px;font-size:14.5px;line-height:1.5;color:var(--ink-soft)}
.gs-opens li::before{content:"✓";color:var(--terra);flex:none;font-weight:700}
.gs-choice{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
.gs-opt{text-align:left;background:#fff;border:1.5px solid rgba(138,90,60,.4);border-radius:12px;padding:12px 13px;color:var(--ink);font-family:'Besley',serif}
.gs-opt b{display:block;font-size:13.5px;margin-bottom:4px}
.gs-opt span{font-family:'Work Sans',sans-serif;font-weight:600;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--terra-deep);line-height:1.6}
.gs-opt.on{border-color:var(--night);background:rgba(168,124,95,.1);box-shadow:0 0 0 1.5px var(--night)}
.gs-name{margin:0 0 14px}
.gs-name label{display:block;font-weight:700;font-size:14.5px;margin:0 0 6px}
.gs-name label small{font-weight:400;color:var(--ink-soft);font-style:italic;font-size:13px}
.gs-name input{width:100%;font-family:'Besley',serif;font-size:16px;border:1.5px solid rgba(138,90,60,.4);border-radius:12px;padding:13px 14px;background:#fff;color:var(--ink)}
.gs-name input:focus{outline:3px solid rgba(168,124,95,.4)}
.gs-cta{width:100%;background:var(--night);color:var(--cream);border:none;border-radius:100px;padding:15px;font-size:16px;font-weight:800;min-height:52px}
.gs-cta:hover{background:#000}
.gs-cta:disabled{opacity:.6;cursor:default}
.gs-err{display:none;margin-top:10px;text-align:center;font-size:13.5px;color:#8a3c2c}
.gs-err.show{display:block}
.gs-fine{font-family:'Work Sans',sans-serif;font-weight:600;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--terra-deep);text-align:center;margin-top:12px}
.gs-fine2{font-size:12.5px;color:var(--ink-soft);text-align:center;line-height:1.7;margin-top:8px}
.gs-x:focus-visible,.gs-opt:focus-visible,.gs-cta:focus-visible{outline:3px solid #2a6df4;outline-offset:2px}
.giftline{max-width:640px;margin:30px auto 0;text-align:center;background:var(--card);border:1.5px solid rgba(138,90,60,.35);border-radius:18px;padding:22px 24px}
.giftline .gk{font-family:'Work Sans',sans-serif;font-weight:600;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--terra-deep)}
.giftline p{font-size:14.5px;line-height:1.65;color:var(--ink-soft);margin:8px auto 14px;max-width:480px}
.giftline .gbtn{background:#fff;border:1.5px solid rgba(138,90,60,.5);border-radius:100px;padding:12px 22px;font-size:15px;font-weight:700;color:var(--terra-deep);min-height:48px}
.giftline .gbtn:hover{border-color:var(--terra)}
.giftline .gbtn:focus-visible{outline:3px solid #2a6df4;outline-offset:2px}
.gatedoor{display:block;margin:18px auto 0;max-width:560px;text-align:center;background:none;border:none;font-style:italic;color:rgba(44,37,32,.65);font-size:14.5px;line-height:1.6;padding:6px}
.gatedoor u{text-underline-offset:3px;color:var(--terra-deep)}
.gatedoor:focus-visible{outline:3px solid #2a6df4;outline-offset:2px}
.lm .lmgift{display:block;width:100%;background:none;border:none;margin-top:10px;text-align:center;font-size:12.5px;font-style:italic;color:var(--terra-deep);text-decoration:underline;text-underline-offset:3px;padding:8px 4px}
.lm .lmgift:focus-visible{outline:3px solid #2a6df4;outline-offset:2px}
@media(max-width:560px){.gs-choice{grid-template-columns:1fr}}
</style>
<div class="gsheet" id="giftSheet" role="dialog" aria-modal="true" aria-labelledby="gsHead">
  <div class="gs-card">
    <button class="gs-x" id="gsClose" type="button" aria-label="Close">✕</button>
    <div class="gs-kick">A gift to the whole family</div>
    <h3 class="gs-head" id="gsHead">Open {{FIRST_NAME}}&rsquo;s wall for everyone</h3>
    <div class="gs-price"><span class="gp">$197</span><span class="gper">Once · never again</span></div>
    <ul class="gs-opens">
      <li>Every memory, from everyone, forever</li>
      <li>Unlimited photos and video</li>
      <li>Audio memories · keep {{THEIR}} voice</li>
      <li id="gsWaitLine" style="display:none"></li>
    </ul>
    <div class="gs-choice" role="group" aria-label="How the gift is signed">
      <button class="gs-opt on" data-choice="named" type="button" aria-pressed="true"><b>With my name</b><span>shown quietly on the page</span></button>
      <button class="gs-opt" data-choice="quiet" type="button" aria-pressed="false"><b>Quietly, without my name</b><span>&ldquo;Someone who loves this family&rdquo;</span></button>
    </div>
    <div class="gs-name" id="gsNameRow">
      <label for="gsName">Your name <small>· how the family will know the gift</small></label>
      <input type="text" id="gsName" placeholder="Your name" autocomplete="name"/>
    </div>
    <button class="gs-cta" id="gsGive" type="button">Give this to the family</button>
    <p class="gs-err" id="gsErr" role="status">The checkout didn&rsquo;t open. Nothing was charged · please try again.</p>
    <div class="gs-fine">Secure checkout via Stripe · no account needed</div>
    <p class="gs-fine2">This opens the full page for everyone, for as long as it stands. The family keeps the page — it stays theirs to tend. It only ever needs to be given once.</p>
  </div>
</div>
<!--IMY_OVERRIDE_SLOT-->
<script>
/* the gift door · plan family_unlock: the webhook opens the wall (tier=plus) and
   writes the sponsor line; ownership never moves. The payload carries slug and
   sponsorName only — never the person's name (compliance). */
(function(){
var sheet=document.getElementById('giftSheet');if(!sheet)return;
function OV(){return window.IMY_OVERRIDE||{}}
var give=document.getElementById('gsGive'),closeB=document.getElementById('gsClose'),err=document.getElementById('gsErr');
var nameRow=document.getElementById('gsNameRow');
var choice='named',lastFocus=null;
function open(){
  var g=OV().gates||{},shown=(OV().MEMS||[]).length,w=Math.max(0,(g.memsTotal||0)-shown);
  var wl=document.getElementById('gsWaitLine');
  if(wl){if(w>0){wl.style.display='';wl.textContent=w+' waiting '+(w===1?'memory comes':'memories come')+' home'}else{wl.style.display='none'}}
  lastFocus=document.activeElement;
  err.classList.remove('show');
  sheet.classList.add('open');give.focus();
}
function close(){sheet.classList.remove('open');if(lastFocus&&lastFocus.focus)try{lastFocus.focus()}catch(e){}}
window.IMYGift={open:open};
closeB.addEventListener('click',close);
sheet.addEventListener('click',function(e){if(e.target===sheet)close()});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&sheet.classList.contains('open')){e.stopPropagation();close()}},true);
function paintChoice(){
  Array.prototype.forEach.call(document.querySelectorAll('.gs-opt'),function(x){var on=x.dataset.choice===choice;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on?'true':'false')});
  if(nameRow)nameRow.style.display=choice==='named'?'':'none';
}
Array.prototype.forEach.call(document.querySelectorAll('.gs-opt'),function(o){o.addEventListener('click',function(){choice=o.dataset.choice;paintChoice()})});
paintChoice();
give.addEventListener('click',function(){
  var slug=OV().slugUrl||'';
  if(!slug)return; /* a preview without a page — the door stays quiet */
  var sponsorName=choice==='named'?String((document.getElementById('gsName')||{}).value||'').replace(/\\s+/g,' ').trim().slice(0,80):'';
  give.disabled=true;give.textContent='Opening a safe checkout…';err.classList.remove('show');
  /* every wait has an end · a hung request returns the button in 15s */
  var ac=('AbortController' in window)?new AbortController():null;
  if(ac)setTimeout(function(){try{ac.abort()}catch(e){}},15000);
  var restore=function(){give.disabled=false;give.textContent='Give this to the family';err.classList.add('show')};
  fetch('/api/stripe/checkout',{method:'POST',headers:{'content-type':'application/json'},signal:ac?ac.signal:undefined,
    body:JSON.stringify({plan:'family_unlock',slug:slug,sponsorName:sponsorName,sponsorMessage:'',returnTo:'/sites/'+slug})})
  .then(function(r){return r.json()}).then(function(j){if(j&&j.ok&&j.url){location.href=j.url}else{restore()}})
  .catch(restore);
});
/* the doors · rest quietly once the wall is already open (plan plus) */
var doors=[['footGive',true],['giftLine',false],['giftLineBtn',true],['lmGift',true]];
function bind(){
  var plus=OV().plan==='plus';
  doors.forEach(function(d){
    var el=document.getElementById(d[0]);if(!el)return;
    if(plus){el.style.display='none';return}
    if(!d[1])return;
    el.addEventListener('click',function(e){
      e.preventDefault();
      var lc=document.getElementById('lmCancel');
      if(d[0]==='lmGift'&&lc)lc.click(); /* step out of the letter first */
      open();
    });
  });
}
bind();
})();
</${"script"}>`,
  "the gift sheet + wiring after the override slot"
);

// ═══ post-patch assertions — the frozen template must be identity-clean ═══════
const forbidden = [
  "Eleanor", // the person
  "Hayes", "Whitfield", // the demo family
  "eleanor.imissyoumemorial.com", // the demo address
  "pub.hyperagent.com", // demo-hosted art
  "api.qrserver.com", // third-party QR
  "aozjmlbkfayaulqnxgxe", // demo Supabase media bucket
  "mem-demo", // demo memory pair art
  "12,438", // the fabricated visits number
  "Half Moon Bay", "Linden Community Chapel", "Seaside Avenue", // demo places
  "Ruth Alvarez", "Fifty years of Tuesdays", // demo people/copy
];
for (const bad of forbidden) {
  const at = doc.indexOf(bad);
  if (at !== -1) fatal(`forbidden string survived extraction: ${JSON.stringify(bad)} near …${JSON.stringify(doc.slice(Math.max(0, at - 60), at + 60))}…`);
}
const required = [
  "<!--IMY_OVERRIDE_SLOT-->",
  "{{TITLE}}", "{{META_DESCRIPTION}}", "{{COVER_URL}}", "{{PORTRAIT_URL}}",
  "{{NAME_PLAIN}}", "{{NAME_HTML}}", "{{DATES_LINE}}", "{{QUOTE_DIV}}",
  "{{THEIR}}", "{{FIRST_NAME}}", "{{FLYER_YEARS}}", "{{SVC_BLOCK}}",
  "var TODAY=(window.IMY_OVERRIDE||{}).TODAY||[];",
  "var MEMS=(window.IMY_OVERRIDE||{}).MEMS||[];",
  "var CHIPS=(window.IMY_OVERRIDE||{}).CHIPS||[];",
  "var PHOTOS=(window.IMY_OVERRIDE||{}).PHOTOS||[];",
  "var CH=(window.IMY_OVERRIDE||{}).CH||[];",
  "var TAPES=(window.IMY_OVERRIDE||{}).TAPES||[];",
  "var PEOPLE=(window.IMY_OVERRIDE||{}).PEOPLE||{};",
  "if(!ROOT||!PEOPLE[ROOT])", // the tree guard
  "QrCreator", // first-party QR
  // the gift door (Issue 2/6) — a regeneration must never silently drop it
  'id="giftSheet"', 'id="footGive"', 'id="giftLine"', 'id="lmGift"',
  "plan:'family_unlock'", "window.IMYGift={open:open}",
  "sponsorName:sponsorName,sponsorMessage:''", // the payload names the sponsor, never the person
];
for (const need of required) {
  if (!doc.includes(need)) fatal(`required string missing from output: ${JSON.stringify(need)}`);
}

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, doc);
console.log(`extract-tribute-unified: ok — ${patches} patches applied, ${doc.length} bytes → ${path.relative(ROOT, OUT)}`);
