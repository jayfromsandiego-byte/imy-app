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
  // Years must be plausible (fix 8): 1900 through this year, passing not before
  // birth. An implausible date never overwrites what the family already has —
  // the field is simply left unchanged.
  const nowYear = new Date().getFullYear();
  const plausible = (v: string): string | null | undefined => {
    if (!v) return null; // cleared on purpose
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
    const y = Number(v.slice(0, 4));
    return y >= 1900 && y <= nowYear ? v : undefined;
  };
  let bornOn = plausible(String(formData.get("born_on") || ""));
  let diedOn = plausible(String(formData.get("died_on") || ""));
  if (typeof bornOn === "string" && typeof diedOn === "string" && diedOn < bornOn) diedOn = undefined;
  const upd: any = {
    loved_one_name: String(formData.get("loved_one_name") || "").slice(0, 120),
    ...(bornOn !== undefined ? { born_on: bornOn } : {}),
    ...(diedOn !== undefined ? { died_on: diedOn } : {}),
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

// ── Where each photograph lives (fix 3 + fix 4 + fix 8) ──────────────────────
// One save carries the family's placements (quote · board · chapters) and their
// edited timeline (years checked server-side: inside the life, 1900–now).
// Implausible years are set aside quietly; the words are always kept.
export async function savePlacements(formData: FormData) {
  const user = await getUser();
  if (!user) return;
  const tributeId = String(formData.get("tributeId") || "");
  const db = supabaseAdmin();
  if (!(await ownsTribute(db, tributeId, user))) return;

  const { data: t } = await db.from("tributes").select("id,born_on,died_on,placements").eq("id", tributeId).maybeSingle();
  if (!t) return;
  const { data: photoRows } = await db.from("tribute_photos").select("id").eq("tribute_id", tributeId).is("deleted_at", null);
  const photoIds = new Set((photoRows || []).map((p: any) => String(p.id)));

  let pl: any = {};
  let rows: any[] = [];
  try { pl = JSON.parse(String(formData.get("placements") || "{}")) || {}; } catch { pl = {}; }
  try { rows = JSON.parse(String(formData.get("timeline") || "[]")) || []; } catch { rows = []; }
  if (!Array.isArray(rows)) rows = [];
  rows = rows.slice(0, 40);

  // Timeline sync: update kept rows, insert new ones, remove the rest.
  const nowYear = new Date().getFullYear();
  const bY = t.born_on ? Number(String(t.born_on).slice(0, 4)) : 1900;
  const dY = t.died_on ? Number(String(t.died_on).slice(0, 4)) : nowYear;
  const lo = Math.max(1900, bY);
  const hi = Math.min(nowYear, dY);
  const cleanYear = (v: any): string => {
    const s = String(v ?? "").trim();
    if (!/^\d{4}$/.test(s)) return "";
    const y = Number(s);
    return y >= lo && y <= hi ? s : "";
  };

  const { data: existing } = await db.from("tribute_timeline").select("id").eq("tribute_id", tributeId);
  const existingIds = new Set((existing || []).map((r: any) => String(r.id)));
  const keptIds = new Set<string>();
  const keyToId: Record<string, string> = {};

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] || {};
    const title = String(r.title || "").slice(0, 140).trim();
    const year = cleanYear(r.year);
    if (!title && !year) continue; // an empty line is not a moment
    if (r.id && existingIds.has(String(r.id))) {
      keptIds.add(String(r.id));
      await db.from("tribute_timeline").update({ year, title, sort: i }).eq("id", r.id).eq("tribute_id", tributeId);
    } else if (!r.id) {
      const { data: ins } = await db.from("tribute_timeline")
        .insert({ tribute_id: tributeId, year, title, body: "", sort: i })
        .select("id").single();
      if (ins?.id && r.k) keyToId[String(r.k)] = String(ins.id);
      if (ins?.id) keptIds.add(String(ins.id));
    }
  }
  const toRemove = [...existingIds].filter((id) => !keptIds.has(id));
  if (toRemove.length) {
    await db.from("tribute_timeline").delete().in("id", toRemove).eq("tribute_id", tributeId);
  }

  // Placements: only this tribute's photos, only known shapes.
  const quote = typeof pl.quote === "string" && photoIds.has(pl.quote) ? pl.quote : undefined;
  const board = Array.isArray(pl.board) ? pl.board.filter((id: any) => typeof id === "string" && photoIds.has(id)).slice(0, 24) : [];
  const chaptersIn = pl.chapters && typeof pl.chapters === "object" ? pl.chapters : {};
  const chapters: Record<string, string[]> = {};
  for (const [key, val] of Object.entries(chaptersIn)) {
    const realKey = keyToId[key] || key;
    if (realKey !== "_group" && !keptIds.has(realKey) && !existingIds.has(realKey)) continue;
    const ids = (Array.isArray(val) ? val : []).filter((id: any) => typeof id === "string" && photoIds.has(id)).slice(0, 6);
    if (realKey === "_group" || ids.length) chapters[realKey] = realKey === "_group" ? (Array.isArray(val) ? val.filter((id: any) => photoIds.has(id)) : []) : ids;
  }

  const placements = { ...(quote ? { quote } : {}), board, chapters };
  await db.from("tributes").update({ placements }).eq("id", tributeId);
  revalidatePath(`/dashboard/tributes/${tributeId}`);
  revalidatePath("/dashboard");
}
