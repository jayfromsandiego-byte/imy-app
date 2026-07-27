// POST /api/upload/client — mints a short-lived Vercel Blob client token so
// the browser can upload straight to Blob storage, bypassing the platform's
// serverless function body limit entirely (that limit — not our own 25MB
// check — is what actually kills a real phone video or a 48MP HEIC today).
//
// R2 stays paused; this does not touch it. `/api/upload` (the proxied door)
// is untouched too and still carries small files just fine.
//
// Every caller goes through `onBeforeGenerateToken`, which is where the real
// enforcement lives — server-side, never copy-only:
//   - owner-photo / owner-voice: signed-in owner of the tribute (any tier).
//   - owner-video: signed-in owner AND the tribute is Plus (the tape shelf's
//     existing rule — a Free family does not get a video token).
//   - onboarding: the letter, before a tribute row (and so before an owner
//     session) exists. Same shape as today's unauthenticated `/api/upload`
//     during intake — rate-limited, capped, written to a onboarding/ prefix
//     since there is no tributeId yet to pin to.
//   - visitor: the public memory door. Stays public like `/api/upload`, same
//     IP rate limit, and the same caps as every other kind.
//
// `onUploadCompleted` is intentionally left unset — it needs a callback URL
// Vercel can resolve, and that never fires on preview/localhost. The browser
// already knows the uploaded URL the moment `upload()` resolves, so every
// caller keeps registering it the same way it already does today (POST to
// the app's own API/server action) rather than waiting on a webhook that
// would leave preview QA unable to verify anything.
import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { SAFE_MEDIA, kindOf, maxBytesFor, isPathnamePinnedToTribute } from "@/lib/uploadMedia";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClientPayload = {
  kind: "owner-photo" | "owner-voice" | "owner-video" | "onboarding" | "visitor";
  tributeId?: string;
};

function parsePayload(raw: string | null): ClientPayload | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    const kind = p?.kind;
    if (!["owner-photo", "owner-voice", "owner-video", "onboarding", "visitor"].includes(kind)) return null;
    return { kind, tributeId: typeof p.tributeId === "string" ? p.tributeId.slice(0, 80) : undefined };
  } catch {
    return null;
  }
}

async function ownsTribute(tributeId: string, user: any): Promise<boolean> {
  const db = supabaseAdmin();
  const { data } = await db.from("tributes").select("owner_id,owner_email").eq("id", tributeId).maybeSingle();
  if (!data) return false;
  return data.owner_id === user.id || data.owner_email === user.email;
}

async function ownsPlusTribute(tributeId: string, user: any): Promise<boolean> {
  const db = supabaseAdmin();
  const { data } = await db
    .from("tributes")
    .select("owner_id,owner_email,tier")
    .eq("id", tributeId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data || (data.owner_id !== user.id && data.owner_email !== user.email)) return false;
  return data.tier === "plus" || data.tier === "heirloom";
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayloadRaw) => {
        const payload = parsePayload(clientPayloadRaw);
        if (!payload) throw new Error("bad_request");

        if (payload.kind === "owner-photo" || payload.kind === "owner-voice" || payload.kind === "owner-video") {
          const tributeId = payload.tributeId || "";
          if (!isPathnamePinnedToTribute(pathname, tributeId)) throw new Error("bad_pathname");
          const user = await getUser();
          if (!user) throw new Error("unauthorized");
          if (payload.kind === "owner-video") {
            // The tape shelf's own rule, mirrored exactly: video is Plus-only.
            if (!(await ownsPlusTribute(tributeId, user))) throw new Error("plus_required");
          } else {
            if (!(await ownsTribute(tributeId, user))) throw new Error("forbidden");
          }
          const wantKind = payload.kind === "owner-voice" ? "audio" : payload.kind === "owner-video" ? "video" : "image";
          return {
            allowedContentTypes: contentTypesFor(wantKind),
            maximumSizeInBytes: maxBytesForKind(wantKind),
            addRandomSuffix: true,
            tokenPayload: JSON.stringify(payload),
          };
        }

        if (payload.kind === "onboarding") {
          // Pre-account: no tributeId exists yet, so there is nothing to pin to
          // except a dedicated prefix. Same public-ish posture as today's
          // /api/upload during intake — soft rate limit, generous caps.
          if (!pathname.startsWith("onboarding/") || pathname.includes("..")) throw new Error("bad_pathname");
          const { allowed } = rateLimit(`upload-client:onboarding:${clientIp(req)}`, 150, 600_000);
          if (!allowed) throw new Error("rate_limited");
          return {
            allowedContentTypes: [...SAFE_MEDIA_LIST],
            maximumSizeInBytes: MAX_ONBOARDING_BYTES,
            addRandomSuffix: true,
            tokenPayload: JSON.stringify(payload),
          };
        }

        // visitor: the public memory door — same wall as /api/upload, tighter
        // caps than an owner gets, no auth (a stranger leaving a memory has
        // no account).
        if (!pathname.startsWith("visitor/") || pathname.includes("..")) throw new Error("bad_pathname");
        {
          const { allowed } = rateLimit(`upload-client:visitor:${clientIp(req)}`, 150, 600_000);
          if (!allowed) throw new Error("rate_limited");
        }
        return {
          allowedContentTypes: [...SAFE_MEDIA_LIST],
          maximumSizeInBytes: MAX_VISITOR_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify(payload),
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (e: any) {
    const message = String(e?.message || e);
    const status =
      message === "unauthorized" ? 401 :
      message === "forbidden" || message === "plus_required" ? 403 :
      message === "rate_limited" ? 429 :
      message === "bad_pathname" || message === "bad_request" ? 400 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

// Content types are expressed per media kind rather than as one flat list, so
// a caller can never be handed a broader allow-list than its own kind (e.g.
// an "owner-photo" token cannot also mint a video-sized write).
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif", "image/avif"];
const AUDIO_TYPES = ["audio/mpeg", "audio/mp4", "audio/wav", "audio/x-m4a", "audio/aac", "audio/ogg", "audio/webm", "audio/amr", "audio/flac"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/3gpp"];
const SAFE_MEDIA_LIST = [...IMAGE_TYPES, ...AUDIO_TYPES, ...VIDEO_TYPES];

function contentTypesFor(kind: "image" | "audio" | "video"): string[] {
  return kind === "image" ? IMAGE_TYPES : kind === "audio" ? AUDIO_TYPES : VIDEO_TYPES;
}
function maxBytesForKind(kind: "image" | "audio" | "video"): number {
  return kind === "image" ? maxBytesFor("image/jpeg") : kind === "audio" ? maxBytesFor("audio/mpeg") : maxBytesFor("video/mp4");
}
// The onboarding letter and the visitor door both carry every kind (photo,
// voice/audio, video) through one token, so their cap is the largest of the
// three (video) — the per-file SAFE_MEDIA regex on the client and the
// allowedContentTypes above are what actually keep an image from arriving
// oversized in practice; this is the outer wall.
const MAX_ONBOARDING_BYTES = maxBytesFor("video/mp4");
const MAX_VISITOR_BYTES = maxBytesFor("video/mp4");

// Re-exported so this module stays the one place a caller checks "is this
// content-type even something we keep" before ever asking Blob for a token.
export { SAFE_MEDIA, kindOf };
