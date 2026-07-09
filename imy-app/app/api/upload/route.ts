// POST /api/upload — receives photos (multipart form-data, field "files") and
// returns public URLs. Cloudflare R2 is preferred (zero egress + WebP optimization);
// Vercel Blob is a fallback. For large media (video), use POST /api/upload/presign
// to upload directly to R2 instead of proxying bytes through this function.
import { NextRequest, NextResponse } from "next/server";
import { r2Configured, uploadToR2 } from "@/lib/r2";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024; // 25MB per file through this proxied route

export async function POST(req: NextRequest) {
  // Visitors attach photographs to memories, so this stays public — but gently
  // limited per IP, like every other public door on the site.
  {
    const ip = clientIp(req);
    const { allowed } = rateLimit(`upload:${ip}`, 30, 600_000);
    if (!allowed) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const hasBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

  if (!r2Configured && !hasBlob) {
    return NextResponse.json(
      {
        ok: false,
        error: "upload_storage_not_configured",
        message:
          "Add Cloudflare R2 (preferred) or Vercel Blob to enable uploads. See lib/r2.ts and the founder setup checklist.",
      },
      { status: 501 }
    );
  }

  try {
    const form = await req.formData();
    const files = form.getAll("files").filter((f) => f instanceof File) as File[];
    if (!files.length) return NextResponse.json({ ok: false, error: "no_files" }, { status: 400 });

    const urls: string[] = [];
    for (const f of files) {
      if (f.size > MAX_BYTES) {
        return NextResponse.json(
          { ok: false, error: "too_large", message: "Files over 25MB should use the presigned upload (/api/upload/presign)." },
          { status: 413 }
        );
      }
      if (r2Configured) {
        const buf = Buffer.from(await f.arrayBuffer());
        urls.push(await uploadToR2(buf, f.name || "upload", f.type || "application/octet-stream"));
      } else {
        const { put } = await import("@vercel/blob");
        const safe = (f.name || "upload").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
        const key = `tributes/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
        const { url } = await put(key, f, { access: "public", contentType: f.type || undefined, addRandomSuffix: false });
        urls.push(url);
      }
    }
    return NextResponse.json({ ok: true, urls });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "upload_failed", message: String(e?.message || e) }, { status: 500 });
  }
}
