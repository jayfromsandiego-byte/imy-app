// renderTribute — fills the WREATH tribute template (templates/tribute-template.html,
// the v11 final locked July 5 2026) from a tribute record.
//
// Two-channel injection, zero animation drift:
//   1) {{TOKENS}} — SSR-visible strings (name, dates, counts, OG meta) so crawlers
//      and link previews see the real person.
//   2) window.__TRIBUTE__ — one JSON boot object the template's own render engine
//      consumes (gallery, chapters, memories, wall state). The engine code is the
//      design file's own; data in, identical motion out.
//
// Tier gating: body[data-tier] drives the template's existing free/plus rendering.
// The credit banner shows on FREE only. The memory wall shows ten on free; every
// approved memory beyond ten becomes a "waiting" entry until Plus/Family Unlock.

import { type LovedThing } from "./lovedThings";

export type TimelineItem = { id?: string; year: string; title: string; text: string };
export type DetailItem = { k: string; v: string };
export type LovedItem = { label: string; photo?: string };
export type PhotoItem = { id?: string; url?: string; cap?: string };
// Every photo slot the family controls (fix 4): no slot ever auto-fills.
export type Placements = {
  quote?: string; // photo id behind their words
  board?: string[]; // bulletin board, owner-placed (ordered photo ids)
  chapters?: Record<string, string[]>; // timeline row id → photo ids ("_group" = legacy shared set)
};
export type MemoryComment = { name: string; rel: string; text: string };
export type MemoryItem = { id?: string; text: string; name: string; rel: string; hearts?: number; audio?: string; comments?: MemoryComment[]; photos?: string[] };
export type ReelItem = { poster?: string; label?: string; url?: string };

export type Tribute = {
  slug?: string;
  fullName: string;
  aka?: string;
  role?: string;
  birth?: string;
  passing?: string;
  place?: string;
  coverPhoto?: string;
  portrait?: string;
  portraitCap?: string;
  quote?: string;
  story?: string;
  candleCount?: number;
  flowerCount?: number;
  flowerToday?: number;
  tier?: string; // "free" | "plus" | "heirloom"
  theme?: string;
  motif?: string;
  visibility?: string; // "public" | "unlisted" | "private" — SEO only, never rendering
  status?: string;
  pronouns?: string; // "he" | "she" | "they" — how the page speaks of them
  showAnnounce?: boolean;
  message?: { text: string; sign?: string };
  service?: { date?: string; time?: string; place?: string; address?: string; charity?: string; charityUrl?: string };
  details?: DetailItem[];
  loved?: LovedItem[];
  lovedThings?: LovedThing[];
  timeline?: TimelineItem[];
  photos?: PhotoItem[];
  videos?: { url: string; cap?: string }[];
  voiceUrl?: string;
  reel?: ReelItem[];
  memories?: MemoryItem[];
  placements?: Placements;
  sponsor?: { name?: string; photoUrl?: string; message?: string };
};

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

// No-photo fallback: a quiet lit candle from the brand's own photo set — never
// a stranger's face in a family's arch. Absolute for og:image validity.
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

/** Memory relation → wall group (family · friends · neighbours · students). */
function classifyGroup(rel: string): string {
  const r = (rel || "").toLowerCase();
  if (/(son|daughter|mother|father|mom|dad|brother|sister|grand|wife|husband|partner|niece|nephew|cousin|aunt|uncle|family)/.test(r)) return "family";
  if (/(neighbou?r|street|next door)/.test(r)) return "neighbours";
  if (/(student|pupil|class|taught|teacher)/.test(r)) return "students";
  return "friends";
}

/** The words a page uses for its person. Default is they/them — never a guess.
 *  Exported so the dashboard speaks the same words the page does. */
export function pronounSet(p?: string) {
  if (p === "he") return { sub: "he", Sub: "He", obj: "him", pos: "his", Pos: "His" };
  if (p === "she") return { sub: "she", Sub: "She", obj: "her", pos: "her", Pos: "Her" };
  return { sub: "they", Sub: "They", obj: "them", pos: "their", Pos: "Their" };
}

export function renderTribute(template: string, t: Tribute): string {
  const tier = t.tier === "plus" || t.tier === "heirloom" ? "plus" : "free";
  const first = firstName(t.fullName);
  const cover = t.coverPhoto || t.portrait || FALLBACK_COVER;
  const slug = t.slug || "example";

  // ── dates line ──
  const born = fmtDate(t.birth);
  const died = fmtDate(t.passing);
  const datesBits = [born && died ? `${born} — ${died}` : born || died, t.place].filter(Boolean);
  const datesLine = esc(datesBits.join(" · ")) || "&nbsp;";

  // ── boot data for the template's engine ──
  // Free keeps about thirty photographs (the pricing promise); Plus is unlimited.
  const allPhotos = (t.photos || []).filter((p) => p.url);
  const photos = tier === "free" ? allPhotos.slice(0, 30) : allPhotos;
  const videos = (t.videos || []).filter((v) => v.url);
  const imgs: Record<string, string> = {};
  photos.forEach((p, i) => { imgs[`p${i}`] = p.url as string; });
  const gal = photos.map((p, i) => [`p${i}`, p.cap || ""]);
  // Living pictures: pair video i with photo i (dashboard can re-pair later).
  const liv: Record<string, string> = {};
  videos.forEach((v, i) => { if (imgs[`p${i}`]) liv[`p${i}`] = v.url; });

  // ── placements (fix 4): the family assigns every slot; nothing auto-fills ──
  const pl = t.placements;
  const byId: Record<string, { key: string; url: string; cap: string }> = {};
  photos.forEach((p, i) => { if (p.id) byId[p.id] = { key: `p${i}`, url: p.url as string, cap: p.cap || "" }; });

  const timeline = t.timeline || [];
  // Chapters (fix 3): a photo belongs to its moment. Per-moment assignments render
  // aligned (ph[k] is mo[k]'s photograph, null = a quiet empty state). The legacy
  // "_group" set reproduces the pre-placements look for pages sealed before 0013.
  const chAssign = pl?.chapters || undefined;
  const perMoment = !!chAssign && timeline.some((m) => m.id && Array.isArray(chAssign[m.id]) && chAssign[m.id].some((x) => byId[x]));
  const groupIds = (chAssign?.["_group"] || []).filter((x) => byId[x]);
  const chPh: (unknown[] | null)[] = perMoment
    ? timeline.map((m) => {
        const id = ((m.id && chAssign?.[m.id]) || []).find((x) => byId[x]);
        return id ? [byId[id].key, byId[id].cap] : null;
      })
    : groupIds.length
      ? groupIds.map((x) => [byId[x].key, byId[x].cap])
      : [];
  const ch = timeline.length
    ? [{
        name: `${first}'s life`,
        yrs: "in moments",
        mo: timeline.map((m) => [m.year || "", m.title || m.text || ""]),
        ph: chPh,
        ...(perMoment ? { al: 1 } : {}),
      }]
    : [];

  const approved = (t.memories || []).map((m) => ({
    id: m.id || "",
    g: classifyGroup(m.rel || ""),
    av: (m.name || "A")[0].toUpperCase(),
    nm: m.name || "A friend",
    rel: m.rel || "",
    tx: m.text || "",
    h: Math.max(0, m.hearts ?? 0),
    // Their voice is a Plus promise: on a resting (free) page recordings sleep — kept, not shown.
    au: tier === "plus" && m.audio && /^https:\/\//.test(m.audio) ? m.audio : "",
    cm: (m.comments || []).map((c) => [c.name || "A friend", c.rel || "", c.text || ""]).filter((c) => c[2]),
  })).filter((m) => m.tx);

  const CAP = 10;
  const mems = tier === "free" ? approved.slice(0, CAP) : approved;
  const seedw = tier === "free"
    ? approved.slice(CAP).map((m) => ({ nm: m.nm, rel: m.rel, tx: m.tx, g: m.g }))
    : [];

  const words = (t.lovedThings || []).map((l) => String(l.label || "").toLowerCase()).filter(Boolean).slice(0, 8);

  // The bulletin board (fix 5) is its own place: owner-placed keepsakes first
  // (placements.board, in the family's order), then visitor-left photographs
  // from approved memories. It never mirrors the gallery on its own.
  const ownerPins = (pl?.board || [])
    .map((id) => byId[id])
    .filter(Boolean)
    .map((p, i) => ({
      t: "photo", img: p.url, ttl: p.cap, who: "", rel: "",
      date: "", h: 0, r: (i % 2 ? 3 : -3) + (i % 3), c: [] as unknown[],
    }));
  const visitorPins = (t.memories || [])
    .filter((m) => m.photos && m.photos[0] && /^https:\/\//.test(m.photos[0]))
    .slice(0, 8)
    .map((m, i) => ({
      t: "photo", img: m.photos![0], ttl: (m.text || "").slice(0, 80), who: m.name || "", rel: m.rel || "",
      date: "", h: Math.max(0, m.hearts ?? 0), r: (i % 2 ? -3 : 3) + (i % 3), c: [] as unknown[],
    }));
  const boardItems = [...ownerPins, ...visitorPins];
  const boards = boardItems.length
    ? [{ key: "photos", label: "Photographs", items: boardItems }]
    : [];

  const boot = {
    slug, tier,
    gal, imgs, liv, ch, mems, seedw, words, boards,
    waiting: seedw.length,
    fwt: Math.max(0, t.flowerToday ?? 0),
  };

  // ── conditional blocks ──
  const serviceStrip = t.service && (t.service.place || t.service.date || t.service.charity)
    ? `<div class="svcrow"><div class="svcrow-in">
  <span class="lab">Service</span>
  <span class="what">${esc([fmtDate(t.service.date), t.service.time].filter(Boolean).join(" · "))}${t.service.place ? ` <span class="mono">· ${esc([t.service.place, t.service.address].filter(Boolean).join(", "))}</span>` : ""}</span>
  ${t.service.charity ? `<a class="mini" href="${esc(t.service.charityUrl || `https://www.google.com/search?q=${encodeURIComponent(t.service.charity + " donate")}`)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:inline-flex;align-items:center">Give in ${esc(first)}'s name</a>` : ""}
  </div></div>`
    : "";

  const creditBanner = tier === "free"
    ? `<div class="announce">Built with love, by I <em style="color:var(--flame)">Miss</em> You Memorial<span class="mono">free · forever</span></div>`
    : "";

  const sponsorPlaque = t.sponsor && (t.sponsor.name || t.sponsor.message)
    ? `<div class="plaque rev" id="plaque">
        ${t.sponsor.photoUrl ? `<img class="pl-photo" id="plPhoto" src="${esc(t.sponsor.photoUrl)}" alt="${esc(t.sponsor.name || "The giver")}"/>` : ""}
        <div><div class="pl-line" id="plLine">${t.sponsor.name
          ? `The full memorial — a gift from ${esc(t.sponsor.name)}, so every memory has a home.`
          : "Someone who loves this family opened the wall for everyone."}</div>
        ${t.sponsor.message ? `<div class="pl-line" style="font-weight:400;font-size:13.5px;margin-top:4px">&ldquo;${esc(t.sponsor.message)}&rdquo;</div>` : ""}
        <div class="pl-date" id="plDate">Given with love</div></div>
      </div>`
    : "";

  const archVideo = tier === "plus" && videos[0]
    ? `<video class="living" src="${esc(videos[0].url)}" muted loop playsinline preload="metadata" aria-hidden="true"></video>`
    : "";
  const archLivetag = archVideo ? `<span class="livetag" id="archLiveTag">Living portrait</span>` : "";

  const metaDescription = (t.story || "").replace(/\s+/g, " ").trim().slice(0, 155) ||
    `A place to remember ${t.fullName} — photos, stories, and the voices of everyone who loved ${first}.`;

  const boot_script = `<script>window.__TRIBUTE__=${JSON.stringify(boot).replace(/</g, "\\u003c")};</script>`;

  // ── token pass ──
  let html = template
    .split("{{TRIBUTE_BOOT}}").join(boot_script)
    .split("{{TITLE}}").join(esc(`${t.fullName} — I Miss You Memorial`))
    .split("{{META_DESCRIPTION}}").join(esc(metaDescription))
    .split("{{COVER_URL}}").join(esc(cover))
    .split("{{NAME_PLAIN}}").join(esc(t.fullName))
    .split("{{NAME_HTML}}").join(nameHtml(t.fullName))
    .split("{{DATES_LINE}}").join(datesLine)
    .split("{{EPIGRAPH}}").join(esc(t.quote || t.aka || "Loved, and remembered."))
    .split("{{FLOWER_COUNT}}").join(String(Math.max(0, t.flowerCount ?? 0)))
    .split("{{THEIR}}").join("their")
    .split("{{TIER}}").join(tier)
    .split("{{SERVICE_STRIP}}").join(serviceStrip)
    .split("{{CREDIT_BANNER}}").join(creditBanner)
    .split("{{SPONSOR_PLAQUE}}").join(sponsorPlaque)
    .split("{{ARCH_VIDEO}}").join(archVideo)
    .split("{{ARCH_LIVETAG}}").join(archLivetag)
    .split("{{PRESENCE_HIDDEN}}").join('hidden style="display:none"')
    .split("{{PRESENCE_LINE}}").join("");

  // ── name pass: the template's UI strings speak the person's real name ──
  html = html.split("Eleanor Margaret Hayes").join(esc(t.fullName));
  html = html.replace(/Eleanor(&#39;s|'s)/g, `${esc(first)}$1`);
  html = html.split("Eleanor").join(esc(first));

  // The footer's address line speaks THIS page's own home (July 8: the demo's
  // lowercase subdomain slipped past the capital-E pass above and reached
  // every live footer).
  if (t.slug) html = html.split("eleanor.imissyoumemorial.com").join(`${esc(t.slug)}.imissyoumemorial.com`);

  // ═══ identity pass (July 7) ══════════════════════════════════════════════
  // The design file is Eleanor's demo. Two real families taught us what leaks:
  // her pronouns, her quote band, her "who she really was" cards, her wall
  // groups, and the demo tape shelf. Everything below regenerates those from
  // THIS tribute's data using the template's own markup — same classes, same
  // motion — or hides a section that has nothing real to say.
  const pn = pronounSet(t.pronouns);

  // 1) The quote band: their photograph, their words — or no band at all.
  {
    const qIdx = html.indexOf("smallest beautiful thing in the day");
    if (qIdx > -1) {
      const secStart = html.lastIndexOf('<section class="band rev">', qIdx);
      const secEnd = html.indexOf("</section>", qIdx);
      if (secStart > -1 && secEnd > -1) {
        // Fix 4: the photograph behind their words is chosen, never guessed.
        // No placement → a warm quiet ground carries the quote alone.
        const qPhoto = pl?.quote ? byId[pl.quote] : undefined;
        const band = t.quote
          ? (qPhoto
              ? `<section class="band rev"><div class="bgi"><img src="${esc(qPhoto.url)}" alt=""></div><div class="v"></div><div class="inb"><div class="q">“${esc(t.quote)}”</div><div class="s">the thing ${pn.sub} always said</div></div></section>`
              : `<section class="band rev" style="background:#241711"><div class="v"></div><div class="inb"><div class="q">“${esc(t.quote)}”</div><div class="s">the thing ${pn.sub} always said</div></div></section>`)
          : "";
        html = html.slice(0, secStart) + band + html.slice(secEnd + "</section>".length);
      }
    }
  }

  // 2) "Who they really were": their detail cards — or the section rests.
  // Either way Eleanor's demo cards leave the page entirely, even from source.
  const detailCards = (t.details || []).filter((d) => d.k && d.v).slice(0, 6);
  {
    const tIdx = html.indexOf('<div class="truths">');
    const mIdx = tIdx > -1 ? html.indexOf("money aside, masks off", tIdx) : -1;
    if (tIdx > -1 && mIdx > -1) {
      const footStart = html.lastIndexOf("<div", mIdx);
      const cards = detailCards
        .map((d) => `<div class="truth"><div class="tl2">${esc(d.k)}</div><div class="tv">${esc(d.v)}</div></div>`)
        .join("\n          ");
      html = html.slice(0, tIdx) + `<div class="truths">\n          ${cards}\n        </div>\n        ` + html.slice(footStart);
    }
    if (!detailCards.length) {
      html = html.split('<a href="#really">Who she was</a>').join("");
    }
  }

  // 3) The editor affordance visitors can't use.
  html = html.split('<div class="under" style="margin-top:20px"><button class="ghostadd">＋ Add a key moment · a year, a line, a photograph</button></div>').join("");

  // 4) Wall groups from the people who actually wrote, never Eleanor's.
  {
    const present = new Set([...mems, ...seedw].map((m: any) => m.g));
    const groups: Array<[string, string]> = [["all", "Everyone"], ["family", "Family"], ["friends", "Friends"]];
    if (present.has("neighbours")) groups.push(["neighbours", "Neighbours"]);
    if (present.has("students")) groups.push(["students", `${pn.Pos} students`]);
    html = html.split(
      "var GROUPS=[['all','Everyone'],['family','Family'],['friends','Friends'],['neighbours','Neighbours'],['students','Her students']];"
    ).join(`var GROUPS=${JSON.stringify(groups)};`);
  }

  // 5) The ticker's fallback names become theirs (it already prefers their words).
  {
    const tickerWords = words.length ? words.slice(0, 8).map((w) => esc(w)).join("·") + "·" : `family·friends·always loved·`;
    html = html.split(
      'var names="her students·the tea girls·seaside ave·room 4·the garden club·her grandchildren·the whole street·butterscotch in every pocket·"'
    ).join(`var names="${tickerWords}"`);
  }

  // 6) The rest of the page speaks their pronouns. Curated, exact strings only.
  const table: Array<[string, string]> = [
    [">Her story</a>", `>${pn.Pos} story</a>`],
    ["Her story &amp; her legacy", `${pn.Pos} story &amp; ${pn.pos} legacy`],
    ['<a href="#really">Who she was</a>', `<a href="#really">Who ${pn.sub} was</a>`],
    ["Chapters · the top of her story", `Chapters · the top of ${pn.pos} story`],
    ['aria-label="Chapters of her life"', `aria-label="Chapters of ${pn.pos} life"`],
    [", only her.", `, only ${pn.obj}.`],
    ["Curated by her family", `Curated by ${pn.pos} family`],
    ["want to forget about her?", `want to forget about ${pn.obj}?`],
    ['placeholder="She always…"', `placeholder="${pn.Sub} always…"`],
    ["The shelf keeps her in motion", `The shelf keeps ${pn.obj} in motion`],
    ["the room fills with her", `the room fills with ${pn.obj}`],
    ["her videos, kept forever", `${pn.pos} videos, kept forever`],
    ["Before you add to her page", `Before you add to ${pn.pos} page`],
    ["find you on her page", `find you on ${pn.pos} page`],
    ["students:'her student'", `students:'${pn.pos} student'`],
    ["e.g. her student, Room 4, 1989", `e.g. ${pn.pos} student, Room 4, 1989`],
    ["keep her voice", `keep ${pn.pos} voice`],
    ["Choose how you knew her. It keeps her page organized.", `Choose how you knew ${pn.obj}. It keeps ${pn.pos} page organized.`],
    ["Her page, bound as a linen hardcover", `${pn.Pos} page, bound as a linen hardcover`],
    ["plus · her motif", `plus · ${pn.pos} motif`],
    ["Her motifs paint every section on Plus", `${pn.Pos} motifs paint every section on Plus`],
    ["Donations in her name", `Donations in ${pn.pos} name`],
    ["Her voice lives on Plus pages.", `${pn.Pos} voice lives on Plus pages.`],
    ["The tape shelf, her videos kept forever", `The tape shelf, ${pn.pos} videos kept forever`],
    ["the thing she always said", `the thing ${pn.sub} always said`],
    ["Who she really was", `Who ${pn.sub} really was`],
    ["With everything set aside, <em>this</em> was her.", `With everything set aside, <em>this</em> was ${pn.obj}.`],
    ["written by her family · only they can change it", `written by ${pn.pos} family · only they can change it`],
    ['"her garden rows, just after sunrise"', `"${pn.pos} garden rows, just after sunrise"`],
    ['"seeds in her coat pocket"', `"seeds in ${pn.pos} coat pocket"`],
    ["label:'Her students'", `label:'${pn.Pos} students'`],
  ];
  for (const [from, to] of table) html = html.split(from).join(to);

  // 6b) The quiet Plus band — free pages only, standing just above the concierge
  // band. The pledge leads, the offer follows; two real checkout forms, no theatre.
  // Injected here (never in the locked template) so plus pages never carry it.
  if (tier === "free" && slug) {
    const bandAnchor = '<div class="gw-band">';
    const bandIdx = html.indexOf(bandAnchor);
    if (bandIdx > -1) {
      const checkoutForm = (plan: string, cls: string, label: string) =>
        `<form method="POST" action="/api/stripe/checkout" style="display:inline-block;margin:0">` +
        `<input type="hidden" name="plan" value="${plan}"/>` +
        `<input type="hidden" name="slug" value="${esc(slug)}"/>` +
        `<input type="hidden" name="returnTo" value="/sites/${esc(slug)}"/>` +
        `<button type="submit" class="${cls}">${label}</button></form>`;
      const band =
        `<section id="plus-band" aria-label="Plus" style="background:#F3ECDD;border-top:1px solid #E4D9C4;border-bottom:1px solid #E4D9C4;padding:56px 5%;text-align:center">` +
        `<div style="max-width:620px;margin:0 auto">` +
        `<div class="mono" style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#8A7C6D;margin-bottom:14px">Keeping more of ${esc(first)}</div>` +
        `<h3 style="font-family:'Besley',serif;font-weight:500;font-size:clamp(22px,3.4vw,30px);line-height:1.25;margin:0 0 10px;color:#2C2520">Everything here is free, forever. <em style="color:#A87C5F">Plus</em> keeps more.</h3>` +
        `<p style="color:#5A4F45;font-size:15.5px;line-height:1.65;margin:0 0 24px">${pn.Pos} voice. Living pictures. Every photograph, the whole wall, an exact-name address. One choice, made once.</p>` +
        `<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">` +
        checkoutForm("plus_once", "btn solid", "Keep everything · $97 once") +
        checkoutForm("plus_monthly", "btn", "$12 a month · 3 days free") +
        `</div>` +
        `<div class="mono" style="font-size:11px;letter-spacing:.14em;color:#8A7C6D;margin-top:18px">the pledge holds · if plus ever rests, the page stays · nothing is ever taken down</div>` +
        `</div></section>`;
      html = html.slice(0, bandIdx) + band + html.slice(bandIdx);
    }
  }

  // 7) Sections with nothing real to show, rest quietly.
  {
    const hides: string[] = [];
    if (!videos.length) hides.push("#keep .shelfview{display:none!important}");
    if (!words.length) hides.push(".cyc{display:none!important}");
    if (!detailCards.length) hides.push("#really{display:none!important}");
    if (hides.length) {
      const hi = html.lastIndexOf("</head>");
      if (hi > -1) html = html.slice(0, hi) + `<style>${hides.join("")}</style>` + html.slice(hi);
    }
  }

  // ═══ presence pass (July 8) ═══════════════════════════════════════════════
  // The design file simulates company ("two people are here with you now").
  // Trust is the entire product: on every server render the simulation leaves
  // the page, and a Realtime module below speaks only when at least two people
  // are actually here. No fabricated number can ever reach a family's page.
  {
    const pAnchor = "/* presence line — no one mourns alone */";
    const pIdx = html.indexOf(pAnchor);
    if (pIdx > -1) {
      const pEndMark = "},14000)})();";
      const pEnd = html.indexOf(pEndMark, pIdx);
      if (pEnd > -1) {
        const rest = `/* presence rests until real people are counted */
(function(){var el=document.getElementById('presenceTxt');if(!el)return;var b=el.parentElement;if(b){b.setAttribute('hidden','');b.style.display='none'}})();`;
        html = html.slice(0, pIdx) + rest + html.slice(pEnd + pEndMark.length);
      }
    }
  }
  {
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const sbAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    if (sbUrl && sbAnon && t.slug) {
      const presenceModule = `<script type="module">/* presence — real people, truthfully counted */
try{
const m=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
const el=document.getElementById("presenceTxt"),box=el&&el.parentElement;
if(el&&box){
const words=["two","three","four","five","six","seven","eight","nine"];
const show=(n)=>{if(n>=2){el.textContent=(n<10?words[n-2]:String(n))+" people are here with you now";box.removeAttribute("hidden");box.style.display="inline-flex"}else{box.setAttribute("hidden","");box.style.display="none"}};
const c=m.createClient(${JSON.stringify(sbUrl)},${JSON.stringify(sbAnon)});
const ch=c.channel("presence-"+${JSON.stringify(t.slug)},{config:{presence:{key:Math.random().toString(36).slice(2)}}});
ch.on("presence",{event:"sync"},()=>{try{show(Object.keys(ch.presenceState()).length)}catch(e){}});
ch.subscribe((st)=>{if(st==="SUBSCRIBED"){try{ch.track({t:Date.now()})}catch(e){}}});
addEventListener("pagehide",()=>{try{c.removeChannel(ch)}catch(e){}});
}
}catch(e){}
</script>`;
      html = html.replace("</body>", presenceModule + "\n</body>");
    }
  }

  return html;
}

/** Airtable fallback mapping (legacy MVP records) — kept during cutover. */
export function recordToTribute(rec: any): Tribute {
  const f = (rec && rec.fields) || {};
  let enriched: Partial<Tribute> = {};
  try {
    if (f["Tribute Data"]) enriched = JSON.parse(f["Tribute Data"]);
  } catch { /* ignore malformed enrichment */ }
  const photosField = Array.isArray(f["Photos"]) ? f["Photos"].map((a: any) => ({ url: a.url })) : undefined;
  return {
    slug: f["Slug"] || undefined,
    fullName: f["Loved One"] || "",
    birth: f["Birth Date"],
    passing: f["Passing Date"],
    place: f["Place"],
    coverPhoto: f["Cover Photo"] || (Array.isArray(f["Photos"]) && f["Photos"][0]?.url) || undefined,
    quote: f["Quote"],
    story: f["Story"],
    candleCount: 0,
    flowerCount: 0,
    tier: (f["Tier"] || "free").toString().toLowerCase(),
    theme: f["Theme"],
    photos: photosField,
    ...enriched,
  };
}
