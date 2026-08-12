import { NextResponse } from "next/server";
import { articles } from "@/lib/blog/articles";
import { liveEntries, entryPath } from "@/lib/seo/catalog";

// Segmented sitemaps for per-cluster indexation tracking in Search Console:
//   /sitemaps/core.xml       — home, onboarding, pricing, about, legal, blog
//   /sitemaps/tools.xml      — live tool pages
//   /sitemaps/templates.xml  — live template pages
//   /sitemaps/guides.xml     — live guide pages
// The main /sitemap.xml remains the full union (plus discoverable tributes).
// Segments exist so day-30/day-90 checkpoints can read coverage per cluster.

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://imissyoumemorial.com";
export const revalidate = 3600;

function xml(urls: { loc: string; lastmod?: string }[]): string {
  const body = urls
    .map(
      (u) =>
        `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
}

export function generateStaticParams() {
  return ["core.xml", "tools.xml", "templates.xml", "guides.xml"].map((segment) => ({ segment }));
}

export function GET(_req: Request, { params }: { params: { segment: string } }) {
  const seg = params.segment.replace(/\.xml$/, "");
  const now = new Date().toISOString().slice(0, 10);

  let urls: { loc: string; lastmod?: string }[] = [];
  if (seg === "core") {
    urls = [
      "",
      "/onboarding",
      "/pricing",
      "/about",
      "/contact",
      "/terms",
      "/privacy",
      "/refunds",
      "/blog",
    ].map((p) => ({ loc: `${SITE}${p}`, lastmod: now }));
    urls.push(
      ...articles.map((a) => ({
        loc: `${SITE}/blog/${a.slug}`,
        lastmod: (a.dateModified || a.datePublished).slice(0, 10),
      }))
    );
  } else if (seg === "tools" || seg === "templates" || seg === "guides") {
    urls = liveEntries(seg).map((e) => ({ loc: `${SITE}${entryPath(e)}`, lastmod: now }));
  } else {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(xml(urls), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
