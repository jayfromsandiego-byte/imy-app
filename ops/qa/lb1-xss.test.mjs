// LB-1 · stored XSS regression — a stranger's words stay words, never code.
// The memory wall, the comment drawers, the bulletin board, and the lightbox
// all write visitor-submitted text straight into innerHTML. Every one of those
// seams now runs the field through the template's own esc() first — the same
// house pattern the live-add comment stubs already used (t.replace(/</g,'&lt;')).
// This suite proves it two ways: it actually evaluates the real esc() and
// memCard() lifted from the template (no DOM needed, they are pure string
// builders), and it checks the other sinks call esc() at the exact seam.
// Run via ops/qa/run.sh, or standalone: node ops/qa/lb1-xss.test.mjs
import { readFileSync } from "node:fs";

const ROOT = process.env.IMY_REPO_ROOT || process.cwd();
const template = readFileSync(`${ROOT}/imy-app/templates/tribute-template.html`, "utf8");

let pass = 0, fail = 0;
const ok = (name, cond) => { cond ? pass++ : (fail++, console.log("  FAIL", name)); };

// Pull a balanced-brace function or statement straight out of the real file —
// the test runs against what actually ships, not a hand copy that could drift.
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
const escFnSrc = extractFn(template, "var esc=function(s)").replace(/^var esc=/, "");
const memCardSrc = extractFn(template, "function memCard(m)");
// eslint-disable-next-line no-eval
const esc = eval(`(${escFnSrc})`);
// eslint-disable-next-line no-eval
const memCard = eval(`(${memCardSrc})`);

const IMG_PAYLOAD = '<img src=x onerror=alert(1)>';
const SCRIPT_PAYLOAD = '"><script>alert(1)</script>';

// ── esc() itself ──────────────────────────────────────────────────────────────
ok("esc turns angle brackets to entities, not tags", esc(IMG_PAYLOAD) === "&lt;img src=x onerror=alert(1)&gt;");
ok("esc closes a breakout attempt in entities", esc(SCRIPT_PAYLOAD) === "&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;");
ok("esc leaves an apostrophe and an ampersand readable, not doubled", esc("O'Brien & family") === "O&#39;Brien &amp; family");
ok("esc treats null and undefined as the empty string", esc(null) === "" && esc(undefined) === "");
ok("esc is idempotent-safe against re-reading its own output (no re-escaping smell)", esc("&amp;") === "&amp;amp;"); // documents single-pass behavior; callers must call esc() exactly once per field, which every sink below does

// ── memory wall · a stranger's angle brackets stay ink, not code ────────────
{
  const hostile = {
    id: "mem-1", av: IMG_PAYLOAD[0], nm: IMG_PAYLOAD, rel: SCRIPT_PAYLOAD,
    tx: IMG_PAYLOAD + " " + SCRIPT_PAYLOAD, h: 3,
    cm: [[IMG_PAYLOAD, SCRIPT_PAYLOAD, IMG_PAYLOAD + SCRIPT_PAYLOAD]],
  };
  const card = memCard(hostile);
  ok("a hostile memory's name carries no live <img> tag", !card.includes("<img src=x onerror"));
  ok("a hostile memory's relation carries no live <script> tag", !/<script>/i.test(card));
  ok("a hostile memory's body is entity-escaped, not executable", card.includes("&lt;img src=x onerror=alert(1)&gt;") && card.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
  ok("a hostile comment's name, relation, and text are all entity-escaped", (() => {
    const commentBlock = card.slice(card.indexOf('<div class="cdrawer">'));
    return commentBlock.includes("&lt;img src=x onerror=alert(1)&gt;") && !/<img[^&]/.test(commentBlock) && !/<script>/i.test(commentBlock);
  })());
}

// ── a benign memory renders exactly as typed, no visible entities ───────────
{
  const gentle = {
    id: "mem-2", av: "O", nm: "O'Brien & family", rel: "the Sunday crowd",
    tx: "She always said \"come back soon\" & meant it.", h: 1, cm: [],
  };
  const card = memCard(gentle);
  ok("a benign name with an apostrophe and an ampersand reads exactly as typed",
    card.includes(">O&#39;Brien &amp; family<"));
  ok("a benign memory body with quotes and an ampersand shows no double-escaping",
    card.includes("She always said &quot;come back soon&quot; &amp; meant it.") &&
    !card.includes("&amp;amp;") && !card.includes("&amp;#39;"));
}

// ── the live-add stub already escapes — untouched, still correct ────────────
ok("the family-first comment stub still escapes with the pre-existing pattern",
  template.includes("t.replace(/</g,'&lt;')"));

// ── every other named sink calls esc() at the exact seam, in the real file ──
const sinkChecks = [
  ["board note title (bnote)", "<div class=\"bt\">'+esc(p.ttl)+'</div>"],
  ["board note body (bnote)", "<div class=\"bx\">'+esc(p.tx)+'</div>"],
  ["board photo caption", "<div class=\"cap\">'+esc(p.ttl)+'</div>"],
  ["board video badge", "<span class=\"vbadge2\">'+esc(p.dur)+'</span>"],
  ["board cassette title", "font-size:12px\">'+esc(p.ttl)+'</div>"],
  ["board cassette meta", "<div class=\"mt\">'+esc(p.meta)+'</div>"],
  ["lightbox voice caption", "color:#d8bd93\">'+esc(p.meta)+'</div>"],
  ["lightbox note body (bignote)", "<div class=\"bignote\">“'+esc(p.tx)+'”</div>"],
  ["lightbox comment name", "<div class=\"cmt2\"><b>'+esc(x[0])+'</b>"],
  ["lightbox comment relation", "<span class=\"r\">'+esc(x[1]||'')+'</span>"],
  ["lightbox comment text", "'</span><br>'+esc(x[2])+'</div>'"],
  ["waiting-wall chip name", "<b>'+esc(w.nm)+'&rsquo;s memory</b>"],
  ["invite line waiting author's name", "var first=esc(WAITING[0].nm)"],
  ["identity name in the family-first comment stub", "d.innerHTML='<b>'+esc(ID.fn)+'</b><span class=\"r\">waiting for the family</span>"],
  ["identity name and relation in the demo comment stub", "d.innerHTML='<b>'+esc(ID.fn)+'</b><span class=\"r\">'+esc(ID.relLabel)+'</span>"],
  ["adding-as line (name, initial, relation)", "<span>Adding as <b>'+esc(ID.fn)+' '+esc(ID.ln[0].toUpperCase())+'. · '+esc(ID.relLabel)+'</b>"],
];
for (const [name, needle] of sinkChecks) ok(`${name} calls esc() at the seam`, template.includes(needle));

// ── nothing that was already safe got a second escape pass ──────────────────
ok("lightbox contributor line still uses textContent, untouched", template.includes("W.textContent='Contributed by '+p.who+(p.rel?' · '+p.rel:'')"));
ok("the say() toast still uses textContent, untouched", template.includes("function say(t,p){whisperT.textContent=t"));

console.log(`\n${pass} passed · ${fail} failed`);
process.exit(fail ? 1 : 0);
