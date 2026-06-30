// Serves a fully-rendered tribute for {slug}.imissyoumemorial.com (and /sites/{slug}).
// Reads from Supabase (Airtable fallback during cutover) and injects into the template.
// "example" is aliased to the seeded "eleanor" tribute so "See an example" always works.
import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getTribute } from "@/lib/tributesData";
import { renderTribute } from "@/lib/renderTribute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A gentle, on-brand page for a mistyped/expired/private link (better than plain text,
// and shared links that miss are common).
const NOT_FOUND = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Tribute not found · I Miss You Memorial</title><link href="https://fonts.googleapis.com/css2?family=Besley:ital,wght@0,500;0,700;1,500&display=swap" rel="stylesheet"><style>html,body{height:100%;margin:0}body{display:flex;align-items:center;justify-content:center;background:#FAF5EC;color:#2C2520;font-family:'Besley',Georgia,serif;text-align:center;padding:24px;-webkit-font-smoothing:antialiased}.b{max-width:30rem}.wm{font-weight:700;font-size:1.05rem;margin-bottom:24px}.wm em{font-style:italic;color:#A87C5F}h1{font-weight:500;font-size:1.7rem;line-height:1.2;margin:0 0 12px}p{color:#6b5f52;line-height:1.6;margin:0 0 24px}a{display:inline-block;background:#A87C5F;color:#fff;text-decoration:none;font-weight:600;padding:12px 26px;border-radius:30px}</style></head><body><div class="b"><div class="wm">I <em>Miss</em> You Memorial</div><h1>This tribute couldn't be found.</h1><p>The link may be mistyped, or the page may have been kept private. If someone shared it with you, ask them to check the address.</p><a href="https://imissyoumemorial.com">Create a tribute</a></div></body></html>`;

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params.slug === "example" ? "eleanor" : params.slug;
  const tribute = await getTribute(slug);

  if (!tribute) {
    return new Response(NOT_FOUND, {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
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
