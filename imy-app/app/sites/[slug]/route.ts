// Serves a fully-rendered tribute for {slug}.imissyoumemorial.com (and /sites/{slug}).
// Reads from Supabase (Airtable fallback during cutover) and injects into the template.
// "example" is aliased to the seeded "eleanor" tribute so "See an example" always works.
//
// SEO: every tribute canonicalizes to the apex /sites/{slug} form, so the subdomain
// and path versions never compete. Public tributes carry a modest Person JSON-LD;
// non-public tributes are served with noindex. The consent-first tracking layer is
// injected last (a no-op until its env vars exist).
import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getTribute } from "@/lib/tributesData";
import { renderTribute } from "@/lib/renderTribute";
import { renderTributeUnified } from "@/lib/renderTributeUnified";
import { injectSeo } from "@/lib/seo";
import { injectTracking } from "@/lib/tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://imissyoumemorial.com";

// A gentle, on-brand page for a mistyped/expired/private link (better than plain text,
// and shared links that miss are common).
const NOT_FOUND = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Tribute not found · I Miss You Memorial</title><link href="https://fonts.googleapis.com/css2?family=Besley:ital,wght@0,500;0,700;1,500&display=swap" rel="stylesheet"><style>html,body{height:100%;margin:0}body{display:flex;align-items:center;justify-content:center;background:#FAF5EC;color:#2C2520;font-family:'Besley',Georgia,serif;text-align:center;padding:24px;-webkit-font-smoothing:antialiased}.b{max-width:30rem}.wm{font-weight:700;font-size:1.05rem;margin-bottom:24px}.wm em{font-style:italic;color:#A87C5F}h1{font-weight:500;font-size:1.7rem;line-height:1.2;margin:0 0 12px}p{color:#6b5f52;line-height:1.6;margin:0 0 24px}a{display:inline-block;background:#A87C5F;color:#fff;text-decoration:none;font-weight:600;padding:12px 26px;border-radius:30px}</style></head><body><div class="b"><div class="wm">I <em>Miss</em> You Memorial</div><h1>This tribute couldn't be found.</h1><p>The link may be mistyped, or the page may have been kept private. If someone shared it with you, ask them to check the address.</p><a href="https://imissyoumemorial.com">Create a tribute</a></div></body></html>`;

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params.slug === "example" ? "eleanor" : params.slug;
  const tribute = await getTribute(slug);

  if (!tribute) {
    return new Response(NOT_FOUND, {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  // ── the unified design, behind a flag (default OFF — zero behavior change).
  // Two doors: `?design=unified` previews the unified page for any slug (the
  // owner's production preview, never cached), and env TRIBUTE_UNIFIED=1 flips
  // the default for the full cutover. With the flag off and no param, the
  // wreath renders byte-identically to today. The subdomain path needs nothing:
  // middleware's rewrite clones the URL, so the query survives it.
  const designParam = req.nextUrl.searchParams.get("design");
  const useUnified = designParam === "unified" || process.env.TRIBUTE_UNIFIED === "1";

  const template = await fs.readFile(
    path.join(process.cwd(), "templates", useUnified ? "tribute-unified.html" : "tribute-template.html"),
    "utf8"
  );
  let html = useUnified ? renderTributeUnified(template, tribute) : renderTribute(template, tribute);

  const canonical = `${SITE}/sites/${encodeURIComponent(tribute.slug || slug)}`;
  const isPublic = !tribute.visibility || tribute.visibility === "public";
  // Search engines see a tribute only when the family has chosen that (0020).
  // Public-by-link remains the default; discovery is an explicit opt-in.
  const isDiscoverable = isPublic && tribute.discoverable === true;
  const person: Record<string, unknown> = {
    "@type": "Person",
    name: tribute.fullName,
    url: canonical,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
  };
  if (tribute.birth) person.birthDate = String(tribute.birth).slice(0, 10);
  if (tribute.passing) person.deathDate = String(tribute.passing).slice(0, 10);
  const personImage = tribute.coverPhoto || tribute.portrait;
  if (personImage) person.image = personImage.startsWith("/") ? `${SITE}${personImage}` : personImage;
  const profilePage: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": canonical,
    url: canonical,
    mainEntity: person,
  };

  html = injectSeo(html, {
    canonical,
    ogUrl: canonical,
    twitterCard: "summary_large_image",
    noindex: !isDiscoverable,
    jsonLd: isDiscoverable ? [profilePage] : [],
  });
  html = injectTracking(html);

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Fresh within a minute — approvals, flowers, and Family Unlock should feel
      // immediate; stale-while-revalidate keeps the CDN protective under load.
      // A ?design= preview is never cached: the owner judging the unified page
      // must always see the freshest render, and a preview URL should not
      // occupy the CDN.
      "cache-control": designParam
        ? "no-store"
        : "public, max-age=0, s-maxage=60, stale-while-revalidate=86400",
    },
  });
}
