// POST /api/upload — receives photos (multipart form-data, field "files") and
// returns public URLs. Cloudflare R2 is preferred (zero egress + WebP optimization);
// Vercel Blob is a fallback. For large media (video), use POST /api/upload/presign
// to upload directly to R2 instead of proxying bytes through this function.
import { NextRequest, NextResponse } from "next/server";
import { r2Configured, uploadToR2 } from "@/lib/r2";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024; // 25MB per file through this proxied route
// Audio welcomes every common recording a family might hold (mp3, m4a, wav,
// ogg/opus, flac, amr, aiff) — a voicemail should never be refused for its
// container. Formats a browser cannot play are normalized by the media worker.
const SAFE_MEDIA = /^(image\/(jpeg|png|webp|gif|heic|heif)|audio\/(mpeg|mp3|mp4|x-m4a|m4a|aac|x-aac|wav|x-wav|wave|vnd\.wave|ogg|opus|webm|flac|x-flac|3gpp|amr|aiff|x-aiff)|video\/(mp4|webm|quicktime))$/i;

export async function POST(req: NextRequest) {
  // Visitors attach photographs to memories, so this stays public — but gently
  // limited per IP, like every other public door on the site. A family in a
  // funeral week legitimately brings a lifetime of photographs in one sitting;
  // 30 per ten minutes silently dropped most of a gallery (July 10). Generous
  // for grief, still a wall against abuse.
  {
    const ip = clientIp(req);
    const { allowed } = await rateLimit(`upload:${ip}`, 150, 600_000);
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
    // Memory photos (0029) arrive already re-encoded by the composer's canvas
    // pass (JPEG/WebP ~0.82, long edge ≤1600, EXIF stripped). This context
    // accepts only what that pass can produce — a tighter door than the
    // family's own gallery uploads, which keep their broader welcome.
    const context = String(form.get("context") || "");
    const isMemoryPhoto = context === "memory";
    // A writer's avatar (0030) is even narrower: one ~512px center-square
    // JPEG from the identity sheet's canvas pass — one file, 3MB is plenty.
    const isAvatar = context === "avatar";
    const MEMORY_PHOTO_TYPES = /^image\/(jpeg|png|webp)$/i;
    const MEMORY_PHOTO_MAX = 8 * 1024 * 1024; // generous for a 1600px re-encode
    const AVATAR_MAX = 3 * 1024 * 1024;
    const files = (form.getAll("files").filter((f) => f instanceof File) as File[]).slice(0, isAvatar ? 1 : isMemoryPhoto ? 4 : 20);
    if (!files.length) return NextResponse.json({ ok: false, error: "no_files" }, { status: 400 });

    const urls: string[] = [];
    for (const f of files) {
      if (!((isMemoryPhoto || isAvatar) ? MEMORY_PHOTO_TYPES : SAFE_MEDIA).test(f.type || "")) {
        return NextResponse.json({ ok: false, error: "unsupported_type" }, { status: 415 });
      }
      if ((isMemoryPhoto && f.size > MEMORY_PHOTO_MAX) || (isAvatar && f.size > AVATAR_MAX)) {
        return NextResponse.json({ ok: false, error: "too_large" }, { status: 413 });
      }
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
