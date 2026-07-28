"use client";
// Two ways back in. The emailed link is the door that always opens — no password
// to remember in a hard season. A password is there for the families who asked
// for one (set in the dashboard's Account room). Forgot it? The email brings
// you home and lets you choose a new one.
import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabaseBrowser";

const C = { cream: "#FAF5EC", ink: "#2C2520", inkSoft: "#5A4F45", terra: "#A87C5F", terraDeep: "#8B5E3C", line: "#E4D9C4" };

type Mode = "link" | "password";

export default function SignInPage() {
  const [mode, setMode] = useState<Mode>("link");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState<"" | "link" | "reset">("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const next = () =>
    (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("next")) || "/dashboard";

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next())}` },
      });
      if (error) setErr(error.message); else setSent("link");
    } catch { setErr("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  // Item 46: Google sign-in. The PKCE return (?code=) is already handled by
  // /auth/confirm, so one door serves links, resets, and Google alike.
  async function signInWithGoogle() {
    setErr(""); setLoading(true);
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next())}` },
      });
      if (error) { setErr(error.message); setLoading(false); }
      // on success the browser is redirected to Google; loading state stays on
    } catch { setErr("Something went wrong. Please try again."); setLoading(false); }
  }

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErr("That email and password don't match. The emailed link below always works.");
      } else {
        window.location.assign(next());
        return;
      }
    } catch { setErr("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  async function forgotPassword() {
    if (!email) { setErr("Write your email first, and we'll send the reset there."); return; }
    setErr(""); setLoading(true);
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/confirm?next=/dashboard/account`,
      });
      if (error) setErr(error.message); else setSent("reset");
    } catch { setErr("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  // Mobile QA (July 15): boxSizing keeps the fields exactly as wide as the
  // button — without it, width:100% + padding + border overflowed the card
  // to the right, the "uneven, off-center" look. One radius family, centered.
  const input = {
    width: "100%", boxSizing: "border-box", fontFamily: "inherit", fontSize: 16, padding: "13px 15px",
    border: `1px solid ${C.line}`, borderRadius: 14, marginBottom: 12, textAlign: "center",
    background: "#FFFDF9", color: C.ink, touchAction: "manipulation",
  } as const;
  const button = {
    width: "100%", boxSizing: "border-box", background: C.terra, color: "#fff", border: "none", fontFamily: "inherit",
    fontWeight: 600, fontSize: 16, padding: "14px", borderRadius: 30, cursor: "pointer", minHeight: 48,
    opacity: loading ? 0.6 : 1, touchAction: "manipulation",
  } as const;

  return (
    <div style={{ minHeight: "100vh", background: C.cream, color: C.ink, fontFamily: "'Besley',Georgia,serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <link href="https://fonts.googleapis.com/css2?family=Besley:ital,wght@0,400;0,600;1,500&display=swap" rel="stylesheet" />
      <div style={{ width: "100%", maxWidth: 420, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 18, padding: "38px 32px", textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 6 }}>I <em style={{ color: C.terra }}>Miss</em> You Memorial</div>

        {sent === "link" ? (
          <div>
            <div style={{ fontSize: "1.7rem", marginTop: 10 }}>{"🕯️"}</div>
            <h1 style={{ fontWeight: 600, fontSize: "1.5rem", margin: "10px 0" }}>Check your email</h1>
            <p style={{ color: C.inkSoft }}>We sent a sign-in link to <b>{email}</b>. It opens on any device — this one, your phone, anywhere.</p>
          </div>
        ) : sent === "reset" ? (
          <div>
            <div style={{ fontSize: "1.7rem", marginTop: 10 }}>{"🕯️"}</div>
            <h1 style={{ fontWeight: 600, fontSize: "1.5rem", margin: "10px 0" }}>Check your email</h1>
            <p style={{ color: C.inkSoft }}>We sent a link to <b>{email}</b>. It signs you in and takes you to your account, where you can choose a new password.</p>
          </div>
        ) : (
          <div>
            <h1 style={{ fontWeight: 600, fontSize: "1.6rem", margin: "12px 0 6px" }}>Welcome</h1>
            <p style={{ color: C.inkSoft, fontSize: 13.5, margin: "0 0 18px" }}>Returning or new, the same doors work. Signing in for the first time creates your account.</p>
            <button type="button" onClick={signInWithGoogle} disabled={loading}
              style={{ width: "100%", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                background: "#fff", color: C.ink, border: `1px solid ${C.line}`, fontFamily: "inherit", fontWeight: 600, fontSize: 16,
                padding: "13px", borderRadius: 30, cursor: "pointer", minHeight: 48, marginBottom: 14, opacity: loading ? 0.6 : 1 }}>
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Continue with Google
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0 16px", color: C.inkSoft, fontSize: 12.5 }}>
              <span style={{ flex: 1, height: 1, background: C.line }} /> or <span style={{ flex: 1, height: 1, background: C.line }} />
            </div>
            {mode === "link" ? (
              <>
                <p style={{ color: C.inkSoft, marginBottom: 22 }}>Sign in to care for the tributes you keep. We'll email you a secure link — no password to remember.</p>
                <form onSubmit={sendLink}>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={input} />
                  <button type="submit" disabled={loading} style={button}>{loading ? "Sending…" : "Email me a sign-in link"}</button>
                </form>
                <p style={{ marginTop: 16, fontSize: 13.5, color: C.inkSoft }}>
                  Have a password?{" "}
                  <button type="button" onClick={() => { setMode("password"); setErr(""); }}
                    style={{ background: "none", border: "none", padding: 0, font: "inherit", color: C.terraDeep, cursor: "pointer", textDecoration: "underline" }}>
                    Sign in with it
                  </button>
                </p>
              </>
            ) : (
              <>
                <p style={{ color: C.inkSoft, marginBottom: 22 }}>Sign in with the password you set in your account.</p>
                <form onSubmit={signInWithPassword}>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={input} autoComplete="email" />
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" style={input} autoComplete="current-password" />
                  <button type="submit" disabled={loading} style={button}>{loading ? "Signing in…" : "Sign in"}</button>
                </form>
                <p style={{ marginTop: 16, fontSize: 13.5, color: C.inkSoft }}>
                  <button type="button" onClick={forgotPassword}
                    style={{ background: "none", border: "none", padding: 0, font: "inherit", color: C.terraDeep, cursor: "pointer", textDecoration: "underline" }}>
                    Forgot it? We'll email you in
                  </button>
                  {" · "}
                  <button type="button" onClick={() => { setMode("link"); setErr(""); }}
                    style={{ background: "none", border: "none", padding: 0, font: "inherit", color: C.terraDeep, cursor: "pointer", textDecoration: "underline" }}>
                    Use the emailed link instead
                  </button>
                </p>
              </>
            )}
            {err ? <p style={{ color: "#8C2F2A", marginTop: 12, fontSize: 14 }}>{err}</p> : null}
          </div>
        )}
        <p style={{ marginTop: 20, fontSize: 13, color: C.inkSoft }}>Just want to begin? <a href="/onboarding" style={{ color: C.terraDeep }}>Create a tribute</a></p>
      </div>
    </div>
  );
}
