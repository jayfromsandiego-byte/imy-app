// /onboarding → serves the onboarding form (which POSTs to /api/intake).
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET() {
  const html = await fs.readFile(path.join(process.cwd(), "templates", "onboarding.html"), "utf8");
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
