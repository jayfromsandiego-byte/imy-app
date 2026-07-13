// lib/seo.ts — server-side SEO injection for the raw-HTML pages.
//
// The locked design files own their <head>; this adds only what is missing —
// canonical, description, Open Graph, twitter card, robots, JSON-LD — and never
// duplicates a tag the template already carries. Zero visual impact.

export type SeoOptions = {
  canonical?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  ogUrl?: string;
  twitterCard?: "summary" | "summary_large_image";
  noindex?: boolean;
  jsonLd?: object[];
};

const esc = (s = "") =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

export function injectSeo(html: string, opts: SeoOptions): string {
  const hi = html.lastIndexOf("</head>");
  if (hi < 0) return html;
  const head = html.slice(0, hi);
  const tags: string[] = [];

  if (opts.noindex && !/name="robots"/i.test(head)) {
    tags.push('<meta name="robots" content="noindex, nofollow"/>');
  }
  if (opts.canonical && !/rel="canonical"/i.test(head)) {
    tags.push(`<link rel="canonical" href="${esc(opts.canonical)}"/>`);
  }
  if (opts.description && !/name="description"/i.test(head)) {
    tags.push(`<meta name="description" content="${esc(opts.description)}"/>`);
  }
  if (opts.ogTitle && !/property="og:title"/i.test(head)) {
    tags.push(`<meta property="og:title" content="${esc(opts.ogTitle)}"/>`);
  }
  if (opts.ogDescription && !/property="og:description"/i.test(head)) {
    tags.push(`<meta property="og:description" content="${esc(opts.ogDescription)}"/>`);
  }
  if (opts.ogImage && !/property="og:image"/i.test(head)) {
    tags.push(`<meta property="og:image" content="${esc(opts.ogImage)}"/>`);
  }
  if (opts.ogType && !/property="og:type"/i.test(head)) {
    tags.push(`<meta property="og:type" content="${esc(opts.ogType)}"/>`);
  }
  if (opts.ogUrl && !/property="og:url"/i.test(head)) {
    tags.push(`<meta property="og:url" content="${esc(opts.ogUrl)}"/>`);
  }
  if (!/rel="icon"/i.test(head)) {
    tags.push('<link rel="icon" href="/icon.svg" type="image/svg+xml"/>');
  }
  if (!/property="og:site_name"/i.test(head)) {
    tags.push('<meta property="og:site_name" content="I Miss You Memorial"/>');
  }
  if (opts.twitterCard && !/name="twitter:card"/i.test(head)) {
    tags.push(`<meta name="twitter:card" content="${esc(opts.twitterCard)}"/>`);
  }
  for (const obj of opts.jsonLd || []) {
    try {
      const json = JSON.stringify(obj).replace(/</g, "\\u003c");
      tags.push(`<script type="application/ld+json">${json}</script>`);
    } catch {
      /* never let structured data break a page */
    }
  }

  if (!tags.length) return html;
  return html.slice(0, hi) + tags.join("\n") + "\n" + html.slice(hi);
}

/** Build FAQPage JSON-LD from the landing page's own FAQ markup, so the
 *  structured data can never drift from the words on the page. Pairs each
 *  <summary> with its answer div; anything unpaired (the compare-table
 *  toggle) is skipped. Returns null rather than ever guessing. */
export function faqJsonLdFromHtml(html: string): object | null {
  try {
    const strip = (s: string) =>
      s
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .replace(/[+\u2192]\s*$/g, "")
        .trim();
    const pairs: { q: string; a: string }[] = [];
    const detailsRe = /<details[^>]*>([\s\S]*?)<\/details>/gi;
    let m: RegExpExecArray | null;
    while ((m = detailsRe.exec(html))) {
      const block = m[1];
      const q = block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i);
      const a = block.match(/<div class="a"[^>]*>([\s\S]*?)<\/div>/i);
      if (!q || !a) continue;
      const question = strip(q[1]);
      const answer = strip(a[1]);
      if (question && answer && question.length < 200) pairs.push({ q: question, a: answer });
    }
    if (!pairs.length) return null;
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: pairs.map((p) => ({
        "@type": "Question",
        name: p.q,
        acceptedAnswer: { "@type": "Answer", text: p.a },
      })),
    };
  } catch {
    return null;
  }
}
