import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const authConfigured = Boolean(URL && ANON);

// Every fetch pins cache:"no-store" — Next's Data Cache otherwise memoizes GETs
// across requests, freezing dashboard reads at their first render. (Launch QA, July 6.)
const freshFetch: typeof fetch = (input, init) =>
  fetch(input, { ...(init || {}), cache: "no-store" });

// Server client for Server Components, Server Actions, and Route Handlers.
export function createServerSupabase() {
  const store = cookies();
  return createServerClient(URL, ANON, {
    global: { fetch: freshFetch },
    cookies: {
      getAll() { return store.getAll(); },
      setAll(list: { name: string; value: string; options: any }[]) {
        try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch {}
      },
    },
  });
}
