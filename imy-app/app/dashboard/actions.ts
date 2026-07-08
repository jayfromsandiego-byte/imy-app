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

/** Words left under memories moderate exactly like memories: approve · keep for family · soft-remove. */
export async function moderateComment(formData: FormData) {
  const user = await getUser();
  if (!user) return;
  const id = String(formData.get("id") || "");
  const tributeId = String(formData.get("tributeId") || "");
  const action = String(formData.get("action") || "");
  const db = supabaseAdmin();
  if (!(await ownsTribute(db, tributeId, user))) return;
  if (action === "approve") await db.from("tribute_memory_comments").update({ status: "approved" }).eq("id", id).eq("tribute_id", tributeId);
  else if (action === "hide") await db.from("tribute_memory_comments").update({ status: "hidden" }).eq("id", id).eq("tribute_id", tributeId);
  else if (action === "delete") await db.from("tribute_memory_comments").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("tribute_id", tributeId);
  revalidatePath(`/dashboard/tributes/${tributeId}`);
}

// ===== Photos / media manager =====

/** Append uploaded photo URLs (newline-separated) to a tribute's gallery. */
export async function addTributePhotos(formData: FormData) {
  const user = await getUser();
  if (!user) return;
  const tributeId = String(formData.get("tributeId") || "");
  const urls = String(formData.get("urls") || "")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//.test(s))
    .slice(0, 60);
  if (!urls.length) return;
  const db = supabaseAdmin();
  if (!(await ownsTribute(db, tributeId, user))) return;

  const { data: top } = await db
    .from("tribute_photos")
    .select("sort")
    .eq("tribute_id", tributeId)
    .is("deleted_at", null)
    .order("sort", { ascending: false })
    .limit(1)
    .maybeSingle();
  let sort = (top?.sort ?? -1) + 1;

  await db.from("tribute_photos").insert(urls.map((url) => ({ tribute_id: tributeId, url, sort: sort++ })));
  revalidatePath(`/dashboard/tributes/${tributeId}`);
}

export async function deleteTributePhoto(formData: FormData) {
  const user = await getUser();
  if (!user) return;
  const id = String(formData.get("id") || "");
  const tributeId = String(formData.get("tributeId") || "");
  const db = supabaseAdmin();
  if (!(await ownsTribute(db, tributeId, user))) return;
  await db.from("tribute_photos").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("tribute_id", tributeId);
  revalidatePath(`/dashboard/tributes/${tributeId}`);
}

/** Swap a photo's sort with its neighbour (dir = "up" | "down"). */
export async function moveTributePhoto(formData: FormData) {
  const user = await getUser();
  if (!user) return;
  const id = String(formData.get("id") || "");
  const tributeId = String(formData.get("tributeId") || "");
  const dir = String(formData.get("dir") || "");
  const db = supabaseAdmin();
  if (!(await ownsTribute(db, tributeId, user))) return;

  const { data: photos } = await db
    .from("tribute_photos")
    .select("id,sort")
    .eq("tribute_id", tributeId)
    .is("deleted_at", null)
    .order("sort", { ascending: true });
  if (!photos) return;
  const idx = photos.findIndex((p: any) => p.id === id);
  if (idx < 0) return;
  const swap = dir === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= photos.length) return;
  const a = photos[idx];
  const b = photos[swap];
  await db.from("tribute_photos").update({ sort: b.sort }).eq("id", a.id);
  await db.from("tribute_photos").update({ sort: a.sort }).eq("id", b.id);
  revalidatePath(`/dashboard/tributes/${tributeId}`);
}
