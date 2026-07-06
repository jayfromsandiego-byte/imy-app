// Homepage (/) → serves the marketing landing page, with SEO chrome and the
// consent-first tracking layer injected server-side (both no-ops until their
// env vars exist; the design file itself is never modified).
import { promises as fs } from "fs";
import path from "path";
import { injectSeo } from "@/lib/seo";
import { injectTracking } from "@/lib/tracking";

export const runtime = "nodejs";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://imissyoumemorial.com";
const DESCRIPTION =
  "Create a beautiful memorial page for someone you love — their photos, their story, and the voices of everyone who misses them. Free, forever.";

export async function GET() {
  let html = await fs.readFile(path.join(process.cwd(), "templates", "landing.html"), "utf8");
  html = injectSeo(html, {
    canonical: `${SITE}/`,
    description: DESCRIPTION,
    ogTitle: "I Miss You Memorial · A place for the people we love",
    ogDescription: DESCRIPTION,
    ogImage: `${SITE}/hero.jpg`,
    ogType: "website",
    ogUrl: `${SITE}/`,
    twitterCard: "summary_large_image",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
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
    ],
  });
  html = injectTracking(html);
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
