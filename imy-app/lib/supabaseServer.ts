// lib/supabaseServer.ts — Supabase clients for the I Miss You Memorial app.
// Server-only admin client (service role) + a public (anon) client.
//
// IMPORTANT: every client here pins `cache: "no-store"` on its fetches.
// Next.js's Data Cache memoizes plain fetch() GETs made inside route handlers
// across requests — without no-store, a tribute page keeps serving the data
// from its very first render: approved memories never appear, Family Unlock
// never wakes the wall, counters freeze. (Found by launch QA, July 6.)
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/** fetch that always bypasses the Next.js Data Cache — live data, every render. */
const freshFetch: typeof fetch = (input, init) =>
  fetch(input, { ...(init || {}), cache: "no-store" });

let _admin: SupabaseClient | null = null;

/** Server-only client (service role; bypasses RLS). NEVER import into a client component. */
export function supabaseAdmin(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(URL, SERVICE, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: freshFetch },
    });
  }
  return _admin;
}

/** Public client (anon key; subject to RLS). Safe for reads of published data. */
export function supabasePublic(): SupabaseClient {
  return createClient(URL, ANON, {
    auth: { persistSession: false },
    global: { fetch: freshFetch },
  });
}

/** True when the core Supabase env is present (lets callers fall back gracefully). */
export const supabaseConfigured = Boolean(URL && (SERVICE || ANON));
