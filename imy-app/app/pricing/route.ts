// A shared pricing link must never dead-end (July 12): the prices live on the
// homepage's own pricing section, so this route simply walks you there.
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export function GET(req: Request) {
  return NextResponse.redirect(new URL("/#pricing", req.url), 308);
}
