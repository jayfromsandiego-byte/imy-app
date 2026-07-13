// QA harness — renders the real tribute template through renderTribute and asserts
// identity safety, tier behavior, hearts, comments, voice, the Plus band,
// the footer address, flower persistence, truthful presence, photo placements,
// the tape shelf, the arranger, the composer's doors, the demo's ask, the
// obituary with the kept voice, a life in chapters, the log-in doors
// (tribute bar + landing), share the date, the visitor's gift note, the
// safe board shape, and the personalized gift sheet, the chronological order of a life, and network deadlines. 146 checks.
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
  t("no placements → no board built from the gallery, but the shape stays safe",
    bareB.boards.length === 1 && bareB.boards[0].items.length === 0);
  const bareHtml = renderTribute(template, { ...base, quote: "Measure twice." });
  t("quote band without a placement rests among flowers on cream", bareHtml.includes('id="quoteband" style="background:linear-gradient(180deg,#F7F0E1,#EFE3CD)"') && bareHtml.includes("/art/mum2-34d609.png") && !bareHtml.includes('id="quoteband"><div class="bgi">'));
  const withQ = renderTribute(template, { ...base, quote: "Measure twice.", placements: { quote: "ph-b" } });
  t("the banner never wears uploaded photographs", withQ.includes('id="quoteband" style="background:linear-gradient') && !withQ.includes('id="quoteband"><div class="bgi">'));
  const pinned = boot(renderTribute(template, { ...base, placements: { board: ["ph-b", "ph-a"] } }));
  t("board follows the family's order", pinned.boards[0].items[0].img === "https://x/p1.jpg" && pinned.boards[0].items[1].img === "https://x/p0.jpg");
  const keeps = boot(renderTribute(template, { ...base, memories: [{ ...mem("99999999-9999-4999-8999-999999999999", "Ana", "a neighbour", "The bench he built.", 2), photos: ["https://x/keep.jpg"] }] }));
  t("visitor keepsakes pin with their names", keeps.boards[0].items.length === 1 && keeps.boards[0].items[0].who === "Ana" && keeps.boards[0].items[0].img === "https://x/keep.jpg");
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
  t("photo attach is wired, honestly labelled", template.includes('id="photoAdd"') && template.includes("＋ Add a photograph"));
  t("a memory can carry its photograph", template.includes("photoUrl:PHOTO.url||''"));
  t("the helper calls the real api on live pages", template.includes("fetch('/api/assist'"));
  t("a quiet way home on every page (July 10: a real door)", page.includes('id="loginTop" href="/signin"') && !page.includes(">tend this page</a>"));
  t("the log-in door sits beside the memorial book", page.includes('Buy a memorial book</button><a id="loginTop"'));
  t("the memory door steps back a size", page.includes('id="addMemTop" style="font-size:11.5px;padding:7px 13px"') && template.includes('id="addMemTop" style="font-size:12.5px;padding:9px 16px"'));
  t("the demo add-a-moment never reaches a real page", !page.includes("＋ Add a key moment · a year, a line, a photograph") && template.includes("＋ Add a key moment"));
  t("demo binder skips the wired buttons", template.includes("if(g.id)return;"));
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
  t("boards never ship empty-but-truthy", Array.isArray(bb.boards) && bb.boards.length === 1 && bb.boards[0].items.length === 0);
  t("the board pill rests when nothing is pinned", bare.includes(".bbfab{display:none!important}"));
  t("the word ticker rests when there are no words", bare.includes(".tick9{display:none!important}"));
  t("the top fold art is asked for first", bare.includes('rel="preload" as="image" href="/art/wreath2-64e82a.png"') && bare.includes('rel="preload" as="image" href="https://x/only.jpg"'));
  t("a missing wall element never takes the wiring down", bare.includes("if(!wallCt||!wchips||!inviteCard)return;"));
  t("the plaque and the waiting line mind their absence", bare.includes("if(plaqueEl)plaqueEl.hidden=!unlocked;") && bare.includes("if(gsWaitLine)gsWaitLine.textContent=") && bare.includes("if(gsWaitLine)gsWaitLine.style.display="));
  const pinned = renderTribute(template, { ...jonny, photos: [{ id: "ph-a", url: "https://x/p0.jpg" }], placements: { board: ["ph-a"] } });
  t("a pinned board keeps its pill", !pinned.includes(".bbfab{display:none!important}"));
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

// ── 21 · every wait has an end (July 12) ──────────────────────────────────────
{
  const letter = readFileSync((process.env.IMY_REPO_ROOT || ".") + "/imy-app/templates/onboarding.html", "utf8");
  t("the gift checkout returns the button on a hung request", template.includes("if(ac)setTimeout(function(){try{ac.abort()}catch(e){}},15000);"));
  t("the letter's checkout and uploads carry their own deadlines",
    letter.includes("},15000);") && letter.includes("},45000):null;"));
}

// ── 16 · the landing carries the log-in door too (July 10) ────────────────────
{
  const landing = readFileSync((process.env.IMY_REPO_ROOT || ".") + "/imy-app/templates/landing.html", "utf8");
  t("the landing's log-in door stands left of start a tribute",
    landing.includes('<a class="mw-login" href="/signin">Log in</a>\n    <a class="mw-navcta" href="/onboarding">Start a tribute</a>'));
  t("the landing door matches the tribute button's size",
    landing.includes(".mwhero .mw-login{margin-left:auto;font-weight:600;font-size:14px;") && landing.includes("padding:10px 20px") && landing.includes(".mwhero .mw-login+.mw-navcta{margin-left:0}"));
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

console.log(`\n${pass} passed · ${fail} failed`);
process.exit(fail ? 1 : 0);
