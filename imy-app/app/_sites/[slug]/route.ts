// Serves a fully-rendered tribute for {slug}.imissyoumemorial.com.
// Reads the canonical Vigil template and injects the person's data.

import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getTributeBySlug } from "@/lib/airtable";
import { renderTribute, recordToTribute } from "@/lib/renderTribute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const rec = await getTributeBySlug(params.slug);
  if (!rec) {
    return new Response("This tribute could not be found.", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const templatePath = path.join(process.cwd(), "templates", "tribute-template.html");
  const template = await fs.readFile(templatePath, "utf8");
  const html = renderTribute(template, recordToTribute(rec));

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=60, s-maxage=300",
    },
  });
}
