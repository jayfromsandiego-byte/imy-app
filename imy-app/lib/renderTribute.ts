// renderTribute — fills the token-based Vigil/Candlelight template
// (templates/tribute-template.html) from an Airtable Tributes row.
// Token model ({{NAME}}) — robust string replacement, no fragile anchor matching.

export type TimelineItem = { year: string; title: string; text: string };
export type DetailItem = { k: string; v: string };
export type LovedItem = { label: string; photo?: string };
export type PhotoItem = { url?: string; cap?: string };
export type MemoryItem = { text: string; name: string; rel: string; writerPhoto?: string; subjectPhoto?: string; photos?: string[] };
export type ReelItem = { poster?: string; label?: string };

export type Tribute = {
  fullName: string;
  birth?: string;
  passing?: string;
  place?: string;
  coverPhoto?: string;
  portrait?: string;
  portraitCap?: string;
  quote?: string;
  story?: string;
  candleCount?: number;
  tier?: string;            // "Free" | "Plus" | "Eternal"
  theme?: string;           // "Garden" | "Letters" | "Ocean" | "Hearth" | "Golden Hour" | "Stillness"
  showAnnounce?: boolean;   // override; defaults to true unless tier is Eternal/Plus
  message?: { text: string; sign?: string };
  service?: { date?: string; time?: string; place?: string; address?: string; charity?: string };
  details?: DetailItem[];
  loved?: LovedItem[];
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

export function renderTribute(template: string, t: Tribute): string {
  const parts = (t.fullName || "").trim().split(/\s+/);
  const first = parts[0] || t.fullName || "Them";
  const rest = parts.slice(1).join(" ") || "";

  const dates = [fmtDate(t.birth), fmtDate(t.passing)].filter(Boolean).join(" — ")
    + (t.place ? ` · of ${esc(t.place)}` : "");

  const detailsHtml = (t.details || [])
    .map((d) => `<div class="detail"><div class="k">${esc(d.k)}</div><div class="v">${esc(d.v)}</div></div>`)
    .join("") || "";

  const lovedHtml = (t.loved || [])
    .map((l) => `<div class="loved-card"><div class="img" style="${l.photo ? `background-image:url('${esc(l.photo)}')` : ""}"></div><div class="tx">${esc(l.label)}</div></div>`)
    .join("") || "";

  const timelineHtml = (t.timeline || [])
    .map((it) => `<div class="tl-item"><div class="tl-year">${esc(it.year)}</div><div class="tl-title">${esc(it.title)}</div><div class="tl-text">${esc(it.text)}</div></div>`)
    .join("") || "";

  const photos = (t.photos && t.photos.length) ? t.photos : (t.coverPhoto ? [{ url: t.coverPhoto }] : []);
  const galleryHtml = photos
    .slice(0, 21)
    .map((p) => (p.url ? `<div class="mcell"><img loading="lazy" src="${esc(p.url)}" alt=""></div>` : ""))
    .join("") || "";

  const reelHtml = (t.reel || [])
    .map((r) => `<div class="rcard" style="${r.poster ? `background-image:url('${esc(r.poster)}')` : ""}"><div class="play">▶</div></div>`)
    .join("") || "";

  const memoriesHtml = (t.memories || [])
    .map((m) => {
      const ph = (m.photos || []).map((u) => `<img src="${esc(u)}" alt="">`).join("");
      const subj = m.subjectPhoto ? `<span class="av" style="background-image:url('${esc(m.subjectPhoto)}')" title="${esc(first)}"></span>` : "";
      const writer = m.writerPhoto ? `<span class="av" style="background-image:url('${esc(m.writerPhoto)}')"></span>` : "";
      return `<div class="memory"><div class="mtxt">${esc(m.text)}</div>${ph ? `<div class="mphotos">${ph}</div>` : ""}<div class="mby">${writer}${subj}<div><div class="nm">${esc(m.name)}</div><div class="rel">${esc(m.rel)}</div></div></div></div>`;
    })
    .join("") || "";

  const quoteBlock = t.quote
    ? `<div style="font-family:'Fraunces',serif;font-style:italic;font-size:1.2rem;color:var(--ink);border-left:2px solid var(--gold);padding-left:16px;margin:0 0 26px">“${esc(t.quote)}”</div>`
    : "";

  const messageFrom = t.message && t.message.text
    ? `<section class="tint-sage"><div class="wrap"><div class="msg"><div class="env">✉️</div><div class="eyebrow" style="text-align:center">A message from ${esc(first)}</div><blockquote>“${esc(t.message.text)}”</blockquote><div class="sign">— ${esc(t.message.sign || first)}</div></div></div></section>`
    : "";

  const svc = t.service;
  const serviceHtml = svc && (svc.date || svc.place)
    ? `<section id="service"><div class="wrap"><div class="eyebrow">Service &amp; remembrance</div><h2 class="sec">If you would like to <em>be there.</em></h2><div class="svc">
        <div class="card"><div class="k">When</div><div class="v">${esc([fmtDate(svc.date), svc.time].filter(Boolean).join(" · ")) || "To be announced"}</div></div>
        ${svc.place ? `<div class="card"><div class="k">Where</div><div class="v">${esc(svc.place)}${svc.address ? `<br><span style="color:var(--ink-soft);font-size:.92rem">${esc(svc.address)}</span>` : ""}</div></div>` : ""}
        ${svc.charity ? `<div class="card"><div class="k">In lieu of flowers</div><div class="v">Donations in ${esc(first)}'s name to ${esc(svc.charity)}.</div></div>` : ""}
        <div class="svc-actions"><a class="primary" href="#">Add to calendar</a>${svc.charity ? `<a href="#">Give in their name</a>` : ""}<a href="#memories">Share a memory</a></div>
      </div></div></section>`
    : "";

  const isEternal = (t.tier || "").toLowerCase() === "eternal";
  const showAnnounce = t.showAnnounce !== undefined ? t.showAnnounce : !isEternal;
  const announce = showAnnounce
    ? `<div class="announce"><span class="flame">🕯</span> With love, from <b>I Miss You Memorial</b> · <a href="https://imissyoumemorial.com">Create one</a></div>`
    : "";

  const pledge = isEternal
    ? "Guaranteed for 50 years, with archival backup — kept for as long as it is needed."
    : "Kept online with love. Choose Eternal to keep this page guaranteed for 50 years.";

  const themeClass = ({
    "evensong": "t-evensong", "hearthstone": "t-hearthstone", "tidewater": "t-tidewater",
  } as Record<string, string>)[(t.theme || "").trim().toLowerCase()] || "";

  const tokens: Record<string, string> = {
    "{{TITLE}}": `${esc(t.fullName)} — A Tribute · I Miss You Memorial`,
    "{{THEME_CLASS}}": themeClass,
    "{{ANNOUNCE_BAR}}": announce,
    "{{KICKER}}": "In loving memory",
    "{{FIRST}}": esc(first),
    "{{REST}}": esc(rest),
    "{{DATES}}": dates,
    "{{CANDLE_COUNT}}": String(t.candleCount ?? 1),
    "{{STORY}}": esc(t.story || ""),
    "{{QUOTE_BLOCK}}": quoteBlock,
    "{{PORTRAIT}}": esc(t.portrait || t.coverPhoto || ""),
    "{{PORTRAIT_CAP}}": esc(t.portraitCap || first),
    "{{DETAILS}}": detailsHtml,
    "{{LOVED_ITEMS}}": lovedHtml,
    "{{TIMELINE}}": timelineHtml,
    "{{GALLERY}}": galleryHtml,
    "{{REEL}}": reelHtml,
    "{{MESSAGE_FROM}}": messageFrom,
    "{{MEMORIES}}": memoriesHtml,
    "{{SERVICE}}": serviceHtml,
    "{{PLEDGE}}": esc(pledge),
  };

  let html = template;
  for (const [k, v] of Object.entries(tokens)) html = html.split(k).join(v);
  return html;
}

// Map an Airtable Tributes record to the Tribute render object.
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
    fullName: f["Loved One"] || "",
    birth: f["Birth Date"],
    passing: f["Passing Date"],
    place: f["Place"],
    coverPhoto: f["Cover Photo"] || (Array.isArray(f["Photos"]) && f["Photos"][0]?.url),
    quote: f["Quote"],
    story: f["Story"],
    candleCount: 1,
    tier: f["Tier"],
    theme: f["Theme"],
    service: (f["Service Date"] || f["Service Location"])
      ? { date: f["Service Date"], place: f["Service Location"], charity: f["Charity"] } : undefined,
    photos: photosField,
    ...enriched,
  };
}
