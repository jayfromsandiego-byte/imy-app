import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServerAuth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try { const supabase = createServerSupabase(); await supabase.auth.signOut(); } catch {}
  return NextResponse.redirect(new URL("/", new URL(req.url).origin), { status: 303 });
}
