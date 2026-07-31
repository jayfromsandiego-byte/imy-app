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
import { HERO_BACKGROUNDS, heroBackground } from "./heroBackgrounds";

export type TimelineItem = { id?: string; year: string; title: string; text: string; chapterId?: string };
// A chapter of the life (0017): the family writes the titles, in their order.
export type ChapterItem = { id?: string; title: string; sort?: number };
export type DetailItem = { k: string; v: string };
export type LovedItem = { label: string; photo?: string };
export type PhotoItem = { id?: string; url?: string; cap?: string };
// Every photo slot the family controls (fix 4): no slot ever auto-fills.
export type Placements = {
  quote?: string; // photo id behind their words
  board?: string[]; // bulletin board, owner-placed (ordered photo ids)
  chapters?: Record<string, string[]>; // timeline row id → photo ids ("_group" = legacy shared set)
  living?: Record<string, string>; // photo id → video id (Living pictures, chosen — never index luck)
};

// The page's rooms, in the family's order (fix 7). Absent = the design's arc.
export type SectionPlan = { order?: string[]; hidden?: string[] };

// A recognized YouTube/Vimeo link becomes a quiet embed; anything else is a file.
export function embedSrc(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,20})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d{6,15})/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}
export type MemoryComment = { name: string; rel: string; text: string };
export type MemoryItem = { id?: string; text: string; name: string; rel: string; hearts?: number; audio?: string; video?: string; comments?: MemoryComment[]; photos?: string[]; avatarUrl?: string };
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
  obituary?: string;
  candleCount?: number;
  flowerCount?: number;
  flowerToday?: number;
  tier?: string; // "free" | "plus" | "heirloom"
  theme?: string;
  motif?: string;
  heroVideoSlot?: string; // the hero's looping scene (0028) — a lib/heroBackgrounds id
  visibility?: string; // "public" | "unlisted" | "private" — SEO only, never rendering
  status?: string;
  discoverable?: boolean; // family opt-in to sitemap + search indexing (0020) — SEO only, never rendering
  pronouns?: string; // "he" | "she" | "they" — how the page speaks of them
  showAnnounce?: boolean;
  message?: { text: string; sign?: string };
  service?: { date?: string; time?: string; place?: string; address?: string; charity?: string; charityUrl?: string };
  details?: DetailItem[];
  loved?: LovedItem[];
  lovedThings?: LovedThing[];
  timeline?: TimelineItem[];
  chapters?: ChapterItem[];
  photos?: PhotoItem[];
  videos?: { id?: string; url: string; cap?: string; kind?: string }[]; // kind: "tape" (family upload) · "film" (the woven film, 0021)
  film?: { url: string; poster?: string; duration?: number; variant?: string }; // the placed film — its own room under the wreath
  filmStatus?: { status: string; error?: string; variant?: string; createdAt?: string }; // the paid film while it is being woven
  voiceUrl?: string;
  reel?: ReelItem[];
  memories?: MemoryItem[];
  placements?: Placements;
  sections?: SectionPlan;
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
  // Stored covers are often site-relative ("/photos/…"); og:image must be
  // absolute to be valid. Same-origin absolute URL — identical rendering.
  const coverRaw = t.coverPhoto || t.portrait || FALLBACK_COVER;
  const cover = coverRaw.startsWith("/") ? `${SITE}${coverRaw}` : coverRaw;
  const slug = t.slug || "example";

  // ── dates line ──
  const born = fmtDate(t.birth);
  const died = fmtDate(t.passing);
  const datesBits = [born && died ? `${born} · ${died}` : born || died, t.place].filter(Boolean);
  const datesLine = esc(datesBits.join(" · ")) || "&nbsp;";
  // Make a donation (July 10, founder ask): the giving door lives under their
  // name on the stone plate, plainly labelled — no longer in the service strip.
  const donateUnderName = t.service?.charity
    ? `<div class="n2" style="margin-top:7px"><a href="${esc(t.service.charityUrl || `https://www.google.com/search?q=${encodeURIComponent(t.service.charity + " donate")}`)}" target="_blank" rel="noopener noreferrer" style="font-family:'Sometype Mono',monospace;font-size:10.5px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#A87C5F;text-decoration:underline;text-underline-offset:3px">Make a donation</a></div>`
    : "";

  // ── boot data for the template's engine ──
  // Free keeps twelve photographs (locked July 23); Plus is unlimited. Every
  // later photograph is HELD, never refused — the album names how many wait,
  // exactly like the memory wall.
  const FREE_PHOTO_CAP = 12;
  const allPhotos = (t.photos || []).filter((p) => p.url);
  const photos = tier === "free" ? allPhotos.slice(0, FREE_PHOTO_CAP) : allPhotos;
  const videos = (t.videos || []).filter((v) => v.url);
  const imgs: Record<string, string> = {};
  photos.forEach((p, i) => { imgs[`p${i}`] = p.url as string; });
  const gal = photos.map((p, i) => [`p${i}`, p.cap || ""]);

  // ── placements (fix 4): the family assigns every slot; nothing auto-fills ──
  const pl = t.placements;
  const byId: Record<string, { key: string; url: string; cap: string }> = {};
  photos.forEach((p, i) => { if (p.id) byId[p.id] = { key: `p${i}`, url: p.url as string, cap: p.cap || "" }; });
  const vidById: Record<string, { url: string; cap: string }> = {};
  videos.forEach((v) => { if (v.id) vidById[v.id] = { url: v.url, cap: v.cap || "" }; });

  // Living pictures (fix 6): chosen pairs first (placements.living); the old
  // index pairing only carries pages from before the choice existed.
  const liv: Record<string, string> = {};
  if (pl?.living && Object.keys(pl.living).length) {
    for (const [phId, vidId] of Object.entries(pl.living)) {
      const p = byId[phId];
      const v = vidById[vidId];
      if (p && v && !embedSrc(v.url)) liv[p.key] = v.url;
    }
  } else if (!pl?.living) {
    // The woven film never becomes a Living picture — it belongs to the tape shelf.
    videos.forEach((v, i) => { if (v.kind !== "film" && imgs[`p${i}`] && !embedSrc(v.url)) liv[`p${i}`] = v.url; });
  }

  const timeline = t.timeline || [];
  // Chapters (fix 3): a photo belongs to its moment. Per-moment assignments render
  // aligned (ph[k] is mo[k]'s photograph, null = a quiet empty state). The legacy
  // "_group" set reproduces the pre-placements look for pages sealed before 0013.
  const chAssign = pl?.chapters || undefined;
  const momentPhoto = (m: TimelineItem): [string, string] | null => {
    const id = ((m.id && chAssign?.[m.id]) || []).find((x) => byId[x]);
    return id ? [byId[id].key, byId[id].cap] : null;
  };

  // A life in chapters (0017): the family's own chapters, every one rendered.
  // Moments group under their chapter in the family's order; moments not yet
  // placed gather quietly at the end. Pages without chapters keep the
  // single-chapter look exactly as before — zero drift on family pages.
  type ChapterBoot = { name: string; yrs: string; mo: string[][]; ph: (unknown[] | null)[]; al?: number };
  const chapterRows = (t.chapters || []).filter((c) => String(c.title || "").trim());
  // The site auto-corrects the order of a life (July 10, founder ask): moments
  // with years render chronologically; moments without a year keep the
  // family's own order, gathered after the dated ones. Stable throughout.
  const chrono = (mos: TimelineItem[]): TimelineItem[] =>
    mos
      .map((m, i) => ({ m, i, y: /^\d{4}$/.test(String(m.year || "").trim()) ? Number(String(m.year).trim()) : Infinity }))
      .sort((a, b) => (a.y - b.y) || (a.i - b.i))
      .map((x) => x.m);
  const chapterYears = (mos: TimelineItem[]): string => {
    const ys = mos.map((m) => (String(m.year || "").match(/^\d{4}$/) || [])[0]).filter(Boolean) as string[];
    if (!ys.length) return "in moments";
    const lo = ys.reduce((a, b) => (b < a ? b : a));
    const hi = ys.reduce((a, b) => (b > a ? b : a));
    return lo === hi ? lo : `${lo} to ${hi}`;
  };
  const chapterEntry = (name: string, unordered: TimelineItem[]): ChapterBoot => {
    const mos = chrono(unordered);
    const anyPhoto = mos.some((m) => momentPhoto(m));
    return {
      name,
      yrs: chapterYears(mos),
      mo: mos.map((m) => [m.year || "", m.title || m.text || ""]),
      ph: anyPhoto ? mos.map((m) => momentPhoto(m)) : [],
      ...(anyPhoto ? { al: 1 } : {}),
    };
  };

  let ch: ChapterBoot[] = [];
  if (timeline.length && chapterRows.length) {
    const placed = new Set<string>();
    for (const c of chapterRows) {
      const mos = timeline.filter((m) => c.id && m.chapterId === c.id);
      mos.forEach((m) => { if (m.id) placed.add(m.id); });
      if (mos.length) ch.push(chapterEntry(String(c.title).trim(), mos));
    }
    const rest = timeline.filter((m) => !(m.id && placed.has(m.id)));
    if (rest.length) ch.push(chapterEntry(ch.length ? `More of ${pronounSet(t.pronouns).pos} days` : `${first}'s life`, rest));
  } else if (timeline.length) {
    // The pre-chapters look — one chapter holding the whole life — now in
    // chronological order like everything else (July 10).
    const ordered = chrono(timeline);
    const perMoment = !!chAssign && ordered.some((m) => m.id && Array.isArray(chAssign[m.id]) && chAssign[m.id].some((x) => byId[x]));
    const groupIds = (chAssign?.["_group"] || []).filter((x) => byId[x]);
    const chPh: (unknown[] | null)[] = perMoment
      ? ordered.map((m) => momentPhoto(m))
      : groupIds.length
        ? groupIds.map((x) => [byId[x].key, byId[x].cap])
        : [];
    ch = [{
      name: `${first}'s life`,
      yrs: "in moments",
      mo: ordered.map((m) => [m.year || "", m.title || m.text || ""]),
      ph: chPh,
      ...(perMoment ? { al: 1 } : {}),
    }];
  }

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
    vi: tier === "plus" && m.video && /^https:\/\//.test(m.video) ? m.video : "",
    ph: m.photos && m.photos[0] && /^https:\/\//.test(m.photos[0]) ? m.photos[0] : "",
    // Every attached photograph a card renders (0029) — up to four, https only.
    phs: (m.photos || []).filter((u) => typeof u === "string" && /^https:\/\//.test(u)).slice(0, 4),
    // The writer's own photo (0030) rides the r3 portrait slot (.mem-pav);
    // absent, the card keeps its soft initial. https only, like every url.
    pp: m.avatarUrl && /^https:\/\//.test(m.avatarUrl) ? m.avatarUrl : "",
    cm: (m.comments || []).map((c) => [c.name || "A friend", c.rel || "", c.text || ""]).filter((c) => c[2]),
  })).filter((m) => m.tx);

  const CAP = 10;
  const mems = tier === "free" ? approved.slice(0, CAP) : approved;
  const seedw = tier === "free"
    ? approved.slice(CAP).map((m) => ({ nm: m.nm, rel: m.rel, tx: m.tx, g: m.g }))
    : [];

  // r3, rewired r5 item 9 · the example wall wears SIX demo pairs (owner-approved
  // placeholder imagery so the scrapbook card layout can be judged), each on
  // EXACTLY ONE card, matched to its person by the writer's first name:
  // Sofia (granddaughter) → sofia · Daniel (her son) → daniel · Tom (son-in-law)
  // → tom · Rebecca (daughter) → rebecca · Marie (neighbour) → ruth · one
  // student card (Miguel, or James if Miguel is absent) → miguel. Every snapshot
  // shows the writer WITH her — no portrait-only leads, zero reuse; every other
  // card is words-only, a state the scrapbook paper finishes. Identity-pass
  // rule unchanged: keyed to the demo slug alone — a real family's page never
  // carries these paths; its cards use their own photoUrls, and the portrait
  // slot falls back to the initial treatment.
  if (slug === "eleanor") {
    const demoPair: Record<string, string> = {
      sofia: "sofia", daniel: "daniel", tom: "tom", rebecca: "rebecca",
      marie: "ruth", miguel: "miguel", james: "miguel",
    };
    const worn = new Set<string>();
    mems.forEach((m: any) => {
      const k = demoPair[String(m.nm || "").trim().split(/\s+/)[0].toLowerCase()];
      if (!k || worn.has(k)) return;
      worn.add(k);
      // r4: a real submission's own avatar (0030) always beats the demo portrait.
      if (!m.pp) m.pp = `/art/mem-demo/${k}-portrait.webp`;
      if (!m.phs.length) m.dp = `/art/mem-demo/${k}-with.webp`;
    });
  }

  const words = (t.lovedThings || []).map((l) => String(l.label || "").toLowerCase()).filter(Boolean).slice(0, 8);

  // The bulletin board (fix 5) is its own place: owner-placed keepsakes first
  // (placements.board, in the family's order), then visitor-left photographs
  // from approved memories. It never mirrors the gallery on its own.
  const ownerBoardIds = pl && Object.prototype.hasOwnProperty.call(pl, "board")
    ? (pl.board || [])
    // No explicit board yet: the gallery graces it by default, but capped the same
    // as a curated board (savePlacements slices at 24) so a large Plus gallery never
    // auto-pins a hundred keepsakes. Free is already ≤12, so this only bounds Plus.
    : photos.map((p) => p.id || "").filter(Boolean).slice(0, 24);
  const ownerPins = ownerBoardIds
    .map((id) => byId[id])
    .filter(Boolean)
    .map((p, i) => ({
      t: "photo", img: p.url, ttl: p.cap || `Photograph ${i + 1}`, who: "Family", rel: "kept in the letter",
      date: "", h: 0, r: (i % 2 ? 3 : -3) + (i % 3), c: [] as unknown[],
    }));
  const visitorPins = (t.memories || [])
    .filter((m) => m.photos && m.photos[0] && /^https:\/\//.test(m.photos[0]))
    .slice(0, 8)
    .map((m, i) => ({
      t: "photo", img: m.photos![0], ttl: (m.text || "").slice(0, 80), who: m.name || "", rel: m.rel || "",
      date: "", h: Math.max(0, m.hearts ?? 0), r: (i % 2 ? -3 : 3) + (i % 3), c: [] as unknown[],
    }));
  const visitorVideos = tier === "plus"
    ? (t.memories || [])
        .filter((m) => m.video && /^https:\/\//.test(m.video))
        .slice(0, 8)
        .map((m, i) => ({
          t: "video", src: m.video, img: (m.photos && m.photos[0]) || cover, dur: "video", ttl: (m.text || "A video memory").slice(0, 80),
          who: m.name || "", rel: m.rel || "", date: "", h: Math.max(0, m.hearts ?? 0), r: (i % 2 ? 2 : -2), plus: true, c: [] as unknown[],
        }))
    : [];
  const boardItems = [...ownerPins, ...visitorPins, ...visitorVideos];
  // The board always keeps a safe shape (July 10): the template's engine calls
  // setB(0) unconditionally and an empty array is truthy, so a bare [] skips
  // the demo fallback and indexes into nothing — one exception there took the
  // whole page's wiring down (ticker, gift sheet, all of it) on every brand-new
  // page. One quiet empty board keeps the engine standing; the board pill
  // rests below when there is nothing pinned yet.
  const boards = [{ key: "photos", label: "Photographs", items: boardItems }];

  const boot = {
    slug, tier,
    gal, imgs, liv, ch, mems, seedw, words, boards,
    phw: tier === "free" ? Math.max(0, allPhotos.length - FREE_PHOTO_CAP) : 0,
    waiting: seedw.length,
    fwt: Math.max(0, t.flowerToday ?? 0),
    // The tape shelf's real tapes (fix 6). Free pages rest their videos — kept,
    // not shown. Only clean https urls ever reach the page.
    vids: tier === "plus"
      ? videos
          // The woven film has its own room under the wreath — the shelf keeps
          // only the family's tapes, so the film never lives in two places.
          .filter((v) => v.kind !== "film" && /^https:\/\/[^"'<>\s]+$/.test(v.url))
          .map((v) => ({ u: v.url, e: embedSrc(v.url), t: v.cap || "" }))
      : [],
  };

  // ── conditional blocks ──
  // m5b (July 29), evolved r3 item 5, moved again r5 item 3 (the owner has
  // seen both placements and chose the top): the service speaks as ONE line —
  // Celebration of Life · the day and time · Share the date — at the TOP of
  // the hero, ABOVE the wreath ({{SERVICE_STRIP}} sits before the wreathbox
  // in the locked template, still INSIDE the hero, never a separate strip
  // above the section; server-rendered in place, no pop-in, no reserved gap,
  // no CLS). It stands on its own paper so it stays legible over every scene
  // (the wr-plate's own gradient and box-shadow treatment). The one-line
  // truncation, the 44px caret, and the full-details overlay are unchanged.
  // r4 item 1.1: the heading ships in ONE voice — the owner chose C (18.5px
  // italic 600 sentence case). The A/B/C switcher pill, the ?heading= query,
  // and the A/B css are retired.
  const svcWhen = [fmtDate(t.service?.date), t.service?.time].filter(Boolean).join(" · ");
  const svcWhere = [t.service?.place, t.service?.address].filter(Boolean).join(", ");
  const svcPn = pronounSet(t.pronouns);
  const svcHasMore = !!(svcWhere || t.service?.charity);
  const serviceStrip = t.service && (t.service.place || t.service.date || t.service.charity)
    ? `<style>
/* r4, reseated r5 item 3 · the bar stands at the hero's TOP, above the wreath —
   the same soft paper plate over the moving scene */
.svcrow{position:relative;z-index:9;background:none;border-bottom:none;display:flex;justify-content:center;width:100%;margin:12px 0 2px;padding:0 4%;cursor:auto}
/* where the bar and the presence pill could meet (narrow screens), the pill
   keeps its watch just below the bar instead of under it */
@media(max-width:700px){.wrhero .presence{top:72px}}
.svcrow .svcrow-in{margin:0;max-width:min(92vw,620px);background:linear-gradient(180deg,#FFFDF6,#FBF4E4);border-radius:6px;box-shadow:0 5px 14px rgba(26,19,13,.3),0 26px 60px -16px rgba(26,19,13,.55);padding:9px 18px;flex-wrap:nowrap;overflow:hidden;gap:10px 16px}
.svcrow .svcrow-in[role="button"]{cursor:pointer}
.svcrow .lab{white-space:nowrap;flex:0 0 auto}
.svcrow .what{font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:1 1 auto}
.svcrow .right{margin-left:auto;display:flex;gap:8px;align-items:center;flex:0 0 auto}
.svcrow .svclink{font-family:'Sometype Mono',monospace;font-size:14px;color:var(--terra);text-decoration:underline;text-underline-offset:3px;cursor:pointer;background:none;border:none;padding:0;white-space:nowrap}
.svc-caret{width:44px;height:44px;margin:-8px -10px -8px -2px;display:inline-flex;align-items:center;justify-content:center;background:none;border:none;color:var(--terra);font-size:14px;cursor:pointer;flex:0 0 auto}
@media(max-width:640px){.svcrow #shareDateBtn{display:none}}
/* r4 item 1.1 · the heading, locked to the owner's C: Besley italic, sentence case */
.svcrow .svcrow-in .lab{font-family:'Besley',serif!important;text-transform:none;font-variant-caps:normal;font-style:italic;font-size:18.5px!important;font-weight:600;letter-spacing:.01em;color:var(--ink)}
/* r3 item 5 · the details overlay */
.svc-ov{position:fixed;inset:0;z-index:4250;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(20,13,8,.82);backdrop-filter:blur(4px)}
.svc-ov[hidden]{display:none}
.svc-ov-card{position:relative;width:100%;max-width:420px;max-height:calc(100dvh - 32px);overflow:auto;background:linear-gradient(180deg,#FFFDF6,#FBF4E4);border:1px solid var(--goldline);border-radius:6px;padding:30px 28px 26px;box-shadow:0 40px 90px -30px #000;text-align:center}
.svc-ov-x{position:absolute;top:6px;right:6px;min-width:44px;min-height:44px;display:inline-flex;align-items:center;justify-content:center;background:rgba(251,246,234,.92);border:1px solid rgba(168,124,95,.3);border-radius:50%;color:#5A4F45;font-size:18px;cursor:pointer;z-index:2}
.svc-ov-kick{font-family:'Besley',serif;font-variant-caps:all-small-caps;letter-spacing:.08em;font-size:17px;font-weight:600;color:#8A5A3C;margin-bottom:10px}
.svc-ov-when{font-family:'Besley',serif;font-weight:700;font-size:20px;line-height:1.3;color:var(--ink)}
.svc-ov-venue{font-family:'Besley',serif;font-size:16.5px;font-weight:600;color:var(--ink);margin-top:12px}
.svc-ov-addr{font-family:'Besley',serif;font-size:14.5px;color:var(--ink-soft);line-height:1.55;margin-top:4px}
.svc-ov-charity{font-family:'Besley',serif;font-size:14px;color:var(--ink-soft);line-height:1.6;margin-top:14px;padding-top:12px;border-top:1px solid var(--goldline)}
.svc-ov-charity a{color:#8A5A3C}
.svc-ov-acts{margin-top:18px}
</style><div class="svcrow">
  <div class="svcrow-in" id="svcBar"${svcHasMore ? ` role="button" tabindex="0" aria-haspopup="dialog" aria-label="Celebration of Life · open the details"` : ""}>
    <span class="lab">Celebration of Life</span>
    <span class="what">${esc(svcWhen || svcWhere)}</span>
    <span class="right">${t.service.date ? `<button class="svclink" id="shareDateBtn" type="button">Share the date</button>` : ""}${svcHasMore ? `<button class="svc-caret" id="svcCaret" type="button" aria-haspopup="dialog" aria-label="Open the service details">▾</button>` : ""}</span>
  </div>
</div>
${svcHasMore ? `<div class="svc-ov" id="svcOv" role="dialog" aria-modal="true" aria-label="Celebration of Life · the details" hidden>
  <div class="svc-ov-card">
    <button class="svc-ov-x" id="svcOvX" type="button" aria-label="Close">✕</button>
    <div class="svc-ov-kick">Celebration of Life</div>
    ${svcWhen ? `<div class="svc-ov-when">${esc(svcWhen)}</div>` : ""}
    ${t.service.place ? `<div class="svc-ov-venue">${esc(t.service.place)}</div>` : ""}
    ${t.service.address ? `<div class="svc-ov-addr">${esc(t.service.address)}</div>` : ""}
    ${t.service.charity ? `<div class="svc-ov-charity">In lieu of flowers, donations in ${esc(svcPn.pos)} name may go to ${t.service.charityUrl ? `<a href="${esc(t.service.charityUrl)}" target="_blank" rel="noopener noreferrer">${esc(t.service.charity)}</a>` : esc(t.service.charity)}.</div>` : ""}
    ${t.service.date ? `<div class="svc-ov-acts"><button class="btn" id="svcOvShare" type="button">Share the date</button></div>` : ""}
  </div>
</div>` : ""}
<script>(function(){
var bar=document.getElementById('svcBar'),ov=document.getElementById('svcOv'),x=document.getElementById('svcOvX'),caret=document.getElementById('svcCaret'),last=null;
function open(){if(!ov)return;last=document.activeElement;ov.hidden=false;document.body.style.overflow='hidden';if(x)x.focus()}
function shut(){if(!ov||ov.hidden)return;ov.hidden=true;document.body.style.overflow='';try{if(last)last.focus()}catch(e){}}
if(caret)caret.addEventListener('click',function(e){e.stopPropagation();open()});
if(bar&&ov){bar.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('#shareDateBtn'))return;open()});
bar.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}})}
if(x)x.addEventListener('click',shut);
if(ov)ov.addEventListener('click',function(e){if(e.target===ov)shut()});
document.addEventListener('keydown',function(e){if(e.key==='Escape')shut()});
var os=document.getElementById('svcOvShare');if(os)os.addEventListener('click',function(){shut();var b=document.getElementById('shareDateBtn');if(b)b.click()});
})();</script>`
    : "";

  const creditBanner = tier === "free"
    ? `<div class="announce">Built with love, by I <em style="color:var(--flame)">Miss</em> You Memorial<span class="mono">free · forever</span></div>`
    : "";

  const sponsorPlaque = tier === "plus" && t.sponsor && (t.sponsor.name || t.sponsor.message)
    ? `<div class="plaque rev" id="plaque">
        ${t.sponsor.photoUrl ? `<img class="pl-photo" id="plPhoto" src="${esc(t.sponsor.photoUrl)}" alt="${esc(t.sponsor.name || "The giver")}"/>` : ""}
        <div><div class="pl-line" id="plLine">${t.sponsor.name
          ? `The full memorial · a gift from ${esc(t.sponsor.name)}, so every memory has a home.`
          : "Someone who loves this family opened the wall for everyone."}</div>
        ${t.sponsor.message ? `<div class="pl-line" style="font-weight:400;font-size:13.5px;margin-top:4px">&ldquo;${esc(t.sponsor.message)}&rdquo;</div>` : ""}
        <div class="pl-date" id="plDate">Given with love</div></div>
      </div>`
    : "";

  // The Stone's living portrait is always a family tape — never the woven film,
  // whose title card would cover the face.
  const archTape = videos.find((v) => v.kind !== "film");
  const archVideo = tier === "plus" && archTape
    ? `<video class="living" src="${esc(archTape.url)}" muted loop playsinline preload="metadata" aria-hidden="true"></video>`
    : "";

  // ── Their film: its own room, first under the wreath (founder decision,
  // July 14 2026). One token in the locked template; every piece of markup
  // lives here, in the page's own design language. Nothing renders when a
  // page has no placed film — no empty rooms. Never autoplays: poster first,
  // press play when you are ready. ──
  const keptFilm = t.film && /^https:\/\/[^"'<>\s]+$/.test(t.film.url) ? t.film : undefined;
  // A refund never deletes the weave. A full paid film rests in the private
  // film room when the page returns to Free; only a true teaser stays public.
  const filmData = keptFilm && (tier === "plus" || keptFilm.variant === "teaser") ? keptFilm : undefined;
  const fpn = pronounSet(t.pronouns);
  const filmDur = filmData?.duration
    ? `${Math.floor(filmData.duration / 60)}:${String(Math.round(filmData.duration % 60)).padStart(2, "0")}`
    : "";
  const filmInvite = filmData && tier === "free"
    ? `<p style="max-width:560px;margin:20px auto 0;text-align:center;font-size:15.5px;line-height:1.65;color:#6E6156">This is a first glimpse. The whole film of ${esc(fpn.pos)} life comes with the full memorial. <a href="/pricing" style="color:#8A5A3C">When you are ready.</a></p>`
    : "";
  const filmSection = filmData
    ? `
    <!-- THE FILM · a life, woven (0021 · the room under the wreath) -->
    <section class="section rev" id="film" aria-label="The film of ${esc(fpn.pos)} life">
      <img class="mg" style="right:-124px;top:12%;width:132px;--mr:-10deg;transform:rotate(-10deg) scaleX(-1)" src="/art/sprig-5ebc72.png" alt=""/>
      <img class="sba" style="top:16px;left:26px;width:86px;opacity:.4;transform:rotate(-8deg)" src="/art/scrapbook/sprig.webp" alt="" aria-hidden="true" loading="lazy"/>
      <div class="kick">The film</div>
      <h2>The film of <em>${esc(fpn.pos)} life</em>.</h2>
      <p class="lede">A short film made from ${esc(fpn.pos)} photographs and memories.</p>
      <img class="mg" style="left:-118px;top:18%;width:126px;--mr:-11deg;transform:rotate(-11deg)" src="/art/rose2-6094a3.png" alt=""/>
      <img class="mg" style="right:-112px;bottom:6%;width:112px;--mr:8deg;transform:rotate(8deg) scaleX(-1)" src="/art/mum2-34d609.png" alt=""/>
      <div style="position:relative;max-width:900px;margin:26px auto 0;border:1.5px solid #A87C5F;border-radius:12px;padding:8px;background:#FFFDF6;box-shadow:0 26px 60px -30px rgba(60,38,10,.35)">
        <span class="tape4" style="top:-10px;left:50%;transform:translateX(-50%) rotate(-2deg)"></span>
        <video controls playsinline preload="metadata"${filmData.poster ? ` poster="${esc(filmData.poster)}"` : ""} src="${esc(filmData.url)}" style="display:block;width:100%;border-radius:8px;background:#0e0905" aria-label="The film of ${esc(first)}&rsquo;s life"></video>
      </div>
      ${filmInvite}
    </section>`
    : "";
  const filmState = t.filmStatus?.status || "";
  const filmStatusSection = !filmData && tier === "plus" && filmState
    ? (() => {
        const waiting = filmState === "waiting_for_photos" || t.filmStatus?.error === "not-enough-photos";
        const failed = filmState === "failed";
        const ready = filmState === "ready";
        const heading = waiting
          ? "A few more photographs will help."
          : failed
            ? "The film needs our care."
            : ready
              ? "The film is nearly home."
              : "The film is being woven.";
        const copy = waiting
          ? `A film needs at least three photographs. Add them in the family study and the weave will begin again.`
          : failed
            ? `The weave did not finish this time. We have been told. Nothing has been lost, and we will tend to it.`
            : ready
              ? `The weave is finished. We are placing it here now.`
              : `${esc(first)}&rsquo;s photographs and your words are becoming a short film. It usually takes less than an hour. We will write when it is here.`;
        const action = waiting
          ? `<a href="/dashboard" class="btn solid" style="display:inline-block;margin-top:18px;text-decoration:none">Add photographs in the family study</a>`
          : failed
            ? `<a href="/dashboard" class="btn" style="display:inline-block;margin-top:18px;text-decoration:none">Open the family study</a>`
            : "";
        return `
    <!-- THEIR FILM · honest progress while the loom works -->
    <section class="section rev" id="film-progress" aria-label="The film is being woven">
      <div style="max-width:720px;margin:0 auto;text-align:center;background:#F3ECDD;border:1px solid #E4D9C4;border-radius:14px;padding:clamp(30px,5vw,54px)">
        <div class="kick">The film</div>
        <h2 style="margin-bottom:12px">${heading}</h2>
        <p class="lede" style="margin-bottom:0">${copy}</p>
        ${action}
      </div>
    </section>`;
      })()
    : "";
  const archLivetag = archVideo ? `<span class="livetag" id="archLiveTag">Living portrait</span>` : "";

  const metaDescription = (t.story || "").replace(/\s+/g, " ").trim().slice(0, 155) ||
    `A place to remember ${t.fullName} · photos, stories, and the voices of everyone who loved ${first}.`;

  const boot_script = `<script>window.__TRIBUTE__=${JSON.stringify(boot).replace(/</g, "\\u003c")};</script>`;

  // ── token pass ──
  let html = template
    .split("{{TRIBUTE_BOOT}}").join(boot_script)
    .split("{{TITLE}}").join(esc((() => {
      // Two people can share a name; a texted link should still know which
      // one it carries (July 12, founder decision). Years and place join the
      // title, so the preview identifies the right person unopened.
      const by = yearOf(t.birth), py = yearOf(t.passing);
      const yearsBit = by && py ? (by === py ? by : `${by} to ${py}`) : (py || by || "");
      const placeBit = String(t.place || "").split(",")[0].trim();
      return [t.fullName, yearsBit, placeBit, "I Miss You Memorial"].filter(Boolean).join(" · ");
    })()))
    .split("{{META_DESCRIPTION}}").join(esc(metaDescription))
    .split("{{COVER_URL}}").join(esc(cover))
    .split("{{NAME_PLAIN}}").join(esc(t.fullName))
    .split("{{NAME_HTML}}").join(nameHtml(t.fullName))
    .split("{{DATES_LINE}}").join(datesLine + donateUnderName)
    // m5d (July 29, owner reversal of item 7): the wreath plate carries no
    // epigraph line — the mid-page quote band keeps their words instead.
    .split("{{FLOWER_COUNT}}").join(String(Math.max(0, t.flowerCount ?? 0)))
    .split("{{THEIR}}").join("their")
    .split("{{TIER}}").join(tier)
    .split("{{SERVICE_STRIP}}").join(serviceStrip)
    .split("{{CREDIT_BANNER}}").join(creditBanner)
    .split("{{SPONSOR_PLAQUE}}").join(sponsorPlaque)
    .split("{{ARCH_VIDEO}}").join(archVideo)
    .split("{{ARCH_LIVETAG}}").join(archLivetag)
    .split("{{FILM_SECTION}}").join(filmSection || filmStatusSection)
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
        // d7 (July 29): the band wears its photograph again — the design's own
        // art ground under the original soft veil, so the quote stays legible.
        // The July 9 rule still holds: never an uploaded photograph here; their
        // pictures live in the gallery, the chapters, and the board.
        const band = t.quote
          ? `<section class="band rev" id="quoteband">` +
            `<div class="bgi"><img src="/art/7bb79736-30a5-4159-97b8-6b753830eae6-8b9c29.png" alt=""></div>` +
            `<div class="v"></div>` +
            `<div class="inb"><div class="q">“${esc(t.quote)}”</div><div class="s">the thing ${pn.sub} always said</div></div></section>`
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
    // The handline is gone (m8, July 29); the truths block ends at its marker.
    const mIdx = tIdx > -1 ? html.indexOf("<!-- truths end -->", tIdx) : -1;
    if (tIdx > -1 && mIdx > -1) {
      const cards = detailCards
        .map((d) => `<div class="truth"><div class="tl2">${esc(d.k)}</div><div class="tv">${esc(d.v)}</div></div>`)
        .join("\n          ");
      html = html.slice(0, tIdx) + `<div class="truths">\n          ${cards}\n        </div>\n        ` + html.slice(mIdx);
    }
    if (!detailCards.length) {
      html = html.split('<a href="#really">Who she was</a>').join("");
    }
  }

  // 2b) The snapshot above "Who they really were" (d5, July 29): a casual taped
  // print from THIS page's own gallery — a captioned photograph reads as chosen,
  // so one of those leads; otherwise the last photograph. No photographs, no
  // frame — and the demo's print never reaches a real page, even from source.
  {
    const snapStart = html.indexOf('<figure class="really-snap"');
    if (snapStart > -1) {
      const snapEnd = html.indexOf("</figure>", snapStart);
      if (snapEnd > -1) {
        const pick = photos.find((p) => p.cap) || photos[photos.length - 1];
        const snap = pick && pick.url
          // r5 item 8: the caption wears hand3 (Caveat), never .hand — the global
          // handwriting-retire rule maps .hand to Besley italic with !important,
          // which is how the caption went gray; the chin's own CSS clamps it to
          // one centered ellipsis line inside the polaroid's white chin.
          ? `<figure class="really-snap"><span class="tape4" style="top:-9px;left:18%;transform:rotate(-6deg)"></span><img src="${esc(pick.url)}" alt=""/>${pick.cap ? `<figcaption class="hand3">${esc(pick.cap)}</figcaption>` : ""}</figure>`
          : "";
        html = html.slice(0, snapStart) + snap + html.slice(snapEnd + "</figure>".length);
      }
    }
  }

  // 3) The editor affordance visitors can't use.
  html = html.split('<div class="under" style="margin-top:20px"><button class="ghostadd">＋ Add a key moment · a year, a line, a photograph</button></div>').join("");

  // 4) Wall groups from the people who actually wrote, never Eleanor's.
  {
    const present = new Set([...mems, ...seedw].map((m: any) => m.g));
    const groups: Array<[string, string]> = [["all", "Everyone"], ["family", "Family"], ["friends", "Friends"]];
    if (present.has("neighbours")) groups.push(["neighbours", "Neighbors"]);
    if (present.has("students")) groups.push(["students", `${pn.Pos} students`]);
    html = html.split(
      "var GROUPS=[['all','Everyone'],['family','Family'],['friends','Friends'],['neighbours','Neighbors'],['students','Her students']];"
    ).join(`var GROUPS=${JSON.stringify(groups)};`);
  }

  // 4b) The demo wall's example imagery (r3): the inline fallback's photo pairs
  // leave a real page entirely, even from source — the same strictness the tape
  // shelf keeps. The fallback array itself stays (the engine needs its shape);
  // only the demo-pair paths are stripped. The example page keeps them.
  if (slug !== "eleanor") {
    html = html.replace(/dp:'\/art\/mem-demo\/[a-z-]+-with\.webp',pp:'\/art\/mem-demo\/[a-z-]+-portrait\.webp',/g, "");
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
    ["Share her page", `Share ${pn.pos} page`],
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
        checkoutForm("plus_once", "btn solid", "Keep everything · $197 once") +
        checkoutForm("plus_monthly", "btn", "$29 a month · 3 days free") +
        `</div>` +
        `<div class="mono" style="font-size:11px;letter-spacing:.14em;color:#8A7C6D;margin-top:18px">the pledge holds · if plus ever rests, the page stays · nothing is ever taken down</div>` +
        `</div></section>`;
      html = html.slice(0, bandIdx) + band + html.slice(bandIdx);
    }
  }

  // 6c) The tape shelf holds THIS family's tapes (fix 6) — same wood, same
  // handwritten labels; the demo's furniture never reaches a real page, even
  // from source. The concierge "add a tape" card stays: digitizing is real help.
  {
    const svIdx = html.indexOf('<div class="shelfview">');
    const capIdx = svIdx > -1 ? html.indexOf('<div class="shelfcap">', svIdx) : -1;
    if (svIdx > -1 && capIdx > -1) {
      const pairImgByVid: Record<string, string> = {};
      if (pl?.living) {
        for (const [phId, vId] of Object.entries(pl.living)) {
          if (byId[phId] && vId) pairImgByVid[vId] = byId[phId].url;
        }
      }
      const addTape = `<div class="tapeobj addtape" role="button" tabindex="0"><div class="hand">＋ Add a tape</div><div class="m2">wedding film · old 8mm · a phone video<br>we help you digitize anything</div></div>`;
      const tape = (v: { id?: string; url: string; cap?: string }, i: number) => {
        const kind = embedSrc(v.url) ? (/vimeo/.test(v.url) ? "vimeo · kept" : "youtube · kept") : "home video · kept";
        const win = v.id && pairImgByVid[v.id] ? `<img src="${esc(pairImgByVid[v.id])}" alt="">` : "";
        return `<div class="tapeobj" data-v="${i}"><div class="win">${win}</div><div class="lbl"><div class="t">${esc(v.cap || "A video")}</div><div class="m">${kind}</div></div></div>`;
      };
      const cells = videos.map((v, i) => tape(v, i)).concat([addTape]);
      const rows: string[] = [];
      for (let i = 0; i < cells.length; i += 3) {
        const last = i + 3 >= cells.length;
        rows.push(`<div class="shelfrow"${last ? ' style="border-bottom:none;margin-bottom:10px"' : ""}>${cells.slice(i, i + 3).join("")}</div>`);
      }
      html = html.slice(0, svIdx) + `<div class="shelfview">` + rows.join("") + html.slice(capIdx);
    }
  }

  // ═══ the obituary and the kept voice (July 9) ═══════════════════════════════
  // The obituary sits directly below the wreath and its flowers (its own quiet
  // sheet, long words wrapped, never off the card). Their voice stands just
  // before the memories wall.
  {
    if (t.obituary && t.obituary.trim()) {
      const rawObituary = t.obituary.trim();
      const sentences = rawObituary.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [rawObituary];
      let obituaryLead = rawObituary;
      let obituaryRest = "";
      if (sentences.length > 3) {
        // Collapse only runs of spaces/tabs, never newlines — a long obituary's
        // paragraph breaks are kept (white-space:pre-line renders them), the same
        // pledge a short obituary already gets.
        obituaryLead = sentences.slice(0, 3).join(" ").replace(/[^\S\n]+/g, " ").trim();
        obituaryRest = sentences.slice(3).join(" ").replace(/[^\S\n]+/g, " ").trim();
      } else if (rawObituary.length > 620) {
        const cut = rawObituary.lastIndexOf(" ", 620);
        obituaryLead = rawObituary.slice(0, cut > 380 ? cut : 620).trim();
        obituaryRest = rawObituary.slice(obituaryLead.length).trim();
      }
      const obituaryMore = obituaryRest
        ? `<details style="margin-top:16px"><summary style="cursor:pointer;color:#A87C5F;font-weight:700;list-style-position:inside">Read the full obituary</summary><div style="margin-top:14px;white-space:pre-line">${esc(obituaryRest)}</div></details>`
        : "";
      const ob =
        // r3 margins audit: this section lives inside .wrap, which already pads
        // 5% each side — its own 5% doubled the gutter. Vertical padding only.
        `<section class="section rev" id="obituary" style="padding:56px 0 26px">` +
        `<div style="max-width:720px;margin:0 auto;background:#FDFAF3;border:1px solid #E9DFC9;border-radius:14px;box-shadow:0 30px 70px -44px rgba(60,40,15,.3);padding:clamp(28px,5vw,54px)">` +
        `<div style="font-family:'Sometype Mono',monospace;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:#A87C5F;margin-bottom:16px">The obituary</div>` +
        `<div style="font-family:'Besley',serif;font-size:16.5px;line-height:1.85;color:#2C2520;white-space:pre-line;overflow-wrap:anywhere;word-break:break-word">${esc(obituaryLead)}${obituaryMore}</div>` +
        `</div></section>`;
      const storyIdx = html.indexOf('<section class="section rev" id="story"');
      const fallbackIdx = html.indexOf('<section class="section rev sheetdeep" id="memories"');
      const at = storyIdx > -1 ? storyIdx : fallbackIdx;
      if (at > -1) html = html.slice(0, at) + ob + html.slice(at);
    }
    if (tier === "plus" && t.voiceUrl && /^https:\/\//.test(t.voiceUrl)) {
      // r3 item 2, moved down one slot r5 item 10: "In her own voice" sits
      // DIRECTLY beneath "Who she really was" — inserted after the really
      // section's close (falling back to its old pre-memories spot only if
      // that marker ever leaves the template). Final order: film → obituary →
      // chapters → quote band → pictures → who she really was → in her own
      // voice → memories → the memory board.
      const gIdx = html.indexOf('<section class="section rev" id="really"');
      const gEnd = gIdx > -1 ? html.indexOf("</section>", gIdx) : -1;
      const mIdx = gEnd > -1 ? gEnd + "</section>".length : html.indexOf('<section class="section rev sheetdeep" id="memories"');
      if (mIdx > -1) {
        // Their voice wears the same cassette the memory cards keep (the template's
        // delegated .vk wiring plays any cassette on the page — one object language).
        // r3 margins audit: vertical padding only — the surrounding .wrap already
        // holds the 5% gutter.
        const voice =
          `<section class="section rev" id="theirvoice" style="padding:44px 0 30px;text-align:center">` +
          `<div style="max-width:560px;margin:0 auto">` +
          `<div style="font-family:'Sometype Mono',monospace;font-size:14px;letter-spacing:.2em;text-transform:uppercase;color:#8A5A3C;margin-bottom:14px">In ${pn.pos} own voice</div>` +
          `<div class="vk" role="group" style="text-align:left"><audio preload="none" src="${esc(t.voiceUrl)}" aria-label="In ${pn.pos} own voice"></audio>` +
          `<button type="button" class="vk-play" aria-label="Play ${pn.pos} voice">▶</button>` +
          `<div class="vk-body"><div class="vk-track" role="slider" aria-label="Seek"><div class="vk-fill"></div></div>` +
          `<div class="vk-meta"><span class="vk-time">0:00</span><span class="vk-cap">in ${pn.pos} own voice</span></div></div></div>` +
          `</div></section>`;
        html = html.slice(0, mIdx) + voice + html.slice(mIdx);
      }
    }
  }

  // ═══ the arranger (fix 7) ══════════════════════════════════════════════════
  // The page's rooms in the family's order. Absent = the design's narrative
  // arc, byte for byte. Hidden rooms rest by CSS so every script keeps its
  // bearings; nothing is removed, nothing is lost.
  {
    const KNOWN = ["story", "quote", "gallery", "really", "memories", "keep"];
    const MARK: Record<string, string> = {
      story: 'id="story"', quote: 'id="quoteband"', gallery: 'id="gallery"',
      really: 'id="really"', memories: 'id="memories"', keep: 'id="keep"',
    };
    const plan = t.sections;
    const wantOrder = (Array.isArray(plan?.order) ? plan!.order! : [])
      .filter((k, i, a) => KNOWN.includes(k) && a.indexOf(k) === i);
    if (wantOrder.length) {
      type Blk = { key: string; start: number; end: number };
      const blocks: Blk[] = [];
      for (const key of KNOWN) {
        const mIdx = html.indexOf(MARK[key]);
        if (mIdx < 0) continue; // e.g. no quote → no band on this page
        const start = html.lastIndexOf("<section", mIdx);
        const end = html.indexOf("</section>", mIdx);
        if (start < 0 || end < 0) continue;
        blocks.push({ key, start, end: end + "</section>".length });
      }
      blocks.sort((a, b) => a.start - b.start);
      if (blocks.length > 1) {
        const present = blocks.map((b) => b.key);
        const finalOrder = [
          ...wantOrder.filter((k) => present.includes(k)),
          ...present.filter((k) => !wantOrder.includes(k)),
        ];
        if (finalOrder.join() !== present.join()) {
          const byKey: Record<string, string> = {};
          blocks.forEach((b) => { byKey[b.key] = html.slice(b.start, b.end); });
          const gaps: string[] = [];
          for (let i = 0; i < blocks.length - 1; i++) gaps.push(html.slice(blocks[i].end, blocks[i + 1].start));
          const head = html.slice(0, blocks[0].start);
          const tail = html.slice(blocks[blocks.length - 1].end);
          let mid = "";
          finalOrder.forEach((k, i) => { mid += byKey[k]; if (i < gaps.length) mid += gaps[i]; });
          html = head + mid + tail;
        }
      }
    }
    const hiddenKeys = (Array.isArray(plan?.hidden) ? plan!.hidden! : []).filter((k) => KNOWN.includes(k));
    if (hiddenKeys.length) {
      const sel: Record<string, string> = {
        story: "#story", quote: "#quoteband", gallery: "#gallery",
        really: "#really", memories: "#memories", keep: "#keep",
      };
      const css = hiddenKeys.map((k) => `${sel[k]}{display:none!important}`).join("")
        + (hiddenKeys.includes("keep") ? ".bbfab{display:none!important}" : "");
      const hi = html.lastIndexOf("</head>");
      if (hi > -1) html = html.slice(0, hi) + `<style>${css}</style>` + html.slice(hi);
    }
  }

  // 7) Sections with nothing real to show, rest quietly.
  {
    const hides: string[] = [];
    // One number is enough (July 9): the big all-time count and the Lay a
    // flower button carry the ritual; the today line was saying it twice.
    hides.push(".wr-count{display:none!important}");
    if (!videos.length || tier !== "plus") hides.push("#keep .shelfview{display:none!important}");
    if (!words.length) hides.push(".cyc{display:none!important}", ".tick9{display:none!important}");
    if (!boardItems.length) hides.push(".bbfab{display:none!important}");
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
      const presenceModule = `<style>/* presence, noticed (July 9) · a quiet live-chip; real company is worth seeing */
.presence{font-size:13px;letter-spacing:.14em;color:#4A4038;background:rgba(243,236,221,.88);border:1px solid #E4D9C4;border-radius:100px;padding:8px 16px;margin-top:14px;gap:10px}
.presence i{width:11px;height:11px}
@media(min-width:880px){.presence{font-size:14.5px;padding:9px 19px;margin-top:16px}.presence i{width:12px;height:12px}}
</style><script type="module">/* presence · real people, truthfully counted */
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

  // A quiet way home (July 10, founder ask): the door into the study is a real
  // log-in pill now, living in the sticky bar beside the memorial book on every
  // tribute page — demo included — and the memory door steps back a size so the
  // bar breathes. One door, always visible, through /signin. The old floating
  // "tend this page" whisper retires; two doors in one corner was noise.
  if (t.slug) {
    // Item 3 gave the log-in door a home beside the logo. m5a (July 29): its
    // label wears Besley now, per brand — the techie mono caps retire. d9
    // (July 29): on desktop the door stands at the header's top right again
    // (CSS order only; phones keep their grid, where it already sits top right).
    const loginBtn = `<a id="loginTop" href="/signin" style="display:inline-flex;align-items:center;font-family:'Besley',serif;font-size:13.5px;font-weight:600;letter-spacing:.01em;color:#5A4F45;border:1px solid #E4D9C4;border-radius:20px;padding:7px 15px;margin-left:10px;text-decoration:none;background:transparent;white-space:nowrap">Log in</a>`;
    html = html.replace("I <em>Miss</em> You Memorial</a>", "I <em>Miss</em> You Memorial</a>" + loginBtn);
    {
      const loginCss = `<style>/* d9 (July 29) · desktop: the log-in door returns to the header's top right */
@media(min-width:821px){#loginTop{order:99;margin-left:12px}}
</style>`;
      const lIdx = html.lastIndexOf("</head>");
      if (lIdx > -1) html = html.slice(0, lIdx) + loginCss + html.slice(lIdx);
    }
    html = html.replace(
      '<button class="btn" id="addMemTop" style="font-size:12.5px;padding:9px 16px">',
      '<button class="btn" id="addMemTop" style="font-size:11.5px;padding:7px 13px">'
    );
    // The chapters' demo "add a key moment" button is study work, not page work.
    html = html.split('<div class="under" style="margin-top:20px"><button class="ghostadd">＋ Add a key moment · a year, a line, a photograph</button></div>').join("");

    // The top fold arrives together (July 10): the wreath art and the portrait
    // are asked for first, so a slow connection never shows a bare arch.
    {
      const cover = (t.photos || []).map((p) => p.url).find(Boolean) || "";
      const preload = `<link rel="preload" as="image" href="/art/wreath2-64e82a.png"/>` +
        (cover ? `<link rel="preload" as="image" href="${esc(cover)}"/>` : "");
      const hi = html.indexOf("</head>");
      if (hi > -1) html = html.slice(0, hi) + preload + html.slice(hi);
    }

    // A missing wall element must never take the page's wiring down with it.
    // The plaque only exists when a sponsor does; the waiting line only when
    // words wait. renderWall touches both — each touch minds the absence.
    html = html.replace(
      "function renderWall(){\n  var gate=wallGateActive(),unlocked=wallState==='unlocked';",
      "function renderWall(){\n  if(!wallCt||!wchips||!inviteCard)return;\n  var gate=wallGateActive(),unlocked=wallState==='unlocked';"
    );
    html = html.replace("  plaqueEl.hidden=!unlocked;", "  if(plaqueEl)plaqueEl.hidden=!unlocked;");
    html = html.replace(
      "  gsWaitLine.textContent=wcap(wnum(WAITING.length))+' waiting '+(WAITING.length===1?'memory comes':'memories come')+' home';",
      "  if(gsWaitLine)gsWaitLine.textContent=wcap(wnum(WAITING.length))+' waiting '+(WAITING.length===1?'memory comes':'memories come')+' home';"
    );
    html = html.replace(
      "  gsWaitLine.style.display=WAITING.length?'flex':'none';",
      "  if(gsWaitLine)gsWaitLine.style.display=WAITING.length?'flex':'none';"
    );

    // ═══ the gift sheet speaks of them (July 10, founder ask) ════════════════
    // Their face at the top, their name in the headline, and only the truth in
    // the waiting line. The named option promises the giver's own name — never
    // the demo's.
    {
      const gsWait = seedw.length;
      const gsFace = (t.photos || []).map((p) => p.url).find(Boolean) || "";
      if (gsFace) {
        html = html.replace(
          '<div class="gs-kick">A gift to the whole family</div>',
          `<img class="gs-face" src="${esc(gsFace)}" alt=""/><div class="gs-kick">A gift to the whole family</div>`
        );
        const gsCss = `<style>.gs-face{display:block;width:64px;height:64px;border-radius:50%;object-fit:cover;margin:0 auto 12px;border:3px solid #FFFDF6;box-shadow:0 10px 24px -10px rgba(26,19,13,.55),0 0 0 1px rgba(201,165,114,.45)}</style>`;
        const hi2 = html.lastIndexOf("</head>");
        if (hi2 > -1) html = html.slice(0, hi2) + gsCss + html.slice(hi2);
      }
      html = html.replace(/(<h3 class="gs-head">)[^<]*(<\/h3>)/,
        (_m, a, b) => `${a}Help keep ${esc(first)}&#39;s memory alive${b}`);
      html = html.split("Dave Alvarez · shown on the wall").join("Your name · shown on the wall");
      const wWord = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"][gsWait] || String(gsWait);
      html = html.replace(/<li id="gsWaitLine">[^<]*<\/li>/,
        () => (gsWait > 0
          ? `<li id="gsWaitLine">${wWord} waiting ${gsWait === 1 ? "memory comes" : "memories come"} home</li>`
          : `<li id="gsWaitLine" style="display:none"></li>`));
    }

    // ═══ share the date (July 10, founder ask) ═══════════════════════════════
    // The service strip carries a quiet "Share the date" door. It opens a paper
    // frame holding a keepsake flyer drawn on the spot: their photograph in the
    // arch, their name, the service line, and a code that opens this page.
    // Send by text (the flyer itself where the phone allows, the link where it
    // does not), download it, or copy the address. Everything is drawn in the
    // browser; nothing is uploaded anywhere.
    if (t.service?.date) {
      const flyerData = {
        name: t.fullName,
        years: [yearOf(t.birth), yearOf(t.passing)].filter(Boolean).join(" · "),
        dateLine: [fmtDate(t.service.date), t.service.time].filter(Boolean).join(" · "),
        venue: t.service.place || "",
        address: t.service.address || "",
        photo: (t.photos || []).map((p) => p.url).find(Boolean) || "",
        url: `https://${slug}.imissyoumemorial.com`,
      };
      const sdOverlay = `<div id="sharedate" style="position:fixed;inset:0;z-index:130;display:none;align-items:center;justify-content:center;background:rgba(26,19,13,.93);padding:4vw" role="dialog" aria-modal="true" aria-label="Share the date">
<div style="background:#FAF5EC;border:1px solid rgba(201,165,114,.4);border-radius:14px;max-width:460px;width:100%;max-height:92vh;overflow:auto;padding:20px 20px 16px;box-shadow:0 40px 90px -30px rgba(0,0,0,.8)">
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
<span style="font-family:'Sometype Mono',monospace;font-size:10.5px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#A87C5F">Share the date</span>
<button id="sdClose" aria-label="Close" style="background:none;border:1px solid #E4D9C4;border-radius:16px;padding:4px 10px;cursor:pointer;color:#5A4F45;font-size:13px">✕</button></div>
<img id="sdPreview" alt="The flyer · ${esc(t.fullName)}" style="display:none;width:100%;border-radius:8px;border:1px solid #E4D9C4;box-shadow:0 14px 34px -18px rgba(26,19,13,.5)"/>
<div id="sdStatus" style="font-family:'Sometype Mono',monospace;font-size:11px;color:#7A6A58;padding:34px 0;text-align:center">Making the flyer…</div>
<div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:14px">
<button id="sdText" class="btn solid" style="font-size:13px;padding:9px 16px">Send by text</button>
<a id="sdDown" class="btn" download="share-the-date.png" style="font-size:13px;padding:9px 16px">Download</a>
<button id="sdCopy" class="btn" style="font-size:13px;padding:9px 16px">Copy the link</button></div>
<div style="font-family:'Sometype Mono',monospace;font-size:10px;color:#7A6A58;margin-top:12px">the code on the flyer opens ${esc(slug)}.imissyoumemorial.com</div>
</div></div>`;
      const sdModule = `<script>
(function(){
var D=${JSON.stringify(flyerData).replace(/</g, "\\u003c")};
var ov=document.getElementById('sharedate'),btn=document.getElementById('shareDateBtn');
if(!ov||!btn)return;
var built=false,flyerBlob=null,lastFocus=null;
function open(){lastFocus=document.activeElement;ov.style.display='flex';document.getElementById('sdClose').focus();if(!built)build()}
function close(){ov.style.display='none';try{if(lastFocus)lastFocus.focus()}catch(e){}}
btn.addEventListener('click',open);
document.getElementById('sdClose').addEventListener('click',close);
ov.addEventListener('click',function(e){if(e.target===ov)close()});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&ov.style.display!=='none')close()});
function withQR(cb){if(window.QrCreator)return cb(true);var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/qr-creator@1.0.0/dist/qr-creator.min.js';s.onload=function(){cb(true)};s.onerror=function(){cb(false)};document.head.appendChild(s)}
function loadImg(src){return new Promise(function(res){if(!src)return res(null);var im=new Image();if(/^https?:/.test(src))im.crossOrigin='anonymous';im.onload=function(){res(im)};im.onerror=function(){res(null)};im.src=src})}
function arch(ctx,x,y,w,h){var r=w/2;ctx.beginPath();ctx.moveTo(x-r,y+h);ctx.lineTo(x-r,y+r);ctx.arc(x,y+r,r,Math.PI,0);ctx.lineTo(x+r,y+h);ctx.closePath()}
function build(){
document.fonts.ready.then(function(){return Promise.all([document.fonts.load('600 68px Besley'),document.fonts.load("italic 500 32px Besley"),document.fonts.load("700 26px 'Sometype Mono'"),document.fonts.load("500 22px 'Sometype Mono'")]).catch(function(){})}).then(function(){
withQR(function(hasQR){loadImg(D.photo).then(function(photo){
var W=1080,H=1440,c=document.createElement('canvas');c.width=W;c.height=H;var x=c.getContext('2d');
x.fillStyle='#FAF5EC';x.fillRect(0,0,W,H);
x.strokeStyle='rgba(201,165,114,.55)';x.lineWidth=2;x.strokeRect(36,36,W-72,H-72);
try{x.letterSpacing='6px'}catch(e){}
x.fillStyle='#A87C5F';x.font="700 26px 'Sometype Mono'";x.textAlign='center';x.fillText('IN LOVING MEMORY',W/2,118);
try{x.letterSpacing='0px'}catch(e){}
var px=W/2,py=170,pw=520,ph=620;
x.save();x.shadowColor='rgba(26,19,13,.28)';x.shadowBlur=34;x.shadowOffsetY=14;x.fillStyle='#fff';arch(x,px,py-8,pw+16,ph+16);x.fill();x.restore();
if(photo){x.save();arch(x,px,py,pw,ph);x.clip();var s=Math.max(pw/photo.width,ph/photo.height),dw=photo.width*s,dh=photo.height*s;x.drawImage(photo,px-dw/2,py+(ph-dh)/2,dw,dh);x.restore()}
else{x.save();arch(x,px,py,pw,ph);x.clip();x.fillStyle='#F3ECDD';x.fillRect(px-pw/2,py,pw,ph);x.restore()}
x.fillStyle='#2C2520';x.textAlign='center';var fs=64,name=D.name;x.font='600 '+fs+'px Besley';
while(x.measureText(name).width>900&&fs>40){fs-=4;x.font='600 '+fs+'px Besley'}
x.fillText(name,W/2,895);
if(D.years){x.fillStyle='#7A6A58';x.font="500 24px 'Sometype Mono'";x.fillText(D.years,W/2,938)}
x.strokeStyle='rgba(201,165,114,.7)';x.lineWidth=1.5;x.beginPath();x.moveTo(W/2-130,972);x.lineTo(W/2-14,972);x.moveTo(W/2+14,972);x.lineTo(W/2+130,972);x.stroke();
x.fillStyle='#C9A572';x.beginPath();x.arc(W/2,972,4,0,7);x.fill();
x.fillStyle='#A87C5F';x.font='italic 500 32px Besley';x.fillText('Join us to remember',W/2,1030);
x.fillStyle='#2C2520';x.font='600 42px Besley';x.fillText(D.dateLine,W/2,1086);
if(D.venue){x.fillStyle='#5A4F45';x.font='500 30px Besley';x.fillText(D.venue,W/2,1132)}
if(D.address){x.fillStyle='#7A6A58';x.font="500 22px 'Sometype Mono'";x.fillText(D.address,W/2,1168)}
if(hasQR&&window.QrCreator){try{var q=document.createElement('canvas');window.QrCreator.render({text:D.url,radius:0,ecLevel:'M',fill:'#2C2520',background:'#FAF5EC',size:336},q);x.drawImage(q,72,H-244,164,164);x.textAlign='left';x.fillStyle='#7A6A58';x.font="500 22px 'Sometype Mono'";x.fillText('scan to visit · leave a memory,',260,H-176);x.fillText('light a candle, lay a flower',260,H-144)}catch(e){}}
x.textAlign='center';x.fillStyle='#2C2520';x.font='600 26px Besley';
var w1=x.measureText('I ').width,w2=x.measureText('Miss').width,w3=x.measureText(' You Memorial').width,bx=W/2-(w1+w2+w3)/2;
x.textAlign='left';x.fillText('I ',bx,H-64);x.fillStyle='#A87C5F';x.font='italic 600 26px Besley';x.fillText('Miss',bx+w1,H-64);x.fillStyle='#2C2520';x.font='600 26px Besley';x.fillText(' You Memorial',bx+w1+w2,H-64);
try{c.toBlob(function(b){if(b){flyerBlob=b;var u=URL.createObjectURL(b);var pv=document.getElementById('sdPreview');pv.src=u;pv.style.display='block';document.getElementById('sdDown').href=u;document.getElementById('sdStatus').style.display='none';built=true}else{fail()}},'image/png')}catch(e){fail()}
})})})}
function fail(){var st=document.getElementById('sdStatus');st.textContent='The flyer could not be drawn here · the link below still carries everything.';built=true}
function smsBody(){return 'Join us to remember '+D.name+'. '+D.dateLine+(D.venue?', '+D.venue:'')+'. The memorial page: '+D.url}
document.getElementById('sdText').addEventListener('click',function(){
if(flyerBlob&&navigator.canShare){try{var f=new File([flyerBlob],'share-the-date.png',{type:'image/png'});if(navigator.canShare({files:[f]})){navigator.share({files:[f],text:smsBody()}).catch(function(){});return}}catch(e){}}
location.href='sms:?&body='+encodeURIComponent(smsBody())});
document.getElementById('sdCopy').addEventListener('click',function(){var b=this;
try{navigator.clipboard.writeText(D.url).then(function(){b.textContent='Copied · ready to paste';setTimeout(function(){b.textContent='Copy the link'},2200)})}catch(e){window.prompt('The page address',D.url)}});
})();
</script>`;
      html = html.replace("</body>", sdOverlay + "\n" + sdModule + "\n</body>");
    }

    // ═══ if you knew them (July 10, founder ask) ═════════════════════════════
    // On a free page, a visitor who has read the wall may want to help. One
    // quiet note, once per browser, after they have actually spent time with
    // the memories — never on arrival. Its door opens the existing gift sheet:
    // the same $197 family unlock, guest checkout, the same sponsor badge.
    if (tier === "free" && slug !== "eleanor") {
      const nWord = (n: number) => ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"][n] || String(n);
      const waiting = seedw.length;
      const noteBody = waiting > 0
        ? `${nWord(waiting)} more ${waiting === 1 ? "memory is" : "memories are"} waiting to join the wall. One gift opens the full memorial for the whole family: every memory, every photograph, ${pn.pos} voice.`
        : `The first ten memories live here free, forever. One gift opens the full memorial for the whole family, so every memory to come has a home.`;
      const keepnote = `<div id="keepnote" hidden style="position:fixed;right:16px;bottom:74px;z-index:96;max-width:min(340px,calc(100vw - 32px));background:#FAF5EC;border:1px solid #E4D9C4;border-radius:14px;box-shadow:0 26px 60px -20px rgba(26,19,13,.5);padding:16px 16px 13px" role="dialog" aria-label="Help keep every memory">
<button id="knClose" aria-label="Not now" style="position:absolute;top:10px;right:10px;background:none;border:none;color:#B7A48B;font-size:14px;cursor:pointer;padding:2px 6px">✕</button>
<div style="font-family:'Sometype Mono',monospace;font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#A87C5F;margin-bottom:6px">If you knew ${esc(first)}</div>
<div style="font-family:'Besley',serif;font-weight:600;font-size:16.5px;color:#2C2520;line-height:1.35;margin-bottom:6px">You can help keep every memory.</div>
<div style="font-family:'Besley',serif;font-size:13.5px;color:#5A4F45;line-height:1.55;margin-bottom:12px">${noteBody}</div>
<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
<button id="knGive" class="btn solid" style="font-size:12.5px;padding:8px 14px">Give the full memorial · $197, once</button>
<button id="knLater" class="mini" style="text-decoration:underline">Not now</button></div>
<div style="font-family:'Sometype Mono',monospace;font-size:9.5px;color:#7A6A58;margin-top:10px">No subscription · nothing is ever taken down</div>
</div>
<script>
(function(){
var el=document.getElementById('keepnote');if(!el)return;
var K='imy-note-'+${JSON.stringify(slug)};
try{if(localStorage.getItem(K)||sessionStorage.getItem(K))return}catch(e){}
var t0=Date.now(),shown=false,seen=false;
function mark(){try{localStorage.setItem(K,'1')}catch(e){}}
function rest(){try{sessionStorage.setItem(K,'1')}catch(e){}}
function show(){if(shown)return;shown=true;el.hidden=false}
function hide(){el.hidden=true}
function maybe(){if(seen&&Date.now()-t0>=20000)show()}
try{var mem=document.getElementById('memories');
if(mem&&'IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){seen=true;maybe()}})},{threshold:0});io.observe(mem);setTimeout(maybe,21000);setInterval(maybe,5000)}
}catch(e){}
setTimeout(show,45000);
document.getElementById('knClose').addEventListener('click',function(){rest();hide()});
document.getElementById('knLater').addEventListener('click',function(){rest();hide()});
document.getElementById('knGive').addEventListener('click',function(){mark();hide();
var gs=document.getElementById('giftSheet');
if(gs){gs.classList.add('open');var g=document.getElementById('gsGive');if(g)g.focus();return}
var inv=document.getElementById('invCta');if(inv){inv.scrollIntoView({behavior:'smooth'});return}
var m=document.getElementById('memories');if(m)m.scrollIntoView({behavior:'smooth'})});
})();
</script>`;
      html = html.replace("</body>", keepnote + "\n</body>");
    }
  }

  // The counter caption ("The full memorial · every memory open · held in
  // full", the .plusheld line) is retired entirely — r5 item 1, owner order.
  // A Plus page's visible whisper is the gold ring on the Stone (CSS) alone.

  // ═══ the example sells the beginning (July 9) ═══════════════════════════════
  // Only the demo carries an ask. A family's memorial never asks a visitor for
  // money on someone else's grief — but the showroom may point at the door,
  // after everything has been seen, in the house voice.
  if (slug === "eleanor") {
    const demoBand =
      `<section id="begin-band" aria-label="Begin a page" style="background:linear-gradient(180deg,#2a1c11,#241711);padding:76px 5% 66px;text-align:center">` +
      `<div style="max-width:660px;margin:0 auto">` +
      `<div style="font-family:'Sometype Mono',monospace;font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;color:#C9A572;margin-bottom:18px">This page is the example</div>` +
      `<h2 style="font-family:'Besley',serif;font-weight:600;font-size:clamp(26px,4vw,38px);line-height:1.2;color:#FAF5EC;margin:0 0 14px">Make one for someone <em style="color:#C9A572">you</em> miss.</h2>` +
      `<p style="font-family:'Besley',serif;font-size:16.5px;line-height:1.65;color:rgba(250,245,236,.82);margin:0 0 30px">Begin free · their page is online in about ten minutes, and it stays forever. Everything you just saw here, the Living pictures, her voice, every photograph in motion: that is Plus.</p>` +
      `<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">` +
      `<a href="/onboarding?plan=plus" style="font-family:'Besley',serif;font-weight:600;font-size:15.5px;background:#A87C5F;color:#FBF6ED;border-radius:100px;padding:14px 26px;text-decoration:none">Begin with Plus · $197 once</a>` +
      `<a href="/onboarding" style="font-family:'Besley',serif;font-weight:600;font-size:15.5px;border:1.5px solid rgba(201,165,114,.65);color:#F4E9D4;border-radius:100px;padding:14px 26px;text-decoration:none">Begin free · $0</a>` +
      `</div>` +
      `</div></section>`;
    const gw = html.indexOf('<div class="gw-band">');
    if (gw > -1) html = html.slice(0, gw) + demoBand + html.slice(gw);
    const beginPill =
      `<a href="/onboarding?plan=plus" id="begin-pill" style="position:fixed;top:14px;right:16px;z-index:60;font-family:'Besley',serif;font-weight:600;font-size:13.5px;background:#A87C5F;color:#fff;border-radius:100px;padding:9px 18px;text-decoration:none;box-shadow:0 14px 30px -12px rgba(60,38,10,.5)">Make one for someone you miss</a>`;
    html = html.replace("</body>", beginPill + "\n</body>");
  }

  // ═══ the room fills (fix 6) ════════════════════════════════════════════════
  // Pull a tape down and it plays in a quiet paper frame on a darkened room —
  // never a black chrome box floating on cream. Plus pages with tapes only.
  if (tier === "plus" && videos.length) {
    const tvRoom = `<div id="tvroom" style="position:fixed;inset:0;z-index:120;display:none;align-items:center;justify-content:center;background:rgba(26,19,13,.93);padding:4vw" role="dialog" aria-modal="true" aria-label="A tape plays">
<button id="tvx" aria-label="Close" style="position:absolute;top:16px;right:22px;background:none;border:none;color:#F4E9D4;font-size:30px;cursor:pointer;line-height:1">×</button>
<div style="max-width:min(920px,94vw);width:100%;background:#FAF5EC;border-radius:12px;padding:14px 14px 8px;box-shadow:0 60px 140px -40px rgba(0,0,0,.85)">
<div id="tvslot" style="border-radius:8px;overflow:hidden;background:#171009;aspect-ratio:16/9"></div>
<div id="tvcap" style="font-family:'Sometype Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#5A4F45;padding:10px 4px 6px;text-align:center"></div>
</div></div>
<script>(function(){var T=window.__TRIBUTE__||null;if(!T||!T.vids||!T.vids.length)return;
var room=document.getElementById('tvroom'),slot=document.getElementById('tvslot'),cap=document.getElementById('tvcap'),x=document.getElementById('tvx');
if(!room||!slot)return;
function shut(){slot.innerHTML='';room.style.display='none';document.body.style.overflow=''}
function open(i){var v=T.vids[i];if(!v)return;
slot.innerHTML=v.e?'<iframe src="'+v.e+'?autoplay=1" style="width:100%;height:100%;border:0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="A kept video"></iframe>':'<video src="'+v.u+'" controls autoplay playsinline style="width:100%;height:100%;display:block;background:#171009"></video>';
cap.textContent=v.t||'';room.style.display='flex';document.body.style.overflow='hidden'}
if(x)x.onclick=shut;room.onclick=function(e){if(e.target===room)shut()};
addEventListener('keydown',function(e){if(e.key==='Escape')shut()});
document.querySelectorAll('.tapeobj[data-v]').forEach(function(tp){tp.onclick=function(){open(+tp.getAttribute('data-v'))}});
})();</script>`;
    html = html.replace("</body>", tvRoom + "\n</body>");
  }

  // ═══ the hero wears a scene (July 29) ════════════════════════════════════
  // A full-bleed looping landscape plays quietly behind the wreath — the
  // family's chosen slot (0028), the open sky by default (0031). The poster paints
  // first; reduced motion, Data Saver, and low-power phones stay on the
  // poster. The scene picker rests in the hero's lower-right corner: the
  // owner's choice persists for everyone through /api/tribute/[slug]/hero-video;
  // anyone else's tap previews in their own browser only.
  {
    const hb = heroBackground(t.heroVideoSlot);
    const heroCss = `<style>/* the hero wears a scene (July 29) · scenic video behind the wreath */
.arrive{background:linear-gradient(180deg,#F3E7D2 0%,#EFE0C4 70%,var(--cream) 100%)}
.hv{position:absolute;inset:0;z-index:0;overflow:hidden;background:#F3E7D2}
/* r6 · the scene always covers: explicit offsets ride beside the inset shorthand
   so older engines hold the same frame, and max-width can never shrink the clip —
   no native-edge seams at any viewport, ultrawide included. */
.hv .hv-poster,.hv video{position:absolute;top:0;right:0;bottom:0;left:0;inset:0;display:block;width:100%;height:100%;max-width:none;max-height:none;object-fit:cover}
.hv .hv-scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(63,44,26,.44) 0%,rgba(63,44,26,.10) 30%,rgba(63,44,26,.14) 60%,rgba(63,44,26,.66) 100%)}
.arrive .wrhero{z-index:2}
.hv-pick{position:absolute;right:14px;bottom:14px;z-index:9}
.hv-pill{font-family:'Besley',serif;font-variant-caps:all-small-caps;letter-spacing:.06em;font-size:13px;color:#F4E9D4;background:rgba(26,19,13,.55);border:1px solid rgba(201,165,114,.5);border-radius:100px;padding:7px 15px;cursor:pointer}
.hv-pill:hover{background:rgba(26,19,13,.75)}
.hv-menu{position:absolute;right:0;bottom:calc(100% + 8px);min-width:190px;background:#FFFDF6;border:1px solid #E4D9C4;border-radius:12px;box-shadow:0 24px 60px -20px rgba(26,19,13,.5);padding:6px;max-height:min(320px,60vh);overflow:auto}
.hv-menu button{display:block;width:100%;text-align:left;font-family:'Besley',serif;font-size:14.5px;color:#2C2520;background:none;border:none;border-radius:8px;padding:9px 12px;cursor:pointer}
.hv-menu button:hover{background:rgba(168,124,95,.1)}
.hv-menu button[aria-selected="true"]{color:#A87C5F;font-weight:700}
</style>`;
    const hIdx = html.lastIndexOf("</head>");
    if (hIdx > -1) html = html.slice(0, hIdx) + heroCss + html.slice(hIdx);

    const heroMarkup =
      `\n<div class="hv" id="heroVid" aria-hidden="true">` +
      `<img class="hv-poster" id="hvPoster" src="${esc(hb.poster)}" alt=""/>` +
      `<video id="hvVideo" autoplay muted loop playsinline preload="metadata" poster="${esc(hb.poster)}">` +
      `<source src="${esc(hb.webm)}" type="video/webm"/><source src="${esc(hb.mp4)}" type="video/mp4"/>` +
      `</video>` +
      `<div class="hv-scrim" aria-hidden="true"></div>` +
      `</div>` +
      `<script>/* poster-only fallbacks · runs before the wreath parses */
(function(){try{
var v=document.getElementById('hvVideo');if(!v)return;
var still=false;
try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)still=true}catch(e){}
try{if(navigator.connection&&navigator.connection.saveData)still=true}catch(e){}
try{if(matchMedia('(max-width:560px)').matches&&((navigator.deviceMemory&&navigator.deviceMemory<=2)||(navigator.connection&&/(^|-)2g/.test(navigator.connection.effectiveType||''))))still=true}catch(e){}
window.__HV_STILL__=still;
if(still){try{v.pause()}catch(e){}v.removeAttribute('autoplay');while(v.firstChild)v.removeChild(v.firstChild);try{v.load()}catch(e){}v.style.display='none'}
}catch(e){}})();
</script>`;
    html = html.replace('<header class="arrive" id="top">', '<header class="arrive" id="top">' + heroMarkup);

    const menuItems = HERO_BACKGROUNDS
      .map((b) => `<button type="button" role="option" data-slot="${esc(b.id)}" aria-selected="${b.id === hb.id ? "true" : "false"}">${esc(b.label)}</button>`)
      .join("");
    const picker =
      `<div class="hv-pick" id="hvPick">` +
      `<button type="button" class="hv-pill" id="hvPillBtn" aria-haspopup="listbox" aria-expanded="false">Scene · <span id="hvCur">${esc(hb.label)}</span></button>` +
      `<div class="hv-menu" id="hvMenu" role="listbox" aria-label="The scene behind the wreath" hidden>${menuItems}</div>` +
      `</div>`;
    html = html.replace("</header>", picker + "\n</header>");

    const hbJson = JSON.stringify(HERO_BACKGROUNDS).replace(/</g, "\\u003c");
    const heroScript = `<script>/* the scene picker · owner persists for everyone, a visitor previews for themselves */
(function(){
var HB=${hbJson},cur=${JSON.stringify(hb.id)},SLUG=${JSON.stringify(slug)};
var v=document.getElementById('hvVideo'),poster=document.getElementById('hvPoster'),pill=document.getElementById('hvPillBtn'),menu=document.getElementById('hvMenu'),curEl=document.getElementById('hvCur');
if(!pill||!menu)return;
function bg(id){for(var i=0;i<HB.length;i++)if(HB[i].id===id)return HB[i];return null}
function apply(id){var b=bg(id);if(!b)return;cur=b.id;
  if(poster)poster.src=b.poster;
  if(v){v.poster=b.poster;while(v.firstChild)v.removeChild(v.firstChild);
    if(!window.__HV_STILL__){var s1=document.createElement('source');s1.src=b.webm;s1.type='video/webm';var s2=document.createElement('source');s2.src=b.mp4;s2.type='video/mp4';v.appendChild(s1);v.appendChild(s2);v.load();var p=v.play();if(p&&p.catch)p.catch(function(){})}}
  if(curEl)curEl.textContent=b.label;
  menu.querySelectorAll('[data-slot]').forEach(function(o){o.setAttribute('aria-selected',o.getAttribute('data-slot')===cur?'true':'false')})}
try{var pv=localStorage.getItem('imy-hero-slot-'+SLUG);if(pv&&pv!==cur&&bg(pv))apply(pv)}catch(e){}
function shut(){menu.hidden=true;pill.setAttribute('aria-expanded','false')}
pill.addEventListener('click',function(){var open=menu.hidden;menu.hidden=!open;pill.setAttribute('aria-expanded',open?'true':'false')});
document.addEventListener('click',function(e){if(!e.target.closest||!e.target.closest('#hvPick'))shut()});
document.addEventListener('keydown',function(e){if(e.key==='Escape')shut()});
menu.querySelectorAll('[data-slot]').forEach(function(o){o.addEventListener('click',function(){
  var id=o.getAttribute('data-slot');apply(id);shut();
  fetch('/api/tribute/'+SLUG+'/hero-video',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({slot:id})})
  .then(function(r){return r.json()}).then(function(j){
    if(j&&j.ok){try{localStorage.removeItem('imy-hero-slot-'+SLUG)}catch(e){}}
    else{try{localStorage.setItem('imy-hero-slot-'+SLUG,id)}catch(e){}}})
  .catch(function(){try{localStorage.setItem('imy-hero-slot-'+SLUG,id)}catch(e){}})})});
})();
</script>`;
    html = html.replace("</body>", heroScript + "\n</body>");
  }

  // Item 57: the framed invitation section is retired from the example page.
  // The Share button lives in the sticky top bar now (Batch B); item 40 rides
  // with this removal — no share prompt closes the example any more.

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
