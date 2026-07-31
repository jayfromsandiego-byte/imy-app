// Scroll-containment scan (r5 item 5, July 30 2026).
//
// The bug it guards against: the page auto-scrolling itself to the film or the
// chapters. Root cause was the book engine's rail centering — chbMark ran
// scrollIntoView({block:'nearest',inline:'center'}) on every auto-advance (and
// on load), and scrollIntoView walks EVERY scrollable ancestor, so whenever the
// rail was offscreen the whole page was vertically dragged toward the chapters
// section on a timer. Policy now: programmatic scrolling happens only in direct
// response to a user gesture; rail centering uses horizontal scrollLeft math on
// the rail container itself, which cannot move the page.
//
// What this scan does: collects every function declared in the tribute
// template's scripts and in renderTribute.ts's injected scripts, seeds a call
// graph with every setTimeout / setInterval / requestAnimationFrame callback
// (the only autoplay on the page is the muted hero/living <video> loop — no JS
// autoplay driver exists), walks the transitive closure, and fails if any
// reachable body contains, at its own level (event-handler closures that are
// merely ASSIGNED there, like m.onclick=go, only run on a gesture and are
// separate graph nodes — they join the closure only if something calls them):
//   · .scrollIntoView(  — can scroll the page from any element
//   · a window/page-level scrollTo/scrollBy (bare, window.- or document.-scoped)
// Element-scoped scrolls (container.scrollTo / container.scrollBy) are allowed.
// A corpus-wide census of every scrollIntoView backstops the graph.
//
// Run from repo root: node ops/qa/scroll-scan.mjs
import { readFileSync } from "node:fs";

const ROOT = process.env.IMY_REPO_ROOT || ".";
const files = {
  "tribute-template.html": readFileSync(`${ROOT}/imy-app/templates/tribute-template.html`, "utf8"),
  "renderTribute.ts": readFileSync(`${ROOT}/imy-app/lib/renderTribute.ts`, "utf8"),
};

let pass = 0, fail = 0;
const t = (name, cond, detail) => {
  if (cond) { pass++; console.log(`  ok  ${name}`); }
  else { fail++; console.log(`FAIL  ${name}${detail ? " — " + detail : ""}`); }
};

// brace-matched body from an index pointing at "{"
function bodyFrom(src, i) {
  let depth = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === "{") depth++;
    else if (src[j] === "}") { depth--; if (depth === 0) return src.slice(i, j + 1); }
  }
  return src.slice(i);
}

// remove nested function bodies so a body is judged at its own level only;
// nested named functions are their own graph nodes and join via real calls.
function ownLevel(body) {
  const inner = /function\s*[A-Za-z_$]?[\w$]*\s*\([^)]*\)\s*\{/g;
  let out = body.slice(1); // drop the outer brace so the outer body isn't "nested"
  for (;;) {
    inner.lastIndex = 0;
    const m = inner.exec(out);
    if (!m) return out;
    const b = bodyFrom(out, m.index + m[0].length - 1);
    out = out.slice(0, m.index) + " __fn__ " + out.slice(m.index + m[0].length - 1 + b.length);
  }
}

function violations(level) {
  const bad = [];
  if (level.includes(".scrollIntoView(")) bad.push("scrollIntoView");
  // window/page-level scrolls only: bare scrollTo(/scrollBy( (no receiver — the
  // lookbehind refuses a preceding "." or identifier char) or an explicit
  // window./document. receiver. Element-scoped x.scrollTo/x.scrollBy cannot
  // move the page and pass.
  const pageScroll = /(?:window\.|document\.(?:body|documentElement)\.|(?<![\w$.)\]]))scroll(?:To|By)\s*\(/g;
  let v;
  while ((v = pageScroll.exec(level))) {
    bad.push("page scroll: …" + level.slice(Math.max(0, v.index - 30), v.index + 12).replace(/\s+/g, " "));
  }
  return bad;
}

function scan(label, src) {
  // 1 · every named function (declarations + var/let/const function expressions)
  const fns = Object.create(null);
  for (const rx of [
    /function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g,
    /(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*function\s*\([^)]*\)\s*\{/g,
  ]) {
    let m;
    while ((m = rx.exec(src))) fns[m[1]] = bodyFrom(src, rx.lastIndex - 1);
  }

  // 2 · seeds: timer / rAF callbacks — inline bodies and named references
  const seedLevels = [];
  const reached = new Set();
  const timer = /(?:setTimeout|setInterval|requestAnimationFrame)\s*\(\s*(function\s*\([^)]*\)\s*\{|[A-Za-z_$][\w$]*)/g;
  let m;
  while ((m = timer.exec(src))) {
    if (m[1].startsWith("function")) {
      seedLevels.push(ownLevel(bodyFrom(src, m.index + m[0].length - 1)));
    } else if (fns[m[1]]) reached.add(m[1]);
  }

  // 3 · transitive closure over real call sites (name followed by "(")
  const queue = [...seedLevels, ...[...reached].map((n) => ownLevel(fns[n]))];
  const levels = [];
  while (queue.length) {
    const lv = queue.pop();
    if (!lv) continue;
    levels.push(lv);
    const call = /([A-Za-z_$][\w$]*)\s*\(/g;
    let c;
    while ((c = call.exec(lv))) {
      const n = c[1];
      if (fns[n] && !reached.has(n)) { reached.add(n); queue.push(ownLevel(fns[n])); }
    }
  }

  // 4 · violations anywhere a timer can reach
  const bad = levels.flatMap(violations);
  t(`${label}: no scrollIntoView or page-level scroll reachable from any timer/autoplay path`,
    bad.length === 0, bad.join(" · "));
  t(`${label}: the scan has teeth (functions mapped, timer paths walked)`,
    Object.keys(fns).length > 0 && levels.length > 0);
  return reached;
}

const reachedTpl = scan("tribute-template.html", files["tribute-template.html"]);
scan("renderTribute.ts", files["renderTribute.ts"]);

// 5 · the named fix and a corpus-wide census, asserted directly
const tpl = files["tribute-template.html"];
t("chbMark centers the rail with scrollLeft math on the rail container only",
  tpl.includes("var target=chbScroll.scrollLeft+(ar.left+ar.width/2)-(sr.left+sr.width/2);") &&
  !tpl.includes("act.scrollIntoView"));
t("the auto player never turns the page — tickCh stays inside the open chapter",
  tpl.includes("function tickCh(){var c=CH[chI];if(c.ph.length>1)setPh((phI+1)%c.ph.length,false)}") &&
  !tpl.includes("goCh(chI+1,false)"));
t("census: exactly three scrollIntoView calls remain, each behind a user gesture",
  (tpl.match(/\.scrollIntoView\(/g) || []).length === 3 && // item-24 moment tap · addMemTop click · runUnlock (wall-switch / gift click)
  !reachedTpl.has("runUnlock") && !reachedTpl.has("goCh"));

console.log(`\n${pass} passed · ${fail} failed`);
process.exit(fail ? 1 : 0);
