"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
    obituary: String(formData.get("obituary") || "").slice(0, 12000) || null,
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
  revalidatePath("/dashboard/waiting");
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
  revalidatePath("/dashboard/waiting");
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
  let chapterList: any[] = [];
  try { pl = JSON.parse(String(formData.get("placements") || "{}")) || {}; } catch { pl = {}; }
  try { rows = JSON.parse(String(formData.get("timeline") || "[]")) || []; } catch { rows = []; }
  try { chapterList = JSON.parse(String(formData.get("chapters") || "[]")) || []; } catch { chapterList = []; }
  if (!Array.isArray(rows)) rows = [];
  if (!Array.isArray(chapterList)) chapterList = [];
  rows = rows.slice(0, 40);
  chapterList = chapterList.slice(0, 12);

  // Chapters sync (0017): update kept titles in order, welcome new ones,
  // release the removed (their moments quietly become unplaced — set null).
  const { data: existingCh } = await db.from("tribute_chapters").select("id").eq("tribute_id", tributeId).is("deleted_at", null);
  const existingChIds = new Set((existingCh || []).map((c: any) => String(c.id)));
  const keptChIds = new Set<string>();
  const ckToChId: Record<string, string> = {};
  for (let i = 0; i < chapterList.length; i++) {
    const c = chapterList[i] || {};
    const title = String(c.title || "").slice(0, 80).trim();
    if (!title) continue; // a chapter with no name is not yet a chapter
    if (c.id && existingChIds.has(String(c.id))) {
      keptChIds.add(String(c.id));
      await db.from("tribute_chapters").update({ title, sort: i }).eq("id", c.id).eq("tribute_id", tributeId);
    } else if (!c.id) {
      const { data: insCh } = await db.from("tribute_chapters")
        .insert({ tribute_id: tributeId, title, sort: i })
        .select("id").single();
      if (insCh?.id) {
        keptChIds.add(String(insCh.id));
        if (c.ck) ckToChId[String(c.ck)] = String(insCh.id);
      }
    }
  }
  const chToRemove = [...existingChIds].filter((id) => !keptChIds.has(id));
  if (chToRemove.length) {
    // Chapters rest, they are not destroyed (0018) — and their moments are
    // quietly released back to the unplaced gathering.
    await db.from("tribute_chapters").update({ deleted_at: new Date().toISOString() }).in("id", chToRemove).eq("tribute_id", tributeId);
    await db.from("tribute_timeline").update({ chapter_id: null }).in("chapter_id", chToRemove).eq("tribute_id", tributeId);
  }
  const chapterIdFor = (v: any): string | null => {
    const key = String(v || "");
    if (!key) return null;
    const real = ckToChId[key] || key;
    return keptChIds.has(real) ? real : null;
  };

  // Timeline sync: update kept rows, insert new ones, remove the rest.
  // Years are plausible (1900–now), not life-bound — timelines legitimately
  // hold family history from before a birth and moments from after.
  const nowYear = new Date().getFullYear();
  const cleanYear = (v: any): string => {
    const s = String(v ?? "").trim();
    if (!/^\d{4}$/.test(s)) return "";
    const y = Number(s);
    return y >= 1900 && y <= nowYear ? s : "";
  };

  const { data: existing } = await db.from("tribute_timeline").select("id").eq("tribute_id", tributeId).is("deleted_at", null);
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
      await db.from("tribute_timeline").update({ year, title, sort: i, chapter_id: chapterIdFor(r.ch) }).eq("id", r.id).eq("tribute_id", tributeId);
    } else if (!r.id) {
      const { data: ins } = await db.from("tribute_timeline")
        .insert({ tribute_id: tributeId, year, title, body: "", sort: i, chapter_id: chapterIdFor(r.ch) })
        .select("id").single();
      if (ins?.id && r.k) keyToId[String(r.k)] = String(ins.id);
      if (ins?.id) keptIds.add(String(ins.id));
    }
  }
  const toRemove = [...existingIds].filter((id) => !keptIds.has(id));
  if (toRemove.length) {
    // A moment a family removes still rests in the ground, never destroyed —
    // the same mark every other kind of content carries (0018).
    await db.from("tribute_timeline").update({ deleted_at: new Date().toISOString() }).in("id", toRemove).eq("tribute_id", tributeId);
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

  // Merge over what's already kept (living pairs and future keys survive).
  const prev = t.placements && typeof t.placements === "object" ? (t.placements as any) : {};
  const placements: any = { ...prev, board, chapters };
  if (quote) placements.quote = quote; else delete placements.quote;
  await db.from("tributes").update({ placements }).eq("id", tributeId);
  revalidatePath(`/dashboard/tributes/${tributeId}`);
  revalidatePath("/dashboard");
}

// ── The tape shelf (fix 6) ────────────────────────────────────────────────────
// Uploads go browser → Supabase Storage directly (signed URL — no function
// body limits); embeds are YouTube/Vimeo links, strictly parsed. Videos pair
// with photographs to become Living pictures (placements.living).

const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const VIDEO_MAX = 50 * 1024 * 1024;

export async function signVideoUpload(tributeId: string, filename: string, type: string, size: number) {
  const user = await getUser();
  if (!user) return { ok: false as const, message: "Please sign in again." };
  const db = supabaseAdmin();
  if (!(await ownsTribute(db, tributeId, user))) return { ok: false as const, message: "Not yours to change." };
  if (!VIDEO_TYPES.includes(type)) return { ok: false as const, message: "MP4, WebM, or MOV, please." };
  if (size > VIDEO_MAX) return { ok: false as const, message: "Keep a tape under 50MB — MP4 at phone quality holds a couple of minutes." };
  const safe = (filename || "video").replace(/[^\w.\-]+/g, "_").slice(-60);
  const path = `videos/${tributeId}/${Date.now()}-${safe}`;
  const { data, error } = await db.storage.from("tribute-media").createSignedUploadUrl(path);
  if (error || !data) return { ok: false as const, message: "The shelf isn't reachable right now. Try again in a moment." };
  return { ok: true as const, signedUrl: data.signedUrl, path };
}

export async function addUploadedVideo(tributeId: string, path: string, caption: string) {
  const user = await getUser();
  if (!user) return { ok: false as const };
  const db = supabaseAdmin();
  if (!(await ownsTribute(db, tributeId, user))) return { ok: false as const };
  if (!path.startsWith(`videos/${tributeId}/`)) return { ok: false as const };
  const { data: pub } = db.storage.from("tribute-media").getPublicUrl(path);
  if (!pub?.publicUrl) return { ok: false as const };
  const { data: sortRows } = await db.from("tribute_videos").select("sort").eq("tribute_id", tributeId).order("sort", { ascending: false }).limit(1);
  const nextSort = ((sortRows?.[0]?.sort as number) ?? -1) + 1;
  await db.from("tribute_videos").insert({ tribute_id: tributeId, url: pub.publicUrl, caption: String(caption || "").slice(0, 120) || null, sort: nextSort });
  revalidatePath(`/dashboard/tributes/${tributeId}`);
  return { ok: true as const };
}

export async function addVideoEmbed(formData: FormData) {
  const user = await getUser();
  if (!user) return;
  const tributeId = String(formData.get("tributeId") || "");
  const db = supabaseAdmin();
  if (!(await ownsTribute(db, tributeId, user))) return;
  const raw = String(formData.get("url") || "").trim().slice(0, 300);
  // Strictly parsed: only a recognized YouTube/Vimeo id is kept, rebuilt clean.
  const yt = raw.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,20})/);
  const vm = raw.match(/vimeo\.com\/(?:video\/)?(\d{6,15})/);
  const url = yt ? `https://www.youtube.com/watch?v=${yt[1]}` : vm ? `https://vimeo.com/${vm[1]}` : null;
  if (!url) return;
  const { data: sortRows } = await db.from("tribute_videos").select("sort").eq("tribute_id", tributeId).order("sort", { ascending: false }).limit(1);
  const nextSort = ((sortRows?.[0]?.sort as number) ?? -1) + 1;
  await db.from("tribute_videos").insert({ tribute_id: tributeId, url, caption: String(formData.get("caption") || "").slice(0, 120) || null, sort: nextSort });
  revalidatePath(`/dashboard/tributes/${tributeId}`);
}

export async function deleteVideo(formData: FormData) {
  const user = await getUser();
  if (!user) return;
  const tributeId = String(formData.get("tributeId") || "");
  const id = String(formData.get("id") || "");
  const db = supabaseAdmin();
  if (!(await ownsTribute(db, tributeId, user))) return;
  // The row leaves the shelf; the file itself is never destroyed.
  await db.from("tribute_videos").delete().eq("id", id).eq("tribute_id", tributeId);
  const { data: t } = await db.from("tributes").select("placements").eq("id", tributeId).maybeSingle();
  const prev = t?.placements && typeof t.placements === "object" ? (t.placements as any) : {};
  if (prev.living && typeof prev.living === "object") {
    const living: Record<string, string> = {};
    for (const [ph, vid] of Object.entries(prev.living)) if (vid !== id) living[ph] = vid as string;
    await db.from("tributes").update({ placements: { ...prev, living } }).eq("id", tributeId);
  }
  revalidatePath(`/dashboard/tributes/${tributeId}`);
}

export async function saveVideoCaption(formData: FormData) {
  const user = await getUser();
  if (!user) return;
  const tributeId = String(formData.get("tributeId") || "");
  const id = String(formData.get("id") || "");
  const db = supabaseAdmin();
  if (!(await ownsTribute(db, tributeId, user))) return;
  await db.from("tribute_videos").update({ caption: String(formData.get("caption") || "").slice(0, 120) || null }).eq("id", id).eq("tribute_id", tributeId);
  revalidatePath(`/dashboard/tributes/${tributeId}`);
}

export async function saveLivingPairs(formData: FormData) {
  const user = await getUser();
  if (!user) return;
  const tributeId = String(formData.get("tributeId") || "");
  const db = supabaseAdmin();
  if (!(await ownsTribute(db, tributeId, user))) return;
  let pairs: any = {};
  try { pairs = JSON.parse(String(formData.get("living") || "{}")) || {}; } catch { pairs = {}; }
  const { data: t } = await db.from("tributes").select("placements").eq("id", tributeId).maybeSingle();
  const { data: photoRows } = await db.from("tribute_photos").select("id").eq("tribute_id", tributeId).is("deleted_at", null);
  const { data: videoRows } = await db.from("tribute_videos").select("id").eq("tribute_id", tributeId);
  const photoIds = new Set((photoRows || []).map((p: any) => String(p.id)));
  const videoIds = new Set((videoRows || []).map((v: any) => String(v.id)));
  const living: Record<string, string> = {};
  for (const [ph, vid] of Object.entries(pairs)) {
    if (photoIds.has(String(ph)) && typeof vid === "string" && videoIds.has(vid)) living[String(ph)] = vid;
  }
  const prev = t?.placements && typeof t.placements === "object" ? (t.placements as any) : {};
  await db.from("tributes").update({ placements: { ...prev, living } }).eq("id", tributeId);
  revalidatePath(`/dashboard/tributes/${tributeId}`);
}

// ── The order of the rooms (fix 7) ────────────────────────────────────────────
// The family's arrangement: order (their sequence) and hidden (rooms resting).
// Only known rooms are kept; the Memorial Stone is never part of the list.
export async function saveSections(formData: FormData) {
  const user = await getUser();
  if (!user) return;
  const tributeId = String(formData.get("tributeId") || "");
  const db = supabaseAdmin();
  if (!(await ownsTribute(db, tributeId, user))) return;
  const KNOWN = ["story", "quote", "gallery", "really", "memories", "keep"];
  let plan: any = {};
  try { plan = JSON.parse(String(formData.get("sections") || "{}")) || {}; } catch { plan = {}; }
  const order = (Array.isArray(plan.order) ? plan.order : [])
    .filter((k: any, i: number, a: any[]) => KNOWN.includes(k) && a.indexOf(k) === i);
  const hidden = (Array.isArray(plan.hidden) ? plan.hidden : [])
    .filter((k: any, i: number, a: any[]) => KNOWN.includes(k) && a.indexOf(k) === i);
  await db.from("tributes").update({ sections: { order, hidden } }).eq("id", tributeId);
  revalidatePath(`/dashboard/tributes/${tributeId}`);
}

// ── Their voice (July 9) ──────────────────────────────────────────────────────
// The tribute's own kept recording — one voice, replaceable, never lost by
// accident (replacing swaps the row; the old file itself is never destroyed).
export async function setTributeVoice(formData: FormData) {
  const user = await getUser();
  if (!user) return;
  const tributeId = String(formData.get("tributeId") || "");
  const url = String(formData.get("url") || "");
  if (!/^https:\/\//.test(url)) return;
  const db = supabaseAdmin();
  if (!(await ownsTribute(db, tributeId, user))) return;
  await db.from("tribute_audio").delete().eq("tribute_id", tributeId).eq("kind", "voice");
  await db.from("tribute_audio").insert({ tribute_id: tributeId, url: url.slice(0, 600), kind: "voice", caption: "A voice to keep" });
  revalidatePath(`/dashboard/tributes/${tributeId}`);
}

export async function removeTributeVoice(formData: FormData) {
  const user = await getUser();
  if (!user) return;
  const tributeId = String(formData.get("tributeId") || "");
  const db = supabaseAdmin();
  if (!(await ownsTribute(db, tributeId, user))) return;
  await db.from("tribute_audio").delete().eq("tribute_id", tributeId).eq("kind", "voice");
  revalidatePath(`/dashboard/tributes/${tributeId}`);
}


/** Rest a page (July 12): the owner's soft delete. The page leaves the public
 *  web and the desk's main list, but nothing is ever hard-deleted — it waits,
 *  whole, and can be returned to the light any time. */
export async function restTribute(formData: FormData) {
  const user = await getUser();
  if (!user) return;
  const id = String(formData.get("id") || "");
  const db = supabaseAdmin();
  if (!(await ownsTribute(db, id, user))) return;
  await db.from("tributes").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

/** Return a resting page to the light — everything exactly as it was. */
export async function wakeTribute(formData: FormData) {
  const user = await getUser();
  if (!user) return;
  const id = String(formData.get("id") || "");
  const db = supabaseAdmin();
  if (!(await ownsTribute(db, id, user))) return;
  await db.from("tributes").update({ deleted_at: null }).eq("id", id);
  revalidatePath("/dashboard");
}

/** The Year Letter's chosen day (Plus keepsake · July 12). Empty = their birthday. */
export async function setYearLetterDate(formData: FormData) {
  const user = await getUser();
  if (!user) return;
  const id = String(formData.get("id") || "");
  const raw = String(formData.get("year_letter_md") || "").trim();
  // Accepts a date input (YYYY-MM-DD) or a bare MM-DD; empty clears to their birthday.
  let md: string | null = null;
  const m = raw.match(/^(?:\d{4}-)?(\d{2}-\d{2})$/);
  if (m) md = m[1];
  if (raw && !m) return;
  const db = supabaseAdmin();
  if (!(await ownsTribute(db, id, user))) return;
  await db.from("tributes").update({ year_letter_md: md }).eq("id", id);
  revalidatePath(`/dashboard/tributes/${id}`);
}
