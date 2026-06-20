// POST /api/assist — the writing assistant.
// Works as soon as OPENAI_API_KEY is set in Vercel; until then it returns a
// graceful, kind fallback so the UI never feels broken.
// Body: { prompt: string, name?: string }

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM =
  "You are a warm, plain-spoken writing companion for a grief memorial product. " +
  "Help the person turn a few true details into one or two tender, dignified sentences. " +
  "Never flowery, never churchy, never clichéd. Short. The words stay theirs.";

export async function POST(req: NextRequest) {
  let body: any = {};
  try { body = await req.json(); } catch {}
  const prompt = (body.prompt || "").toString().slice(0, 1200);
  const name = (body.name || "your loved one").toString();
  if (!prompt.trim()) {
    return NextResponse.json({ ok: false, error: "Tell me one true thing to start." }, { status: 400 });
  }

  const key = process.env.OPENAI_API_KEY;
  if (key) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: process.env.ASSIST_MODEL || "gpt-4o-mini",
          temperature: 0.7,
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: `About ${name}. ${prompt}` },
          ],
        }),
      });
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content?.trim();
      if (text) return NextResponse.json({ ok: true, text });
    } catch {
      /* fall through to fallback */
    }
  }

  // Fallback (no key configured) — still helpful, shapes their own words.
  const seed = prompt.trim().replace(/\s+/g, " ");
  const text =
    `Here's a gentle start you can make your own:\n\n` +
    `"${seed.charAt(0).toUpperCase() + seed.slice(1)}${/[.!?]$/.test(seed) ? "" : "."}" ` +
    `\n\nKeep going — add one more small, true detail and it will feel like them.`;
  return NextResponse.json({ ok: true, text, fallback: true });
}
