// Homepage (/) → serves the marketing landing page, with SEO chrome and the
// consent-first tracking layer injected server-side (both no-ops until their
// env vars exist; the design file itself is never modified).
import { promises as fs } from "fs";
import path from "path";
import { injectSeo, faqJsonLdFromHtml } from "@/lib/seo";
import { injectTracking } from "@/lib/tracking";

export const runtime = "nodejs";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://imissyoumemorial.com";
const DESCRIPTION =
  "Create a beautiful online memorial page for someone you love — their photos, their story, and the voices of everyone who misses them. Free, forever.";
const ORG_DESCRIPTION =
  "Free permanent online memorial pages — photos, life stories, voice and video memories, virtual candles, and a family-moderated guest book. Free forever; memorial pages are never deleted.";

export async function GET() {
  let html = await fs.readFile(path.join(process.cwd(), "templates", "landing.html"), "utf8");

  // Structured data. Organization + WebSite ride together in a single @graph so
  // the publisher entity that Blog Article schema references
  // (https://imissyoumemorial.com/#organization) is actually defined here in the
  // SSR layer. The FAQ block is derived from the landing page's own markup, so
  // the schema can never say something the page does not.
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
          description: ORG_DESCRIPTION,
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
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "I Miss You Memorial",
      serviceType: "Online memorial and tribute pages",
      description: DESCRIPTION,
      url: SITE,
      provider: { "@id": `${SITE}/#organization` },
      areaServed: "Worldwide",
      offers: [
        {
          "@type": "Offer",
          name: "Free tribute page",
          price: "0",
          priceCurrency: "USD",
          description: "A complete tribute page, online forever. Free stays free.",
        },
        {
          "@type": "Offer",
          name: "Plus",
          price: "197",
          priceCurrency: "USD",
          description: "$197 once or $29/month — video and voice memories, every photo, an exact-name address.",
        },
        {
          "@type": "Offer",
          name: "Concierge",
          price: "499",
          priceCurrency: "USD",
          description: "A tribute hand-built for the family, from $499.",
        },
      ],
    },
  ];
  const faq = faqJsonLdFromHtml(html);
  if (faq) jsonLd.push(faq);

  html = injectSeo(html, {
    canonical: `${SITE}/`,
    description: DESCRIPTION,
    ogTitle: "I Miss You Memorial · A place for the people we love",
    ogDescription: DESCRIPTION,
    ogImage: `${SITE}/hero.jpg`,
    ogType: "website",
    ogUrl: `${SITE}/`,
    twitterCard: "summary_large_image",
    jsonLd,
  });
  html = injectTracking(html);
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
