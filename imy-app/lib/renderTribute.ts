// renderTribute — fills the token-based approved tribute template
// (templates/tribute-template.html) from a tribute record. Token model ({{NAME}}):
// robust string replacement, no fragile anchor matching.
//
// This renders the LOCKED design: arched Memorial Stone cover over a candle + rose
// vigil, with the section background driven by the family's chosen motif, and the
// premium sections gated by tier (free shows a gentle lock; paid is unlocked).

import { type LovedThing } from "./lovedThings";

export type TimelineItem = { year: string; title: string; text: string };
export type DetailItem = { k: string; v: string };
export type LovedItem = { label: string; photo?: string };
export type PhotoItem = { url?: string; cap?: string };
export type MemoryItem = { text: string; name: string; rel: string; photos?: string[] };
export type ReelItem = { poster?: string; label?: string };

export type Tribute = {
  slug?: string;
  fullName: string;
  role?: string;            // e.g. "Teacher · Gardener · Grandmother" (optional)
  birth?: string;
  passing?: string;
  place?: string;
  coverPhoto?: string;
  portrait?: string;
  portraitCap?: string;
  quote?: string;
  story?: string;
  candleCount?: number;
  tier?: string;            // "free" | "plus" | "heirloom"
  theme?: string;
  motif?: string;           // family's chosen interest key -> section background
  showAnnounce?: boolean;
  message?: { text: string; sign?: string };
  service?: { date?: string; time?: string; place?: string; address?: string; charity?: string };
  details?: DetailItem[];
  loved?: LovedItem[];
  lovedThings?: LovedThing[];
  timeline?: TimelineItem[];
  photos?: PhotoItem[];
  reel?: ReelItem[];
  memories?: MemoryItem[];
};

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

function fmtDate(s?: string): string {
  if (!s) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return s;
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${months[parseInt(m[2], 10) - 1]} ${parseInt(m[3], 10)}, ${m[1]}`;
}

// Map a family's chosen interest (stored on the tribute) to one of the eight
// section-background motif archetypes. Defaults to the warm "gardener" pattern.
const MOTIF_MAP: Record<string, string> = {
  gardening: "gardener", garden: "gardener", flowers: "gardener", gardener: "gardener",
  cooking: "cook", coffee: "cook", baking: "cook", food: "cook", cook: "cook", baker: "cook",
  fishing: "angler", angler: "angler",
  "music-piano": "musician", music: "musician", singing: "musician", dancing: "musician", musician: "musician",
  sailing: "sailor", boating: "sailor", sailor: "sailor",
  flying: "aviator", aviation: "aviator", aviator: "aviator",
  travel: "traveler", outdoors: "traveler", hiking: "traveler", traveler: "traveler",
  astronomy: "astronomer", stargazing: "astronomer", stars: "astronomer", astronomer: "astronomer",
};
function motifKey(m?: string, theme?: string): string {
  const k = (m || theme || "").toString().trim().toLowerCase();
  return MOTIF_MAP[k] || "gardener";
}

export function renderTribute(template: string, t: Tribute): string {
  const parts = (t.fullName || "").trim().split(/\s+/);
  const first = parts[0] || t.fullName || "Them";

  const dates =
    [fmtDate(t.birth), fmtDate(t.passing)].filter(Boolean).join(" — ") +
    (t.place ? ` · ${esc(t.place)}` : "");

  const portrait = t.portrait || t.coverPhoto || "";
  const stoneImg = portrait ? `<img src="${esc(portrait)}" alt="${esc(t.fullName)}">` : "";
  const roleLine = t.role ? `<div class="role">${esc(t.role)}</div>` : "";

  const quoteBlock = t.quote
    ? `<blockquote class="her-quote">“${esc(t.quote)}”</blockquote>`
    : "";

  const factsInner = (t.details || [])
    .map((d) => `<div class="fact"><div class="ft">${esc(d.k)}</div><div class="fv">${esc(d.v)}</div></div>`)
    .join("");
  const facts = factsInner ? `<div class="facts">${factsInner}</div>` : "";

  const lovedFigs = (t.loved || [])
    .map((l) => `<figure class="lcard">${l.photo ? `<img src="${esc(l.photo)}" alt="${esc(l.label)}">` : ""}<figcaption>${esc(l.label)}</figcaption></figure>`)
    .join("");
  const loved = lovedFigs ? `<div class="loved"><h3>What ${esc(first)} loved most</h3><div class="loved-grid">${lovedFigs}</div></div>` : "";

  const timelineInner = (t.timeline || [])
    .map((it) => `<div class="tl-item"><div class="tl-year">${esc(it.year)}</div><div class="tl-t">${esc(it.title)}</div><div class="tl-d">${esc(it.text)}</div></div>`)
    .join("");
  const timelineBlock = timelineInner ? `<div class="timeline"><div class="tl-track">${timelineInner}</div></div>` : "";

  const photos = (t.photos && t.photos.length) ? t.photos : (portrait ? [{ url: portrait }] : []);
  const gallery = photos
    .slice(0, 12)
    .map((p) => (p.url ? `<div class="tile photo"><img loading="lazy" src="${esc(p.url)}" alt=""></div>` : ""))
    .join("");

  const message = t.message && t.message.text
    ? `<section class="section reveal" id="message"><div class="kick">A message from ${esc(first)}</div><div class="message"><div class="mq">“${esc(t.message.text)}”</div><div class="mby">— ${esc(t.message.sign || first)}</div></div></section>`
    : "";

  const memoriesInner = (t.memories && t.memories.length)
    ? t.memories
        .map((m) => {
          const initial = esc((m.name || "•").trim().charAt(0).toUpperCase() || "•");
          const photo = (m.photos && m.photos[0]) ? `<div class="mem-photo"><img src="${esc(m.photos[0])}" alt=""></div>` : "";
          return `<div class="mem-card"><div class="mem-head"><div class="mem-av">${initial}</div><div><div class="mem-nm">${esc(m.name)}</div>${m.rel ? `<div class="mem-rel">${esc(m.rel)}</div>` : ""}</div></div><div class="mem-text">${esc(m.text)}</div>${photo}</div>`;
        })
        .join("")
    : `<div class="mem-card"><div class="mem-text">Be the first to share a memory of ${esc(first)}.</div></div>`;

  const reelInner = (t.reel || [])
    .map((r) => `<div class="rec"><div class="play">▶</div><div style="flex:1"><div style="font-size:14px;font-weight:700">${esc(r.label || "A recorded tribute")}</div><div class="wave" style="margin-top:8px"></div></div></div>`)
    .join("");
  const recorded = reelInner
    ? `<section class="section reveal" id="tributes"><div class="kick">Recorded tributes</div><h2>In their own voices.</h2><div class="rec-track">${reelInner}</div></section>`
    : "";

  const svc = t.service;
  const service = svc && (svc.date || svc.place)
    ? `<section class="section reveal" id="service"><div class="kick">Service &amp; remembrance</div><h2>If you would like to be there.</h2><div class="svc">
        <div class="scard"><div class="st">When</div><div class="sv">${esc([fmtDate(svc.date), svc.time].filter(Boolean).join(" · ")) || "To be announced"}</div></div>
        ${svc.place ? `<div class="scard"><div class="st">Where</div><div class="sv">${esc(svc.place)}${svc.address ? `<br>${esc(svc.address)}` : ""}</div></div>` : ""}
        ${svc.charity ? `<div class="scard" style="grid-column:1/-1"><div class="st">In lieu of flowers</div><div class="sv">Donations in ${esc(first)}'s name to ${esc(svc.charity)}.</div></div>` : ""}
      </div><div class="svc-actions"><a class="btn outline" href="#memories">Share a memory</a></div></section>`
    : "";

  const tier = (t.tier || "").trim().toLowerCase();
  const isPaid = tier === "plus" || tier === "heirloom" || tier === "eternal";
  const tierAttr = isPaid ? "plus" : "free";

  const pledge = isPaid
    ? "Backed by a dedicated reserve and an independent archive — kept with love, for as long as we are here."
    : "Every tribute stays online. We will never charge you to keep a memory alive.";

  // Open Graph / Twitter share preview — the product grows by people sharing the link,
  // so a shared tribute should show the loved one's portrait, name, and a gentle line.
  const DEFAULT_OG = "https://pub.hyperagent.com/api/published/pbf01KWBE8XFP_ZYS6S7BJ3MVYD8MC/36eaf3d1-1610-48b5-980c-e275c8f5eebd.png";
  const ogUrl = t.slug ? `https://${t.slug}.imissyoumemorial.com` : "https://imissyoumemorial.com";
  const ogTitle = `${t.fullName || first} · In loving memory`;
  const _excerpt = (t.story || "").replace(/\s+/g, " ").trim();
  const ogDesc = _excerpt
    ? (_excerpt.length > 155 ? _excerpt.slice(0, 152) + "…" : _excerpt)
    : `A place to remember ${first} — light a candle, leave a memory, and share what they meant to you.`;
  const ogImage = portrait || DEFAULT_OG;

  // Anniversary / birthday acknowledgement, computed server-side from the dates.
  const _md = (s?: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((s || "").trim()); return m ? { y: +m[1], mo: +m[2], d: +m[3] } : null; };
  const _now = new Date();
  const _tMo = _now.getUTCMonth() + 1, _tD = _now.getUTCDate(), _tY = _now.getUTCFullYear();
  const _b = _md(t.birth), _p = _md(t.passing);
  let _anniv = "";
  if (_p && _p.mo === _tMo && _p.d === _tD) { const yrs = _tY - _p.y; _anniv = yrs > 0 ? `Remembering ${first}, ${yrs} year${yrs === 1 ? "" : "s"} on.` : `Remembering ${first} today.`; }
  else if (_b && _b.mo === _tMo && _b.d === _tD) { _anniv = `Today would have been ${first}'s birthday.`; }
  const anniversaryHtml = _anniv ? `<div class="vigil-anniv">${esc(_anniv)}</div>` : "";

  const tokens: Record<string, string> = {
    "{{TITLE}}": `${esc(t.fullName)} — I Miss You Memorial`,
    "{{SLUG}}": esc(t.slug || ""),
    "{{OG_TITLE}}": esc(ogTitle),
    "{{OG_DESC}}": esc(ogDesc),
    "{{OG_IMAGE}}": esc(ogImage),
    "{{OG_URL}}": esc(ogUrl),
    "{{ANNIVERSARY}}": anniversaryHtml,
    "{{TIER_ATTR}}": tierAttr,
    "{{MOTIF}}": motifKey(t.motif, t.theme),
    "{{KICKER}}": "In loving memory",
    "{{FIRST}}": esc(first),
    "{{FULLNAME}}": esc(t.fullName),
    "{{ROLE_LINE}}": roleLine,
    "{{DATES}}": dates,
    "{{STONE_IMG}}": stoneImg,
    "{{CANDLE_COUNT}}": String(t.candleCount ?? 0),
    "{{STORY}}": esc(t.story || ""),
    "{{QUOTE_BLOCK}}": quoteBlock,
    "{{FACTS}}": facts,
    "{{LOVED}}": loved,
    "{{TIMELINE_BLOCK}}": timelineBlock,
    "{{GALLERY}}": gallery,
    "{{MESSAGE_FROM}}": message,
    "{{MEMORIES}}": memoriesInner,
    "{{RECORDED}}": recorded,
    "{{SERVICE}}": service,
    "{{PLEDGE}}": esc(pledge),
  };

  let html = template;
  for (const [k, v] of Object.entries(tokens)) html = html.split(k).join(v);
  return html;
}

// Map an Airtable Tributes record to the Tribute render object (legacy fallback).
export function recordToTribute(rec: any): Tribute {
  const f = (rec && rec.fields) || {};
  let enriched: Partial<Tribute> = {};
  try {
    if (f["Tribute Data"]) enriched = JSON.parse(f["Tribute Data"]);
  } catch {
    /* ignore malformed enrichment */
  }
  const photosField = Array.isArray(f["Photos"]) ? f["Photos"].map((a: any) => ({ url: a.url })) : undefined;
  return {
    slug: f["Slug"] || undefined,
    fullName: f["Loved One"] || "",
    birth: f["Birth Date"],
    passing: f["Passing Date"],
    place: f["Place"],
    coverPhoto: f["Cover Photo"] || (Array.isArray(f["Photos"]) && f["Photos"][0]?.url),
    quote: f["Quote"],
    story: f["Story"],
    candleCount: 0,
    tier: f["Tier"],
    theme: f["Theme"],
    motif: f["Motif"],
    service: (f["Service Date"] || f["Service Location"])
      ? { date: f["Service Date"], place: f["Service Location"], charity: f["Charity"] } : undefined,
    photos: photosField,
    ...enriched,
  };
}
