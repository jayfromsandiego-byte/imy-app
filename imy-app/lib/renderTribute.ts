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

export type TimelineItem = { year: string; title: string; text: string };
export type DetailItem = { k: string; v: string };
export type LovedItem = { label: string; photo?: string };
export type PhotoItem = { url?: string; cap?: string };
export type MemoryItem = { text: string; name: string; rel: string; photos?: string[] };
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
  tier?: string; // "free" | "plus" | "heirloom"
  theme?: string;
  motif?: string;
  visibility?: string; // "public" | "unlisted" | "private" — SEO only, never rendering
  status?: string;
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

  const timeline = t.timeline || [];
  const ch = timeline.length
    ? [{
        name: `${first}'s life`,
        yrs: "in moments",
        mo: timeline.map((m) => [m.year || "", m.title || m.text || ""]),
        ph: gal.slice(0, 3).length ? gal.slice(0, 3) : (photos[0] ? [["p0", photos[0].cap || ""]] : []),
      }]
    : [];

  const approved = (t.memories || []).map((m) => ({
    g: "friends",
    av: (m.name || "A")[0].toUpperCase(),
    nm: m.name || "A friend",
    rel: m.rel || "",
    tx: m.text || "",
    h: 0,
    cm: [] as unknown[],
  })).filter((m) => m.tx);

  const CAP = 10;
  const mems = tier === "free" ? approved.slice(0, CAP) : approved;
  const seedw = tier === "free"
    ? approved.slice(CAP).map((m) => ({ nm: m.nm, rel: m.rel, tx: m.tx, g: m.g }))
    : [];

  const words = (t.lovedThings || []).map((l) => String(l.label || "").toLowerCase()).filter(Boolean).slice(0, 8);

  const boards = photos.length
    ? [{
        key: "photos",
        label: "Photographs",
        items: photos.slice(0, 8).map((p, i) => ({
          t: "photo", img: p.url, ttl: p.cap || "", who: "", rel: "",
          date: "", h: 0, r: (i % 2 ? 3 : -3) + (i % 3), c: [] as unknown[],
        })),
      }]
    : [];

  const boot = {
    slug, tier,
    gal, imgs, liv, ch, mems, seedw, words, boards,
    waiting: seedw.length,
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
    .split("{{PRESENCE_HIDDEN}}").join("hidden")
    .split("{{PRESENCE_LINE}}").join("");

  // ── name pass: the template's UI strings speak the person's real name ──
  html = html.split("Eleanor Margaret Hayes").join(esc(t.fullName));
  html = html.replace(/Eleanor(&#39;s|'s)/g, `${esc(first)}$1`);
  html = html.split("Eleanor").join(esc(first));

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
