// /media/r2/<key> — same-origin reads for tribute media stored in R2.
//
// Why this door exists (Gate 1, media privacy): a page that links media at the
// storage provider's public base needs the bucket to be publicly readable —
// forever, for every key. A page that links media here does not. This route
// reads with the app's own credentials (lib/r2.ts getFromR2), so it keeps
// serving after public bucket access is switched off; at that point a raw
// storage URL stops resolving and this becomes the only door, one the app
// controls (and can later teach revocation checks and expiring grants —
// see ops/media-privacy-plan.md).
//
// Nothing links here until R2_PROXY_READS=1 makes lib/r2.ts address new
// uploads at /media/r2/<key>. Any existing key can be fetched through it at
// any time, which is how the route is verified against the public base.
//
// Contract kept for players: Range in → 206 + Content-Range out, so <audio>
// and <video> seek exactly as they do against the bucket. Long immutable
// caching matches the bucket's own upload setting (keys are unique per upload
// and never rewritten).
import { NextRequest, NextResponse } from "next/server";
import { r2ReadConfigured, getFromR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Only media namespaces the app itself writes (lib/r2.ts keyFor → tributes/…,
// the film worker → films/…). Path segments stay on a strict charset — no
// traversal, no encoded surprises, nothing outside the media tree.
const KEY_OK = /^(tributes|films)\/[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/;

async function serve(req: NextRequest, key: string, headOnly: boolean): Promise<NextResponse> {
  if (!r2ReadConfigured || key.length > 512 || !KEY_OK.test(key) || key.includes("..")) {
    return new NextResponse(null, { status: 404 });
  }
  const range = req.headers.get("range") || undefined;
  try {
    const obj = await getFromR2(key, range);
    const headers = new Headers();
    headers.set("Cache-Control", "public, max-age=31536000, s-maxage=31536000, immutable");
    headers.set("Accept-Ranges", "bytes");
    headers.set("X-Content-Type-Options", "nosniff");
    if (obj.ContentType) headers.set("Content-Type", obj.ContentType);
    if (obj.ETag) headers.set("ETag", obj.ETag);
    if (obj.ContentRange) headers.set("Content-Range", obj.ContentRange);
    if (obj.ContentLength != null) headers.set("Content-Length", String(obj.ContentLength));
    const status = obj.ContentRange ? 206 : 200;
    if (headOnly || !obj.Body) return new NextResponse(null, { status, headers });
    const body = (obj.Body as any).transformToWebStream() as ReadableStream;
    return new NextResponse(body, { status, headers });
  } catch (e: any) {
    const code = Number(e?.$metadata?.httpStatusCode || 0);
    if (code === 404 || e?.name === "NoSuchKey" || e?.name === "NotFound") {
      return new NextResponse(null, { status: 404 });
    }
    if (code === 416 || e?.name === "InvalidRange") {
      return new NextResponse(null, { status: 416 });
    }
    // Storage hiccup — never cache a failure in front of a family's media.
    return new NextResponse(null, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}

export async function GET(req: NextRequest, { params }: { params: { key: string[] } }) {
  return serve(req, (params.key || []).join("/"), false);
}

export async function HEAD(req: NextRequest, { params }: { params: { key: string[] } }) {
  return serve(req, (params.key || []).join("/"), true);
}
