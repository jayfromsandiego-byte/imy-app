import type { MetadataRoute } from "next";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabaseServer";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://imissyoumemorial.com";
export const revalidate = 3600; // refresh hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = ["", "/onboarding", "/terms", "/privacy"].map((p) => ({
    url: `${SITE}${p}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.6,
  }));

  let tributes: MetadataRoute.Sitemap = [];
  if (supabaseConfigured) {
    try {
      const { data } = await supabaseAdmin()
        .from("tributes")
        .select("slug")
        .eq("status", "published")
        .eq("visibility", "public")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(5000);
      tributes = (data || []).map((t: any) => ({
        url: `${SITE}/sites/${t.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      }));
    } catch {
      /* fall back to static routes only */
    }
  }
  return [...staticRoutes, ...tributes];
}
