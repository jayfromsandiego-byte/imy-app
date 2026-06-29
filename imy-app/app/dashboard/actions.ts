"use server";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseServer";

async function ownsTribute(db: any, tributeId: string, user: any) {
  const { data } = await db.from("tributes").select("owner_id,owner_email").eq("id", tributeId).maybeSingle();
  if (!data) return false;
  return data.owner_id === user.id || data.owner_email === user.email;
}

export async function saveTribute(formData: FormData) {
  const user = await getUser();
  if (!user) return;
  const id = String(formData.get("id") || "");
  const db = supabaseAdmin();
  if (!(await ownsTribute(db, id, user))) return;
  const upd: any = {
    loved_one_name: String(formData.get("loved_one_name") || "").slice(0, 120),
    born_on: String(formData.get("born_on") || "") || null,
    died_on: String(formData.get("died_on") || "") || null,
    place: String(formData.get("place") || "").slice(0, 120) || null,
    portrait_quote: String(formData.get("portrait_quote") || "").slice(0, 300) || null,
    story: String(formData.get("story") || "").slice(0, 8000) || null,
    status: String(formData.get("status") || "draft"),
    visibility: String(formData.get("visibility") || "public"),
  };
  await db.from("tributes").update(upd).eq("id", id);
  revalidatePath(`/dashboard/tributes/${id}`);
  revalidatePath("/dashboard");
}

export async function moderateMemory(formData: FormData) {
  const user = await getUser();
  if (!user) return;
  const id = String(formData.get("id") || "");
  const tributeId = String(formData.get("tributeId") || "");
  const action = String(formData.get("action") || "");
  const db = supabaseAdmin();
  if (!(await ownsTribute(db, tributeId, user))) return;
  if (action === "approve") await db.from("tribute_memories").update({ status: "approved" }).eq("id", id);
  else if (action === "hide") await db.from("tribute_memories").update({ status: "hidden" }).eq("id", id);
  else if (action === "delete") await db.from("tribute_memories").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  revalidatePath(`/dashboard/tributes/${tributeId}`);
}
