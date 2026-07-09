"use client";
// ArrangeManager — the page in the family's order (fix 7).
// The Memorial Stone always opens the page. The rooms after it can be
// reordered with the arrows, or set to rest — hidden from visitors, kept safe.
import { useState } from "react";
import { saveSections } from "@/app/dashboard/actions";

const C = { ink: "#2C2520", inkSoft: "#5A4F45", terra: "#A87C5F", line: "#E4D9C4", deep: "#F3ECDD" };
const KNOWN: { key: string; label: string; note: string }[] = [
  { key: "story", label: "A life, in chapters", note: "the timeline and its photographs" },
  { key: "quote", label: "Their words", note: "the line they always said" },
  { key: "gallery", label: "The photographs", note: "the family gallery" },
  { key: "really", label: "Who they really were", note: "the detail cards" },
  { key: "memories", label: "The memories wall", note: "what everyone left" },
  { key: "keep", label: "The keeping place", note: "the board and the tape shelf" },
];

export default function ArrangeManager({
  tributeId, sections,
}: {
  tributeId: string;
  sections: { order?: string[]; hidden?: string[] } | null;
}) {
  const defaultOrder = KNOWN.map((s) => s.key);
  const saved = sections || {};
  const initial = [
    ...(saved.order || []).filter((k) => defaultOrder.includes(k)),
    ...defaultOrder.filter((k) => !(saved.order || []).includes(k)),
  ];
  const [order, setOrder] = useState<string[]>(initial);
  const [hidden, setHidden] = useState<string[]>((saved.hidden || []).filter((k) => defaultOrder.includes(k)));
  const [dirty, setDirty] = useState(false);

  const move = (key: string, dir: -1 | 1) => {
    setOrder((o) => {
      const i = o.indexOf(key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= o.length) return o;
      const next = o.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setDirty(true);
  };
  const toggle = (key: string) => {
    setHidden((h) => (h.includes(key) ? h.filter((x) => x !== key) : [...h, key]));
    setDirty(true);
  };

  const mini: any = { background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: C.ink };

  return (
    <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 22 }}>
      <h2 style={{ fontWeight: 600, fontSize: "1.2rem" }}>The order of the rooms</h2>
      <p style={{ color: C.inkSoft, fontSize: 13.5, marginTop: 4, lineHeight: 1.55 }}>
        The page reads like a walk through their life. Arrange the rooms the way your
        family would tell it. A room set to rest is hidden from visitors — everything
        in it stays kept.
      </p>

      <div style={{ marginTop: 16, border: `1px solid ${C.line}`, borderRadius: 11, padding: "11px 14px", background: C.deep, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: "'Sometype Mono',monospace", fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: C.inkSoft }}>always first</span>
        <strong style={{ fontSize: 14.5 }}>The Memorial Stone</strong>
        <span style={{ color: C.inkSoft, fontSize: 13 }}>· the wreath, their name, the flowers</span>
      </div>

      <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
        {order.map((key, i) => {
          const meta = KNOWN.find((s) => s.key === key)!;
          const resting = hidden.includes(key);
          return (
            <div key={key} style={{ border: `1px solid ${C.line}`, borderRadius: 11, padding: "11px 14px", background: resting ? "#FBF7EE" : "#FDFAF3", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", opacity: resting ? 0.72 : 1 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <button type="button" style={{ ...mini, opacity: i === 0 ? 0.35 : 1 }} disabled={i === 0} onClick={() => move(key, -1)} aria-label="Earlier">↑</button>
                <button type="button" style={{ ...mini, opacity: i === order.length - 1 ? 0.35 : 1 }} disabled={i === order.length - 1} onClick={() => move(key, 1)} aria-label="Later">↓</button>
              </div>
              <div style={{ flex: "1 1 200px" }}>
                <strong style={{ fontSize: 14.5 }}>{meta.label}</strong>
                <span style={{ color: C.inkSoft, fontSize: 13 }}> · {meta.note}</span>
              </div>
              <button type="button" style={{ ...mini, color: resting ? C.terra : C.inkSoft }} onClick={() => toggle(key)}>
                {resting ? "resting · show it" : "shown · let it rest"}
              </button>
            </div>
          );
        })}
      </div>

      {dirty && (
        <form action={saveSections} onSubmit={() => setDirty(false)} style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <input type="hidden" name="tributeId" value={tributeId} />
          <input type="hidden" name="sections" value={JSON.stringify({ order, hidden })} />
          <button type="submit" style={{ background: C.terra, color: "#fff", border: "none", fontFamily: "inherit", fontWeight: 600, fontSize: 14, padding: "10px 20px", borderRadius: 30, cursor: "pointer" }}>
            Save the arrangement
          </button>
          <span style={{ fontFamily: "'Sometype Mono',monospace", fontSize: 12, color: C.inkSoft }}>the page follows within a minute</span>
        </form>
      )}
    </div>
  );
}
