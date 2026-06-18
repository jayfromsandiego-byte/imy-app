// renderTribute — turns an Airtable Tributes row into a finished tribute page by
// transforming the canonical "Vigil" template (templates/tribute-template.html).
// String-based (no external deps); mirrors the proven Python generator.

export type TimelineItem = { year: string; title: string; text: string; tag?: "family" | "linkedin" };
export type DetailItem = { k: string; v: string; wide?: boolean };
export type PhotoItem = { url?: string; cap?: string };
export type MemoryItem = { text: string; name: string; rel: string };

export type Tribute = {
  fullName: string;
  birth?: string;
  passing?: string;
  place?: string;
  coverPhoto?: string;
  quote?: string;
  quoteAttrib?: string;
  story?: string;
  candleCount?: number;
  serviceSummary?: string;
  service?: { date?: string; time?: string; place?: string; address?: string; reception?: string; dress?: string };
  charityName?: string;
  charityDesc?: string;
  details?: DetailItem[];
  timeline?: TimelineItem[];
  photos?: PhotoItem[];
  memories?: MemoryItem[];
};

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

function cut(s: string, start: string, endmark: string, repl: string): string {
  const i = s.indexOf(start);
  if (i < 0) return s;
  const j = s.indexOf(endmark, i + start.length);
  if (j < 0) return s;
  return s.slice(0, i) + repl + s.slice(j);
}

export function renderTribute(template: string, t: Tribute): string {
  let tpl = template;
  const parts = (t.fullName || "").trim().split(/\s+/);
  const first = parts[0] || t.fullName || "Them";
  const rest = parts.slice(1).join(" ");
  const lastName = rest || first;

  const detailsHtml = (t.details || [])
    .map((d) => `<div class="detail${d.wide ? " wide" : ""}"><div class="k">${esc(d.k)}</div><div class="v">${esc(d.v)}</div></div>`)
    .join("");
  const timelineHtml = (t.timeline || [])
    .map((it) => `<div class="tl-item reveal"><div class="tl-year">${esc(it.year)}</div><div class="tl-title">${esc(it.title)}${it.tag === "family" ? ' <span class="tag-mini family">family</span>' : ""}</div><div class="tl-text">${esc(it.text)}</div></div>`)
    .join("");
  const photos = (t.photos && t.photos.length ? t.photos : (t.coverPhoto ? [{ url: t.coverPhoto, cap: "In loving memory" }] : []));
  const photoHtml = photos
    .map((p) => `<div class="pcell" data-cap="${esc(p.cap)}"><div class="ph" data-cap="${esc(p.cap)}">${p.url ? `<img src="${esc(p.url)}" alt="${esc(p.cap)}">` : ""}</div>${p.cap ? `<div class="pcap">${esc(p.cap)}</div>` : ""}</div>`)
    .join("");
  const memHtml = (t.memories || [])
    .map((m) => `<div class="memory"><div class="mtxt">${esc(m.text)}</div><div class="mby"><span class="mname">${esc(m.name)}</span><span class="mdot"></span><span class="mrel">${esc(m.rel)}</span></div></div>`)
    .join("");

  const dates = `${esc(t.birth || "")} — ${esc(t.passing || "")}` + (t.place ? ` · a sky full of those who loved her` : "");
  const svc = t.service || {};
  const svcSummary = t.serviceSummary || [t.service?.date && `A Celebration of ${esc(first)}'s Life`, svc.date, svc.place].filter(Boolean).join(" · ");

  // ---- exact single-line replacements (canonical Eleanor strings -> this person) ----
  const reps: Record<string, string> = {
    "EVER<span>last</span>ING": 'I&nbsp;MISS <span>you</span> MEMORIAL',
    "<title>Eleanor Margaret Hayes — A Tribute · Everlasting</title>": `<title>${esc(t.fullName)} — A Tribute · I Miss You Memorial</title>`,
    "Eleanor<br><em>Margaret Hayes</em>": `${esc(first)}<br><em>${esc(rest)}</em>`,
    "April 14, 1942 — October 22, 2024 · a sky full of those who loved her": dates,
    "<b data-count>2,847</b>": `<b data-count>${t.candleCount ?? 1}</b>`,
    "Begin with the person — the small, exact, beloved things — and let the timeline show how those values played out across eighty-two years.": esc(t.story || ""),
    "“Find the smallest beautiful thing in the day, <span class=\"q\">and tell someone about it.</span> That’s the whole point.”": t.quote ? `“${esc(t.quote)} <span class="q"></span>”` : "",
    "— what she said, most mornings, for forty years": t.quoteAttrib ? `— ${esc(t.quoteAttrib)}` : "",
    "https://hyperagent.com/api/files/usergenerated/threads/cmoxraijj08rh08adbfnyh068/images/fdff9e3a-3b86-4513-98a5-d2c866b9e349.png": t.coverPhoto || "",
    "Eleanor, in her garden": esc(t.fullName),
    'alt="Eleanor Margaret Hayes"': `alt="${esc(t.fullName)}"`,
    '<span class="chip linked">◇ Career imported from LinkedIn · with consent</span>': "",
    '<span class="chip family">✦ Memories added by family</span>': "",
    "A Celebration of Eleanor’s Life · Saturday, June 13, 2026 · 11:00 AM PT · Linden Community Chapel": esc(svcSummary),
    "Private · for Eleanor only": `Private · for ${esc(first)} only`,
    "Write a letter to <em>Eleanor</em>.": `Write a letter to <em>${esc(first)}</em>.`,
    "I still make your lemon cake every autumn. I think I finally got it right…": "I still think of you in the quiet of the morning…",
    "Saturday, June 13, 2026": esc(svc.date || "To be announced"),
    "Gathering from 10:30 AM · service at 11:00 AM PT": esc(svc.time || ""),
    "Linden Community Chapel": esc(svc.place || ""),
    "142 Seaside Avenue, Half Moon Bay, CA 94019": esc(svc.address || ""),
    "In the chapel garden": esc(svc.reception || ""),
    "Her roses are in bloom. She would have liked that.": "",
    "She never cared for all-black. Bring a little of her brightness.": esc(svc.dress || ""),
    "The Eleanor Hayes Reading Fund": esc(t.charityName || "In their memory"),
    "Books and a literacy aide for Linden Elementary — the school where she taught for nearly four decades.": esc(t.charityDesc || ""),
    'data-give="The Eleanor Hayes Reading Fund"': `data-give="${esc(t.charityName || "")}"`,
    "Eleanor spent thirty-eight years teaching children to read. If you’d like to honour her, two things she loved:": `If you’d like to honour ${esc(first)}:`,
    "Everlasting passes 100% of your gift to the fund. We never take a fee on in-memoriam giving.": "I Miss You Memorial passes 100% of your gift. We never take a fee on in-memoriam giving.",
    "No subscription keeps Eleanor’s memory here, and none ever will. Free tributes stay online for good; should the family ever choose Eternal, it’s guaranteed for fifty years and backed by an endowment. We will never charge to keep a memory alive.": `No subscription keeps ${esc(first)}’s memory here, and none ever will. Free tributes stay online for good; Eternal is guaranteed for fifty years and backed by an endowment. We will never charge to keep a memory alive.`,
    "The Everlasting Permanence Pledge": "The I Miss You Memorial Permanence Pledge",
    "A tribute curated by the Hayes family.": "A tribute kept with care.",
  };
  for (const [a, b] of Object.entries(reps)) tpl = tpl.split(a).join(b);

  // ---- structural block replacements (index-based) ----
  tpl = cut(tpl, '<div class="details reveal">', '<div class="tl-head reveal">',
    '<div class="details reveal">' + detailsHtml + "</div>\n      </div>\n\n    ");
  const ts = tpl.indexOf('<div class="timeline">');
  if (ts >= 0) {
    const ie = tpl.indexOf('<div class="import-note', ts);
    if (ie >= 0) {
      const iee = tpl.indexOf("</div>", ie) + "</div>".length;
      tpl = tpl.slice(0, ts) + '<div class="timeline">' + timelineHtml + "</div>\n" + tpl.slice(iee);
    }
  }
  tpl = cut(tpl, '<div class="reel reveal" id="reel">', "<!-- PHOTOS", '<div class="reel reveal" id="reel"></div>\n\n    ');
  tpl = cut(tpl, '<div class="photo-grid reveal" id="photoGrid">', '<div class="add-cta',
    '<div class="photo-grid reveal" id="photoGrid">' + photoHtml + "</div>\n\n    ");
  tpl = cut(tpl, '<div class="mwall" id="mwall">', "</section>",
    '<div class="mwall" id="mwall">' + memHtml + "</div>\n  </div>\n");

  // ---- scrub sample names baked into the template's client-side JS ----
  tpl = tpl.replace(/var NAMES=\[[\s\S]*?\];/,
    'var NAMES=[["A friend","lit a candle"],["Someone who loved her","lit a candle"],["A neighbour","lit a candle"]];');
  tpl = tpl.split("Eulogy · Sarah").join("Eulogy").split("A song for Grandma").join("A song for her");

  // ---- catch-all scrub of any remaining identifiers ----
  tpl = tpl.replace(/https:\/\/hyperagent\.com\/api\/files\/usergenerated\/threads\/cmoxraijj[^"\s)]+/g, t.coverPhoto || "");
  const catch_: [string, string][] = [
    ["Eleanor", esc(first)], ["Hayes", esc(lastName)], ["Robert", ""], ["Linden Elementary", "the local school"],
    ["Half Moon Bay", esc(t.place || "")], ["Everlasting", "I Miss You Memorial"],
  ];
  for (const [a, b] of catch_) tpl = tpl.split(a).join(b);

  return tpl;
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
  const fullName = f["Loved One"] || "";
  const first = (fullName.split(/\s+/)[0]) || "their";
  return {
    fullName,
    birth: f["Birth Date"],
    passing: f["Passing Date"],
    place: f["Place"],
    coverPhoto: f["Cover Photo"] || (Array.isArray(f["Photos"]) && f["Photos"][0]?.url),
    quote: f["Quote"],
    story: f["Story"],
    candleCount: 1,
    service: (f["Service Date"] || f["Service Location"])
      ? { date: f["Service Date"], place: f["Service Location"] } : undefined,
    serviceSummary: (f["Service Date"] || f["Service Location"])
      ? [`A Celebration of ${first}'s Life`, f["Service Date"], f["Service Location"]].filter(Boolean).join(" · ") : undefined,
    charityName: f["Charity"],
    charityDesc: f["Charity"] ? `A cause close to ${first}'s heart.` : undefined,
    photos: Array.isArray(f["Photos"]) ? f["Photos"].map((a: any) => ({ url: a.url, cap: "" })) : undefined,
    ...enriched,
  };
}
