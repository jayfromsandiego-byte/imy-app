// POST /api/upload — receives onboarding photos/videos (multipart form-data)
// and returns public URLs to store on the tribute.
//
// WIRING (one of):
//  - Vercel Blob: add `@vercel/blob`, set BLOB_READ_WRITE_TOKEN, then
//      import { put } from "@vercel/blob";
//      const { url } = await put(file.name, file, { access: "public" });
//  - S3 / R2 / UploadThing: swap in their SDK below.
//
// Once URLs are returned, the onboarding submit writes them to Airtable:
//   first image -> Cover Photo;  remaining -> Photos (attachments);  video -> Video URL.
// renderTribute already places Cover Photo (hero/portrait), Photos[] (gallery),
// and Video URL (reel) automatically.

import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Storage not configured yet — respond clearly so the UI can fall back.
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.S3_BUCKET) {
    return NextResponse.json(
      {
        ok: false,
        error: "upload_storage_not_configured",
        message:
          "Add a storage provider (Vercel Blob token or S3/R2 bucket) to enable photo uploads. See app/api/upload/route.ts for wiring.",
      },
      { status: 501 }
    );
  }

  try {
    const form = await req.formData();
    const files = form.getAll("files").filter((f) => f instanceof File) as File[];
    const urls: string[] = [];
    for (const f of files) {
      const safe = (f.name || "upload").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
      const key = `tributes/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
      const { url } = await put(key, f, { access: "public", contentType: f.type || undefined, addRandomSuffix: false });
      urls.push(url);
    }
    return NextResponse.json({ ok: true, urls });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "upload_failed", message: String(e?.message || e) }, { status: 500 });
  }
}
