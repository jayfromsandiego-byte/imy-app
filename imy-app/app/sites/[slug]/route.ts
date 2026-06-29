// Serves a fully-rendered tribute for {slug}.imissyoumemorial.com (and /sites/{slug}).
// Reads from Supabase (Airtable fallback during cutover) and injects into the Vigil template.
// "example" is aliased to the seeded "eleanor" tribute so "See an example" always works.
import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getTribute } from "@/lib/tributesData";
import { renderTribute } from "@/lib/renderTribute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params.slug === "example" ? "eleanor" : params.slug;
  const tribute = await getTribute(slug);

  if (!tribute) {
    return new Response("This tribute could not be found.", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const template = await fs.readFile(path.join(process.cwd(), "templates", "tribute-template.html"), "utf8");
  const html = renderTribute(template, tribute);
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=60, s-maxage=300",
    },
  });
}
