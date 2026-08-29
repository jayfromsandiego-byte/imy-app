import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://imissyoumemorial.com";

// AI answer engines are welcomed explicitly (consent made legible), then the
// default rule covers everyone else. Private surfaces stay disallowed for all.
const AI_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "PerplexityBot",
  "ClaudeBot",
  "Claude-SearchBot",
  "Google-Extended",
  "Applebot",
];

export default function robots(): MetadataRoute.Robots {
  const disallow = ["/dashboard", "/api", "/auth"];
  return {
    rules: [
      ...AI_AGENTS.map((userAgent) => ({ userAgent, allow: "/", disallow })),
      { userAgent: "*", allow: "/", disallow },
    ],
    sitemap: [
      `${SITE}/sitemap.xml`,
      `${SITE}/sitemaps/core.xml`,
      `${SITE}/sitemaps/tools.xml`,
      `${SITE}/sitemaps/templates.xml`,
      `${SITE}/sitemaps/guides.xml`,
    ],
    host: SITE,
  };
}
