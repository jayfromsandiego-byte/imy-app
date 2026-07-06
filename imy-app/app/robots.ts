import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://imissyoumemorial.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/api", "/auth"] }],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
