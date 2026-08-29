// /pricing → serves the marketing landing page as real, crawlable SSR content
// (the prices live in the landing document's own #pricing section). Previously
// this route 308-redirected to /#pricing, which left /pricing with no indexable
// HTML of its own; now Googlebot and AI crawlers see the full page without
// executing the app bundle. The locked design file is served verbatim — only
// server-side SEO chrome and the consent-first tracking layer are injected
// (both no-ops until their env vars exist). Canonical is self so / and /pricing
// never compete.
import { promises as fs } from "fs";
import path from "path";
import { injectSeo, faqJsonLdFromHtml } from "@/lib/seo";
import { injectTracking } from "@/lib/tracking";

export const runtime = "nodejs";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://imissyoumemorial.com";
const DESCRIPTION =
  "I Miss You Memorial pricing — a complete tribute page is free, forever. Plus is $197 once, yours for life: video, voice, and every photo. Concierge, hand-built, from $499.";

export async function GET() {
  let html = await fs.readFile(path.join(process.cwd(), "templates", "landing.html"), "utf8");

  const jsonLd: object[] = [
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": `${SITE}/#organization`,
          name: "I Miss You Memorial",
          url: SITE,
          logo: {
            "@type": "ImageObject",
            url: `${SITE}/icon.svg`,
          },
          description:
            "Free permanent online memorial pages — photos, life stories, voice and video memories, virtual candles, and a family-moderated guest book. Free forever; memorial pages are never deleted.",
        },
        {
          "@type": "WebSite",
          "@id": `${SITE}/#website`,
          name: "I Miss You Memorial",
          url: SITE,
          publisher: { "@id": `${SITE}/#organization` },
        },
      ],
    },
  ];
  const faq = faqJsonLdFromHtml(html);
  if (faq) jsonLd.push(faq);

  // The unified landing document ships its own JSON-LD — when the design file
  // carries structured data it is the source of truth; inject nothing on top.
  const docOwnsJsonLd = html.includes("application/ld+json");

  html = injectSeo(html, {
    canonical: `${SITE}/pricing`,
    description: DESCRIPTION,
    ogTitle: "I Miss You Memorial · Pricing",
    ogDescription: DESCRIPTION,
    ogImage: `${SITE}/hero.jpg`,
    ogType: "website",
    ogUrl: `${SITE}/pricing`,
    twitterCard: "summary_large_image",
    jsonLd: docOwnsJsonLd ? [] : jsonLd,
  });
  html = injectTracking(html);
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
