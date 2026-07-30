// POST /api/tribute/[slug]/memory — leave a memory (public).
// Memories are saved as "pending" and appear on the page only after the family
// welcomes them in from the dashboard. Spam is held back with three quiet guards:
// a honeypot field, length caps, and a soft per-IP rate limit. We never reject a
// grieving stranger's words for looking "wrong" — moderation is the family's, not a filter's.
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabaseServer";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { sendMemoryWaitingEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const clean = (v: unknown, max: number) =>
  String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

// A kept URL is https, carries no credentials, and is re-serialized so any stray
// quote or space is percent-encoded — it can never break out of a src="…" attribute.
function keptUrl(value: unknown): string | null {
  try {
    const url = new URL(String(value || ""));
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.toString().slice(0, 600);
  } catch {
    return null;
  }
}

// Visitor video additionally rests only on our own storage hosts (Supabase, R2,
// or Vercel Blob) — the app reads whichever URL env var the deployment sets.
function keptVideoUrl(value: unknown): string | null {
  const kept = keptUrl(value);
  if (!kept) return null;
  const host = new URL(kept).hostname.toLowerCase();
  const allowed = new Set<string>();
  for (const raw of [process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_URL, process.env.R2_PUBLIC_BASE_URL]) {
    try { if (raw) allowed.add(new URL(raw).hostname.toLowerCase()); } catch {}
  }
  if (!allowed.has(host) && !host.endsWith(".public.blob.vercel-storage.com")) return null;
  return kept;
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params.slug === "example" ? "eleanor" : params.slug;

  if (!supabaseConfigured) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // Honeypot: a hidden field real people never see. If it's filled, quietly accept
  // and drop (don't tip off the bot that it was caught).
  if (clean(body.company, 100)) return NextResponse.json({ ok: true, pending: true });

  const text = clean(body.body, 2000);
  const name = clean(body.name, 80) || "A friend";
  const relation = clean(body.relation, 60) || null;
  // Kept private to the family, never rendered publicly (0016).
  const authorEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email || "")) ? clean(body.email, 200) : null;
  // Up to four photographs ride with one memory (0029). Each URL passes the
  // same https re-serialization gate; the first also lands in photo_url so the
  // board pins, the archive, and older reads keep working unchanged.
  const photoUrls = (Array.isArray(body.photoUrls) ? body.photoUrls : [])
    .map(keptUrl)
    .filter((u: string | null): u is string => Boolean(u))
    .slice(0, 4);
  const photoUrl = keptUrl(body.photoUrl) || photoUrls[0] || null;
  const audioUrl = keptUrl(body.audioUrl);
  const videoUrl = keptVideoUrl(body.videoUrl);
  if (text.length < 2) return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });

  const ip = clientIp(req);
  const { allowed } = rateLimit(`memory:${ip}`, 8, 5 * 60_000);
  if (!allowed) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });

  const db = supabaseAdmin();
  const { data: trib } = await db
    .from("tributes")
    .select("id, loved_one_name, owner_email, tier")
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();
  if (!trib) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  // Visitor video may be given on any tier and always waits for family moderation.
  // Free keeps it safely at rest; Plus may publish it. Voice remains a Plus promise.
  const isPlus = trib.tier === "plus" || trib.tier === "heirloom";

  const row: Record<string, unknown> = {
    tribute_id: trib.id,
    author_name: name,
    relation,
    author_email: authorEmail,
    body: text,
    photo_url: photoUrl,
    audio_url: isPlus ? audioUrl : null,
    video_url: videoUrl,
    status: "pending",
  };
  if (photoUrls.length) row.photo_urls = photoUrls;
  let { error } = await db.from("tribute_memories").insert(row);
  if (error && row.photo_urls) {
    // 0029 not applied yet: never refuse a memory over a missing column — the
    // words and the first photograph are kept the pre-0029 way.
    delete row.photo_urls;
    ({ error } = await db.from("tribute_memories").insert(row));
  }
  if (error) return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });

  // Nudge the caretaker when this is the FIRST memory waiting — one gentle
  // email, not one per visitor. Best-effort; no-op until Resend is configured.
  try {
    if (trib.owner_email) {
      const { count } = await db
        .from("tribute_memories")
        .select("id", { count: "exact", head: true })
        .eq("tribute_id", trib.id)
        .eq("status", "pending");
      if (count === 1) {
        await sendMemoryWaitingEmail(trib.owner_email, trib.loved_one_name || "them");
      }
    }
  } catch { /* non-fatal */ }

  return NextResponse.json({ ok: true, pending: true });
}
