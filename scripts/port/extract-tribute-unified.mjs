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
];
for (const need of required) {
  if (!doc.includes(need)) fatal(`required string missing from output: ${JSON.stringify(need)}`);
}

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, doc);
console.log(`extract-tribute-unified: ok — ${patches} patches applied, ${doc.length} bytes → ${path.relative(ROOT, OUT)}`);
