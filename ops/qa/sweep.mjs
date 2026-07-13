// ops/qa/sweep.mjs — the whole-site health sweep (July 12).
// Fetches every live tribute page, executes its scripts under jsdom, and
// reports any JS error, an unfilled ticker, or a missing boot — the exact
// failure class that once took a page's wiring down silently.
//
// Usage:
//   node ops/qa/sweep.mjs slug1 slug2 …        (or)
//   node ops/qa/sweep.mjs --file slugs.txt
// Needs jsdom available (npm i jsdom in a scratch dir and run from there, or
// npx --yes -p jsdom node ops/qa/sweep.mjs …). Exit code 1 if any page fails.
import { readFileSync } from "node:fs";
import { JSDOM, VirtualConsole } from "jsdom";

const args = process.argv.slice(2);
let slugs = args.filter((a) => !a.startsWith("--"));
const fileIdx = args.indexOf("--file");
if (fileIdx > -1) slugs = readFileSync(args[fileIdx + 1], "utf8").split("\n").map((s) => s.trim()).filter(Boolean);
if (!slugs.length) { console.error("no slugs given"); process.exit(2); }

const BASE = process.env.SWEEP_BASE || "https://imissyoumemorial.com/sites/";

async function sweep(slug) {
  const res = await fetch(`${BASE}${slug}?cb=${Date.now()}`, { headers: { "user-agent": "imy-sweep/1.0" } });
  if (!res.ok) return { slug, ok: false, why: `http ${res.status}` };
  const html = await res.text();
  const errs = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => errs.push(((e && e.detail && e.detail.message) || e.message || String(e)).split("\n")[0]));
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    url: `https://imissyoumemorial.com/sites/${slug}`,
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = w.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
      w.IntersectionObserver = w.IntersectionObserver || class { observe() {} unobserve() {} disconnect() {} };
      w.ResizeObserver = w.ResizeObserver || class { observe() {} unobserve() {} disconnect() {} };
      w.scrollTo = () => {};
      w.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      if (w.HTMLCanvasElement) w.HTMLCanvasElement.prototype.getContext = () => null;
      w.HTMLMediaElement.prototype.play = () => Promise.resolve();
      w.HTMLMediaElement.prototype.pause = () => {};
    },
  });
  await new Promise((r) => setTimeout(r, 900));
  const doc = dom.window.document;
  const tick = doc.getElementById("tick9");
  const boot = html.includes("window.__TRIBUTE__=");
  const tickExpected = !html.includes(".tick9{display:none!important}");
  const tickOk = !tickExpected || !!(tick && tick.innerHTML.length > 10);
  try { dom.window.close(); } catch { /* timers */ }
  const ok = errs.length === 0 && boot && tickOk;
  return { slug, ok, why: ok ? "" : (errs[0] || (!boot ? "no boot" : "ticker unfilled")) };
}

let failed = 0;
for (const slug of slugs) {
  try {
    const r = await sweep(slug);
    console.log(`${r.ok ? "  ok " : "FAIL "} ${slug}${r.why ? " · " + r.why : ""}`);
    if (!r.ok) failed++;
  } catch (e) {
    console.log(`FAIL  ${slug} · ${String(e).split("\n")[0]}`);
    failed++;
  }
}
console.log(`\n${slugs.length - failed} whole · ${failed} hurt`);
process.exit(failed ? 1 : 0);
