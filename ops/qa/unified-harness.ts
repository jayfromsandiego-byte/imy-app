// Unified-template QA harness — renders templates/tribute-unified.html through
// renderTributeUnified and asserts the ported render contract: the frozen
// template's identity hygiene (Gate 0 — empty fallbacks, the tree guard, no
// demo strings even from source), identity safety on the server output (no
// Eleanor leaks, the family's pronouns), tier behavior (free wall cap at ten,
// twelve free photographs, resting voices and tapes), the film's shelf seat,
// hearts/comments/leave-a-memory wiring to the real endpoints (Gate 2),
// the moments-stage synthesis, chapters with en-dash eras in chronological
// order, the flyer's service block, SSR titles/OG that know their person,
// the visits rest (no fabricated numbers), the resting tree (PEOPLE/ROOT
// empty until G-U2 lands), the obituary's home, and the scroll-containment
// census (every programmatic scroll answers a gesture or a studio command,
// never a timer).
//
// The wreath harness (harness.ts) is untouched and keeps running — both suites
// stay green while both templates ship (R15).
// Run from repo root: sh ops/qa/run.sh
import { readFileSync } from "node:fs";
import { renderTributeUnified } from "./renderTributeUnified.gen.ts";
import { renderTribute, type Tribute } from "./renderTribute.gen.ts";

const ROOT = process.env.IMY_REPO_ROOT || ".";
const template = readFileSync(`${ROOT}/imy-app/templates/tribute-unified.html`, "utf8");
const wreathTemplate = readFileSync(`${ROOT}/imy-app/templates/tribute-template.html`, "utf8");

let pass = 0, fail = 0;
const t = (name: string, cond: boolean, detail?: string) => {
  if (cond) { pass++; console.log(`  ok  ${name}`); }
  else { fail++; console.log(`FAIL  ${name}${detail ? " — " + detail : ""}`); }
};

const boot = (html: string) => {
  const m = html.match(/window\.IMY_OVERRIDE=(\{.*?\});<\/script>/s);
  if (!m) throw new Error("no IMY_OVERRIDE object");
  return JSON.parse(m[1].replace(/\\u003c/g, "<"));
};

// ── fixtures (the wreath harness's cast, unchanged) ───────────────────────────
const mem = (id: string, name: string, rel: string, text: string, hearts: number) =>
  ({ id, name, rel, text, hearts });

const jonny: Tribute = {
  slug: "jonny", fullName: "Jon Alvarez", pronouns: "he", tier: "plus", status: "published",
  birth: "1948-03-02", passing: "2026-06-20", place: "San Diego, California",
  quote: "Measure twice.", story: "A father, a builder.",
  photos: [{ id: "ph-0", url: "https://x/p0.jpg", cap: "the workshop" }, { id: "ph-1", url: "https://x/p1.jpg" }],
  memories: [
    { ...mem("aaaaaaaa-1111-4111-8111-111111111111", "Maria", "his daughter", "He built my first bookshelf.", 4), photos: ["https://x/bench.jpg"] },
    mem("bbbbbbbb-2222-4222-8222-222222222222", "Sam", "a neighbour", "Best fence on the street.", 0),
  ],
  flowerCount: 12, candleCount: 3, flowerToday: 4,
};

const freeShe: Tribute = {
  slug: "rose-8559", fullName: "Rose Ann Lee", pronouns: "she", tier: "free", status: "published",
  memories: Array.from({ length: 13 }, (_, i) =>
    mem(`cccccccc-3333-4333-8333-${String(i).padStart(12, "0")}`, `Friend ${i}`, "friend", `Memory number ${i}.`, i)),
};

const skipped: Tribute = { slug: "jay-8049", fullName: "Jay Río", tier: "free", memories: [{ text: "No id, airtable-era.", name: "Old Pal", rel: "friend" }] };

// ── 0 · the frozen template itself (Gate 0 contract) ──────────────────────────
{
  t("override slot present", template.includes("<!--IMY_OVERRIDE_SLOT-->"));
  t("TODAY fallback is empty", template.includes("var TODAY=(window.IMY_OVERRIDE||{}).TODAY||[];"));
  t("MEMS fallback is empty", template.includes("var MEMS=(window.IMY_OVERRIDE||{}).MEMS||[];"));
  t("CHIPS fallback is empty", template.includes("var CHIPS=(window.IMY_OVERRIDE||{}).CHIPS||[];"));
  t("PHOTOS fallback is empty", template.includes("var PHOTOS=(window.IMY_OVERRIDE||{}).PHOTOS||[];"));
  t("CH fallback is empty", template.includes("var CH=(window.IMY_OVERRIDE||{}).CH||[];"));
  t("TAPES fallback is empty", template.includes("var TAPES=(window.IMY_OVERRIDE||{}).TAPES||[];"));
  t("PEOPLE fallback is empty", template.includes("var PEOPLE=(window.IMY_OVERRIDE||{}).PEOPLE||{};"));
  t("SHURL/SHTXT fallbacks are empty",
    template.includes("var SHURL=(window.IMY_OVERRIDE||{}).SHURL||'';") &&
    template.includes("var SHTXT=(window.IMY_OVERRIDE||{}).SHTXT||'';"));
  t("share title fallback is empty", template.includes("title:((window.IMY_OVERRIDE||{}).person||{}).name||''"));
  t("ROOT fallback empty + the tree guard stands (the one-exception lesson)",
    template.includes("var ROOT=(window.IMY_OVERRIDE||{}).ROOT||''") &&
    template.includes(`if(!ROOT||!PEOPLE[ROOT]){var _troom=document.getElementById('room-tree');`));
  t("treeOwnLabel fallback is empty", template.includes("((window.IMY_OVERRIDE||{}).treeOwnLabel||'')"));
  t("no Eleanor in the template, even from source", !template.includes("Eleanor") && !template.includes("Hayes") && !template.includes("Whitfield"));
  t("no demo art hosts in the template", !template.includes("pub.hyperagent.com") && !template.includes("aozjmlbkfayaulqnxgxe") && !template.includes("mem-demo"));
  t("no third-party QR in the template", !template.includes("api.qrserver.com") && template.includes("QrCreator"));
  t("the fabricated visits number is gone, count-up and all",
    !template.includes("12,438") && !template.includes("Math.random()<.5"));
  t("demo service details are gone", !template.includes("Linden Community Chapel") && !template.includes("Seaside Avenue") && !template.includes("Half Moon Bay"));
  t("the log-in door points at a real route", template.includes('href="https://imissyoumemorial.com/signin"') && !template.includes("imissyoumemorial.com/login"));
}

// ── 0b · scroll containment census (r5 policy carried over) ──────────────────
{
  const siv = (template.match(/scrollIntoView/g) || []).length;
  t("exactly six scrollIntoView call sites (tab gesture, IMY anchor, room/snap commands)", siv === 6, `found ${siv}`);
  const wst = (template.match(/window\.scrollTo/g) || []).length;
  t("exactly three window.scrollTo call sites (tab gesture + scrolltop command)", wst === 3, `found ${wst}`);
  // the two timers on the page (moments stage 4500ms, photo rotation 2600ms)
  // mutate srcs and text only — no scroll reachable from a timer
  const timers = [...template.matchAll(/setInterval\(function\(\)\{[\s\S]*?\},\d+\)/g)].map((m) => m[0]);
  t("timers never scroll", timers.length >= 2 && timers.every((b) => !/scroll/i.test(b)));
}

// ── 1 · production page (plus · he) ──────────────────────────────────────────
{
  const html = renderTributeUnified(template, jonny);
  const b = boot(html);
  t("override parses and speaks the person", b.person.name === "Jon Alvarez" && b.person.first === "Jon" && b.person.pron === "he");
  t("datesLine joins dates and an uppercased place", b.person.datesLine === "March 2, 1948 — June 20, 2026 · SAN DIEGO, CALIFORNIA");
  t("mode is view, plan mirrors the tier", b.mode === "view" && b.plan === "plus");
  t("no Eleanor leak (he page)", !html.includes("Eleanor"));
  t("no template tokens left", (html.match(/\{\{[A-Z_]+\}\}/g) || []).length === 0);
  t("MEMS carry their ids for the wiring", b.MEMS.every((m: any) => typeof m.id === "string" && m.id.length > 0));
  t("hearts carried onto the wall", b.MEMS[0].h === 4 && b.MEMS[1].h === 0);
  t("relations classify to the document's chips (neighbours → neighbors, R10)", b.MEMS[1].rel === "neighbors");
  t("chips grow from the people who wrote", JSON.stringify(b.CHIPS.map((c: any) => c[0])) === JSON.stringify(["everyone", "family", "friends", "neighbors"]));
  t("a memory's title derives from its first words (R7)", b.MEMS[0].t === "He built my first bookshelf");
  t("a memory's recency line is its relation alone — no fabricated timestamps (R7)", b.MEMS[0].r === "his daughter");
  t("a photographed memory leads the moments stage", b.TODAY.length > 0 && b.TODAY[0].img === "https://x/bench.jpg" && b.TODAY[0].k === "remembered by Maria · his daughter");
  t("captioned photographs follow on the stage", b.TODAY.some((x: any) => x.img === "https://x/p0.jpg" && x.k === "from his photographs"));
  t("a memory with no avatar wears the SVG-initials avatar", b.MEMS[0].av.startsWith("data:image/svg+xml;utf8,"));
  t("gates speak the pre-cap truth", b.gates.memsTotal === 2 && b.gates.photosTotal === 2);
  t("the tree rests until it has a data source (G-U2/R6)", JSON.stringify(b.PEOPLE) === "{}" && b.ROOT === "" && b.treeOwnLabel === "this page is his");
  t("SHURL/SHTXT speak the page's own address", b.SHURL === "https://jonny.imissyoumemorial.com" && b.SHTXT.includes("Remembering Jon Alvarez"));
  t("the quote rides both channels", b.person.quote === "Measure twice." && html.includes('<div class="qt">&ldquo;Measure twice.&rdquo;</div>'));
  // pronouns — SSR, before any hydrator runs
  t("the tab speaks his life", html.includes(">His life</button>") && !html.includes(">Her life</button>"));
  t("the rooms speak him", html.includes(">Moments of his</h2>") && html.includes(">From the people who knew him</h3>") && html.includes('>His album</div>') && html.includes(">His family tree</h2>"));
  t("the letter speaks him", html.includes("<option>His student</option>") && html.includes('aria-label="How you knew him"') && !html.includes("Her student"));
  t("the share sheet speaks his page", html.includes("Share his page <button") && !html.includes("Share her page"));
  t("no her-page residue in any visible string on a he page",
    !html.includes("How you knew her") && !html.includes("visited her page") && !html.includes("Share her page") &&
    !html.includes("joins her wall") && !html.includes("Back to her page") && !html.includes("Moments of hers") &&
    !html.includes("who loved her") && !html.includes(">Her wall</div>"));
  // wiring (Gate 2)
  t("hearts post to the real endpoint, remembered per browser", html.includes("/memory/heart") && html.includes("imy-hearts-"));
  t("kind words post to the real endpoint, keeping the waiting stub", html.includes("/memory/comment") && html.includes("waiting for the family"));
  t("the letter posts to the real memory door with its photographs", html.includes("post('/memory',{name:name,relation:rel,body:body,photoUrls:urls})") && html.includes("/api/upload"));
  t("the document's local-only heart handler is replaced, not doubled", html.includes("hb.parentNode.replaceChild(nb,hb)"));
  // visits (R2): no fabricated number can render
  t("the visits lines rest — no counter exists yet", html.includes(".mvisits{display:none!important}") && html.includes(".ribbon .visits{display:none!important}"));
  // SSR head
  t("the title knows its person (same formula as the wreath)", html.includes("<title>Jon Alvarez · 1948 to 2026 · San Diego · I Miss You Memorial</title>"));
  t("the link preview matches", html.includes('property="og:title" content="Jon Alvarez · 1948 to 2026 · San Diego · I Miss You Memorial"') && html.includes('property="og:image" content="https://x/p0.jpg"'));
  t("the wreath and the unified page agree on the title", (() => {
    const w = renderTribute(wreathTemplate, jonny).match(/<title>([^<]*)<\/title>/)?.[1];
    const u = html.match(/<title>([^<]*)<\/title>/)?.[1];
    return !!w && w === u;
  })());
  t("the h1 wears the name, serifed last (SSR)", html.includes("<h1>Jon <em>Alvarez</em></h1>"));
  t("the flyer knows him (SSR)", html.includes("<h5>Jon Alvarez</h5>") && html.includes('<div class="fd">1948 · 2026</div>'));
}

// ── 2 · free she page · the caps hold ─────────────────────────────────────────
{
  const html = renderTributeUnified(template, freeShe);
  const b = boot(html);
  t("free wall caps at ten", b.MEMS.length === 10);
  t("the held memories are counted, never refused", b.gates.memsTotal === 13);
  t("hearts survive the cap mapping", b.MEMS.some((m: any) => m.h > 0));
  t("no Eleanor leak (she page)", !html.includes("Eleanor"));
  t("she page speaks her", html.includes(">Her life</button>") && html.includes("<option>Her student</option>") && !html.includes(">His life</button>"));
  t("plan rests free", b.plan === "free");
  const photoPage = boot(renderTributeUnified(template, { ...freeShe, photos: Array.from({ length: 14 }, (_, i) => ({ id: `free-photo-${i}`, url: `https://x/free-${i}.jpg` })) }));
  t("free pages show twelve photographs", photoPage.PHOTOS.length === 12);
  t("the held photographs are counted (gates)", photoPage.gates.photosTotal === 14);
  t("photo flex ratios are numbers, never strings", photoPage.PHOTOS.every((p: any) => typeof p.f === "number"));
}

// ── 3 · id-less memories (airtable era) degrade gracefully ────────────────────
{
  const html = renderTributeUnified(template, skipped);
  const b = boot(html);
  t("id-less memory renders with empty id (wiring skips persistence for it)", b.MEMS[0].id === "");
  t("they/them default (no pronouns)", html.includes(">Their life</button>") && b.treeOwnLabel === "this page is theirs" && b.person.pron === "they");
  t("no Eleanor leak (skipped page)", !html.includes("Eleanor"));
  t("no service · the flyer block rests, join line and all", !html.includes('<div class="join">'));
}

// ── 4 · hearts never negative through the mapping ─────────────────────────────
{
  const b = boot(renderTributeUnified(template, { ...jonny, memories: [mem("dddddddd-4444-4444-8444-444444444444", "X", "friend", "hi", -5 as any)] }));
  t("negative hearts clamp to zero", b.MEMS[0].h === 0);
}

// ── 5 · comments compose escaped, as pairs ─────────────────────────────────────
{
  const withComments: Tribute = {
    ...jonny,
    memories: [
      { ...mem("eeeeeeee-5555-4555-8555-555555555555", "Maria", "his daughter", "He built my first bookshelf.", 2),
        comments: [
          { name: "Tom", rel: "next door", text: "I still have mine." },
          { name: "Ana", rel: "friend", text: "He never stopped building." },
        ] },
    ],
  };
  const b = boot(renderTributeUnified(template, withComments));
  t("comments become [initial, composed line] pairs",
    JSON.stringify(b.MEMS[0].c) === JSON.stringify([["T", "<b>Tom</b> · I still have mine."], ["A", "<b>Ana</b> · He never stopped building."]]));
  t("comments absent → empty c", JSON.stringify(boot(renderTributeUnified(template, jonny)).MEMS[0].c) === "[]");
}

// ── 6 · voice memories: a Plus promise, https only, really wired ──────────────
{
  const voiced: Tribute = {
    ...jonny,
    memories: [{ ...mem("ffffffff-6666-4666-8666-666666666666", "Daniel", "his son", "His voicemail, kept.", 1),
      audio: "https://blob.example/voice.mp3" }],
  };
  const htmlPlus = renderTributeUnified(template, voiced);
  const bPlus = boot(htmlPlus);
  t("plus page carries the voice url for the wiring", bPlus.MEMS[0].audioUrl === "https://blob.example/voice.mp3" && !!bPlus.MEMS[0].voice);
  t("the wiring builds a real audio element for the voice card", htmlPlus.includes("au.preload='metadata';au.src=m.audioUrl") && htmlPlus.includes("loadedmetadata"));
  const bFree = boot(renderTributeUnified(template, { ...voiced, tier: "free" }));
  t("free page rests the recording (kept, not shown)", !bFree.MEMS[0].audioUrl && !bFree.MEMS[0].voice);
  const bBad = boot(renderTributeUnified(template, { ...voiced, memories: [{ ...voiced.memories![0], audio: "javascript:alert(1)" }] }));
  t("non-https audio never reaches the page", !bBad.MEMS[0].audioUrl);
}

// ── 7 · the tape shelf: plus tapes, the film first, free teaser only ──────────
{
  const vids = [
    { id: "v-1", url: "https://x/first.mp4", cap: "The wedding toast" },
    { id: "v-2", url: "https://youtu.be/dQw4w9WgXcQ", cap: "The garden, filmed" },
  ];
  const film = { url: "https://x/film.mp4", poster: "https://x/poster.jpg", duration: 102, variant: "full" };
  const bp = boot(renderTributeUnified(template, { ...jonny, videos: vids, film, placements: { living: { "ph-0": "v-1" } } }));
  t("the film rides first on the shelf (R5)", bp.TAPES[0].t === "The film of his life" && bp.TAPES[0].url === "https://x/film.mp4" && bp.TAPES[0].cover === "https://x/poster.jpg" && bp.TAPES[0].dur === "1:42");
  t("real tapes follow with their captions", bp.TAPES[1].t === "The wedding toast" && bp.TAPES[1].url === "https://x/first.mp4");
  t("a living pair's photograph fronts its tape", bp.TAPES[1].cover === "https://x/p0.jpg");
  t("a youtube tape becomes a quiet embed for the wiring (R9)", bp.TAPES[2].embed === "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" && !bp.TAPES[2].url);
  const bFree = boot(renderTributeUnified(template, { ...jonny, tier: "free", videos: vids, film }));
  t("free pages rest their tapes, and a full film rests with them", bFree.TAPES.length === 0);
  const bTeaser = boot(renderTributeUnified(template, { ...jonny, tier: "free", videos: vids, film: { ...film, variant: "teaser" } }));
  t("a true teaser stays public on free", bTeaser.TAPES.length === 1 && bTeaser.TAPES[0].url === "https://x/film.mp4");
  t("the embed room is wired for shelf clicks", renderTributeUnified(template, { ...jonny, videos: vids }).includes("tp.embed+'?autoplay=1'"));
}

// ── 8 · a life in chapters, chronological, en-dash eras ───────────────────────
{
  const tlA = { id: "tl-a", year: "1999", title: "Second", chapterId: "ch-1" };
  const tlB = { id: "tl-b", year: "1970", title: "First", chapterId: "ch-1" };
  const chapters = [{ id: "ch-1", title: "A chapter", sort: 0 }];
  const b = boot(renderTributeUnified(template, { ...jonny, timeline: [tlA, tlB], chapters, placements: { chapters: { "tl-b": ["ph-0"] } } }));
  t("chapters render as the family wrote them", b.CH.length === 1 && b.CH[0].t === "A chapter");
  t("a chapter's moments sort by year", b.CH[0].ms[0].l === "First" && b.CH[0].ms[1].l === "Second");
  t("the era wears the document's en-dash", b.CH[0].era === "1970–1999");
  t("a placed photograph sits with its moment", b.CH[0].ms[0].img === "https://x/p0.jpg" && b.CH[0].ms[0].cap === "the workshop");
  t("an unplaced moment falls back to the page's photograph — the book never breaks", b.CH[0].ms[1].img === "https://x/p0.jpg");
  t("the chapter's cover is its first moment's photograph", b.CH[0].cover === "https://x/p0.jpg");
  t("no timeline → CH rests empty (the room rests via emptyStates)", boot(renderTributeUnified(template, jonny)).CH.length === 0);
}

// ── 9 · the service block (SSR + override, no double-escape) ──────────────────
{
  const svc = { date: "2026-06-13", time: "6:00 PM", place: "Linden Community Chapel", address: "142 Seaside Avenue, Half Moon Bay, CA 94019" };
  const html = renderTributeUnified(template, { ...jonny, service: svc });
  const b = boot(html);
  t("the flyer's service block renders server-side", html.includes('<div class="join">Join us to remember</div>') && html.includes("<b>Linden Community Chapel</b>") && html.includes("June 13, 2026 · 6:00 PM"));
  t("the override's svc fields stay raw — the hydrator escapes its own seams (R13)", b.svc.whereName === "Linden Community Chapel" && b.svc.when === "June 13, 2026 · 6:00 PM");
  t("no service → svc is null and the SSR block rests", (() => {
    const bare = renderTributeUnified(template, jonny);
    return boot(bare).svc === null && !bare.includes('<div class="join">');
  })());
}

// ── 10 · the obituary keeps its home (R4) ─────────────────────────────────────
{
  const withOb = renderTributeUnified(template, { ...jonny, obituary: "In loving memory of Jon.\nSurvived by his family." });
  t("the obituary stands on its own sheet in the memories room", withOb.includes('id="obituary"') && withOb.includes("In loving memory of Jon."));
  t("obituary line breaks are kept, long words stay inside", withOb.includes("white-space:pre-line") && withOb.includes("overflow-wrap:anywhere"));
  t("the obituary lives inside the memories room", (() => {
    const room = withOb.indexOf('id="room-mem"');
    const ob = withOb.indexOf('id="obituary"');
    const end = withOb.indexOf("</section>", room);
    return room > -1 && ob > room && ob < end;
  })());
  t("no obituary → no empty sheet", !renderTributeUnified(template, jonny).includes('id="obituary"'));
}

// ── 11 · every key is present so no fallback can ever fire (§4a) ──────────────
{
  const bare = boot(renderTributeUnified(template, { slug: "new-4444", fullName: "Ana Reyes", tier: "free", status: "published" }));
  for (const k of ["TODAY", "MEMS", "CHIPS", "PHOTOS", "CH", "TAPES"]) {
    t(`a brand-new page ships ${k} as an empty array`, Array.isArray(bare[k]) && bare[k].length === 0);
  }
  t("a brand-new page ships PEOPLE/ROOT/SHURL/SHTXT/person present", bare.PEOPLE !== undefined && bare.ROOT === "" && bare.SHURL === "https://new-4444.imissyoumemorial.com" && typeof bare.SHTXT === "string" && bare.person.name === "Ana Reyes");
  t("gates are zeros, not absences", bare.gates.memsTotal === 0 && bare.gates.photosTotal === 0);
  t("counts carry no fabricated visits", !("visits" in (bare.counts || {})) || !bare.counts.visits);
}

// ── 12 · the wreath template and renderer are untouched by this port ──────────
{
  t("the wreath template still carries its own boot contract", wreathTemplate.includes("{{TRIBUTE_BOOT}}"));
  const w = renderTribute(wreathTemplate, jonny);
  t("the wreath still renders (spot check)", w.includes("window.__TRIBUTE__=") && !w.includes("IMY_OVERRIDE"));
}

console.log(`\n${pass} passed · ${fail} failed`);
process.exit(fail ? 1 : 0);
