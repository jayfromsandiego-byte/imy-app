"use client";
// The quiet password room: choose one once, and the door opens two ways —
// the emailed link keeps working, and /signin accepts the password too.
import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabaseBrowser";

export default function SetPassword() {
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setNote(null);
    if (pw1.length < 8) {
      setNote({ tone: "err", text: "Eight characters or more keeps it safe." });
      return;
    }
    if (pw1 !== pw2) {
      setNote({ tone: "err", text: "Those two don't match yet. One more try." });
      return;
    }
    setBusy(true);
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.updateUser({ password: pw1 });
      if (error) setNote({ tone: "err", text: "That didn't save. Give it a moment and try again." });
      else {
        setPw1(""); setPw2("");
        setNote({ tone: "ok", text: "Kept. From now on, your email and this password sign you in at imissyoumemorial.com/signin — the emailed link keeps working too." });
      }
    } catch {
      setNote({ tone: "err", text: "That didn't save. Give it a moment and try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="story-room" style={{ maxWidth: 440 }}>
      <label style={{ display: "block" }}>
        <span className="field-label">New password</span>
        <input className="field-input" type="password" autoComplete="new-password" value={pw1}
          onChange={(e) => setPw1(e.target.value)} placeholder="Eight characters or more" />
      </label>
      <label style={{ display: "block", marginTop: 14 }}>
        <span className="field-label">Once more</span>
        <input className="field-input" type="password" autoComplete="new-password" value={pw2}
          onChange={(e) => setPw2(e.target.value)} placeholder="The same, again" />
      </label>
      <button type="submit" className="btn primary" style={{ marginTop: 20 }} disabled={busy}>
        {busy ? "Keeping it safe…" : "Keep this password"}
      </button>
      {note ? (
        <p className="panel-sub" style={{ marginTop: 12, color: note.tone === "err" ? "#8C2F2A" : undefined }}>
          {note.text}
        </p>
      ) : null}
    </form>
  );
}
