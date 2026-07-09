"use client";
// VideosManager — the tape shelf's back room (fix 6).
// Add a video by file (browser → Supabase Storage directly, 50MB) or by
// YouTube/Vimeo link. Pair a tape with a photograph and it becomes that
// photograph's Living picture. Videos live on Plus pages; on a free page
// they are kept, resting.
import { useRef, useState } from "react";
import { signVideoUpload, addUploadedVideo, addVideoEmbed, deleteVideo, saveVideoCaption, saveLivingPairs } from "@/app/dashboard/actions";

type Photo = { id: string; url: string };
type Video = { id: string; url: string; caption: string | null };

const C = { ink: "#2C2520", inkSoft: "#5A4F45", terra: "#A87C5F", line: "#E4D9C4", deep: "#F3ECDD", bad: "#8C2F2A" };

const isEmbed = (url: string) =>
  /youtube\.com|youtu\.be/.test(url) ? "youtube" : /vimeo\.com/.test(url) ? "vimeo" : null;

export default function VideosManager({
  tributeId, videos, photos, living, tier,
}: {
  tributeId: string;
  videos: Video[];
  photos: Photo[];
  living: Record<string, string>;
  tier: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [pairs, setPairs] = useState<Record<string, string>>(living || {});
  const [pairsDirty, setPairsDirty] = useState(false);

  async function onPick() {
    const f = fileRef.current?.files?.[0];
    if (!f) return;
    setBusy(true);
    setMsg("Uploading — straight to the shelf…");
    try {
      const sign = await signVideoUpload(tributeId, f.name, f.type, f.size);
      if (!sign.ok) { setMsg(sign.message || "That didn't go through."); setBusy(false); return; }
      const put = await fetch(sign.signedUrl, { method: "PUT", headers: { "Content-Type": f.type, "x-upsert": "false" }, body: f });
      if (!put.ok) { setMsg("The upload didn't hold. Please try again."); setBusy(false); return; }
      const done = await addUploadedVideo(tributeId, sign.path, f.name.replace(/\.[^.]+$/, ""));
      setMsg(done.ok ? "On the shelf." : "Saved the file, but the shelf didn't hear — refresh and check.");
    } catch {
      setMsg("That upload didn't go through. Please try again.");
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  const pairFor = (videoId: string) => Object.entries(pairs).find(([, v]) => v === videoId)?.[0] || "";
  const setPair = (videoId: string, photoId: string) => {
    setPairs((p) => {
      const next: Record<string, string> = {};
      for (const [ph, vid] of Object.entries(p)) if (vid !== videoId) next[ph] = vid;
      if (photoId) next[photoId] = videoId;
      return next;
    });
    setPairsDirty(true);
  };

  const mini: any = { background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: C.ink };
  const sub: any = { color: C.inkSoft, fontSize: 13.5, marginTop: 4, lineHeight: 1.55 };

  return (
    <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 22 }}>
      <h2 style={{ fontWeight: 600, fontSize: "1.2rem" }}>The tape shelf{videos.length ? ` · ${videos.length}` : ""}</h2>
      <p style={sub}>
        Home videos, old films, a phone clip — kept forever. MP4 plays everywhere; keep a
        tape under 50MB (a couple of minutes at phone quality), or bring a YouTube or Vimeo link.
        {tier !== "plus" ? " Videos live on Plus pages — everything you add here is kept, resting, until then." : ""}
      </p>

      {videos.length > 0 && (
        <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
          {videos.map((v) => (
            <div key={v.id} style={{ border: `1px solid ${C.line}`, borderRadius: 11, padding: 12, background: "#FDFAF3", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'Sometype Mono',monospace", fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", background: C.deep, border: `1px solid ${C.line}`, borderRadius: 12, padding: "3px 9px", color: C.inkSoft }}>
                {isEmbed(v.url) || "home video"}
              </span>
              <form action={saveVideoCaption} style={{ display: "flex", gap: 8, flex: "1 1 240px" }}>
                <input type="hidden" name="tributeId" value={tributeId} />
                <input type="hidden" name="id" value={v.id} />
                <input name="caption" defaultValue={v.caption || ""} placeholder="A handwritten label"
                  style={{ flex: 1, padding: "8px 11px", border: `1.5px solid ${C.line}`, borderRadius: 9, fontSize: 14, background: "#fff" }} />
                <button type="submit" style={mini}>Save</button>
              </form>
              {photos.length > 0 && !isEmbed(v.url) && (
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.inkSoft }}>
                  living picture
                  <select value={pairFor(v.id)} onChange={(e) => setPair(v.id, e.target.value)}
                    style={{ padding: "7px 9px", border: `1.5px solid ${C.line}`, borderRadius: 9, fontSize: 13, background: "#fff", maxWidth: 150 }}>
                    <option value="">no photograph</option>
                    {photos.map((p, i) => (
                      <option key={p.id} value={p.id} disabled={!!pairs[p.id] && pairs[p.id] !== v.id}>
                        photo {i + 1}{i === 0 ? " · cover" : ""}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <form action={deleteVideo}>
                <input type="hidden" name="tributeId" value={tributeId} />
                <input type="hidden" name="id" value={v.id} />
                <button type="submit" style={{ ...mini, color: C.bad, borderColor: "#e6cfc9" }} aria-label="Take this tape down">✕</button>
              </form>
            </div>
          ))}
        </div>
      )}

      {pairsDirty && (
        <form action={saveLivingPairs} onSubmit={() => setPairsDirty(false)} style={{ marginTop: 12 }}>
          <input type="hidden" name="tributeId" value={tributeId} />
          <input type="hidden" name="living" value={JSON.stringify(pairs)} />
          <button type="submit" style={{ background: C.terra, color: "#fff", border: "none", fontFamily: "inherit", fontWeight: 600, fontSize: 14, padding: "9px 18px", borderRadius: 30, cursor: "pointer" }}>
            Save living pictures
          </button>
        </form>
      )}

      <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/quicktime" hidden onChange={onPick} />
        <button type="button" disabled={busy} onClick={() => fileRef.current?.click()}
          style={{ background: C.terra, color: "#fff", border: "none", fontFamily: "inherit", fontWeight: 600, fontSize: 14, padding: "10px 20px", borderRadius: 30, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
          {busy ? "Uploading…" : "＋ Add a tape"}
        </button>
        <form action={addVideoEmbed} style={{ display: "flex", gap: 8, flex: "1 1 300px" }}>
          <input type="hidden" name="tributeId" value={tributeId} />
          <input name="url" placeholder="or paste a YouTube / Vimeo link" inputMode="url"
            style={{ flex: 1, padding: "9px 12px", border: `1.5px solid ${C.line}`, borderRadius: 9, fontSize: 14, background: "#fff" }} />
          <button type="submit" style={mini}>Keep it</button>
        </form>
        {msg && <span style={{ fontFamily: "'Sometype Mono',monospace", fontSize: 12, color: C.inkSoft, flexBasis: "100%" }}>{msg}</span>}
      </div>
    </div>
  );
}
