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
