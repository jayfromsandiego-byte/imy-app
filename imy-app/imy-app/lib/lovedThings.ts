// lovedThings.ts — Plus tier personalization sections ("Loved Things").
// Renders ONE section per thing the person loved: a traced background drawing
// (object only, never the person), a photo carousel, and a short blurb.
//
// SAFETY / ADDITIVITY CONTRACT:
//   renderLovedThings() returns "" unless the tribute is Plus/Eternal AND has
//   at least one loved thing. So Free tributes and existing Plus tributes with
//   no loved-things data render byte-for-byte as they do today.

import { MOTIFS, labelToMotifKey } from "./motifs";

export type LovedThing = {
  label: string;                       // from the onboarding dropdown; drives the motif + heading
  note?: string;                       // the blurb ("his favorite thing after work…")
  photos?: Array<string | { url?: string }>; // carousel images (Airtable attachment urls or strings)
  motifKey?: string;                   // optional explicit override; else derived from label
  title?: string;                      // optional heading override; else the label
};

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

const MAX_SECTIONS = 6; // soft cap — more dilutes the effect and bloats the page

function isPlus(tier?: string): boolean {
  return ["plus", "eternal"].includes((tier || "").trim().toLowerCase());
}

function photoUrl(p: string | { url?: string }): string {
  return typeof p === "string" ? p : (p && p.url) || "";
}

export function renderLovedThings(things: LovedThing[] = [], tier?: string): string {
  if (!isPlus(tier) || !Array.isArray(things) || things.length === 0) return "";

  return things
    .slice(0, MAX_SECTIONS)
    .map((thing, i) => {
      const key = thing.motifKey && MOTIFS[thing.motifKey] ? thing.motifKey : labelToMotifKey(thing.label);
      const motif = MOTIFS[key] || MOTIFS.fallback;
      const num = String(i + 1).padStart(2, "0");
      const heading = esc(thing.title || thing.label || motif.label);
      const blurb = thing.note ? `<p class="lt-blurb">${esc(thing.note)}</p>` : "";

      const shots = (thing.photos || [])
        .map(photoUrl)
        .filter(Boolean)
        .map((u) => `<div class="shot"><img loading="lazy" src="${esc(u)}" alt="${heading}"></div>`)
        .join("");
      const carousel = shots
        ? `<div class="lt-carousel" aria-label="${heading} photos">${shots}</div>`
        : "";

      // Alternate background tints like the rest of the page for rhythm.
      const tint = i % 2 === 1 ? " tint-b" : "";

      return `<section class="lt${tint}" id="loved-${esc(key)}-${i}">
  <div class="lt-trace" aria-hidden="true" style="-webkit-mask-image:url('/personalization/${esc(motif.asset)}');mask-image:url('/personalization/${esc(motif.asset)}')"></div>
  <div class="wrap">
    <div class="eyebrow">What they loved · ${num}</div>
    <h2 class="sec">${heading}</h2>
    ${blurb}
    ${carousel}
  </div>
</section>`;
    })
    .join("");
}
