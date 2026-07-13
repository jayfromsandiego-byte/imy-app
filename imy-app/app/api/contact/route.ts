// POST /api/contact — the contact form's one door. Accepts a plain form post,
// sends the note to the studio inbox with reply-to set to the writer, and walks
// the person back to /contact?sent=1. The same quiet guards as every public
// door: a honeypot, length caps, a soft per-IP rate limit.
import { NextRequest, NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const clean = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

export async function POST(req: NextRequest) {
  const origin = new URL(req.url).origin;
  const back = (ok: boolean) =>
    NextResponse.redirect(new URL(ok ? "/contact?sent=1" : "/contact?sent=1", origin), { status: 303 });

  let p: Record<string, string> = {};
  const ct = req.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) {
      const j = await req.json();
      p = Object.fromEntries(Object.entries(j || {}).map(([k, v]) => [k, String(v ?? "")]));
    } else {
      const form = await req.formData();
      form.forEach((v, k) => { p[k] = String(v); });
    }
  } catch {
    return back(false);
  }

  // Honeypot: quietly accept and drop.
  if (clean(p.company, 100)) return back(true);

  const ip = clientIp(req);
  const { allowed } = rateLimit(`contact:${ip}`, 5, 10 * 60_000);
  if (!allowed) return back(true);

  const name = clean(p.name, 120) || "A visitor";
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(p.email || "")) ? clean(p.email, 200) : "";
  const subject = clean(p.subject, 140) || "A note from the contact page";
  const message = String(p.message ?? "").trim().slice(0, 5000);
  if (!message || !email) return back(false);

  // Best-effort: the redirect never depends on the send.
  try {
    await sendContactEmail({ name, email, subject, message, ip });
  } catch { /* non-fatal */ }

  return back(true);
}
