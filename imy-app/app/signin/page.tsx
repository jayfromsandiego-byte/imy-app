"use client";
import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabaseBrowser";

const C = { cream: "#FAF5EC", ink: "#2C2520", inkSoft: "#5A4F45", terra: "#A87C5F", terraDeep: "#8B5E3C", line: "#E4D9C4" };

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const supabase = createBrowserSupabase();
      const next = new URLSearchParams(window.location.search).get("next") || "/dashboard";
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}` },
      });
      if (error) setErr(error.message); else setSent(true);
    } catch { setErr("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.cream, color: C.ink, fontFamily: "'Besley',Georgia,serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <link href="https://fonts.googleapis.com/css2?family=Besley:ital,wght@0,400;0,600;1,500&display=swap" rel="stylesheet" />
      <div style={{ width: "100%", maxWidth: 420, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 18, padding: "38px 32px", textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 6 }}>I <em style={{ color: C.terra }}>Miss</em> You Memorial</div>
        {sent ? (
          <div>
            <div style={{ fontSize: "1.7rem", marginTop: 10 }}>{"🕯️"}</div>
            <h1 style={{ fontWeight: 600, fontSize: "1.5rem", margin: "10px 0" }}>Check your email</h1>
            <p style={{ color: C.inkSoft }}>We sent a sign-in link to <b>{email}</b>. Open it on this device to continue.</p>
          </div>
        ) : (
          <div>
            <h1 style={{ fontWeight: 600, fontSize: "1.6rem", margin: "12px 0 6px" }}>Welcome back</h1>
            <p style={{ color: C.inkSoft, marginBottom: 22 }}>Sign in to manage the tributes you've created. We'll email you a secure link, no password to remember.</p>
            <form onSubmit={submit}>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                style={{ width: "100%", fontFamily: "inherit", fontSize: 16, padding: "13px 15px", border: `1px solid ${C.line}`, borderRadius: 11, marginBottom: 12 }} />
              <button type="submit" disabled={loading}
                style={{ width: "100%", background: C.terra, color: "#fff", border: "none", fontFamily: "inherit", fontWeight: 600, fontSize: 16, padding: "14px", borderRadius: 30, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
                {loading ? "Sending…" : "Email me a sign-in link"}
              </button>
            </form>
            {err ? <p style={{ color: "#8C2F2A", marginTop: 12, fontSize: 14 }}>{err}</p> : null}
          </div>
        )}
        <p style={{ marginTop: 20, fontSize: 13, color: C.inkSoft }}>Just want to begin? <a href="/onboarding" style={{ color: C.terraDeep }}>Create a tribute</a></p>
      </div>
    </div>
  );
}
