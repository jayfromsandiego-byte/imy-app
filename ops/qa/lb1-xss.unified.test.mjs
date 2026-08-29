// LB-1 · stored XSS regression, unified template — a stranger's words stay
// words, never code.
//
// The unified document does NOT escape at its innerHTML seams (its card,
// chip, chapter, tape, and tree builders concatenate their fields raw — the
// demo data deliberately carried <b> tags in comments). The port therefore
// escapes ONCE, server-side, at the mapping layer in renderTributeUnified,
// with the boundary documented there:
//   · esc()  (&<>"') for innerHTML-only fields (MEMS r/t/b, comment lines,
//             CH era/t/y/l, …)
//   · escT() (<>" only) for dual-sink fields the document paints into BOTH
//             innerHTML/attributes AND textContent (MEMS.n, PHOTOS.cap,
//             TAPES.t) — a full esc() would surface visible entities in the
//             textContent sinks; <>" can still never open a tag or leave a
//             double-quoted attribute
//   · raw    for textContent/hydrator-consumed fields (TODAY.*, CH.ms[].cap,
//             person.*, svc.*) — the hydrator escapes or textContents its own
//             seams; escaping here would double-escape (R13)
//
// This suite drives hostile fixtures through renderTributeUnified per field
// and proves (1) no live payload ever appears in the server output, (2) the
// override's fields carry the exact expected escape class, (3) benign
// apostrophes and ampersands render cleanly — single-escaped where innerHTML
// consumes them, untouched where textContent does (no &amp;amp;, no visible
// entities), and (4) the template's own attribute escaper (atv) and URL gates
// hold. It also lifts atv() from the shipped template — the test runs against
// what ships, never a hand copy.
//
// Run via ops/qa/run.sh, or standalone:
//   GEN=<path/to/renderTributeUnified.gen.ts dir> node ops/qa/lb1-xss.unified.test.mjs
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.env.IMY_REPO_ROOT || process.cwd();
const template = readFileSync(`${ROOT}/imy-app/templates/tribute-unified.html`, "utf8");
const GEN_DIR = process.env.GEN_DIR || ".";
const { renderTributeUnified } = await import(pathToFileURL(path.resolve(GEN_DIR, "renderTributeUnified.gen.ts")).href);

let pass = 0, fail = 0;
const ok = (name, cond) => { cond ? pass++ : (fail++, console.log("  FAIL", name)); };

const boot = (html) => {
  const m = html.match(/window\.IMY_OVERRIDE=(\{.*?\});<\/script>/s);
  if (!m) throw new Error("no IMY_OVERRIDE object");
  return JSON.parse(m[1].replace(/\\u003c/g, "<"));
};

const IMG = "<img src=x onerror=alert(1)>";
const SCRIPT = '"><script>alert(1)</script>';
const BREAKOUT = '"></script><script>alert(2)</script>';

// ── the template's own attribute escaper, lifted from what ships ─────────────
function extractFn(src, marker) {
  const start = src.indexOf(marker);
  if (start === -1) throw new Error(`marker not found: ${marker}`);
  const braceAt = src.indexOf("{", start);
  let depth = 0, end = braceAt;
  for (let i = braceAt; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  return src.slice(start, end);
}
// eslint-disable-next-line no-eval
const atv = eval(`(${extractFn(template, "function atv(s)")})`);
ok("atv escapes quotes so a value stays inside its attribute", atv('a" onerror="x') === "a&quot; onerror=&quot;x");
ok("atv escapes ampersands", atv("a&b") === "a&amp;b");

// ── one hostile tribute, every visitor/family field armed ─────────────────────
const hostile = {
  slug: "hostile-1", fullName: "Jon Alvarez", pronouns: "he", tier: "plus", status: "published",
  birth: "1948-03-02", passing: "2026-06-20", place: "San Diego",
  quote: `O'Brien & family ${IMG}`,
  obituary: `Obituary ${IMG}`,
  photos: [{ id: "ph-0", url: "https://x/p0.jpg", cap: `cap ${IMG} ${SCRIPT}` }],
  timeline: [{ id: "tl-a", year: `1970${SCRIPT}`, title: `Moment ${IMG}`, chapterId: "ch-1" }],
  chapters: [{ id: "ch-1", title: `Chapter ${IMG}`, sort: 0 }],
  videos: [{ id: "v-1", url: "https://x/tape.mp4", cap: `Tape ${IMG}` }],
  service: { date: "2026-06-13", time: "6:00 PM", place: `Chapel ${IMG}`, address: `Addr ${SCRIPT}` },
  memories: [
    {
      id: "aaaaaaaa-1111-4111-8111-111111111111",
      name: `Name ${IMG}`,
      rel: `rel ${SCRIPT}`,
      text: `Body ${IMG} ${SCRIPT} ${BREAKOUT}`,
      hearts: 1,
      photos: ['https://x/a.jpg" onerror="alert(1)', "https://x/ok.jpg"],
      audio: "javascript:alert(1)",
      avatarUrl: "javascript:alert(1)",
      comments: [{ name: `C ${IMG}`, rel: "x", text: `word ${SCRIPT}` }],
    },
  ],
};

const html = renderTributeUnified(template, hostile);
const b = boot(html);

// ── (1) no live payload in the server output ──────────────────────────────────
ok("no live <img onerror> anywhere in the page", !html.includes("<img src=x onerror"));
ok("no live <script>alert anywhere in the page", !html.includes("<script>alert(1)</script>") && !html.includes("<script>alert(2)</script>"));
ok("the override JSON cannot close its own script tag", (() => {
  const m = html.match(/window\.IMY_OVERRIDE=(\{.*?\});<\/script>/s);
  return m && !m[1].includes("</script") && !m[1].includes("<");
})());

// ── (2) each field carries its documented escape class ───────────────────────
ok("MEMS.n (dual-sink) neutralizes tags", b.MEMS[0].n === "Name &lt;img src=x onerror=alert(1)&gt;");
ok("MEMS.r (innerHTML) is entity-escaped", b.MEMS[0].r === "rel &quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;");
ok("MEMS.b (innerHTML) is entity-escaped, quotes wrapped", b.MEMS[0].b.startsWith("“Body &lt;img") && !/[<>]/.test(b.MEMS[0].b.replace(/[“”]/g, "")));
ok("MEMS.t derives from the body, escaped", b.MEMS[0].t.includes("&lt;img") && !b.MEMS[0].t.includes("<img"));
ok("comment lines compose as <b>esc(name)</b> · esc(text)", (() => {
  const line = b.MEMS[0].c[0][1];
  return line.startsWith("<b>C &lt;img") && line.includes("</b> · word &quot;&gt;&lt;script&gt;") && !line.includes("<script");
})());
ok("comment initials are escaped single characters", b.MEMS[0].c[0][0] === "C");
ok("CH chip fields (innerHTML) are entity-escaped", b.CH[0].t === "Chapter &lt;img src=x onerror=alert(1)&gt;" && b.CH[0].ms[0].l.includes("&lt;img") && b.CH[0].ms[0].y.includes("&lt;script&gt;"));
ok("PHOTOS.cap (dual-sink) neutralizes tags and quotes", b.PHOTOS[0].cap.includes("&lt;img") && b.PHOTOS[0].cap.includes("&quot;&gt;&lt;script&gt;") && !/[<>"]/.test(b.PHOTOS[0].cap.replace(/&[a-z]+;|&#\d+;/g, "")));
ok("TAPES.t (dual-sink) neutralizes tags", b.TAPES.some((x) => x.t === "Tape &lt;img src=x onerror=alert(1)&gt;"));

// ── (3) hydrator-consumed fields stay raw — no double-escape (R13) ───────────
ok("person.quote rides raw for the hydrator's textContent", b.person.quote === `O'Brien & family ${IMG}`);
ok("svc.whereName rides raw for the hydrator's own esc()", b.svc.whereName === `Chapel ${IMG}`);
ok("TODAY story fields ride raw for textContent", b.TODAY.every((x) => !x.s || !x.s.includes("&lt;")));
ok("but the SSR quote token IS escaped in the markup", html.includes("O&#39;Brien &amp; family &lt;img") && !html.includes(`<div class="qt">&ldquo;O'Brien`));
ok("and the SSR service block IS escaped in the markup", html.includes("<b>Chapel &lt;img src=x onerror=alert(1)&gt;</b>") && html.includes("Addr &quot;&gt;&lt;script&gt;"));
ok("the obituary sheet is escaped", html.includes("Obituary &lt;img") && !html.includes("Obituary <img"));

// ── (4) URL gates ─────────────────────────────────────────────────────────────
ok("a photo url carrying quotes never reaches the page (the strict gate drops it)",
  b.MEMS[0].ph === undefined && !JSON.stringify(b.MEMS).includes("https://x/a.jpg"));
ok("javascript: audio and avatar never reach the page", !b.MEMS[0].audioUrl && b.MEMS[0].av.startsWith("data:image/svg+xml;utf8,"));
ok("the SVG avatar is fully URL-encoded — no raw quotes to shatter an attribute", !/["<>]/.test(b.MEMS[0].av.slice("data:image/svg+xml;utf8,".length)));
ok("hostile photo flex cannot inject style", b.PHOTOS.every((p) => typeof p.f === "number"));

// ── (5) benign text renders exactly as typed ──────────────────────────────────
const gentle = renderTributeUnified(template, {
  slug: "gentle-1", fullName: "Rose O'Brien", tier: "plus", status: "published",
  quote: 'She said "come back soon" & meant it.',
  photos: [{ id: "p1", url: "https://x/p.jpg", cap: "O'Brien & family, the bench" }],
  memories: [{
    id: "bbbbbbbb-2222-4222-8222-222222222222",
    name: "O'Brien & family", rel: "the Sunday crowd",
    text: 'She always said "come back soon" & meant it.', hearts: 1,
    comments: [{ name: "D'Arcy", rel: "", text: "Always & forever." }],
  }],
});
const gb = boot(gentle);
ok("a benign name reads exactly as typed in its dual sinks (no visible entities)", gb.MEMS[0].n === "O'Brien & family");
ok("a benign caption reads exactly as typed in the viewing room", gb.PHOTOS[0].cap === "O'Brien & family, the bench");
ok("a benign body single-escapes its ampersand and quotes for innerHTML — never doubles",
  gb.MEMS[0].b === "“She always said &quot;come back soon&quot; &amp; meant it.”" && !gb.MEMS[0].b.includes("&amp;amp;"));
ok("a benign comment line single-escapes", gb.MEMS[0].c[0][1] === "<b>D&#39;Arcy</b> · Always &amp; forever." && !gb.MEMS[0].c[0][1].includes("&amp;#39;"));
ok("the hydrator's quote stays untouched for textContent", gb.person.quote === 'She said "come back soon" & meant it.');
ok("the SSR title keeps the real name, escaped once", gentle.includes("Rose O&#39;Brien · I Miss You Memorial") && !gentle.includes("&amp;#39;"));

// ── (6) the template's raw seams still exist exactly as designed — the
//        pre-escaped mapping is what keeps them safe; if design ever adds its
//        own esc() here, the mapping must drop to single-pass (this trips) ────
ok("MEMS card name/relation seam is the document's raw concatenation", template.includes(`'<div><b>'+m.n+'</b><span>'+m.r+'</span></div></div><span class="mt">'+m.t+'</span>'`) || template.includes(`<b>'+m.n+'</b><span>'+m.r+'</span>`));
ok("comment seam is the document's raw concatenation", template.includes(`'<div class="cmt"><div class="cav">'+c[0]+'</div><p>'+c[1]+'</p></div>'`));
ok("the live comment stub still escapes with the document's own pattern", template.includes("v.replace(/</g,'&lt;')"));

console.log(`\n${pass} passed · ${fail} failed`);
process.exit(fail ? 1 : 0);
