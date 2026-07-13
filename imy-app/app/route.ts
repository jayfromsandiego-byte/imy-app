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

export async function GET() {
  let html = await fs.readFile(path.join(process.cwd(), "templates", "landing.html"), "utf8");

  // Structured data. The FAQ block is derived from the landing page's own
  // markup, so the schema can never say something the page does not.
  const jsonLd: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${SITE}/#organization`,
      name: "I Miss You Memorial",
      url: SITE,
      logo: `${SITE}/icon.svg`,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "I Miss You Memorial",
      url: SITE,
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
          price: "97",
          priceCurrency: "USD",
          description: "$97 once or $12/month — video and voice memories, every photo, an exact-name address.",
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
