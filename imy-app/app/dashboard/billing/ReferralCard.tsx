"use client";
// ReferralCard — fetches the owner's personal referral code from /api/referral
// and shows a copyable link. Lives under app/dashboard/billing so the whole
// re-skin stays inside app/dashboard/**, per the Study restyle scope.
import { useEffect, useState } from "react";

export default function ReferralCard() {
  const [code, setCode] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/referral")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d?.ok && d.code) {
          setCode(d.code);
          setStatus("ready");
        } else {
          setStatus("error");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "error") return null; // referral system not configured — say nothing rather than showing a broken card

  const link = code ? `https://imissyoumemorial.com/?ref=${code}` : "";

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="referral-card">
      <div style={{ fontWeight: 700, fontSize: 15.5 }}>Invite a friend</div>
      <p className="panel-sub" style={{ margin: 0, fontSize: 14 }}>
        Friends get 20% off Plus monthly, forever.
      </p>
      {status === "loading" ? (
        <span className="mono" style={{ fontSize: 12, color: "var(--ink-soft)" }}>
          Finding your code…
        </span>
      ) : (
        <div className="invite-row">
          <span className="link-pill mono">{link}</span>
          <button type="button" className="btn small quiet" onClick={copy} disabled={!link}>
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      )}
    </div>
  );
}
