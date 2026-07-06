// /onboarding → serves the keepsake letter (which POSTs to /api/intake), with
// SEO chrome and the consent-first tracking layer injected server-side. The
// letter_started / letter_sealed events fire from the injected layer without
// touching the design file's own code.
import { promises as fs } from "fs";
import path from "path";
import { injectSeo } from "@/lib/seo";
import { injectTracking } from "@/lib/tracking";

export const runtime = "nodejs";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://imissyoumemorial.com";
const DESCRIPTION =
  "Write them a letter — a few gentle questions become a memorial page you can share with everyone who loved them.";

export async function GET() {
  let html = await fs.readFile(path.join(process.cwd(), "templates", "onboarding.html"), "utf8");
  html = injectSeo(html, {
    canonical: `${SITE}/onboarding`,
    description: DESCRIPTION,
    ogTitle: "Create their memorial · I Miss You Memorial",
    ogDescription: DESCRIPTION,
    ogImage: `${SITE}/hero.jpg`,
    ogType: "website",
    ogUrl: `${SITE}/onboarding`,
    twitterCard: "summary_large_image",
  });
  html = injectTracking(html);
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
