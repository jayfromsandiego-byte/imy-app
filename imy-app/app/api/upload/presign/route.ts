// POST /api/upload/presign — returns a short-lived presigned PUT URL so the browser
// can upload a large file (e.g. video) directly to R2, bypassing the serverless
// function (which has tight body limits and would burn execution time on big files).
//
// Body: { filename, contentType }. Returns { uploadUrl, publicUrl, key }.
// NOTE: the R2 bucket must allow CORS PUT from the site origin (see founder checklist).
import { NextRequest, NextResponse } from "next/server";
import { r2Configured, presignPut } from "@/lib/r2";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!r2Configured) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 501 });
  }
  // Same wall as the proxied upload door (July 12 audit): a family's videos
  // fit comfortably; an unbounded signer does not.
  {
    const { allowed } = rateLimit(`presign:${clientIp(req)}`, 60, 600_000);
    if (!allowed) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const filename = String(body.filename || "upload").slice(0, 120);
  const contentType = String(body.contentType || "application/octet-stream").slice(0, 100);
  if (!/^(image|video|audio)\//.test(contentType)) {
    return NextResponse.json({ ok: false, error: "unsupported_type" }, { status: 400 });
  }
  try {
    const r = await presignPut(filename, contentType);
    return NextResponse.json({ ok: true, ...r });
  } catch {
    return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });
  }
}
