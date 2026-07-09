"use client";
// VoiceKeeper — their voice, kept (July 9).
// One recording per tribute: a voicemail, a voice memo, a message. It plays on
// the page under "Their voice · kept" (Plus); on a free page it rests, held.
import { useRef, useState } from "react";
import { setTributeVoice, removeTributeVoice } from "@/app/dashboard/actions";

const C = { ink: "#2C2520", inkSoft: "#5A4F45", terra: "#A87C5F", line: "#E4D9C4", bad: "#8C2F2A" };

export default function VoiceKeeper({
  tributeId, voiceUrl, tier,
}: {
  tributeId: string;
  voiceUrl: string | null;
  tier: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function onPick() {
    const f = fileRef.current?.files?.[0];
    if (!f) return;
    if (f.size > 25 * 1024 * 1024) { setMsg("Keep a recording under 25MB — a shorter clip lands just fine."); return; }
    setBusy(true);
    setMsg("Keeping the voice safe…");
    try {
      const fd = new FormData();
      fd.append("files", f);
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await r.json().catch(() => null);
      if (r.ok && d?.ok && d.urls?.[0] && urlRef.current && formRef.current) {
        urlRef.current.value = d.urls[0];
        formRef.current.requestSubmit();
        setMsg("Kept.");
      } else {
        setMsg("That didn't upload. Give it a moment and try again.");
      }
    } catch {
      setMsg("That didn't upload. Give it a moment and try again.");
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 22 }}>
      <h2 style={{ fontWeight: 600, fontSize: "1.2rem" }}>Their voice</h2>
      <p style={{ color: C.inkSoft, fontSize: 13.5, marginTop: 4, lineHeight: 1.55 }}>
        A voicemail, a voice memo, a message saved from a phone — one recording, kept.
        It plays on the page under &ldquo;Their voice · kept.&rdquo;
        {tier !== "plus" ? " Voices live on Plus pages — a recording added here is kept, resting, until then." : ""}
      </p>

      {voiceUrl ? (
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <audio controls preload="none" src={voiceUrl} style={{ flex: "1 1 280px", height: 36 }} />
          <form action={removeTributeVoice}>
            <input type="hidden" name="tributeId" value={tributeId} />
            <button type="submit" style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: C.bad, fontSize: 13, fontFamily: "inherit" }}>
              Take it down
            </button>
          </form>
        </div>
      ) : null}

      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <input ref={fileRef} type="file" accept="audio/*" hidden onChange={onPick} />
        <button type="button" disabled={busy} onClick={() => fileRef.current?.click()}
          style={{ background: C.terra, color: "#fff", border: "none", fontFamily: "inherit", fontWeight: 600, fontSize: 14, padding: "10px 20px", borderRadius: 30, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
          {busy ? "Keeping it safe…" : voiceUrl ? "Replace the recording" : "＋ Keep a voice"}
        </button>
        {msg && <span style={{ fontFamily: "'Sometype Mono',monospace", fontSize: 12, color: C.inkSoft }}>{msg}</span>}
      </div>

      <form ref={formRef} action={setTributeVoice} style={{ display: "none" }}>
        <input type="hidden" name="tributeId" value={tributeId} />
        <input ref={urlRef} type="hidden" name="url" defaultValue="" />
      </form>
    </div>
  );
}
