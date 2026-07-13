import type { MetadataRoute } from "next";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabaseServer";
import { articles } from "@/lib/blog/articles";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://imissyoumemorial.com";
export const revalidate = 3600; // refresh hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = ["", "/onboarding", "/contact", "/terms", "/privacy", "/refunds"].map(
    (p) => ({
      url: `${SITE}${p}`,
      lastModified: now,
      changeFrequency: p === "" ? "weekly" : "monthly",
      priority: p === "" ? 1 : p === "/onboarding" ? 0.8 : 0.4,
    })
  );

  const blogRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    ...articles.map((a) => ({
      url: `${SITE}/blog/${a.slug}`,
      lastModified: new Date(a.dateModified || a.datePublished),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  // Tribute pages join the sitemap only when a family has chosen to be
  // discoverable (migration 0020). Reachable-by-link stays the default;
  // the search index is an explicit opt-in.
  let tributes: MetadataRoute.Sitemap = [];
  if (supabaseConfigured) {
    try {
      const { data } = await supabaseAdmin()
        .from("tributes")
        .select("slug, updated_at")
        .eq("status", "published")
        .eq("visibility", "public")
        .eq("discoverable", true)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(5000);
      tributes = (data || []).map((t: any) => ({
        url: `${SITE}/sites/${t.slug}`,
        lastModified: t.updated_at ? new Date(t.updated_at) : now,
        changeFrequency: "weekly",
        priority: 0.8,
      }));
    } catch {
      /* fall back to static + blog routes only */
    }
  }
  return [...staticRoutes, ...blogRoutes, ...tributes];
}
