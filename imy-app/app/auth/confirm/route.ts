import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServerAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Handles both the PKCE (?code=) and the OTP (?token_hash=&type=) magic-link styles.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const nextParam = searchParams.get("next") || "/dashboard";
  const safeNext = nextParam.startsWith("/") ? nextParam : "/dashboard";
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const supabase = createServerSupabase();
  try {
    if (code) await supabase.auth.exchangeCodeForSession(code);
    else if (tokenHash && type) await supabase.auth.verifyOtp({ type: type as any, token_hash: tokenHash });
  } catch {}
  return NextResponse.redirect(new URL(safeNext, origin));
}
