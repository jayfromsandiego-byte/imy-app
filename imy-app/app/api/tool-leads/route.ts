import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabaseServer";

// Email gate for free tools. House rules:
// - The gate sits AFTER the full output is visible, never before.
// - This endpoint must NEVER block a grieving user: any failure still
//   returns ok so the client unlocks the download regardless.
// - Stores only email + tool + variant. No names, no content, no photo —
//   the photo never leaves the browser.
// Table: public.tool_leads (see supabase/migrations/0021_tool_leads.sql).

export async function POST(req: Request) {
  try {
    const { email, tool, variant } = await req.json();
    const clean = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!clean || !clean.includes("@") || clean.length > 320) {
      return NextResponse.json({ ok: false, reason: "invalid" }, { status: 200 });
    }
    if (supabaseConfigured) {
      await supabaseAdmin()
        .from("tool_leads")
        .insert({
          email: clean,
          tool: String(tool || "").slice(0, 80),
          variant: String(variant || "").slice(0, 80),
        });
    }
    return NextResponse.json({ ok: true });
  } catch {
    // Never block the family on our infrastructure.
    return NextResponse.json({ ok: true, stored: false });
  }
}
