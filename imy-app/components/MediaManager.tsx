"use client";
// MediaManager — the owner's photo manager on the tribute edit page.
// Uploads go to /api/upload (R2 with WebP optimization, or Blob fallback); the
// returned URLs are saved via the addTributePhotos server action. Reorder/delete
// are plain server-action forms, so they work even without client JS.
import { useRef, useState } from "react";
import { addTributePhotos, deleteTributePhoto, moveTributePhoto } from "@/app/dashboard/actions";

type Photo = { id: string; url: string; sort: number };

const C = { ink: "#2C2520", inkSoft: "#5A4F45", terra: "#A87C5F", line: "#E4D9C4", deep: "#F3ECDD", bad: "#8C2F2A" };

export default function MediaManager({ tributeId, photos }: { tributeId: string; photos: Photo[] }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const urlsRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function onPick() {
    const files = fileRef.current?.files;
    if (!files || !files.length) return;
    setBusy(true);
    setMsg("Uploading…");
    const urls: string[] = [];
    try {
      for (const f of Array.from(files)) {
        const fd = new FormData();
        fd.append("files", f);
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        const d = await r.json().catch(() => null);
        if (r.ok && d?.ok && Array.isArray(d.urls)) {
          urls.push(...d.urls);
        } else if (r.status === 501) {
          setMsg("Storage isn't connected yet — add Cloudflare R2 to enable photo uploads.");
          setBusy(false);
          return;
        } else if (r.status === 413) {
          setMsg("One of those files is over 25MB. Large videos need the direct upload (coming with R2).");
        } else {
          setMsg("That upload didn't go through. Please try again.");
        }
      }
      if (urls.length && urlsRef.current && formRef.current) {
        urlsRef.current.value = urls.join("\n");
        formRef.current.requestSubmit();
        setMsg("Added.");
      }
    } catch {
      setMsg("That upload didn't go through. Please try again.");
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  const btn: any = { background: C.terra, color: "#fff", border: "none", fontFamily: "inherit", fontWeight: 600, fontSize: 14, padding: "10px 20px", borderRadius: 30, cursor: "pointer" };
  const mini: any = { background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "4px 9px", cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: C.ink };

  return (
    <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 22 }}>
      <h2 style={{ fontWeight: 600, fontSize: "1.2rem" }}>Photos{photos.length ? ` · ${photos.length}` : ""}</h2>
      <p style={{ color: C.inkSoft, marginTop: 6, fontSize: 14 }}>
        The first photo becomes their Memorial Stone and portrait. Drag isn’t needed — use the arrows to reorder.
      </p>

      {photos.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 12, marginTop: 16 }}>
          {photos.map((p, idx) => (
            <div key={p.id} style={{ border: `1px solid ${C.line}`, borderRadius: 11, overflow: "hidden", background: C.deep }}>
              <div style={{ position: "relative", aspectRatio: "1", background: `center/cover url('${p.url}')` }}>
                {idx === 0 && (
                  <span style={{ position: "absolute", top: 6, left: 6, background: "rgba(168,124,95,.95)", color: "#fff", fontFamily: "'Sometype Mono',monospace", fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 20 }}>Cover</span>
                )}
              </div>
              <div style={{ display: "flex", gap: 6, padding: 8, justifyContent: "space-between" }}>
                <form action={moveTributePhoto}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="tributeId" value={tributeId} />
                  <input type="hidden" name="dir" value="up" />
                  <button type="submit" disabled={idx === 0} style={{ ...mini, opacity: idx === 0 ? 0.4 : 1 }} aria-label="Move earlier">↑</button>
                </form>
                <form action={moveTributePhoto}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="tributeId" value={tributeId} />
                  <input type="hidden" name="dir" value="down" />
                  <button type="submit" disabled={idx === photos.length - 1} style={{ ...mini, opacity: idx === photos.length - 1 ? 0.4 : 1 }} aria-label="Move later">↓</button>
                </form>
                <form action={deleteTributePhoto}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="tributeId" value={tributeId} />
                  <button type="submit" style={{ ...mini, color: C.bad, borderColor: "#e6cfc9" }} aria-label="Remove">✕</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onPick} />
        <button type="button" style={{ ...btn, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? "Uploading…" : "＋ Add photos"}
        </button>
        {msg && <span style={{ fontFamily: "'Sometype Mono',monospace", fontSize: 12, color: C.inkSoft }}>{msg}</span>}
      </div>

      {/* Hidden form that persists uploaded URLs via the server action. */}
      <form ref={formRef} action={addTributePhotos} style={{ display: "none" }}>
        <input type="hidden" name="tributeId" value={tributeId} />
        <textarea ref={urlsRef} name="urls" defaultValue="" />
      </form>
    </div>
  );
}
