// QA harness — renders the real tribute template through renderTribute and asserts
// identity safety, tier behavior, hearts, comments, voice, the Plus band, and
// the footer address. 43 checks.
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
  flowerCount: 12, candleCount: 3,
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
  t("concierge cta is a real intake, not the old mockup", htmlFree.includes("mailto:hello@imissyoumemorial.com?subject=Concierge") && !htmlFree.includes("hyperagent.com/s/aBadvO39KhiuGhTHgfi93g"));
}

// ── 8 · the footer speaks each page's own address (July 8) ───────────────────
{
  const htmlJonny = renderTribute(template, jonny);
  t("footer speaks the page's own address", htmlJonny.includes("jonny.imissyoumemorial.com"));
  t("no demo address leak", !htmlJonny.includes("eleanor.imissyoumemorial.com"));
  const htmlEleanor = renderTribute(template, { ...jonny, slug: "eleanor", fullName: "Eleanor Margaret Hayes" });
  t("eleanor keeps her own address", htmlEleanor.includes("eleanor.imissyoumemorial.com"));
}

console.log(`\n${pass} passed · ${fail} failed`);
process.exit(fail ? 1 : 0);
