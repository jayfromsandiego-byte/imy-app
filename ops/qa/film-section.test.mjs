// Film-section render checks against the REAL template + renderer.
// Run via ops/qa/run.sh (which generates the type-stripped renderer first).
import { readFileSync } from "node:fs";

const ROOT = process.env.IMY_REPO_ROOT || process.cwd();
const mod = await import("file://" + (process.env.GEN || "/tmp/renderTribute.gen.ts"));
const { renderTribute } = mod;
const template = readFileSync(`${ROOT}/imy-app/templates/tribute-template.html`, "utf8");

const base = {
  slug: "test-page",
  fullName: "Rose Marie Alvarez",
  birth: "1940-02-01",
  passing: "2026-01-05",
  pronouns: "she",
  photos: [{ id: "p1", url: "https://x.example/a.jpg", cap: "By the sea" }],
  videos: [
    { id: "v1", url: "https://x.example/tape1.mp4", cap: "Her voice, kept", kind: "tape" },
    { id: "v2", url: "https://x.example/film.mp4", cap: "The film of her life", kind: "film" },
  ],
  film: { url: "https://x.example/film.mp4", poster: "https://x.example/poster.jpg", duration: 100, variant: "full" },
};

let pass = 0, fail = 0;
const ok = (name, cond) => { cond ? pass++ : (fail++, console.log("  FAIL", name)); };

// plus page with film
{
  const html = renderTribute(template, { ...base, tier: "plus" });
  ok("film section renders", html.includes('id="film"'));
  ok("film sits before the story section", html.indexOf('id="film"') < html.indexOf('id="story"'));
  ok("film sits inside main, under the wreath header", html.indexOf("</header>") < html.indexOf('id="film"'));
  ok("heading speaks her pronouns", html.includes("The film of <em>her life</em>"));
  ok("lede speaks her name", html.includes("Rose&rsquo;s photographs"));
  ok("poster carried", html.includes('poster="https://x.example/poster.jpg"'));
  ok("duration line reads 1:40", html.includes("1:40 &middot;"));
  ok("no autoplay anywhere in the film room", !/autoplay/.test(html.slice(html.indexOf('id="film"'), html.indexOf('id="story"'))));
  ok("shelf keeps only the tape", html.includes("tape1.mp4") && !JSON.stringify(html.match(/"vids":\[[^\]]*\]/)?.[0] || "").includes("film.mp4"));
  ok("arch never takes the film", !html.includes('class="living" src="https://x.example/film.mp4"'));
  ok("no invite on a paid page", !html.includes("first glimpse"));
}
// free page with teaser film
{
  const html = renderTribute(template, { ...base, tier: "free", film: { ...base.film, variant: "teaser", duration: 33 } });
  ok("free page renders the film room too", html.includes('id="film"'));
  ok("free page carries the quiet invitation", html.includes("first glimpse") && html.includes("/pricing"));
  ok("teaser duration reads 0:33", html.includes("0:33 &middot;"));
}
// page with no film
{
  const { film, ...noFilm } = base;
  const html = renderTribute(template, { ...noFilm, tier: "plus" });
  ok("no film, no room — token gone", !html.includes("{{FILM_SECTION}}") && !html.includes('id="film"'));
}
// paid film in progress, before the first render lands
{
  const { film, ...noFilm } = base;
  const html = renderTribute(template, { ...noFilm, tier: "plus", filmStatus: { status: "rendering", variant: "full" } });
  ok("paid page shows honest film progress", html.includes('id="film-progress"') && html.includes("The film is being woven"));
  ok("film progress speaks the person's name", html.includes("Rose&rsquo;s photographs"));
  ok("progress never invents a video player", !html.includes('id="film"'));
}
// a paid film waiting for photographs
{
  const { film, ...noFilm } = base;
  const html = renderTribute(template, { ...noFilm, tier: "plus", filmStatus: { status: "waiting_for_photos", error: "not-enough-photos" } });
  ok("waiting film asks gently for photographs", html.includes("at least three photographs") && html.includes("/dashboard"));
}
// free pages never expose an internal queue state
{
  const { film, ...noFilm } = base;
  const html = renderTribute(template, { ...noFilm, tier: "free", filmStatus: { status: "rendering", variant: "teaser" } });
  ok("free queue state stays private", !html.includes('id="film-progress"'));
}
// they/them page
{
  const html = renderTribute(template, { ...base, tier: "plus", pronouns: undefined });
  ok("unknown pronouns speak they, never a guess", html.includes("The film of <em>their life</em>"));
}

console.log(`\n${pass} passed · ${fail} failed`);
process.exit(fail ? 1 : 0);
