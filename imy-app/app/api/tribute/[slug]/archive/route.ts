// GET /api/tribute/[slug]/archive — the Archive (Plus keepsake · July 12).
// One click: every photograph at full resolution, every memory, every voice
// recording, arranged with a cover — a family's whole page, in their hands.
// Owner-only, Plus pages only. Basic export of words stays free elsewhere;
// this is the curated, voice-included edition.
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabaseServer";
import { buildZip, type ZipEntry } from "@/lib/zipStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PER_FILE_CAP = 60 * 1024 * 1024; // one runaway file never sinks the zip
const TOTAL_CAP = 400 * 1024 * 1024; // stay well inside function memory

const esc = (s = "") =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

const extOf = (url: string, fallback: string) => {
  const m = String(url).split("?")[0].match(/\.([a-zA-Z0-9]{2,5})$/);
  return m ? m[1].toLowerCase() : fallback;
};

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  if (!supabaseConfigured) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }
  const user = await getUser();
  if (!user) {
    return NextResponse.redirect(new URL(`/signin?next=/api/tribute/${params.slug}/archive`, req.url), 303);
  }

  const db = supabaseAdmin();
  const { data: rawTribute } = await db
    .from("tributes")
    .select(
      "id,slug,loved_one_name,born_on,died_on,place,tier,owner_id,owner_email,candle_count,flower_count," +
        "tribute_photos(id,url,caption,sort,deleted_at)," +
        "tribute_memories(author_name,relation,body,status,photo_url,audio_url,created_at,deleted_at)," +
        "tribute_audio(url,kind)"
    )
    .eq("slug", params.slug)
    .is("deleted_at", null)
    .maybeSingle();

  // Supabase cannot infer the nested relationship shape from a computed select
  // string. Keep the runtime query unchanged and narrow once at this boundary.
  const t = rawTribute as any;
  if (!t) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  const owns = t.owner_id === user.id || (t.owner_email && t.owner_email === user.email);
  if (!owns) return NextResponse.json({ ok: false, error: "not_yours" }, { status: 403 });
  if (t.tier !== "plus" && t.tier !== "heirloom") {
    return NextResponse.json(
      { ok: false, error: "plus_only", message: "The Archive comes with Plus. Everything you wrote stays yours on every plan." },
      { status: 402 }
    );
  }

  const name = t.loved_one_name || "them";
  const photos = (t.tribute_photos || []).filter((p: any) => !p.deleted_at && p.url).sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0));
  const memories = (t.tribute_memories || []).filter((m: any) => m.status === "approved" && !m.deleted_at);
  const voice = ((t.tribute_audio || []) as any[]).find((a) => a.kind === "voice");

  const entries: ZipEntry[] = [];
  const skipped: string[] = [];
  let total = 0;

  async function pull(url: string, path: string) {
    if (total >= TOTAL_CAP) { skipped.push(path); return null; }
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) { skipped.push(path); return null; }
      const buf = new Uint8Array(await r.arrayBuffer());
      if (buf.length > PER_FILE_CAP || total + buf.length > TOTAL_CAP) { skipped.push(path); return null; }
      total += buf.length;
      entries.push({ name: path, data: buf });
      return path;
    } catch {
      skipped.push(path);
      return null;
    }
  }

  // Photographs, in the family's order.
  const photoRefs: { file: string | null; cap: string }[] = [];
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i];
    const file = await pull(p.url, `photographs/${String(i + 1).padStart(3, "0")}.${extOf(p.url, "jpg")}`);
    photoRefs.push({ file, cap: p.caption || "" });
  }

  // Voices: theirs, and every voice memory.
  let voiceRef: string | null = null;
  if (voice?.url) voiceRef = await pull(voice.url, `voices/their-voice.${extOf(voice.url, "mp3")}`);
  const memRefs: { photo: string | null; audio: string | null }[] = [];
  for (let i = 0; i < memories.length; i++) {
    const m = memories[i];
    const photo = m.photo_url ? await pull(m.photo_url, `memories/photographs/memory-${String(i + 1).padStart(3, "0")}.${extOf(m.photo_url, "jpg")}`) : null;
    const audio = m.audio_url ? await pull(m.audio_url, `voices/memory-${String(i + 1).padStart(3, "0")}.${extOf(m.audio_url, "mp3")}`) : null;
    memRefs.push({ photo, audio });
  }

  // The cover — cream paper, their name, everything indexed.
  const dates = [t.born_on, t.died_on].filter(Boolean).map((d: any) => String(d).slice(0, 4)).join(" · ");
  const memHtml = memories
    .map((m: any, i: number) => {
      const r = memRefs[i] || { photo: null, audio: null };
      return `<div class="mem">
        <div class="who">${esc(m.author_name || "A friend")}${m.relation ? ` · ${esc(m.relation)}` : ""}</div>
        <div class="words">“${esc(m.body || "")}”</div>
        ${r.photo ? `<div class="ref">photograph · <a href="../${r.photo}">${r.photo.split("/").pop()}</a></div>` : ""}
        ${r.audio ? `<div class="ref">their voice · <a href="../${r.audio}">${r.audio.split("/").pop()}</a></div>` : ""}
      </div>`;
    })
    .join("\n");
  const cover = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${esc(name)} · the Archive</title>
<style>
body{background:#FAF5EC;color:#2C2520;font-family:Georgia,'Times New Roman',serif;line-height:1.7;margin:0;padding:48px 7%}
.mono{font-family:'Courier New',monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#8a7f70}
h1{font-size:34px;font-weight:600;margin:10px 0 4px}
h1 em{font-style:italic;color:#A87C5F}
h2{font-size:19px;margin:38px 0 10px;border-bottom:1px solid #e7dcc8;padding-bottom:8px}
a{color:#A87C5F}
.mem{border-left:3px solid #e7dcc8;padding:10px 16px;margin:0 0 16px}
.mem .who{font-weight:700;font-size:14.5px}
.mem .words{font-style:italic;margin-top:4px}
.mem .ref,.cap{font-family:'Courier New',monospace;font-size:11.5px;color:#8a7f70;margin-top:6px}
.note{background:#F3ECDD;border:1px solid #e7dcc8;border-radius:12px;padding:16px 20px;font-size:14.5px;margin-top:30px}
</style></head><body>
<div class="mono">The Archive · kept ${esc(new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }))}</div>
<h1>I <em>Miss</em> You Memorial</h1>
<div style="font-size:22px;margin-top:14px">${esc(name)}${dates ? ` <span class="mono" style="font-size:13px">${esc(dates)}${t.place ? ` · ${esc(t.place)}` : ""}</span>` : ""}</div>
<p style="margin-top:16px">Everything from ${esc(name)}’s page, in your hands: ${photoRefs.filter((p) => p.file).length} photographs, ${memories.length} memories${voiceRef ? ", and their voice" : ""}. Yours, forever — wherever this folder lives.</p>
<h2>Photographs</h2>
${photoRefs.map((p, i) => (p.file ? `<div class="cap">${p.file.split("/").pop()}${p.cap ? ` · ${esc(p.cap)}` : ""}</div>` : "")).join("\n")}
${voiceRef ? `<h2>Their voice</h2><div class="cap"><a href="voices/${voiceRef.split("/").pop()}">${voiceRef.split("/").pop()}</a></div>` : ""}
<h2>The memories</h2>
${memHtml || '<p class="mono">the wall is still gathering</p>'}
<div class="note">${t.candle_count ?? 0} candles lit · ${t.flower_count ?? 0} flowers laid · the page itself stays online, always — this folder is simply yours to hold.${skipped.length ? ` A few files (${skipped.length}) could not be gathered this time; download again and they will try once more.` : ""}</div>
</body></html>`;

  entries.unshift({ name: "cover.html", data: new TextEncoder().encode(cover) });

  const memoriesText = memories
    .map((m: any) => `${m.author_name || "A friend"}${m.relation ? ` · ${m.relation}` : ""}\n“${m.body || ""}”\n`)
    .join("\n");
  entries.push({ name: "memories/the-wall.txt", data: new TextEncoder().encode(memoriesText || "The wall is still gathering.\n") });

  const zip = buildZip(entries);
  const filename = `${t.slug || "tribute"}-archive.zip`;
  return new NextResponse(Buffer.from(zip), {
    status: 200,
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
