import { createServerSupabase, authConfigured } from "./supabaseServerAuth";

export async function getUser() {
  if (!authConfigured) return null;
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch {
    return null;
  }
}
