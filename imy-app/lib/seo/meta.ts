import type { Metadata } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://imissyoumemorial.com";

// ---------------------------------------------------------------------------
// THE NOINDEX LAW (SEO program, locked Aug 2026)
//
// Pages a visitor GENERATES — a finished funeral program, a drafted obituary,
// a rendered card — are never indexed. Only three things are ever indexed:
//   1. Tool and template pages (the catalog in lib/seo/catalog.ts)
//   2. Guides with a real author
//   3. Memorial pages a family chose to make discoverable
// Any route that renders user-generated output must use NOINDEX_OUTPUT below.
// Verify in rendered HTML before every ship: <meta name="robots" content="noindex"...
// ---------------------------------------------------------------------------

/** Metadata fragment for user-generated output pages. Never indexed, links still followed. */
export const NOINDEX_OUTPUT: Pick<Metadata, "robots"> = {
  robots: { index: false, follow: true },
};

/** Standard metadata for an indexed SEO page (tool, template, or guide). */
export function seoPageMetadata(opts: {
  title: string;
  description: string;
  /** Site-absolute path with trailing slash, e.g. "/templates/funeral-program/word/" */
  path: string;
  /** Set false while a section index has no live entries yet. */
  index?: boolean;
}): Metadata {
  const { title, description, path, index = true } = opts;
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: index ? undefined : { index: false, follow: true },
    openGraph: {
      title: `${title} · I Miss You Memorial`,
      description,
      url: path,
      type: "website",
      siteName: "I Miss You Memorial",
    },
  };
}

/** JSON-LD helper — escapes < to keep script content safe. */
export function jsonLdScript(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export { SITE };
