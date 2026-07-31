// QA harness — renders the real tribute template through renderTribute and asserts
// identity safety, tier behavior, hearts, comments, voice, the Plus band,
// the footer address, flower persistence, truthful presence, photo placements,
// the tape shelf, the arranger, the composer's doors, the demo's ask, the
// obituary with the kept voice, a life in chapters, the log-in doors
// (tribute bar + landing), share the date, the visitor's gift note, the
// safe board shape, and the personalized gift sheet, the chronological order of a life, network deadlines, titles that know their person, and the r6
// refinements (open-sky default, scene coverage, media-first memories, the landing's example doors). 247 checks.
// Run from repo root: sh ops/qa/run.sh   (needs Node 22.7+; Node 24 recommended)
import { readFileSync } from "node:fs";
import { renderTribute, type Tribute } from "./renderTribute.gen.ts";

const template = readFileSync((process.env.IMY_REPO_ROOT || ".") + "/imy-app/templates/tribute-template.html", "utf8");

let pass = 0, fail = 0;
const t = (name: string, cond: boolean, detail?: string) => {
  if (cond) { pass++; console.log(`  ok  ${name}`); }
  else { fail++; console.log(`FAIL  ${name}${detail ? " — " + detail : ""}`); }
};

const boot = (html: string) => {
  const m = html.match(/window\.__TRIBUTE__=(\{.*?\});<\/script>/s);
  if (!m) throw new Error("no boot object");
  return JSON.parse(m[1].replace(/\\u003c/g, "<"));
};

// ── fixtures ──────────────────────────────────────────────────────────────────
const mem = (id: string, name: string, rel: string, text: string, hearts: number) =>
  ({ id, name, rel, text, hearts });

const jonny: Tribute = {
  slug: "jonny", fullName: "Jon Alvarez", pronouns: "he", tier: "plus", status: "published",
  birth: "1948-03-02", passing: "2026-06-20", place: "San Diego, California",
  quote: "Measure twice.", story: "A father, a builder.",
  photos: [{ url: "https://x/p0.jpg" }, { url: "https://x/p1.jpg" }],
  memories: [
    mem("aaaaaaaa-1111-4111-8111-111111111111", "Maria", "his daughter", "He built my first bookshelf.", 4),
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

// ── 1 · production page (plus · he) ──────────────────────────────────────────
{
  const html = renderTribute(template, jonny);
  const b = boot(html);
  t("boot mems carry ids", b.mems.every((m: any) => typeof m.id === "string" && m.id.length > 0));
  t("boot mems carry hearts", b.mems[0].h === 4 && b.mems[1].h === 0);
  t("no template tokens left", ((html.match(/\{\{[A-Z_]+\}\}/g) || []).filter((x) => x !== "{{TOKENS}}").length === 0));
  t("no Eleanor leak (he page)", !html.includes("Eleanor"));
  t("speaks he/him (his students group label impossible — no students)", !html.includes("Her students"));
  t("memCard emits data-id", html.includes(`(m.id?' data-id="'+m.id+'"':'')`));
  t("wireLikes posts to heart endpoint", html.includes("/memory/heart"));
  t("wireLikes remembers per browser", html.includes("imy-hearts-"));
  t("demo fallback MEMS intact for template", html.includes("var MEMS=(T&&T.mems)||["));
  t("pop animation preserved", html.includes("@keyframes pop"));
  t(".like styles preserved", html.includes(".like.on{background:#fbeee8"));
  const videoMemory: any = { ...mem("video-memory-1", "Jade", "friend", "Her laugh in the garden.", 0), video: "https://media.example/memory.mp4" };
  const plusVideo = boot(renderTribute(template, { ...jonny, memories: [videoMemory] }));
  const freeVideo = boot(renderTribute(template, { ...jonny, tier: "free", memories: [videoMemory] }));
  t("approved visitor video plays on Plus", plusVideo.mems[0].vi === "https://media.example/memory.mp4" && plusVideo.boards[0].items.some((x: any) => x.t === "video"));
  t("approved visitor video rests on Free", freeVideo.mems[0].vi === "" && !freeVideo.boards[0].items.some((x: any) => x.t === "video"));
}

// ── 2 · free she page · wall cap ──────────────────────────────────────────────
{
  const html = renderTribute(template, freeShe);
  const b = boot(html);
  t("free wall caps at ten", b.mems.length === 10);
  t("waiting memories seeded", b.seedw.length === 3 && b.waiting === 3);
  t("hearts survive the cap mapping", b.mems.some((m: any) => m.h > 0));
  t("she page has no he leak", !html.includes(">His story</a>"));
  t("no Eleanor leak (she page)", !html.includes("Eleanor"));
  const photoPage = boot(renderTribute(template, { ...freeShe, photos: Array.from({ length: 14 }, (_, i) => ({ id: `free-photo-${i}`, url: `https://x/free-${i}.jpg` })) }));
  t("free pages show twelve photographs", photoPage.gal.length === 12 && photoPage.phw === 2);
  t("onboarding photographs reach the board by default", photoPage.boards[0].items.length === 12 && photoPage.boards[0].items[0].ttl === "Photograph 1");
}

// ── 3 · id-less memories (airtable fallback) degrade gracefully ───────────────
{
  const html = renderTribute(template, skipped);
  const b = boot(html);
  t("id-less memory renders with empty id", b.mems[0].id === "");
  t("they/them default (no pronouns)", html.includes(">Their story</a>") || html.includes("Their story"));
  t("no Eleanor leak (skipped page)", !html.includes("Eleanor"));
}

// ── 4 · hearts never negative through mapping ────────────────────────────────
{
  const html = renderTribute(template, { ...jonny, memories: [mem("dddddddd-4444-4444-8444-444444444444", "X", "friend", "hi", -5 as any)] });
  const b = boot(html);
  t("negative hearts clamp to zero", b.mems[0].h === 0);
}

// ── 5 · comments (July 8) ─────────────────────────────────────────────────────
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
  const html = renderTribute(template, withComments);
  const b = boot(html);
  t("boot cm carries approved comment triples", JSON.stringify(b.mems[0].cm) === JSON.stringify([["Tom","next door","I still have mine."],["Ana","friend","He never stopped building."]]));
  t("memCard emits data-mid", html.includes(`(m.id?' data-mid="'+m.id+'"':'')`));
  t("comment post goes to the family first", html.includes("/memory/comment") && html.includes("waiting for the family"));
  t("demo comment path preserved", html.includes("bp.parentNode.parentNode.insertBefore(d,bp.parentNode);inp.value=''"));
  t("comments absent → empty cm", JSON.stringify(boot(renderTribute(template, jonny)).mems[0].cm) === "[]");
}


// ── 6 · voice memories (July 8) ───────────────────────────────────────────────
{
  const voiced: Tribute = {
    ...jonny,
    memories: [{ ...mem("ffffffff-6666-4666-8666-666666666666", "Daniel", "his son", "His voicemail, kept.", 1),
      audio: "https://blob.example/voice.mp3" }],
  };
  const htmlPlus = renderTribute(template, voiced);
  const bPlus = boot(htmlPlus);
  t("plus page carries the voice url", bPlus.mems[0].au === "https://blob.example/voice.mp3");
  t("card builder renders a player", htmlPlus.includes("aria-label=\"A voice memory\"") && htmlPlus.includes("a voice, kept"));
  t("composer offers the voice attach", htmlPlus.includes("＋ Add a voice memory") && htmlPlus.includes("voiceFile"));
  t("share POST carries audioUrl", htmlPlus.includes("audioUrl:VOICE.url||''"));
  const htmlFree = renderTribute(template, { ...voiced, tier: "free" });
  const bFree = boot(htmlFree);
  t("free page rests the recording (kept, not shown)", bFree.mems[0].au === "");
  t("free gate speaks the Plus promise", htmlFree.includes("Voice memories live on Plus pages."));
  const badScheme = renderTribute(template, { ...voiced, memories: [{ ...voiced.memories![0], audio: "javascript:alert(1)" }] });
  t("non-https audio never reaches the page", boot(badScheme).mems[0].au === "");
}


// ── 7 · the quiet Plus band (July 8) ─────────────────────────────────────────
{
  const htmlFree = renderTribute(template, freeShe);
  t("free page carries the Plus band", htmlFree.includes('id="plus-band"'));
  t("band posts real checkout forms", htmlFree.includes('name="plan" value="plus_once"') && htmlFree.includes('name="plan" value="plus_monthly"'));
  t("band carries the page slug", htmlFree.includes('name="slug" value="rose-8559"'));
  t("band speaks her voice (she page)", htmlFree.includes("Her voice. Living pictures."));
  t("band leads with the pledge", htmlFree.includes("Everything here is free, forever."));
  const htmlSkipped = renderTribute(template, skipped);
  t("band defaults to their voice (no pronouns)", htmlSkipped.includes("Their voice. Living pictures."));
  const htmlPlus = renderTribute(template, jonny);
  t("plus pages never carry the band", !htmlPlus.includes('id="plus-band"'));
  t("concierge cta is a real intake, not the old mockup", htmlFree.includes("mailto:imissyoumemorial@gmail.com?subject=Concierge") && !htmlFree.includes("hyperagent.com/s/aBadvO39KhiuGhTHgfi93g"));
}

// ── 9 · flowers persist — today's wreath hydrates from the ground truth ──────
{
  const html = renderTribute(template, jonny);
  const b = boot(html);
  t("boot carries today's wreath count", b.fwt === 4);
  t("template hydrates today's count from boot", html.includes("if(T&&T.fwt)"));
  t("lay POST consumes the server's today count", html.includes("if(j&&j.ok&&j.today)"));
  t("negative today count clamps to zero", boot(renderTribute(template, { ...jonny, flowerToday: -3 })).fwt === 0);
}

// ── 11 · placements: every photograph knows its place (July 8) ────────────────
{
  const phA = { id: "ph-a", url: "https://x/p0.jpg" }, phB = { id: "ph-b", url: "https://x/p1.jpg", cap: "the bench" };
  const tlA = { id: "tl-a", year: "1968", title: "Married" }, tlB = { id: "tl-b", year: "1975", title: "The house" };
  const base = { ...jonny, photos: [phA, phB], timeline: [tlA, tlB] };
  const aligned = boot(renderTribute(template, { ...base, placements: { chapters: { "tl-a": ["ph-b"] } } }));
  t("aligned chapters flag on", aligned.ch[0].al === 1);
  t("a moment's own photo sits at its index", JSON.stringify(aligned.ch[0].ph[0]) === JSON.stringify(["p1", "the bench"]));
  t("an unassigned moment is a quiet null", aligned.ch[0].ph[1] === null);
  const legacy = boot(renderTribute(template, { ...base, placements: { chapters: { _group: ["ph-a", "ph-b"] } } }));
  t("legacy group keeps the pre-placements look", !legacy.ch[0].al && legacy.ch[0].ph.length === 2 && legacy.ch[0].ph[0][0] === "p0");
  const bareB = boot(renderTribute(template, base));
  t("no placements → chapters carry no photos", Array.isArray(bareB.ch[0].ph) && bareB.ch[0].ph.length === 0);
  t("no placements → the gallery graces the board, captions first",
    bareB.boards.length === 1 && bareB.boards[0].items.length === 2 && bareB.boards[0].items[0].img === "https://x/p0.jpg" && bareB.boards[0].items[0].ttl === "Photograph 1" && bareB.boards[0].items[0].who === "Family" && bareB.boards[0].items[1].img === "https://x/p1.jpg" && bareB.boards[0].items[1].ttl === "the bench");
  const bareHtml = renderTribute(template, { ...base, quote: "Measure twice." });
  t("quote band wears its photographic ground again (d7, July 29)", bareHtml.includes('id="quoteband"><div class="bgi"><img src="/art/7bb79736') && bareHtml.includes('<div class="v"></div>'));
  const withQ = renderTribute(template, { ...base, quote: "Measure twice.", placements: { quote: "ph-b" } });
  t("the banner never wears uploaded photographs", withQ.includes('id="quoteband"><div class="bgi"><img src="/art/') && !withQ.includes('<div class="bgi"><img src="https://x/'));
  const pinned = boot(renderTribute(template, { ...base, placements: { board: ["ph-b", "ph-a"] } }));
  t("board follows the family's order", pinned.boards[0].items[0].img === "https://x/p1.jpg" && pinned.boards[0].items[1].img === "https://x/p0.jpg");
  const keeps = boot(renderTribute(template, { ...base, memories: [{ ...mem("99999999-9999-4999-8999-999999999999", "Ana", "a neighbour", "The bench he built.", 2), photos: ["https://x/keep.jpg"] }] }));
  t("visitor keepsakes pin with their names, after the family's photographs", keeps.boards[0].items.length === 3 && keeps.boards[0].items[2].who === "Ana" && keeps.boards[0].items[2].img === "https://x/keep.jpg");
  t("engine renders the quiet empty card", template.includes("no photograph for this moment · yet"));
  t("one flower number is enough", renderTribute(template, jonny).includes(".wr-count{display:none!important}"));
  t("engine survives an empty carousel", template.includes("if(!c.ph.length)return;phI"));
}

// ── 16 · the obituary and the kept voice (July 9) ─────────────────────────────
{
  const withOb = renderTribute(template, { ...jonny, obituary: "In loving memory of Jon.\nSurvived by his family.", voiceUrl: "https://x/voice.mp3" });
  t("the obituary stands on its own sheet", withOb.includes('id="obituary"') && withOb.includes("In loving memory of Jon."));
  t("obituary line breaks are kept", withOb.includes("white-space:pre-line"));
  t("long unbroken words stay inside the card", withOb.includes("overflow-wrap:anywhere;word-break:break-word"));
  t("the obituary sits directly below the wreath", withOb.indexOf('id="obituary"') < withOb.indexOf('<section class="section rev" id="story"'));
  t("their kept voice plays on plus", withOb.includes('id="theirvoice"') && withOb.includes('src="https://x/voice.mp3"'));
  const freeV = renderTribute(template, { ...jonny, tier: "free", obituary: "In loving memory.", voiceUrl: "https://x/voice.mp3" });
  t("a free page keeps the voice resting", !freeV.includes('id="theirvoice"') && freeV.includes('id="obituary"'));
  const longOb = renderTribute(template, { ...jonny, obituary: "First sentence. Second sentence. Third sentence. Fourth sentence carries the rest of the formal notice. Fifth sentence closes it." });
  t("long obituaries show three sentences before disclosure", longOb.includes("First sentence. Second sentence. Third sentence.") && longOb.includes("Read the full obituary"));
  const longObBreaks = renderTribute(template, { ...jonny, obituary: "First sentence. Second sentence. Third sentence. Fourth sentence carries the notice.\nA new paragraph closes it." });
  t("a long obituary keeps paragraph breaks in the disclosure", longObBreaks.includes("Fourth sentence carries the notice.\n") && longObBreaks.includes("Read the full obituary"));
  t("short obituaries remain open", !withOb.includes("Read the full obituary"));
  t("no obituary → no empty sheet", !renderTribute(template, jonny).includes('id="obituary"'));
}

// ── 15 · the example sells the beginning; family pages never do (July 9) ──────
{
  const demo = renderTribute(template, { ...jonny, slug: "eleanor", fullName: "Eleanor Margaret Hayes" });
  t("the demo carries the begin band", demo.includes('id="begin-band"') && demo.includes("Make one for someone"));
  t("the demo's pill leads with plus intent", demo.includes('href="/onboarding?plan=plus" id="begin-pill"'));
  t("the old whisper stays retired", !demo.includes(">tend this page</a>"));
  const family = renderTribute(template, jonny);
  t("a family page never carries the ask", !family.includes('id="begin-band"') && !family.includes('id="begin-pill"'));
  t("the demo carries the log-in door too", demo.includes('id="loginTop"'));
}

// ── 14 · the composer's doors are real (July 8) ───────────────────────────────
{
  const page = renderTribute(template, jonny);
  t("photo attach is wired, honestly capped (r2 Task 5: 'up to 4')", template.includes('id="photoAdd"') && template.includes("＋ Add photos · up to 4") && !template.includes("＋ Add a photograph"));
  t("a memory can carry its photographs (0029: up to four)", template.includes("photoUrls:PHOTOS.map(function(s){return s.url}).filter(Boolean)") && template.includes("photoUrl:(PHOTOS[0]&&PHOTOS[0].url)||''"));
  t("the composer re-encodes on a canvas (EXIF stripped, HEIC converted where decodable)", template.includes("function shrinkPhoto(") && template.includes("'image/jpeg',.82") && template.includes("MAX=1600"));
  t("a browser that cannot read a HEIC is asked kindly for a JPG or PNG", template.includes("A JPG or PNG of the same picture will land just fine."));
  t("chosen photos preview with a remove control before submission", template.includes('id="photoPrev"') && template.includes("aria-label','Remove this photo'"));
  t("visitors can attach a moderated video", template.includes('id="videoAdd"') && template.includes("videoUrl:VIDEO.url||''") && template.includes("uploadVisitorVideo"));
  t("the helper calls the real api on live pages", template.includes("fetch('/api/assist'"));
  t("a quiet way home on every page (July 10: a real door)", page.includes('id="loginTop" href="/signin"') && !page.includes(">tend this page</a>"));
  t("the log-in door stands beside the logo (item 3)", page.includes('You Memorial</a><a id="loginTop"'));
  t("the memory door steps back a size", page.includes('id="addMemTop" style="font-size:11.5px;padding:7px 13px"') && template.includes('id="addMemTop" style="font-size:12.5px;padding:9px 16px"'));
  t("the demo add-a-moment never reaches a real page", !page.includes("＋ Add a key moment · a year, a line, a photograph") && template.includes("＋ Add a key moment"));
  t("demo binder skips the wired buttons", template.includes("if(g.id)return;"));
}

// ── 14b · photos ride with memories (0029 · r2 Task 5) ────────────────────────
{
  const withPhotos: Tribute = { ...jonny, memories: [
    { ...mem("abcd1111-1111-4111-8111-111111111111", "Maria", "his daughter", "The bench, that summer.", 1),
      photos: ["https://x/k1.jpg", "https://x/k2.jpg", "https://x/k3.jpg"] },
    mem("abcd2222-2222-4222-8222-222222222222", "Sam", "a neighbour", "Words only, whole on their own.", 0),
  ] };
  const b = boot(renderTribute(template, withPhotos));
  t("boot carries the full photo set", JSON.stringify(b.mems[0].phs) === JSON.stringify(["https://x/k1.jpg", "https://x/k2.jpg", "https://x/k3.jpg"]));
  t("the first photograph still rides as ph (board pins, back-compat)", b.mems[0].ph === "https://x/k1.jpg");
  t("a text-only memory carries no photo scaffolding", Array.isArray(b.mems[1].phs) && b.mems[1].phs.length === 0 && b.mems[1].ph === "");
  const many = boot(renderTribute(template, { ...jonny, memories: [
    { ...mem("abcd3333-3333-4333-8333-333333333333", "Ana", "friend", "Five arrived, four ride.", 0),
      photos: ["https://x/1.jpg", "https://x/2.jpg", "https://x/3.jpg", "https://x/4.jpg", "https://x/5.jpg"] },
  ] }));
  t("the wall caps a memory at four photographs", many.mems[0].phs.length === 4);
  const unsafe = boot(renderTribute(template, { ...jonny, memories: [
    { ...mem("abcd4444-4444-4444-8444-444444444444", "Ana", "friend", "Only https survives.", 0),
      photos: ["javascript:alert(1)", "https://x/ok.jpg"] },
  ] }));
  t("non-https photo urls never reach the page", JSON.stringify(unsafe.mems[0].phs) === JSON.stringify(["https://x/ok.jpg"]));
  t("the card builder renders one whole or a small strip", template.includes("function memPhotos(") && template.includes('class="mem-phs"') && template.includes('class="mem-pht"'));
  t("the photo room is ready, with its exits", template.includes('id="memLb"') && template.includes('id="memLbClose"') && template.includes('id="memLbPrev"') && template.includes('id="memLbNext"'));
  t("voice and photos coexist on one post (neither replaces the other)", (() => {
    const both = boot(renderTribute(template, { ...jonny, memories: [
      { ...mem("abcd5555-5555-4555-8555-555555555555", "Dan", "his son", "Both, together.", 0),
        photos: ["https://x/p.jpg"], audio: "https://x/v.mp3" },
    ] }));
    return both.mems[0].phs.length === 1 && both.mems[0].au === "https://x/v.mp3";
  })());
}

// ── 14c · the desktop memory arrows are placed on purpose (r2 Task 6) ─────────
{
  t("arrows stand fixed at the carousel's top right, not at 50% of a wrapper",
    template.includes(".memtrackwrap{padding-top:56px}") && template.includes("position:absolute;top:0;width:44px") && !template.includes(".memarr{display:flex;align-items:center;justify-content:center;position:absolute;top:50%"));
  t("arrows disable and dim at the row's ends, kept honest on scroll",
    template.includes("p.disabled=tr.scrollLeft<=2") && template.includes("tr.addEventListener('scroll',sync,{passive:true})") && template.includes(".memarr:disabled{opacity:.35"));
  t("arrows carry hover and focus-visible states; mobile keeps pure swipe",
    template.includes(".memarr:hover:not(:disabled)") && template.includes(".memarr:focus-visible") && template.includes(".memarr{display:none}"));
}

// ── 14d · hero content shadows (r2 Task 7) — the Task 2 scene system untouched ─
{
  t("hero text wears one soft shadow setting over every scene",
    template.includes("--hv-ts:0 1px 3px rgba(26,19,13,.55),0 5px 20px rgba(26,19,13,.38)") && template.includes(".arrive .wr-big b,.arrive .wr-biglab,.arrive .wr-count,.arrive .wr-arch .il{text-shadow:var(--hv-ts)}"));
  t("the count line turned cream so the shadow can carry it", template.includes(".arrive .wr-count{color:#F7EFDF}"));
  t("the portrait's FRAME casts the shadow, never the wreath cutout", template.includes(".arrive .wr-arch{box-shadow:0 8px 20px") && !template.includes(".wreathimg{filter:drop-shadow"));
  const page = renderTribute(template, jonny);
  t("the Task 2 scene system stands exactly as built", page.includes('id="heroVid"') && page.includes("hv-scrim") && page.includes('id="hvPick"') && page.includes("linear-gradient(180deg,rgba(63,44,26,.44) 0%,rgba(63,44,26,.10) 30%,rgba(63,44,26,.14) 60%,rgba(63,44,26,.66) 100%)"));
}

// ── 14e · visual batch r3 (July 30) — the shared off-white band, the voice's new
//          seat, the scrapbook wall, the heading options, the one-line bar, the
//          margins grid, and the multiply-blend accents ────────────────────────
{
  // item 1 · ONE shared off-white token; only the two named sections read it
  t("one shared off-white token exists", template.includes("--band-off:#F6F1E6"));
  t("the film and the chapters both read the single token",
    template.includes("#story{background:var(--band-off)") && template.includes("#film{background:var(--band-off)"));
  t("the pictures and the memories keep their own grounds",
    template.includes("#memories.sheetdeep{background:linear-gradient(180deg,#FFFFFF 0%") && !template.includes("#gallery{background:var(--band-off)"));
  // item 2 (r3), moved down one slot r5 item 10 · in their own voice sits
  // directly beneath who-they-really-were, above the memories
  const voiced = renderTribute(template, { ...jonny, voiceUrl: "https://x/voice.mp3" });
  const vIdx = voiced.indexOf('id="theirvoice"');
  t("the kept voice sits directly beneath who-they-were, above the memories (r5 10)",
    vIdx > voiced.indexOf("</section>", voiced.indexOf('id="really"')) && vIdx < voiced.indexOf('id="memories"'));
  // item 3 · scrapbook memory cards: taped snapshot lead, round writer portrait,
  // finished no-photo state, and demo pairs that never leave the example page
  t("cards lead with a taped 4:3 snapshot and seat a round portrait",
    template.includes('class="mem-snap"') && template.includes('class="mem-pav"') && template.includes("aspect-ratio:4/3"));
  t("a card with no photograph still stands finished (initial fallback intact)",
    template.includes(`'<div class="mem-av">'`) && template.includes("if(ps.length)out=") );
  // r5 item 9 · six unique pairs, each on exactly one card, matched by name:
  // Sofia→sofia · Daniel→daniel · Tom→tom · Rebecca→rebecca · Marie→ruth ·
  // one student (Miguel first, else James)→miguel; everyone else words-only.
  const demoFolk: Array<[string, string]> = [
    ["Sofia", "granddaughter"], ["Daniel", "her son"], ["Tom", "her son-in-law"],
    ["Rebecca", "her daughter"], ["Marie", "a neighbour"], ["Miguel", "her student"],
    ["James", "a former student"], ["Grace", "friend"],
  ];
  const demoWall = boot(renderTribute(template, {
    ...jonny, slug: "eleanor", fullName: "Eleanor Margaret Hayes",
    memories: demoFolk.map(([nm, rel], i) => mem(`dddddddd-9999-4999-8999-${String(i).padStart(12, "0")}`, nm, rel, `A memory from ${nm}.`, 0)),
  }));
  const pairOf = (nm: string) => {
    const m = demoWall.mems.find((x: any) => x.nm === nm);
    return m && m.dp ? String(m.dp).replace("/art/mem-demo/", "").replace("-with.webp", "") : "";
  };
  t("each pair sits on exactly one card, matched to its person (r5 9)",
    pairOf("Sofia") === "sofia" && pairOf("Daniel") === "daniel" && pairOf("Tom") === "tom" &&
    pairOf("Rebecca") === "rebecca" && pairOf("Marie") === "ruth" && pairOf("Miguel") === "miguel");
  t("zero reuse — no with-her snapshot or portrait appears twice (r5 9)", (() => {
    const dps = demoWall.mems.map((m: any) => m.dp).filter(Boolean);
    const pps = demoWall.mems.map((m: any) => m.pp).filter(Boolean);
    return new Set(dps).size === dps.length && new Set(pps).size === pps.length && dps.length === 6 && pps.length === 6;
  })());
  t("every other demo card is words-only (finished on paper alone) (r5 9)",
    demoWall.mems.filter((m: any) => !m.dp).every((m: any) => !m.pp) &&
    demoWall.mems.some((m: any) => !m.dp && !m.pp));
  t("the second student card stays words-only — miguel is never worn twice (r5 9)", (() => {
    const james = demoWall.mems.find((x: any) => x.nm === "James");
    return !!james && !james.dp && !james.pp;
  })());
  const realPage = renderTribute(template, jonny);
  t("demo pair paths never reach a real page, even from source", !realPage.includes("/art/mem-demo/"));
  t("the template's own demo wall wears all six pairs, once each (r5 9)", (() => {
    const withs = template.match(/dp:'\/art\/mem-demo\/([a-z]+)-with\.webp'/g) || [];
    const ports = template.match(/pp:'\/art\/mem-demo\/([a-z]+)-portrait\.webp'/g) || [];
    const names = withs.map((x) => x.replace(/^dp:'\/art\/mem-demo\//, "").replace(/-with\.webp'$/, "")).sort();
    return names.join() === "daniel,miguel,rebecca,ruth,sofia,tom" && withs.length === 6 && ports.length === 6;
  })());
  // items 4 + 5, rewritten r4, reseated r5 · the bar: heading locked to C,
  // standing at the top of the hero, one-line + overlay behavior unchanged
  const svc = { date: "2026-06-13", time: "11:00 AM", place: "Linden Community Chapel", address: "142 Seaside Avenue, Half Moon Bay, CA 94019", charity: "American Cancer Society" };
  const barPage = renderTribute(template, { ...jonny, service: svc });
  t("the heading is locked to the owner's C — one voice, no switcher, no query (r4 1.1)",
    barPage.includes(".svcrow .svcrow-in .lab{font-family:'Besley',serif!important;text-transform:none;font-variant-caps:normal;font-style:italic;font-size:18.5px!important;font-weight:600") &&
    !barPage.includes("svc-hswitch") && !barPage.includes("data-heading") && !barPage.includes("URLSearchParams(location.search).get('heading')") &&
    !renderTribute(template, { ...jonny, slug: "eleanor", service: svc }).includes("svc-hswitch"));
  t("the label speaks with its capitals — Celebration of Life (r4 1.2)",
    barPage.includes('<span class="lab">Celebration of Life</span>') &&
    barPage.includes('aria-label="Celebration of Life · open the details"') &&
    barPage.includes('<div class="svc-ov-kick">Celebration of Life</div>') &&
    !barPage.includes("Celebration of life"));
  t("the bar stands at the top of the hero, above the wreath, still inside it (r5 3)", (() => {
    const hero = barPage.indexOf('<header class="arrive"');
    const wrhero = barPage.indexOf('<div class="wrhero"');
    const bar = barPage.indexOf('<div class="svcrow">');
    const wreath = barPage.indexOf('<div class="wreathbox"');
    const plate = barPage.indexOf('<div class="wr-plate">');
    return hero > -1 && wrhero > hero && bar > wrhero && wreath > bar && plate > wreath;
  })());
  t("the bar stands on its own paper over the scene, and a tap on it never lays a flower",
    barPage.includes(".svcrow .svcrow-in{margin:0;max-width:min(92vw,620px);background:linear-gradient(180deg,#FFFDF6,#FBF4E4)") &&
    template.includes(".wr-plate,.svcrow'))return;"));
  t("no service · no bar in the hero, and nothing reserves the old strip's room",
    !renderTribute(template, jonny).includes('class="svcrow"') && !template.includes("{{SERVICE_STRIP}}\n\n\n\n{{CREDIT_BANNER}}"));
  t("the bar holds one line and truncates with an ellipsis",
    barPage.includes("text-overflow:ellipsis") && barPage.includes("flex-wrap:nowrap") && !barPage.includes('id="svcMore"'));
  t("the caret is a real 44px control pinned at the line's end",
    barPage.includes('id="svcCaret"') && barPage.includes(".svc-caret{width:44px;height:44px"));
  t("the caret opens an overlay with the full details and honest exits",
    barPage.includes('id="svcOv"') && barPage.includes('id="svcOvX"') && barPage.includes("Linden Community Chapel") && barPage.includes("142 Seaside Avenue") && barPage.includes("American Cancer Society") && barPage.includes("if(e.key==='Escape')shut()") && barPage.includes("document.body.style.overflow='hidden'"));
  t("share the date still rides the bar and the overlay", barPage.includes('id="shareDateBtn"') && barPage.includes('id="svcOvShare"'));
  // item 6 · the margins grid: torn bands, board, and concierge card align
  t("torn bands sit on the shared 972px content line", template.includes("calc(50vw - 486px)"));
  t("the board and the concierge card join the 1080px grid",
    template.includes(".boardstage{position:relative;max-width:1080px") && template.includes(".gw-inner{max-width:1080px"));
  t("injected sections stopped doubling the wrap's gutter",
    voiced.includes(`id="theirvoice" style="padding:44px 0 30px`) && renderTribute(template, { ...jonny, obituary: "Kept." }).includes(`id="obituary" style="padding:56px 0 26px`));
  // item 7, hardened r4 · scrapbook accents: multiply-blend imgs in gutters,
  // sparse on phones, size-capped, and immune to section-class collisions
  t("accents are lazy multiply-blend images behind all content",
    template.includes(".sba{position:absolute;z-index:-1;mix-blend-mode:multiply;pointer-events:none") && template.includes('class="sba stay"'));
  t("at most the two staying accents survive under 900px",
    template.includes("@media(max-width:899px){.sba{display:none}.sba.stay{display:block}}") && (template.match(/class="sba stay"/g) || []).length <= 2);
  t("the survivor class no longer collides with the keeping place (r4 3.1 · the slabs)",
    !template.includes('class="sba keep"') && !renderTribute(template, jonny).includes('class="sba keep"'));
  t("img.sba is capped and immunized — no ground, no padding, no min-height, ≤160px",
    template.includes("img.sba{max-width:160px;min-height:0;padding:0;border:0;background:none}"));
  t("no standalone accent wears the tape or torn-paper scraps (off a card they read as artifacts)", (() => {
    const rx = /class="sba[^"]*"[^>]*src="\/art\/scrapbook\/(tape|tornpaper)\.webp"/;
    return !rx.test(template) && !rx.test(renderTribute(template, { ...jonny, film: { url: "https://x/film.mp4" } }));
  })());
  t("the r2 botanical SVG corners retired where the webps serve the corner",
    !template.includes("no-repeat top 18px right 20px / 108px auto"));
}

// ── 14f · visual batch r4 (July 30) — the hero header block and the
//          memory-submission identity system ─────────────────────────────────
{
  // item 1.4 · the counter's digits: a closed, properly weighted zero. Besley's
  // tabular figure set carries a hairline zero and Sometype Mono's zero is
  // slashed — the count wears Noto Serif 700, tabular by default, no jitter.
  t("the counter wears Noto Serif 700 with tabular lining figures (r4 1.4)",
    template.includes(".wr-big,.wr-big b{font-family:'Noto Serif','Besley',serif!important;font-variant-caps:normal;font-variant-numeric:lining-nums tabular-nums;font-weight:700") &&
    template.includes("family=Noto+Serif:wght@700"));
  t("the count-up stays comma-grouped through the same animation",
    template.includes("el.textContent=Math.floor(p*t).toLocaleString()"));
  // item 1.5 retired by r5 item 1 (owner order): the counter caption — element,
  // styles, and this contract's old assertion — is gone everywhere.
  t("the counter caption is removed everywhere (r5 1)",
    !template.includes("plusheld") && !template.includes("held in full") &&
    !renderTribute(template, jonny).includes("plusheld") &&
    !renderTribute(template, jonny).includes("The full memorial · every memory open"));
  // item 1.6 · the presence pill never leaves the viewport
  t("the presence pill keeps a sane inset at every width (r4 1.6)",
    template.includes(".wrhero .presence{top:14px;left:clamp(18px,2vw,24px);right:auto;max-width:calc(100vw - 2*clamp(18px,2vw,24px))}"));
  // item 2 · the identity sheet: asked once at the composer's first touch,
  // escape/backdrop close it, the photo is optional and never blocks
  t("the sheet opens once at the composer's first touch (r4 2.1)",
    template.includes("mi.addEventListener('focus',function(){if(ID||askedOnce)return;askedOnce=true;requireId(null)"));
  t("escape closes the sheet like the backdrop and the X (r4 2.2)",
    template.includes("if(e.key==='Escape'&&idm.classList.contains('open')"));
  t("the sheet speaks the owner's copy — the ask, the photo line, the primary door",
    template.includes("Want to add your photo so people can see who you are?") &&
    template.includes("That's me · continue") &&
    template.includes("Before you add to her page") && template.includes("Tell the family <em>who you are</em>"));
  t("the photo is optional, circular, and canvas-cropped center-square (r4 2.3)",
    template.includes('id="idpRing"') && template.includes("function avatarSquare(") &&
    template.includes("c.getContext('2d').drawImage(im,(w-s)/2,(h-s)/2,s,s,0,0,out,out)") &&
    template.includes("'image/jpeg',.82") && template.includes('id="idpSkip"') &&
    template.includes("Add a photo · optional") && template.includes('accept="image/*,.heic,.heif"'));
  t("the avatar goes up through the narrow avatar door and rides the share POST",
    template.includes("fd.append('context','avatar')") && template.includes("avatarUrl:ID.pu||''"));
  t("a returning visitor's email brings their kept details home (r4 2.5)",
    template.includes("/api/memory-author") && template.includes("Your details are filled in from last time."));
  // item 2.4 · the avatar renders on the card through the r3 portrait slot
  const avMem = { ...mem("aaaa0030-1111-4111-8111-111111111111", "Ana", "friend", "Her laugh, kept.", 1), avatarUrl: "https://x/ana.jpg" } as any;
  t("an approved memory seats its writer's photo in the portrait slot (r4 2.4)",
    boot(renderTribute(template, { ...jonny, memories: [avMem] })).mems[0].pp === "https://x/ana.jpg");
  t("a non-https avatar never reaches the page",
    boot(renderTribute(template, { ...jonny, memories: [{ ...avMem, avatarUrl: "javascript:alert(1)" }] })).mems[0].pp === "");
  t("no avatar → the soft initial stands in (fallback intact)",
    boot(renderTribute(template, jonny)).mems[0].pp === "" && template.includes(`'<div class="mem-av">'`));
  t("a real avatar beats the demo portrait on the example wall",
    boot(renderTribute(template, { ...jonny, slug: "eleanor", fullName: "Eleanor Margaret Hayes", memories: [avMem] })).mems[0].pp === "https://x/ana.jpg");
}

// ── 14g · visual batch r5 (July 30 evening) — the count above the button, the
//          bar at the hero's top, the rose watch, the contained book, and the
//          accents without the book ─────────────────────────────────────────────
{
  // item 2 · the flower number stands above the "Lay a flower" button
  t("the count stands above the button — number first, then the hud (r5 2)", (() => {
    const big = template.indexOf('<div class="wr-big">');
    const hud = template.indexOf('<div class="wr-hud">');
    const btn = template.indexOf('id="layBtn"');
    return big > -1 && hud > big && btn > hud;
  })());
  t("the count keeps its Noto Serif face and its count-up (r5 2)",
    template.includes(".wr-big,.wr-big b{font-family:'Noto Serif','Besley',serif!important") &&
    template.includes('<div class="wr-big"><b data-count="{{FLOWER_COUNT}}">0</b></div>'));
  // item 4 · the presence watch is a blinking rose, no stem, no green
  t("the presence dot is a rose now — layered petals, no green anywhere (r5 4)",
    template.includes('<i aria-hidden="true"><svg viewBox="0 0 14 14"') &&
    template.includes('fill="#C28270"') && template.includes('fill="#B26A55"') &&
    !template.includes("#7a9464"));
  t("the rose keeps the gentle blink, stilled under reduced motion (r5 4)",
    template.includes(".presence i{width:14px;height:14px;flex:0 0 auto;display:inline-flex;background:none;border-radius:0;animation:pulse9 2.4s ease-in-out infinite}") &&
    template.includes("@keyframes pulse9{0%,100%{opacity:.5;transform:scale(.9)}50%{opacity:1;transform:scale(1)}}") &&
    template.includes("@media(prefers-reduced-motion:reduce){*{animation-duration:.001ms!important"));
  // item 5 · the auto-scroll root cause: rail centering never touches the page.
  // Programmatic scrolling only answers a user gesture; the rail centers with
  // scrollLeft math on its own container, and scrollIntoView never rides a timer.
  t("rail centering is horizontal scrollLeft math on the rail container only (r5 5)",
    template.includes("var target=chbScroll.scrollLeft+(ar.left+ar.width/2)-(sr.left+sr.width/2);") &&
    template.includes("chbScroll.scrollTo({left:target,behavior:'smooth'})") &&
    !template.includes("act.scrollIntoView"));
  t("the item-24 snap answers a real tap only — never a timer (r5 5)",
    template.includes("if(chbMob()&&rBox.scrollIntoView)") &&
    template.includes("m.onclick=go;m.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}}"));
  // item 6 · the quiet player stays inside the open chapter, at a slower breath
  t("auto-advance cycles inside the chapter and wraps to its own top (r5 6)",
    template.includes("function tickCh(){var c=CH[chI];if(c.ph.length>1)setPh((phI+1)%c.ph.length,false)}") &&
    !template.includes("goCh(chI+1,false)"));
  t("the cadence slowed to ~6.5s; manual chapter turns unchanged (r5 6)",
    template.includes("auto=setTimeout(function(){tickCh();restart(6500)},ms||6500)") &&
    !template.includes("restart(4200)") && !template.includes("restart(4600)") &&
    template.includes("if(manual)restart(9000)"));
  // item 7 · the book accent retired everywhere; a fern holds its corner
  t("book.webp is gone from the scatter — everywhere, even from source (r5 7)",
    !template.includes("book.webp") && !renderTribute(template, jonny).includes("book.webp") &&
    !renderTribute(template, { ...jonny, slug: "eleanor", fullName: "Eleanor Margaret Hayes" }).includes("book.webp"));
  t("a mirrored fern reads clearly where the book stood (r5 7)",
    template.includes('style="top:14px;right:30px;width:110px;opacity:.4;transform:rotate(7deg) scaleX(-1)" src="/art/scrapbook/fern.webp"'));
  // item 8 · the polaroid caption lives in the chin: Caveat, one ellipsis line
  t("the who-they-were caption sits inside the chin, one clamped line (r5 8)",
    template.includes(".really-snap figcaption{position:absolute;left:10px;right:10px;bottom:7px;height:22px;line-height:22px;text-align:center;font-family:'Caveat',cursive;font-size:17px;color:var(--ink-soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}") &&
    template.includes("padding:10px 10px 34px"));
  t("the caption never wears .hand (Besley-italic override) — hand3 carries Caveat (r5 8)", (() => {
    const page = renderTribute(template, { ...jonny, photos: [{ url: "https://x/p0.jpg", cap: "Say cheese, then come help" }] });
    return page.includes('<figcaption class="hand3">Say cheese, then come help</figcaption>') &&
      !page.includes('<figcaption class="hand">') && !template.includes('<figcaption class="hand">');
  })());
}

// ── 13 · the page in the family's order (July 8) ──────────────────────────────
{
  const withQuote = { ...jonny, quote: "Measure twice.", timeline: [{ id: "tl-a", year: "1968", title: "Married" }] };
  const seq = (html: string) => ["story", "quoteband", "gallery", "really", "memories", "keep"]
    .map((id) => [id, html.indexOf(`id="${id}"`)] as const)
    .filter(([, i]) => i > -1)
    .sort((a, b) => a[1] - b[1])
    .map(([id]) => id);
  const def = renderTribute(template, withQuote);
  t("no plan → the design's arc, untouched", JSON.stringify(seq(def)) === JSON.stringify(["story", "quoteband", "gallery", "really", "memories", "keep"]));
  const rearranged = renderTribute(template, { ...withQuote, sections: { order: ["memories", "quote", "story", "gallery", "really", "keep"] } });
  t("the rooms follow the family's order", JSON.stringify(seq(rearranged)) === JSON.stringify(["memories", "quoteband", "story", "gallery", "really", "keep"]));
  t("reordering loses no room", ["story", "quoteband", "gallery", "really", "memories", "keep"].every((id) => rearranged.includes(`id="${id}"`)));
  t("junk keys are ignored", JSON.stringify(seq(renderTribute(template, { ...withQuote, sections: { order: ["hero", "story"] } }))) === JSON.stringify(["story", "quoteband", "gallery", "really", "memories", "keep"]));
  const resting = renderTribute(template, { ...withQuote, sections: { hidden: ["gallery", "keep"] } });
  t("a resting room hides by css, stays in the page", resting.includes("#gallery{display:none!important}") && resting.includes(`id="gallery"`));
  t("resting the keeping place rests its fab too", resting.includes(".bbfab{display:none!important}"));
  t("the gold thread sews top-down whatever the order", template.includes("pts.sort(function(a,b){return a[1]-b[1]})"));
}

// ── 12 · the tape shelf holds real tapes (July 8) ─────────────────────────────
{
  const vids = [
    { id: "v-1", url: "https://x/first.mp4", cap: "The wedding toast" },
    { id: "v-2", url: "https://youtu.be/dQw4w9WgXcQ", cap: "The garden, filmed" },
  ];
  const onePhoto = [{ id: "ph-a", url: "https://x/p0.jpg" }];
  const plusPage = renderTribute(template, { ...jonny, videos: vids, photos: onePhoto, placements: { living: { "ph-a": "v-1" }, board: [], chapters: {} } });
  const bp = boot(plusPage);
  t("demo tapes never reach a real page", !plusPage.includes("First baseball game, with Grandpa"));
  t("real tapes stand on the shelf", plusPage.includes('data-v="0"') && plusPage.includes("The wedding toast"));
  t("a paired tape wears its photograph", plusPage.includes('<div class="tapeobj" data-v="0"><div class="win"><img src="https://x/p0.jpg"'));
  t("the digitizing card stays", plusPage.includes("we help you digitize anything"));
  t("boot carries playable tapes", bp.vids.length === 2 && bp.vids[0].u === "https://x/first.mp4" && !bp.vids[0].e);
  t("a youtube link becomes a quiet embed", bp.vids[1].e === "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  t("the room is ready to fill", plusPage.includes('id="tvroom"'));
  t("living pairs are chosen, not index luck", bp.liv.p0 === "https://x/first.mp4");
  const freePage = renderTribute(template, { ...jonny, tier: "free", videos: vids, photos: onePhoto });
  const bf = boot(freePage);
  t("free pages rest their tapes", bf.vids.length === 0 && !freePage.includes('id="tvroom"') && freePage.includes("#keep .shelfview{display:none!important}"));
  const legacy = boot(renderTribute(template, { ...jonny, videos: [{ id: "v-1", url: "https://x/first.mp4" }], photos: onePhoto }));
  t("pages from before the choice keep index pairing", legacy.liv.p0 === "https://x/first.mp4");
}

// ── 10 · presence is real or silent — never simulated (July 8) ───────────────
{
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const bare = renderTribute(template, jonny);
  t("simulation never survives a server render", !bare.includes("' people are here with you now'") && !bare.includes("var cur=2+Math.floor"));
  t("presence rests hidden without realtime config", bare.includes("presence rests until real people are counted") && bare.includes('hidden style="display:none"'));
  t("no realtime module without keys", !bare.includes("supabase-js@2/+esm"));
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-for-harness";
  const wired = renderTribute(template, jonny);
  t("realtime module ships with keys", wired.includes("supabase-js@2/+esm") && wired.includes('"presence-"+"jonny"'));
  t("presence wears the live-chip when it shows", wired.includes("presence, noticed (July 9)"));
  t("module only speaks from two upward", wired.includes("if(n>=2)"));
  t("demo simulation intact in the raw design file", template.includes("/* presence line — no one mourns alone */"));
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

// ── 8 · the footer speaks each page's own address (July 8) ───────────────────
{
  const htmlJonny = renderTribute(template, jonny);
  t("footer speaks the page's own address", htmlJonny.includes("jonny.imissyoumemorial.com"));
  t("no demo address leak", !htmlJonny.includes("eleanor.imissyoumemorial.com"));
  const htmlEleanor = renderTribute(template, { ...jonny, slug: "eleanor", fullName: "Eleanor Margaret Hayes" });
  t("eleanor keeps her own address", htmlEleanor.includes("eleanor.imissyoumemorial.com"));
}

// ── 17 · share the date + if you knew them (July 10) ──────────────────────────
{
  const svc = { date: "2026-06-13", time: "6:00 PM", place: "Linden Community Chapel", address: "142 Seaside Avenue, Half Moon Bay, CA 94019" };
  const withSvc = renderTribute(template, { ...jonny, service: svc });
  t("the service strip carries share the date", withSvc.includes('id="shareDateBtn"'));
  t("the flyer room is ready", withSvc.includes('id="sharedate"') && withSvc.includes("Making the flyer…") && withSvc.includes("share-the-date.png"));
  t("the flyer speaks the page's own address", withSvc.includes("https://jonny.imissyoumemorial.com"));
  const noSvc = renderTribute(template, jonny);
  t("no service · no flyer door", !noSvc.includes('id="shareDateBtn"') && !noSvc.includes('id="sharedate"'));
  const freePage = renderTribute(template, freeShe);
  t("a free page carries the quiet note", freePage.includes('id="keepnote"') && freePage.includes("If you knew Rose"));
  t("the note tells the truth about what waits", freePage.includes("Three more memories are waiting"));
  t("the note opens the real gift sheet, remembered once", freePage.includes("getElementById('giftSheet')") && freePage.includes("imy-note-"));
  const fewMem = renderTribute(template, { ...freeShe, memories: (freeShe.memories || []).slice(0, 2) });
  t("a quieter wall gets the forward-looking words", fewMem.includes("so every memory to come has a home"));
  t("a plus page never carries the note", !renderTribute(template, jonny).includes('id="keepnote"'));
  t("the demo never carries the note", !renderTribute(template, { ...freeShe, slug: "eleanor" }).includes('id="keepnote"'));
}

// ── 18 · a brand-new page stands whole (July 10) ──────────────────────────────
// The template's engine indexes BOARDS[0] unconditionally, and an empty array
// is truthy — so boards must never ship bare. One exception there killed the
// ticker, the gift sheet's options, and the checkout wiring on every page
// without a pin. This block keeps that lesson.
{
  const bare = renderTribute(template, { slug: "new-4444", fullName: "Ana Reyes", tier: "free", status: "published",
    photos: [{ id: "ph-n", url: "https://x/only.jpg" }] });
  const bb = boot(bare);
  t("boards never ship empty-but-truthy", Array.isArray(bb.boards) && bb.boards.length === 1 && bb.boards[0].items.length === 1);
  t("an onboarding photograph reaches the board", bb.boards[0].items[0].img === "https://x/only.jpg" && bb.boards[0].items[0].ttl === "Photograph 1");
  t("the word ticker rests when there are no words", bare.includes(".tick9{display:none!important}"));
  t("the top fold art is asked for first", bare.includes('rel="preload" as="image" href="/art/wreath2-64e82a.png"') && bare.includes('rel="preload" as="image" href="https://x/only.jpg"'));
  t("a missing wall element never takes the wiring down", bare.includes("if(!wallCt||!wchips||!inviteCard)return;"));
  t("the plaque and the waiting line mind their absence", bare.includes("if(plaqueEl)plaqueEl.hidden=!unlocked;") && bare.includes("if(gsWaitLine)gsWaitLine.textContent=") && bare.includes("if(gsWaitLine)gsWaitLine.style.display="));
  const deliberatelyEmpty = renderTribute(template, { ...jonny, photos: [{ id: "ph-a", url: "https://x/p0.jpg" }], placements: { board: [] } });
  t("a family-cleared board stays empty", deliberatelyEmpty.includes(".bbfab{display:none!important}"));
}

// ── 19 · the gift sheet speaks of them (July 10) ──────────────────────────────
{
  const freePage = renderTribute(template, { ...freeShe, photos: [{ id: "ph-r", url: "https://x/rose.jpg" }] });
  t("their face tops the gift sheet", freePage.includes('class="gs-face" src="https://x/rose.jpg"') && freePage.includes(".gs-face{display:block"));
  t("no photograph · the sheet stays quiet about it", !renderTribute(template, freeShe).includes('class="gs-face"'));
  t("the sheet asks to keep their memory alive", freePage.includes("Help keep Rose&#39;s memory alive"));
  t("the demo giver's name never reaches a real page", !freePage.includes("Dave Alvarez") && freePage.includes("Your name · shown on the wall"));
  t("the waiting line tells the truth", freePage.includes('<li id="gsWaitLine">Three waiting memories come home</li>'));
  const noneWaiting = renderTribute(template, { ...freeShe, memories: (freeShe.memories || []).slice(0, 2) });
  t("no waiting memories · the line rests but the element stays", noneWaiting.includes('<li id="gsWaitLine" style="display:none"></li>'));
  t("the raw design file keeps its demo sheet", template.includes("Dave Alvarez · shown on the wall"));
}

// ── 22 · a link knows who it carries (July 12) ────────────────────────────────
{
  const titled = renderTribute(template, jonny);
  t("the title speaks years and place", titled.includes("<title>Jon Alvarez · 1948 to 2026 · San Diego · I Miss You Memorial</title>"));
  t("the link preview matches", titled.includes('og:title" content="Jon Alvarez · 1948 to 2026 · San Diego · I Miss You Memorial"'));
  const bareTitle = renderTribute(template, skipped);
  t("no dates, no place · the title stays plain", bareTitle.includes("<title>Jay Río · I Miss You Memorial</title>"));
}

// ── 21 · every wait has an end (July 12) ──────────────────────────────────────
{
  const letter = readFileSync((process.env.IMY_REPO_ROOT || ".") + "/imy-app/templates/onboarding.html", "utf8");
  t("the gift checkout returns the button on a hung request", template.includes("if(ac)setTimeout(function(){try{ac.abort()}catch(e){}},15000);"));
  t("the letter's checkout and uploads carry their own deadlines",
    letter.includes("},15000);") && letter.includes("},45000):null;"));
  t("the letter resumes visibly without losing uploaded references", letter.includes('id="draftReturn"') && letter.includes("Continue the letter") && letter.includes("galleryUploads"));
  t("step fourteen speaks photos, videos, and twelve free photographs", letter.includes("Photos and videos, so the page feels like them.") && letter.includes("12 photos are free"));
  t("mobile ruled writing follows the text line", letter.includes("textarea{min-height:150px;line-height:28px") && letter.includes("transparent 27px"));
  t("the free completion page opens the tribute or family study", letter.includes('id="finStudy"') && letter.includes("Open the family study"));
}

// ── 16 · the landing carries the log-in door too (July 10) ────────────────────
{
  const landing = readFileSync((process.env.IMY_REPO_ROOT || ".") + "/imy-app/templates/landing.html", "utf8");
  t("the landing's log-in door stands left of start a tribute",
    landing.includes('<a class="mw-login" href="/signin">Log in</a>\n    <a class="mw-navcta" href="/onboarding">Start a tribute</a>'));
  t("the landing door matches the tribute button's size",
    landing.includes(".mwhero .mw-login{margin-left:auto;font-weight:600;font-size:14px;") && landing.includes("padding:10px 20px") && landing.includes(".mwhero .mw-login+.mw-navcta{margin-left:0}"));
  t("the full mobile wordmark is no longer ellipsized", landing.includes("overflow:visible;text-overflow:clip;font-size:18px") && landing.includes("height:23px!important"));
  t("the mobile CTA waits inside the menu", landing.includes(".mw-login,.mwhero .tornbar .mw-navcta{display:none!important}") && landing.includes("cta.cloneNode(true)"));
}

// ── 12 · a life in chapters — every chapter the family writes renders (0017) ─
{
  const phA = { id: "ph-a", url: "https://x/p0.jpg" }, phB = { id: "ph-b", url: "https://x/p1.jpg", cap: "the bench" };
  const tlA = { id: "tl-a", year: "1968", title: "Married", chapterId: "ch-1" };
  const tlB = { id: "tl-b", year: "1975", title: "The house", chapterId: "ch-1" };
  const tlC = { id: "tl-c", year: "1990", title: "Retired" };
  const chapters = [{ id: "ch-1", title: "A love, a family", sort: 0 }, { id: "ch-2", title: "The quiet years", sort: 1 }];
  const base = { ...jonny, photos: [phA, phB], timeline: [tlA, tlB, tlC], chapters };
  const b = boot(renderTribute(template, base));
  t("chapters render as the family wrote them", b.ch.length === 2 && b.ch[0].name === "A love, a family");
  t("a chapter holds its own moments only", b.ch[0].mo.length === 2 && b.ch[0].mo[0][1] === "Married");
  t("chapter years derive from its moments", b.ch[0].yrs === "1968 to 1975");
  t("a chapter with no moments waits quietly", !b.ch.some((c: any) => c.name === "The quiet years"));
  t("unplaced moments gather at the end", b.ch[1].mo.length === 1 && /days$/.test(b.ch[1].name));
  t("a single-year chapter speaks one year", b.ch[1].yrs === "1990");
  const withPhoto = boot(renderTribute(template, { ...base, placements: { chapters: { "tl-a": ["ph-b"] } } }));
  t("a moment's photo aligns inside its chapter", withPhoto.ch[0].al === 1 && JSON.stringify(withPhoto.ch[0].ph[0]) === JSON.stringify(["p1", "the bench"]) && withPhoto.ch[0].ph[1] === null);
  t("a chapter with no photos rests its carousel", Array.isArray(withPhoto.ch[1].ph) && withPhoto.ch[1].ph.length === 0);
  const noCh = boot(renderTribute(template, { ...base, chapters: [] }));
  t("no chapters keeps the single-chapter look — zero drift", noCh.ch.length === 1 && noCh.ch[0].yrs === "in moments" && noCh.ch[0].mo.length === 3);
  const sheTail = boot(renderTribute(template, { ...base, pronouns: "she" }));
  t("the unplaced tail speaks her pronouns", sheTail.ch[1].name === "More of her days");
}

// ── 20 · the order of a life corrects itself (July 10) ────────────────────────
{
  const scrambled = [
    { id: "tl-1", year: "1990", title: "The middle" },
    { id: "tl-2", year: "1969", title: "The start" },
    { id: "tl-3", year: "", title: "No year, placed by hand" },
    { id: "tl-4", year: "2012", title: "The later years" },
    { id: "tl-5", year: "1969", title: "The same spring" },
  ];
  const b = boot(renderTribute(template, { ...jonny, timeline: scrambled }));
  const order = b.ch[0].mo.map((m: any) => m[1]);
  t("years order the page chronologically",
    JSON.stringify(order) === JSON.stringify(["The start", "The same spring", "The middle", "The later years", "No year, placed by hand"]));
  t("a tie keeps the family's own order", order[0] === "The start" && order[1] === "The same spring");
  t("chapter years still derive after the sort", b.ch[0].yrs === "in moments");
  const chaptered = boot(renderTribute(template, {
    ...jonny,
    timeline: [
      { id: "tl-a", year: "1999", title: "Second", chapterId: "ch-1" },
      { id: "tl-b", year: "1970", title: "First", chapterId: "ch-1" },
    ],
    chapters: [{ id: "ch-1", title: "A chapter", sort: 0 }],
  }));
  t("a chapter's moments sort by year too", chaptered.ch[0].mo[0][1] === "First" && chaptered.ch[0].yrs === "1970 to 1999");
}

// ── 21 · r6 — the open sky leads, the scene always covers, media-first
//          memories, and the landing's example doors split (July 30) ──────────
{
  const page = renderTribute(template, jonny); // no chosen scene
  t("a tribute with no chosen scene rests on the open sky",
    page.includes('src="/bg/clouds-poster.jpg"') && page.includes('Scene · <span id="hvCur">Open sky</span>'));
  const menuAt = page.indexOf('id="hvMenu"');
  const firstOpt = page.indexOf('data-slot="', menuAt);
  t("the picker lists Open sky first",
    menuAt > -1 && page.slice(firstOpt, firstOpt + 20).includes('data-slot="clouds"'));
  t("an unknown slot falls back to the sky",
    renderTribute(template, { ...jonny, heroVideoSlot: "volcano" }).includes('src="/bg/clouds-poster.jpg"'));
  t("a family's chosen scene still stands",
    renderTribute(template, { ...jonny, heroVideoSlot: "canopy" }).includes('src="/bg/canopy-poster.jpg"'));
  t("the scene and its poster always cover — absolute, inset 0, full size, object-fit cover",
    page.includes(".hv .hv-poster,.hv video{position:absolute;top:0;right:0;bottom:0;left:0;inset:0;display:block;width:100%;height:100%;max-width:none;max-height:none;object-fit:cover}"));
  t("memories with photographs or recorded media surface first — a stable boot sort",
    template.includes("function mtier(m){var ph=((m.phs&&m.phs.length)||m.ph||m.dp)?1:0,av=(m.au||m.vi)?1:0;return ph&&av?0:(ph?1:(av?2:3))}") &&
    template.includes("MEMS.sort(function(a,b){return mtier(a)-mtier(b)||a._bi-b._bi})"));
  const landing = readFileSync((process.env.IMY_REPO_ROOT || ".") + "/imy-app/templates/landing.html", "utf8");
  t("the landing hero wears the memory wall exactly once",
    (landing.match(/\/art\/landing-memorywall\.webp/g) || []).length === 1);
  t("the nav's Example walks the page to the example section (a plain anchor, gesture-only)",
    landing.includes('<a href="#example">Example</a>') && landing.includes('id="example"'));
  t("the hero's See an example still opens Eleanor in a new tab",
    landing.includes('<a class="mw-bg2" href="/sites/eleanor" target="_blank" rel="noopener">See an example</a>'));
  t("the nav scroll is smooth, and rests under reduced motion",
    landing.includes("html{scroll-behavior:smooth}") && landing.includes("html{scroll-behavior:auto}"));
}

console.log(`\n${pass} passed · ${fail} failed`);
process.exit(fail ? 1 : 0);
