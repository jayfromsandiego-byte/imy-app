// lib/r2.ts — Cloudflare R2 media storage (S3-compatible, zero egress fees).
//
// Why R2: storage is cheap; the real bill is egress, and video is ~95% of it.
// R2 charges $0 egress, so a tribute costs pennies/year to keep online — which is
// what makes the Permanence Pledge affordable. Images are optimized to WebP on
// upload (80–98% fewer bytes) before they are stored.
//
// Configured entirely from env (see the founder setup checklist). When R2 isn't
// configured, callers fall back to Vercel Blob or return a clear "not configured".
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ACCOUNT = process.env.R2_ACCOUNT_ID || "";
const KEY = process.env.R2_ACCESS_KEY_ID || "";
const SECRET = process.env.R2_SECRET_ACCESS_KEY || "";
const BUCKET = process.env.R2_BUCKET || "";
const ENDPOINT = process.env.R2_ENDPOINT || (ACCOUNT ? `https://${ACCOUNT}.r2.cloudflarestorage.com` : "");
const PUBLIC_BASE = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/$/, "");

export const r2Configured = Boolean(KEY && SECRET && BUCKET && ENDPOINT && PUBLIC_BASE);

let _client: S3Client | null = null;
function client(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: "auto",
      endpoint: ENDPOINT,
      credentials: { accessKeyId: KEY, secretAccessKey: SECRET },
    });
  }
  return _client;
}

function keyFor(name: string, forcedExt?: string): string {
  const safe = (name || "upload").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
  const base = `tributes/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
  return forcedExt ? base.replace(/\.[^.]+$/, "") + forcedExt : base;
}

export function publicUrl(key: string): string {
  return `${PUBLIC_BASE}/${key}`;
}

/** Upload bytes to R2. Images are resized + converted to WebP when sharp is available. */
export async function uploadToR2(buf: Buffer, filename: string, contentType: string): Promise<string> {
  let body: Buffer = buf;
  let type = contentType || "application/octet-stream";
  let key = keyFor(filename);

  if (type.startsWith("image/") && !type.includes("gif") && !type.includes("svg")) {
    try {
      const sharp = (await import("sharp")).default;
      body = await sharp(buf)
        .rotate() // honor EXIF orientation
        .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      type = "image/webp";
      key = keyFor(filename, ".webp");
    } catch {
      // sharp unavailable at runtime — store the original, still correct.
      body = buf;
      type = contentType || "application/octet-stream";
      key = keyFor(filename);
    }
  }

  await client().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: type,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  return publicUrl(key);
}

/** Presigned PUT for large/direct uploads (e.g. video) that shouldn't proxy through the function. */
export async function presignPut(
  filename: string,
  contentType: string
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const key = keyFor(filename);
  const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType || "application/octet-stream" });
  const uploadUrl = await getSignedUrl(client(), cmd, { expiresIn: 600 });
  return { uploadUrl, publicUrl: publicUrl(key), key };
}
