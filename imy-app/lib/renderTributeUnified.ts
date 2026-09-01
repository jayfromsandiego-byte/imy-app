// renderTributeUnified — fills the UNIFIED tribute template
// (templates/tribute-unified.html, extracted from the design-truth document by
// scripts/port/extract-tribute-unified.mjs) from a tribute record.
//
// Two-channel injection, mirroring the wreath renderer's philosophy exactly:
//   1) {{TOKENS}} — SSR-visible strings (title, meta/OG, name, dates, alts,
//      srcs, the flyer) so crawlers, link previews, and JS-off readers see the
//      real person. The hydrator never runs for them.
//   2) window.IMY_OVERRIDE — the one object the document was built to consume:
//      every data declaration reads it first, and the embedded hydrator applies
//      person/plan/gates/empty-states from the same object. This is the same
//      contract the design studio feeds client-side, so a page and its live
//      preview can never drift.
//
// ── The escaping boundary (LB-1 at the new seams) ─────────────────────────────
// The unified document does NOT escape at its innerHTML seams — it treats its
// data arrays as trusted text. Therefore every visitor/family text field is
// escaped HERE, once, at the mapping layer, and never again downstream.
// Three field classes, decided by where the document paints each field:
//
//   · esc()   — full entity escape (&<>"') for fields consumed ONLY via
//               innerHTML: MEMS r/t/b and comment lines, CH era/t/y/l,
//               PHOTOS.when, TAPES.when, PEOPLE n/y/note.
//   · escT()  — tag-neutralizing escape (<>" only) for fields the document
//               paints into BOTH innerHTML/attribute seams AND textContent
//               seams (MEMS.n → card <b> + snap data-cap → viewing-room
//               textContent; PHOTOS.cap → aria-label/alt + see-all innerHTML +
//               viewing-room textContent; TAPES.t likewise). A full esc() here
//               would surface visible "&#39;"/"&amp;" artifacts in the
//               textContent sinks; escT keeps benign apostrophes/ampersands
//               readable while < > " can never open a tag or leave a
//               double-quoted attribute.
//   · raw     — fields consumed ONLY via textContent or by the hydrator's own
//               esc()/textContent paths: TODAY k/t/s/who, CH.ms[].cap,
//               person.*, svc.*, SHTXT, treeOwnLabel, PEOPLE relLabel.
//               Escaping these would double-escape (R13).
//
// Every URL field (av/ph/img/src/cover/url/portrait/coverbg) passes the same
// https-only allowlist the wreath renderer keeps (renderTribute.ts:371); the
// only non-https value we ever emit is the SVG-initials data URL we compose
// ourselves. The override JSON serializes with `<` → < on both sides.
//
// Tier gating mirrors the wreath: free wall caps at ten (extras become
// gates.memsTotal — the hydrator writes the quiet hold note), free album caps
// at twelve, voices/tapes rest on free (kept, not shown), the film rides only
// as a teaser on free. PEOPLE/ROOT ship empty until a family-tree data source
// exists (G-U2/R6) — the template's Gate 0 guard rests the tree room quietly.

import { pronounSet, embedSrc, type Tribute, type TimelineItem } from "./renderTribute";

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

// Tag-neutralizing escape for dual-sink fields — see the boundary note above.
const escT = (s = "") =>
  String(s).replace(/[<>"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://imissyoumemorial.com";
const FALLBACK_COVER = `${SITE}/photos/candle.jpg`;

function firstName(full: string) {
  return (full || "").trim().split(/\s+/)[0] || "them";
}
function nameHtml(full: string) {
  const parts = (full || "").trim().split(/\s+/);
  if (parts.length < 2) return esc(full);
  const last = parts.pop() as string;
  return `${esc(parts.join(" "))} <em>${esc(last)}</em>`;
}
function fmtDate(d?: string) {
  if (!d) return "";
  const dt = new Date(`${String(d).slice(0, 10)}T12:00:00Z`);
  if (isNaN(+dt)) return String(d);
  return dt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}
function yearOf(d?: string) {
  const m = String(d || "").match(/\d{4}/);
  return m ? m[0] : "";
}

/** Memory relation → the unified wall's chip keys. Same vocabulary as the
 *  wreath's classifyGroup, normalized to the document's `neighbors` (R10 —
 *  the wreath renderer keeps its own `neighbours` untouched). */
function classifyGroupUnified(rel: string): string {
  const r = (rel || "").toLowerCase();
  if (/(son|daughter|mother|father|mom|dad|brother|sister|grand|wife|husband|partner|niece|nephew|cousin|aunt|uncle|family)/.test(r)) return "family";
  if (/(neighbou?r|street|next door)/.test(r)) return "neighbors";
  if (/(student|pupil|class|taught|teacher)/.test(r)) return "students";
  return "friends";
}

/** https-only, no quotes/brackets/whitespace — the wreath's URL gate. */
const keptUrl = (u?: string) => (u && /^https:\/\/[^"'<>\s]+$/.test(u) ? u : "");

/** The hydrator's own SVG-initials avatar, composed server-side so every MEMS
 *  card has a src even before the hydrator runs. Byte-identical recipe to the
 *  template's avatarFromName (fully encoded — raw quotes in a data url shatter
 *  any html attribute they land in). */
function svgAvatar(name: string): string {
  const p = String(name || "").trim().split(/\s+/);
  const ini = ((p[0] || "")[0] || "✿").toUpperCase() + ((p.length > 1 ? p[p.length - 1][0] : "") || "").toUpperCase();
  return "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="160" height="160" fill="#EDE3D2"/><text x="80" y="97" font-family="Georgia,serif" font-size="52" fill="#A87C5F" text-anchor="middle">${ini}</text></svg>`
  );
}

/** A memory card's title, derived from its first words (R7 — production
 *  memories carry body text only, G-P6). */
function deriveTitle(text: string): string {
  const words = String(text || "").replace(/\s+/g, " ").trim().replace(/^["“”']+/, "").split(" ");
  const head = words.slice(0, 6).join(" ").replace(/[\s.,;:!?"“”']+$/, "");
  return words.length > 6 ? `${head}…` : head;
}

function mmss(seconds?: number): string {
  if (!seconds || !isFinite(seconds) || seconds <= 0) return "";
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function renderTributeUnified(template: string, t: Tribute): string {
  const tier = t.tier === "plus" || t.tier === "heirloom" ? "plus" : "free";
  const first = firstName(t.fullName);
  const pn = pronounSet(t.pronouns);
  const poss = pn.pos === "her" ? "hers" : pn.pos === "his" ? "his" : "theirs";
  const slug = t.slug || "example";
  const shurl = `https://${slug}.imissyoumemorial.com`;

  const firstPhoto = (t.photos || []).map((p) => p.url).find(Boolean) || "";
  const abs = (u: string) => (u.startsWith("/") ? `${SITE}${u}` : u);
  const cover = abs(t.coverPhoto || t.portrait || firstPhoto || FALLBACK_COVER);
  const portrait = abs(t.portrait || t.coverPhoto || firstPhoto || FALLBACK_COVER);

  // ── dates line (the hydrator splits on the last " · " for a nowrap place;
  //    the SSR token below mirrors that split exactly) ──
  const born = fmtDate(t.birth);
  const died = fmtDate(t.passing);
  const datesFront = born && died ? `${born} — ${died}` : born || died;
  const datesLine = [datesFront, t.place ? String(t.place).toUpperCase() : ""].filter(Boolean).join(" · ");

  // ── photos → PHOTOS (free keeps twelve, like the wreath; the rest are HELD,
  //    named by gates.photosTotal — never refused) ──
  const FREE_PHOTO_CAP = 12;
  const allPhotos = (t.photos || []).filter((p) => keptUrl(p.url));
  const photos = tier === "free" ? allPhotos.slice(0, FREE_PHOTO_CAP) : allPhotos;
  const FLEX = [1, 1.2, 1.1, 1.4, 1, 1.3];
  const PHOTOS = photos.map((p, i) => ({
    src: keptUrl(p.url),
    cap: escT(p.cap || ""),
    when: "", // no "taken when" column exists (G-U5)
    f: FLEX[i % FLEX.length],
  }));

  // ── memories → MEMS (free wall caps at ten; every approved memory beyond
  //    ten is counted by gates.memsTotal and the hydrator speaks the hold note) ──
  const approved = (t.memories || [])
    .map((m) => ({
      id: m.id || "",
      name: m.name || "A friend",
      rel: m.rel || "",
      text: m.text || "",
      hearts: Math.max(0, m.hearts ?? 0),
      audio: tier === "plus" ? keptUrl(m.audio) : "",
      ph: keptUrl((m.photos || [])[0]),
      av: keptUrl(m.avatarUrl),
      comments: (m.comments || []).filter((c) => c.text),
    }))
    .filter((m) => m.text);
  const CAP = 10;
  const shown = tier === "free" ? approved.slice(0, CAP) : approved;
  const MEMS = shown.map((m) => ({
    id: m.id, // the Gate 2 wiring reads it by card index; the document ignores unknown keys
    av: m.av || svgAvatar(m.name),
    n: escT(m.name), // dual sink: card <b> + snap data-cap → viewing-room textContent
    r: esc(m.rel), // relation only — no fabricated timestamps (R7)
    rel: classifyGroupUnified(m.rel),
    ...(m.ph ? { ph: m.ph } : {}),
    t: esc(deriveTitle(m.text)),
    b: `“${esc(m.text)}”`,
    ...(m.audio ? { voice: "···", audioUrl: m.audio } : {}), // wiring wires an <audio>, real duration lands on loadedmetadata
    h: m.hearts,
    c: m.comments.map((c) => [esc((c.name || "A friend")[0].toUpperCase()), `<b>${esc(c.name || "A friend")}</b> · ${esc(c.text)}`]),
  }));

  // ── the wall's chips, from the people who actually wrote (an empty wall
  //    ships an empty bar — emptyStates rests it; never empty-but-truthy) ──
  const present = new Set(MEMS.map((m) => m.rel));
  const CHIPS: Array<[string, string]> = MEMS.length
    ? [["everyone", "Everyone"], ["family", "Family"], ["friends", "Friends"]]
    : [];
  if (present.has("neighbors")) CHIPS.push(["neighbors", "Neighbors"]);
  if (present.has("students")) CHIPS.push(["students", `${pn.Pos} students`]);

  // ── the moments stage (TODAY), synthesized like the studio's composer:
  //    photographed memories first, then captioned photographs, six at most.
  //    Every field is textContent-consumed → raw. ──
  type Moment = { img: string; k: string; t: string; s: string; who: string };
  const TODAY: Moment[] = [];
  for (const m of shown) {
    if (TODAY.length >= 6) break;
    if (!m.ph) continue;
    const who = m.rel ? `${m.name} · ${m.rel}` : m.name;
    TODAY.push({ img: m.ph, k: `remembered by ${who}`, t: deriveTitle(m.text), s: m.text, who });
  }
  for (const p of photos) {
    if (TODAY.length >= 6) break;
    if (!p.cap || !p.url) continue;
    if (TODAY.some((x) => x.img === p.url)) continue;
    TODAY.push({ img: p.url as string, k: `from ${pn.pos} photographs`, t: p.cap, s: p.cap, who: "the family" });
  }

  // ── a life in chapters → CH (same chrono + chapter-years logic as the
  //    wreath; eras wear the document's en-dash) ──
  const timeline = t.timeline || [];
  const chAssign = t.placements?.chapters || undefined;
  const byId: Record<string, { url: string; cap: string }> = {};
  photos.forEach((p) => { if (p.id) byId[p.id] = { url: p.url as string, cap: p.cap || "" }; });
  const chrono = (mos: TimelineItem[]): TimelineItem[] =>
    mos
      .map((m, i) => ({ m, i, y: /^\d{4}$/.test(String(m.year || "").trim()) ? Number(String(m.year).trim()) : Infinity }))
      .sort((a, b) => (a.y - b.y) || (a.i - b.i))
      .map((x) => x.m);
  const eraOf = (mos: TimelineItem[]): string => {
    const ys = mos.map((m) => (String(m.year || "").match(/^\d{4}$/) || [])[0]).filter(Boolean) as string[];
    if (!ys.length) return "in moments";
    const lo = ys.reduce((a, b) => (b < a ? b : a));
    const hi = ys.reduce((a, b) => (b > a ? b : a));
    return lo === hi ? lo : `${lo}–${hi}`;
  };
  const momentPhoto = (m: TimelineItem) => {
    const id = ((m.id && chAssign?.[m.id]) || []).find((x) => byId[x]);
    return id ? byId[id] : null;
  };
  const photoFallback = keptUrl(photos[0]?.url) || cover;
  type ChapterOut = { era: string; t: string; cover: string; ms: Array<{ y: string; l: string; img: string; cap: string }> };
  const chapterOut = (title: string, unordered: TimelineItem[]): ChapterOut => {
    const mos = chrono(unordered);
    const ms = mos.map((m) => {
      const ph = momentPhoto(m);
      return {
        y: esc(m.year || ""),
        l: esc(m.title || m.text || ""),
        img: ph ? ph.url : photoFallback, // the document requires an img per moment
        cap: ph?.cap || m.title || "", // textContent-consumed → raw
      };
    });
    return { era: esc(eraOf(mos)), t: esc(title), cover: ms[0]?.img || photoFallback, ms };
  };
  const chapterRows = (t.chapters || []).filter((c) => String(c.title || "").trim());
  let CH: ChapterOut[] = [];
  if (timeline.length && chapterRows.length) {
    const placed = new Set<string>();
    for (const c of chapterRows) {
      const mos = timeline.filter((m) => c.id && m.chapterId === c.id);
      mos.forEach((m) => { if (m.id) placed.add(m.id); });
      if (mos.length) CH.push(chapterOut(String(c.title).trim(), mos));
    }
    const rest = timeline.filter((m) => !(m.id && placed.has(m.id)));
    if (rest.length) CH.push(chapterOut(CH.length ? `More of ${pn.pos} days` : `${first}'s life`, rest));
  } else if (timeline.length) {
    CH = [chapterOut(`${first}'s life`, timeline)];
  }

  // ── the tape shelf → TAPES. The film rides first (R5 — visible, playable,
  //    one place); free pages rest their tapes and keep only a true teaser. ──
  const videos = (t.videos || []).filter((v) => keptUrl(v.url));
  const keptFilm = t.film && keptUrl(t.film.url) ? t.film : undefined;
  const filmData = keptFilm && (tier === "plus" || keptFilm.variant === "teaser") ? keptFilm : undefined;
  type Tape = { cover: string; t: string; when: string; dur: string; url?: string; embed?: string };
  const TAPES: Tape[] = [];
  if (filmData) {
    TAPES.push({
      cover: keptUrl(filmData.poster) || photoFallback,
      t: escT(`The film of ${pn.pos} life`),
      when: "",
      dur: mmss(filmData.duration),
      url: filmData.url,
    });
  }
  if (tier === "plus") {
    const pairImgByVid: Record<string, string> = {};
    const photoById: Record<string, string> = {};
    photos.forEach((p) => { if (p.id && p.url) photoById[p.id] = p.url; });
    if (t.placements?.living) {
      for (const [phId, vId] of Object.entries(t.placements.living)) {
        if (photoById[phId] && vId) pairImgByVid[vId] = photoById[phId];
      }
    }
    for (const v of videos) {
      if (v.kind === "film") continue; // the film already leads the shelf
      const e = embedSrc(v.url);
      TAPES.push({
        cover: (v.id && pairImgByVid[v.id]) || photoFallback,
        t: escT(v.cap || "A video"),
        when: "",
        dur: "", // no duration column for family tapes (G-U3/R9)
        ...(e ? { embed: e } : { url: v.url }), // embeds play via the Gate 2 wiring; files via the hydrator's tapePlayback
      });
    }
  }

  // ── the service, for the flyer (charity has no home here — G-P4/R1; the
  //    donate door stays a wreath-page feature until the owner places it) ──
  const svcWhen = [fmtDate(t.service?.date), t.service?.time].filter(Boolean).join(" · ");
  const svc = t.service && (t.service.date || t.service.place)
    ? { when: svcWhen, whereName: t.service.place || "", whereAddr: t.service.address || "" } // hydrator-consumed → raw (it escapes its own seams)
    : null;

  // ── the family tree (0034) — PEOPLE keyed by member_key, ROOT the subject.
  //    Escaping classes per the boundary note: n/y/note are innerHTML-consumed
  //    → esc(); relLabel is textContent-consumed (relTo → tiRel.textContent)
  //    → raw. Avatars ride the https-only gate; a gated-out or absent avatar
  //    falls back to a monogram. member_key doubles as an object key and a
  //    link target (sp/pa/chosen), so it must be slug-safe — anything else is
  //    dropped whole rather than half-linked. No subject row = no ROOT = the
  //    template's Gate 0 guard rests the room, exactly as before 0034. ──
  const keyOk = (k?: string) => !!k && /^[a-z0-9_-]{1,64}$/i.test(k);
  const peopleDict: Record<string, object> = {};
  let treeRoot = "";
  for (const fm of t.familyTree || []) {
    if (!fm || !keyOk(fm.key) || !String(fm.name || "").trim()) continue;
    const entry: Record<string, unknown> = {
      n: esc(fm.name),
      y: esc(fm.years || ""),
      note: esc(fm.note || ""),
    };
    const av = keptUrl(fm.avatar);
    if (av) entry.av = av;
    else
      entry.i = esc(
        (fm.initials || String(fm.name).trim().split(/\s+/).map((w) => w[0] || "").join("").slice(0, 2)).toUpperCase().slice(0, 3)
      );
    if (keyOk(fm.spouse)) entry.sp = fm.spouse;
    const parents = (fm.parents || []).filter(keyOk);
    if (parents.length) entry.pa = parents;
    if (keyOk(fm.chosenOf)) entry.chosen = fm.chosenOf;
    if (fm.relLabel) entry.relLabel = fm.relLabel; // textContent-consumed → raw
    if (fm.isSubject && !treeRoot) {
      entry.her = true;
      treeRoot = fm.key;
    }
    peopleDict[fm.key] = entry;
  }

  // ── the override — every key present, empty arrays included, so no `||`
  //    fallback can ever fire (§4a) ──
  const override = {
    person: {
      name: t.fullName,
      first,
      last: (t.fullName || "").trim().split(/\s+/).slice(1).join(" ") ? (t.fullName || "").trim().split(/\s+/).pop() : "",
      pron: t.pronouns === "he" || t.pronouns === "she" ? t.pronouns : "they",
      datesLine,
      quote: t.quote || "",
      portrait: keptUrl(portrait) ? portrait : "",
      coverbg: keptUrl(cover) ? cover : "",
      home: t.place || "",
    },
    plan: tier,
    mode: "view",
    slugUrl: slug,
    counts: {}, // no visits counter exists (G-U1/R2) — the lines rest via CSS below; no fabricated number ever renders
    svc,
    gates: { memsTotal: approved.length, photosTotal: allPhotos.length },
    TODAY,
    MEMS,
    CHIPS,
    PHOTOS,
    CH,
    TAPES,
    SHURL: shurl,
    SHTXT: `Remembering ${t.fullName} · leave a memory, a photo, a kind word · ${shurl}`,
    PEOPLE: peopleDict,
    ROOT: treeRoot,
    treeOwnLabel: `this page is ${poss}`,
  };
  const overrideScript = `<script>window.IMY_OVERRIDE=${JSON.stringify(override).replace(/</g, "\\u003c")};</script>`;

  // ── SSR strings ──
  const metaDescription = ((): string => {
    const story = (t.story || "").replace(/\s+/g, " ").trim();
    if (!story) {
      return `A place to remember ${t.fullName} · photos, stories, and the voices of everyone who loved ${first}.`;
    }
    if (story.length <= 155) return story;
    const clip = story.slice(0, 155);
    const sentenceEnd = Math.max(clip.lastIndexOf(". "), clip.lastIndexOf("! "), clip.lastIndexOf("? "));
    if (sentenceEnd >= 60) return clip.slice(0, sentenceEnd + 1).trim();
    const wordCut = clip.slice(0, 154).lastIndexOf(" ");
    const base = (wordCut > 0 ? clip.slice(0, wordCut) : clip.slice(0, 154)).replace(/[\s.,;:!?-]+$/, "").trim();
    return `${base}…`;
  })();
  const title = ((): string => {
    const by = yearOf(t.birth), py = yearOf(t.passing);
    const yearsBit = by && py ? (by === py ? by : `${by} to ${py}`) : (py || by || "");
    const placeBit = String(t.place || "").split(",")[0].trim();
    return [t.fullName, yearsBit, placeBit, "I Miss You Memorial"].filter(Boolean).join(" · ");
  })();
  // The dates token mirrors the hydrator's split-on-last-" · " nowrap treatment.
  const datesToken = t.place && datesFront
    ? `${esc(datesFront)} · <span style="white-space:nowrap">${esc(String(t.place).toUpperCase())}</span>`
    : esc(datesLine) || "&nbsp;";
  const quoteDiv = t.quote ? `<div class="qt">&ldquo;${esc(t.quote)}&rdquo;</div>` : "";
  const flyerYears = ((): string => {
    const by = yearOf(t.birth), py = yearOf(t.passing);
    return by && py ? `${by} · ${py}` : py || by || "";
  })();
  const svcBlock = svc
    ? `<div class="join">Join us to remember</div>
      ${svc.when ? `<div class="when">${esc(svc.when)}</div>` : ""}
      ${svc.whereName || svc.whereAddr ? `<div class="where">${svc.whereName ? `<b>${esc(svc.whereName)}</b>` : ""}${svc.whereAddr ? `<br/>${esc(svc.whereAddr)}` : ""}</div>` : ""}`
    : "";

  // ── token pass ──
  let html = template
    .split("{{TITLE}}").join(esc(title))
    .split("{{META_DESCRIPTION}}").join(esc(metaDescription))
    .split("{{COVER_URL}}").join(esc(cover))
    .split("{{PORTRAIT_URL}}").join(esc(portrait))
    .split("{{NAME_PLAIN}}").join(esc(t.fullName))
    .split("{{NAME_HTML}}").join(nameHtml(t.fullName))
    .split("{{DATES_LINE}}").join(datesToken)
    .split("{{QUOTE_DIV}}").join(quoteDiv)
    .split("{{THEIR}}").join(esc(pn.pos))
    .split("{{FIRST_NAME}}").join(esc(first))
    .split("{{FLYER_YEARS}}").join(esc(flyerYears))
    .split("{{SVC_BLOCK}}").join(svcBlock);

  // ── the override lands in the slot the document was built around ──
  html = html.split("<!--IMY_OVERRIDE_SLOT-->").join(overrideScript);

  // ── the static markup speaks the family's pronouns (§4b). The hydrator
  //    fixes these client-side too (pack()); this curated table is the SSR
  //    mirror, exact strings only — same approach as the wreath's table. ──
  const table: Array<[string, string]> = [
    ['aria-label="Her page"', `aria-label="${esc(pn.Pos)} page"`],
    [">Her life</button>", `>${esc(pn.Pos)} life</button>`],
    [">Moments of hers</h2>", `>Moments of ${esc(poss)}</h2>`],
    ['aria-label="Words left for her"', `aria-label="Words left for ${esc(pn.obj)}"`],
    ['margin:0 0 4px">Her wall</div>', `margin:0 0 4px">${esc(pn.Pos)} wall</div>`],
    [">From the people who knew her</h3>", `>From the people who knew ${esc(pn.obj)}</h3>`],
    ['margin:0 2px 6px">Her album</div>', `margin:0 2px 6px">${esc(pn.Pos)} album</div>`],
    ['margin:0 2px 6px">Her life</div>', `margin:0 2px 6px">${esc(pn.Pos)} life</div>`],
    [">Her family tree</h2>", `>${esc(pn.Pos)} family tree</h2>`],
    ['aria-label="Her family tree. Drag to move, plus and minus to zoom, click a person to open their card."', `aria-label="${esc(pn.Pos)} family tree. Drag to move, plus and minus to zoom, click a person to open their card."`],
    ["· and how you knew her</small>", `· and how you knew ${esc(pn.obj)}</small>`],
    ['aria-label="How you knew her"', `aria-label="How you knew ${esc(pn.obj)}"`],
    ["<option>Her student</option>", `<option>${esc(pn.Pos)} student</option>`],
    ['data-start="The first time I met her, ">Start from the first time you met her&hellip;</button>', `data-start="The first time I met ${esc(pn.obj)}, ">Start from the first time you met ${esc(pn.obj)}&hellip;</button>`],
    ['data-start="What I&rsquo;d give to tell her now is ">Start from what you&rsquo;d tell her now&hellip;</button>', `data-start="What I&rsquo;d give to tell ${esc(pn.obj)} now is ">Start from what you&rsquo;d tell ${esc(pn.obj)} now&hellip;</button>`],
    [">Back to her page</button>", `>Back to ${esc(pn.pos)} page</button>`],
    ['aria-label="Share her page"', `aria-label="Share ${esc(pn.pos)} page"`],
    ["Share her page <button", `Share ${esc(pn.pos)} page <button`],
    ["send her page to the family &amp; friends who loved her —<br/>every memory they leave joins her wall", `send ${esc(pn.pos)} page to the family &amp; friends who loved ${esc(pn.obj)} —<br/>every memory they leave joins ${esc(pn.pos)} wall`],
    ["it joins her wall — and they'll know", `it joins ${esc(pn.pos)} wall — and they'll know`],
  ];
  for (const [from, to] of table) html = html.split(from).join(to);

  // ── the Eleanor name-pass safety net (extraction already strips her; this
  //    keeps the standing rule enforced even if a future re-extraction drifts) ──
  html = html.split("Eleanor Margaret Hayes").join(esc(t.fullName));
  html = html.replace(/Eleanor(&#39;s|'s|’s)/g, `${esc(first)}$1`);
  html = html.split("Eleanor").join(esc(first));

  // ── section rests (CSS, like the wreath's) — nothing is removed ──
  {
    const hides: string[] = [];
    // No visits counter exists (G-U1/R2): the lines rest until a real one
    // ships. Never show a number that isn't counted — and the hydrator's
    // `n||1` fallback would fabricate "1 person has visited".
    hides.push(".mvisits{display:none!important}", ".ribbon .visits{display:none!important}");
    const hi = html.lastIndexOf("</head>");
    if (hi > -1) html = html.slice(0, hi) + `<style>${hides.join("")}</style>` + html.slice(hi);
  }

  // ── the sponsor's quiet line (Issue 2) — when a family_unlock gift opened
  //    the wall, the page says so, softly, at the end of the memories room.
  //    The gift writes sponsor_* and the tier only; ownership never moves. ──
  if (tier === "plus" && t.sponsor && (t.sponsor.name || t.sponsor.message)) {
    const roomIdx = html.indexOf('<section class="room on" id="room-mem">');
    const endIdx = roomIdx > -1 ? html.indexOf("</section>", roomIdx) : -1;
    if (endIdx > -1) {
      const line =
        `\n  <p id="sponsorLine" style="margin:26px auto 0;max-width:520px;text-align:center;font-style:italic;color:rgba(44,37,32,.6);font-size:14.5px;line-height:1.7">` +
        `The whole page, open for everyone — a gift from ${t.sponsor.name ? esc(t.sponsor.name) : "someone who loves this family"}.` +
        `${t.sponsor.message ? `<br/>&ldquo;${esc(t.sponsor.message)}&rdquo;` : ""}</p>\n`;
      html = html.slice(0, endIdx) + line + html.slice(endIdx);
    }
  }

  // ── the obituary keeps its home (R4): families have entered these words;
  //    they must not silently disappear. A quiet sheet at the end of the
  //    memories room, in the document's own visual language. ──
  if (t.obituary && t.obituary.trim()) {
    const roomIdx = html.indexOf('<section class="room on" id="room-mem">');
    const endIdx = roomIdx > -1 ? html.indexOf("</section>", roomIdx) : -1;
    if (endIdx > -1) {
      const ob =
        `\n  <hr class="roomsep"/>\n  <div class="kick" style="text-align:center;margin:0 0 4px">The obituary</div>` +
        `\n  <div id="obituary" style="max-width:680px;margin:14px auto 0;background:#FFFDF6;border:1px solid rgba(201,165,114,.35);border-radius:14px;padding:clamp(22px,4vw,40px);font-size:15.5px;line-height:1.85;color:var(--ink);white-space:pre-line;overflow-wrap:anywhere;word-break:break-word">${esc(t.obituary.trim())}</div>\n`;
      html = html.slice(0, endIdx) + ob + html.slice(endIdx);
    }
  }

  // ── Gate 2 · the wall is real — hearts, comments, and leave-a-memory reach
  //    the same endpoints the wreath uses; voice cards get a real <audio>;
  //    embedded tapes (YouTube/Vimeo) get their quiet iframe room (R9). The
  //    document's own local-only handlers are replaced (hearts, comment sends)
  //    or ridden (the lm form's optimistic "sent" pane stays; the POST lands
  //    behind it, pending the family's welcome). ──
  const wiring = `<script>/* the wall is real · hearts, kind words, and memories reach the family (Gate 2) */
(function(){
var OV=window.IMY_OVERRIDE||{},SLUG=${JSON.stringify(slug)},MEMS=OV.MEMS||[];
var stream=document.getElementById('stream');
function post(path,body){return fetch('/api/tribute/'+SLUG+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json()})}
/* hearts · persisted through /memory/heart, remembered per browser */
var HK='imy-hearts-'+SLUG;
function kept(){try{return JSON.parse(localStorage.getItem(HK)||'[]')}catch(e){return []}}
function keep(a){try{localStorage.setItem(HK,JSON.stringify(a))}catch(e){}}
if(stream)Array.prototype.forEach.call(stream.querySelectorAll('.memcard'),function(card,i){
  var m=MEMS[i];if(!m)return;
  if(m.id){
    var hb=card.querySelector('.heart');
    if(hb){
      /* the document's handler only toggles a local variable — replace it with the persistent one */
      var nb=hb.cloneNode(true);hb.parentNode.replaceChild(nb,hb);
      var on=kept().indexOf(m.id)!==-1,n=Math.max(0,m.h|0);
      var paint=function(){nb.classList.toggle('hearted',on);nb.innerHTML='♥ <b>'+n+'</b>'};
      if(on)paint();
      nb.addEventListener('click',function(){
        on=!on;n=Math.max(0,n+(on?1:-1));paint();
        var a=kept();if(on){if(a.indexOf(m.id)===-1)a.push(m.id)}else{a=a.filter(function(x){return x!==m.id})}keep(a);
        post('/memory/heart',{memoryId:m.id,on:on}).then(function(j){if(j&&j.ok&&typeof j.count==='number'){n=Math.max(0,j.count);paint()}}).catch(function(){});
      });
    }
    var ci=card.querySelector('.cmtrow input'),cb=card.querySelector('.cmtrow button');
    if(ci&&cb){
      /* kind words go to the family first — same stub, real POST */
      var ni=ci.cloneNode(true),nbn=cb.cloneNode(true);
      ci.parentNode.replaceChild(ni,ci);cb.parentNode.replaceChild(nbn,cb);
      var sendC=function(){
        var v=ni.value.trim();if(!v)return;
        var d=document.createElement('div');d.className='cmt';
        d.innerHTML='<div class="cav">Y</div><p><b>You</b> · '+v.replace(/</g,'&lt;')+' <i style="font-style:normal;font-family:\\'Work Sans\\',sans-serif;font-size:9px;color:var(--terra-deep)">· waiting for the family</i></p>';
        var row=card.querySelector('.cmtrow');if(row)row.before(d);
        ni.value='';
        post('/memory/comment',{memoryId:m.id,body:v}).catch(function(){});
      };
      nbn.addEventListener('click',sendC);
      ni.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();sendC()}});
    }
  }
  /* a voice card really plays (G-P9) — plus pages only; the url rode the override */
  if(m.audioUrl){
    var vb=card.querySelector('button[aria-label="Play voice memory"]');
    if(vb){
      var au=document.createElement('audio');au.preload='metadata';au.src=m.audioUrl;card.appendChild(au);
      au.addEventListener('loadedmetadata',function(){
        var s=Math.round(au.duration||0);
        var span=vb.parentNode?vb.parentNode.querySelector('.mono'):null;
        if(span&&s)span.textContent=Math.floor(s/60)+':'+('0'+(s%60)).slice(-2);
      });
      au.addEventListener('ended',function(){vb.textContent='▶'});
      vb.addEventListener('click',function(){if(au.paused){au.play().catch(function(){});vb.textContent='❚❚'}else{au.pause();vb.textContent='▶'}});
    }
  }
});
/* leave a memory · the letter really reaches the family (pending their welcome).
   The document's own submit handler shows the "sent" pane; this one carries the words. */
var lmForm=document.getElementById('lmForm');
if(lmForm)lmForm.addEventListener('submit',function(e){
  e.preventDefault();
  var val=function(id){var el=document.getElementById(id);return el?String(el.value||'').trim():''};
  var name=val('lmName'),title=val('lmTitle'),story=val('lmStory');
  var relEl=document.getElementById('lmRel'),rel=relEl?relEl.value:'';
  var body=title&&story?title+' — '+story:(story||title);
  if(!body)return;
  var files=[];try{files=Array.prototype.slice.call((document.getElementById('lmFile')||{}).files||[],0,4)}catch(err){}
  var uploaded=Promise.resolve([]);
  if(files.length){
    var fd=new FormData();files.forEach(function(f){fd.append('files',f)});
    uploaded=fetch('/api/upload',{method:'POST',body:fd}).then(function(r){return r.json()}).then(function(j){return (j&&j.ok&&j.urls)||[]}).catch(function(){return []});
  }
  uploaded.then(function(urls){
    return post('/memory',{name:name,relation:rel,body:body,photoUrls:urls});
  }).catch(function(){});
});
/* embedded tapes (YouTube/Vimeo) open their quiet room (R9) — direct files
   already play through the hydrator's tapePlayback, which stops this handler */
if((OV.TAPES||[]).some(function(x){return x.embed}))document.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('.tape');if(!b)return;
  var tp=(OV.TAPES||[])[+b.dataset.ti];if(!tp||!tp.embed||tp.url)return;
  e.preventDefault();e.stopPropagation();
  var wrap=document.createElement('div');
  wrap.style.cssText='position:fixed;inset:0;background:rgba(20,15,10,.94);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  var fr=document.createElement('iframe');
  fr.src=tp.embed+'?autoplay=1';fr.title='A kept video';fr.allow='autoplay; fullscreen; picture-in-picture';fr.allowFullscreen=true;
  fr.style.cssText='width:min(920px,94vw);aspect-ratio:16/9;border:0;border-radius:12px;background:#000';
  var x=document.createElement('button');x.setAttribute('aria-label','Close');x.textContent='✕';
  x.style.cssText='position:absolute;top:14px;right:16px;background:none;border:1px solid rgba(250,245,236,.4);color:#FAF5EC;border-radius:8px;width:36px;height:36px;font-size:16px;cursor:pointer';
  x.addEventListener('click',function(){document.body.removeChild(wrap)});
  wrap.appendChild(fr);wrap.appendChild(x);document.body.appendChild(wrap);
},true);
})();
</${"script"}>`;
  html = html.replace("</body>", wiring + "\n</body>");

  return html;
}
