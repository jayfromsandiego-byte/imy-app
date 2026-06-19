// Homepage (/) → serves the marketing landing page.
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET() {
  const html = await fs.readFile(path.join(process.cwd(), "templates", "landing.html"), "utf8");
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
