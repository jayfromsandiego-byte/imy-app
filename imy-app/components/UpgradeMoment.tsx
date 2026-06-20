"use client";

// A gentle, brand-styled upgrade modal. Render it when a free user reaches a real
// limit — and only then. It marks itself "seen" so it won't nag again this session.
//
// Usage in the editor:
//   const [moment, setMoment] = useState<MomentId | null>(null);
//   // when they try to add the 51st photo:
//   if (photos.length >= 50 && !hasSeenMoment("photos")) setMoment("photos");
//   ...
//   <UpgradeMoment id={moment} onClose={() => setMoment(null)} />

import { useEffect } from "react";
import { UPGRADE_MOMENTS, MomentId, markMomentSeen } from "@/lib/upgradeMoments";

const C = {
  cream: "#FAF5EC", ink: "#2C2520", inkSoft: "#5f544b",
  terra: "#A87C5F", terraHover: "#946a4f", gold: "#C9A572", line: "#e6dcc8",
};

export function UpgradeMoment({
  id,
  onClose,
}: {
  id: MomentId | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!id) return;
    markMomentSeen(id);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [id, onClose]);

  if (!id) return null;
  const m = UPGRADE_MOMENTS[id];

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 100, display: "flex",
        alignItems: "center", justifyContent: "center", padding: 24,
        background: "rgba(28,23,19,.55)", backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          background: C.cream, border: `1px solid ${C.line}`, borderRadius: 22,
          maxWidth: 440, width: "100%", padding: "38px 36px 30px", textAlign: "center",
          boxShadow: "0 40px 90px -40px rgba(44,37,32,.6)", position: "relative",
          fontFamily: "Inter, system-ui, sans-serif", color: C.ink,
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ position: "absolute", top: 16, right: 18, background: "none", border: "none", fontSize: 22, color: C.inkSoft, cursor: "pointer", lineHeight: 1 }}
        >×</button>

        <div style={{ fontSize: "1.6rem" }}>🕯️</div>
        <div style={{ fontSize: ".72rem", letterSpacing: ".18em", textTransform: "uppercase", color: C.terra, fontWeight: 600, margin: "10px 0" }}>
          {m.eyebrow}
        </div>
        <h2 style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 380, fontSize: "1.7rem", lineHeight: 1.15, letterSpacing: "-.01em", marginBottom: 12 }}>
          {m.title}
        </h2>
        <p style={{ color: C.inkSoft, fontSize: "1rem", lineHeight: 1.65, marginBottom: 22 }}>
          {m.body}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <a
            href={m.primaryHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: C.terra, color: "#fff", fontWeight: 600, fontSize: ".95rem",
              padding: "14px 22px", borderRadius: 40, textDecoration: "none", transition: "background .2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = C.terraHover)}
            onMouseOut={(e) => (e.currentTarget.style.background = C.terra)}
          >
            {m.primaryLabel}
          </a>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: C.inkSoft, fontSize: ".9rem", cursor: "pointer", padding: 6, fontFamily: "Inter, sans-serif" }}
          >
            {m.secondaryLabel}
          </button>
        </div>

        <div style={{ fontFamily: "Caveat, cursive", fontSize: "1.25rem", color: C.terra, marginTop: 16 }}>
          {m.reassure}
        </div>
      </div>
    </div>
  );
}
