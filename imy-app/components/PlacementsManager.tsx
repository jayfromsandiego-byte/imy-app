"use client";
// PlacementsManager — where each photograph lives (fix 3 + fix 4).
// The family assigns every photo slot by hand: the photograph behind their
// words, the bulletin board pins, and each chapter moment's photo. Years are
// edited here too, with quiet inline checks (fix 8). Nothing auto-fills.
// A life in chapters (0017): the family writes chapter titles, orders them,
// and places each moment inside one — every chapter renders on the page.
import { useMemo, useState } from "react";
import { savePlacements } from "@/app/dashboard/actions";

type Photo = { id: string; url: string };
// k = a stable client key for rows not yet saved; the server remaps it to the
// real row id on insert, so a chapter photo chosen before saving still holds.
// ch = the chapter this moment belongs to (a chapter id, or a new chapter's ck).
type Row = { id?: string; k?: string; year: string; title: string; ch?: string };
// ck = a stable client key for chapters not yet saved, remapped on insert.
type Chapter = { id?: string; ck?: string; title: string };
type Placements = { quote?: string; board?: string[]; chapters?: Record<string, string[]> };

const C = { ink: "#2C2520", inkSoft: "#5A4F45", terra: "#A87C5F", line: "#E4D9C4", deep: "#F3ECDD", bad: "#8C2F2A" };
const NOW_YEAR = new Date().getFullYear();

export default function PlacementsManager({
  tributeId, photos, timeline, chapterRows, placements, bornYear, diedYear,
}: {
  tributeId: string;
  photos: Photo[];
  timeline: Row[];
  chapterRows?: { id: string; title: string }[];
  placements: Placements | null;
  bornYear?: number;
  diedYear?: number;
}) {
  const pl = placements || {};
  const [board, setBoard] = useState<string[]>((pl.board || []).filter((id) => photos.some((p) => p.id === id)));
  const [chapters, setChapters] = useState<Record<string, string[]>>(pl.chapters || {});
  const [rows, setRows] = useState<Row[]>(timeline.map((r) => ({ id: r.id, year: r.year || "", title: r.title || "", ch: r.ch || "" })));
  const [chs, setChs] = useState<Chapter[]>((chapterRows || []).map((c) => ({ id: c.id, title: c.title })));
  const [saved, setSaved] = useState(false);

  // Plausible years only (1900–now). Not life-bound: timelines hold family
  // history from before a birth, and moments from after, kindly.
  const lo = 1900;
  const hi = NOW_YEAR;
  const yearError = (y: string) => {
    const v = y.trim();
    if (!v) return "";
    if (!/^\d{4}$/.test(v)) return "four digits, like 1968";
    const n = Number(v);
    if (n < lo || n > hi) return `a year between ${lo} and ${hi}`;
    return "";
  };
  const errors = useMemo(() => rows.map((r) => yearError(r.year)), [rows]);
  const hasErrors = errors.some(Boolean);

  const toggleBoard = (id: string) =>
    setBoard((b) => (b.includes(id) ? b.filter((x) => x !== id) : [...b, id]));
  const setMomentPhoto = (rowKey: string, photoId: string | null) =>
    setChapters((c) => {
      const next = { ...c };
      if (photoId) next[rowKey] = [photoId];
      else delete next[rowKey];
      return next;
    });
  const editRow = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  const removeRow = (i: number) =>
    setRows((rs) => rs.filter((_, k) => k !== i));
  const addRow = () => setRows((rs) => [...rs, { k: "new-" + Math.random().toString(36).slice(2, 8), year: "", title: "", ch: "" }]);

  // The chapters themselves: add, rename, reorder, let one go.
  const chKey = (c: Chapter) => c.id || c.ck || "";
  const addChapter = () => setChs((cs) => [...cs, { ck: "newch-" + Math.random().toString(36).slice(2, 8), title: "" }]);
  const editChapter = (i: number, title: string) =>
    setChs((cs) => cs.map((c, k) => (k === i ? { ...c, title } : c)));
  const moveChapter = (i: number, dir: -1 | 1) =>
    setChs((cs) => {
      const j = i + dir;
      if (j < 0 || j >= cs.length) return cs;
      const next = cs.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const removeChapter = (i: number) =>
    setChs((cs) => {
      const gone = chKey(cs[i]);
      if (gone) setRows((rs) => rs.map((r) => (r.ch === gone ? { ...r, ch: "" } : r)));
      return cs.filter((_, k) => k !== i);
    });

  const thumb = (p: Photo, on: boolean, badge?: string) => ({
    position: "relative" as const, width: 74, height: 74, borderRadius: 9, cursor: "pointer",
    background: `center/cover url('${p.url}')`, border: on ? `2.5px solid ${C.terra}` : `1.5px solid ${C.line}`,
    opacity: on ? 1 : 0.82, flex: "0 0 auto",
  });
  const badgeStyle: any = {
    position: "absolute", top: 4, right: 4, background: "rgba(168,124,95,.95)", color: "#fff",
    fontFamily: "'Sometype Mono',monospace", fontSize: 10, padding: "1px 6px", borderRadius: 12,
  };
  const noneChip = (on: boolean): any => ({
    display: "inline-flex", alignItems: "center", height: 74, padding: "0 14px", borderRadius: 9, cursor: "pointer",
    border: on ? `2.5px solid ${C.terra}` : `1.5px dashed ${C.line}`, color: C.inkSoft, fontSize: 13, background: C.deep, flex: "0 0 auto",
  });
  const h3: any = { fontWeight: 600, fontSize: "1.02rem", marginTop: 26 };
  const sub: any = { color: C.inkSoft, fontSize: 13.5, marginTop: 4, lineHeight: 1.55 };
  const strip: any = { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 };

  return (
    <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 22 }}>
      <h2 style={{ fontWeight: 600, fontSize: "1.2rem" }}>Where each photograph lives</h2>
      <p style={sub}>
        Every place a photograph appears is yours to choose. Nothing is picked for you —
        an empty place simply rests. The Memorial Stone portrait is the first photo in
        &ldquo;The pictures&rdquo; above.
      </p>

      {photos.length === 0 ? (
        <p style={{ ...sub, marginTop: 16 }}>Add photographs above first — then choose where each one lives.</p>
      ) : (
        <>
          <h3 style={h3}>The bulletin board</h3>
          <p style={sub}>
            Pin the photographs you want on the board, in the order you tap them.
            Photographs visitors leave with their memories join the board on their own, with their names.
          </p>
          <div style={strip}>
            {photos.map((p) => {
              const idx = board.indexOf(p.id);
              return (
                <div key={p.id} style={thumb(p, idx > -1)} onClick={() => toggleBoard(p.id)} role="button" aria-label="Pin to the board">
                  {idx > -1 && <span style={badgeStyle}>{idx + 1}</span>}
                </div>
              );
            })}
          </div>
        </>
      )}

      <h3 style={h3}>A life, in chapters</h3>
      <p style={sub}>
        Name the chapters of the life · the girl by the sea, the teacher, the garden.
        Every chapter you write renders on the page, in your order. A moment can join
        a chapter below, or rest unplaced · unplaced moments gather at the end.
      </p>
      {chs.map((c, i) => (
        <div key={chKey(c) || `ch-${i}`} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: i === 0 ? 12 : 8 }}>
          <span style={{ fontFamily: "'Sometype Mono',monospace", fontSize: 11, color: C.inkSoft, width: 18, textAlign: "right" }}>{i + 1}</span>
          <input
            value={c.title}
            onChange={(e) => editChapter(i, e.target.value)}
            placeholder="A chapter title"
            aria-label="Chapter title"
            maxLength={80}
            style={{ flex: "1 1 200px", padding: "9px 12px", border: `1.5px solid ${C.line}`, borderRadius: 9, fontSize: 14.5, background: "#fff" }}
          />
          <button type="button" onClick={() => moveChapter(i, -1)} disabled={i === 0} aria-label="Move this chapter up"
            style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 9px", cursor: i === 0 ? "default" : "pointer", color: C.inkSoft, opacity: i === 0 ? 0.4 : 1 }}>
            ↑
          </button>
          <button type="button" onClick={() => moveChapter(i, 1)} disabled={i === chs.length - 1} aria-label="Move this chapter down"
            style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 9px", cursor: i === chs.length - 1 ? "default" : "pointer", color: C.inkSoft, opacity: i === chs.length - 1 ? 0.4 : 1 }}>
            ↓
          </button>
          <button type="button" onClick={() => removeChapter(i)} aria-label="Let this chapter go"
            style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: C.bad, fontSize: 13 }}>
            ✕
          </button>
        </div>
      ))}
      {chs.length < 12 && (
        <button type="button" onClick={addChapter}
          style={{ marginTop: 10, background: "none", border: `1.5px dashed ${C.line}`, borderRadius: 10, padding: "8px 14px", cursor: "pointer", color: C.inkSoft, fontSize: 13.5 }}>
          ＋ add a chapter
        </button>
      )}
      <p style={sub}>
        Each moment can hold its own photograph. A moment without one shows a quiet
        empty state · never a photo that doesn&rsquo;t belong to it. Years live
        between {lo} and {hi}.
      </p>
      {rows.map((r, i) => {
        const rowKey = r.id || r.k || `new-${i}`;
        const chosen = (chapters[rowKey] || [])[0] || null;
        return (
          <div key={rowKey} style={{ border: `1px solid ${C.line}`, borderRadius: 11, padding: 14, marginTop: 12, background: "#FDFAF3" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div>
                <input
                  value={r.year}
                  onChange={(e) => editRow(i, { year: e.target.value })}
                  placeholder="1968"
                  inputMode="numeric"
                  aria-label="Year"
                  style={{ width: 86, padding: "9px 10px", border: `1.5px solid ${errors[i] ? "#c98b76" : C.line}`, borderRadius: 9, fontFamily: "'Sometype Mono',monospace", fontSize: 14, background: "#fff" }}
                />
                {errors[i] && <div style={{ color: C.bad, fontSize: 12, marginTop: 4, maxWidth: 120 }}>{errors[i]}</div>}
              </div>
              <input
                value={r.title}
                onChange={(e) => editRow(i, { title: e.target.value })}
                placeholder="What happened"
                aria-label="The moment"
                style={{ flex: "1 1 220px", padding: "9px 12px", border: `1.5px solid ${C.line}`, borderRadius: 9, fontSize: 14.5, background: "#fff" }}
              />
              {chs.some((c) => c.title.trim()) && (
                <select
                  value={r.ch || ""}
                  onChange={(e) => editRow(i, { ch: e.target.value })}
                  aria-label="This moment's chapter"
                  style={{ flex: "0 1 170px", padding: "9px 10px", border: `1.5px solid ${C.line}`, borderRadius: 9, fontSize: 13.5, background: "#fff", color: r.ch ? C.ink : C.inkSoft }}
                >
                  <option value="">no chapter · yet</option>
                  {chs.filter((c) => c.title.trim()).map((c) => (
                    <option key={chKey(c)} value={chKey(c)}>{c.title.trim()}</option>
                  ))}
                </select>
              )}
              <button type="button" onClick={() => removeRow(i)} aria-label="Remove this moment"
                style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: C.bad, fontSize: 13 }}>
                ✕
              </button>
            </div>
            {photos.length > 0 && (
              <div style={{ ...strip, marginTop: 10 }}>
                <div style={noneChip(!chosen)} onClick={() => setMomentPhoto(rowKey, null)} role="button" aria-label="No photograph for this moment">
                  no photograph · yet
                </div>
                {photos.map((p) => (
                  <div key={p.id} style={{ ...thumb(p, chosen === p.id), width: 58, height: 58 }} onClick={() => setMomentPhoto(rowKey, chosen === p.id ? null : p.id)} role="button" aria-label="This moment's photograph" />
                ))}
              </div>
            )}
          </div>
        );
      })}
      <button type="button" onClick={addRow}
        style={{ marginTop: 12, background: "none", border: `1.5px dashed ${C.line}`, borderRadius: 10, padding: "9px 16px", cursor: "pointer", color: C.inkSoft, fontSize: 14 }}>
        ＋ add a moment
      </button>

      <form
        action={savePlacements}
        onSubmit={() => setSaved(true)}
        style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}
      >
        <input type="hidden" name="tributeId" value={tributeId} />
        <input type="hidden" name="placements" value={JSON.stringify({ board, chapters })} />
        <input type="hidden" name="timeline" value={JSON.stringify(rows)} />
        <input type="hidden" name="chapters" value={JSON.stringify(chs)} />
        <button type="submit" disabled={hasErrors}
          style={{ background: hasErrors ? "#C9BBA8" : C.terra, color: "#fff", border: "none", fontFamily: "inherit", fontWeight: 600, fontSize: 14, padding: "10px 20px", borderRadius: 30, cursor: hasErrors ? "not-allowed" : "pointer" }}>
          Save these choices
        </button>
        {hasErrors && <span style={{ fontFamily: "'Sometype Mono',monospace", fontSize: 12, color: C.bad }}>a year needs a gentle check first</span>}
        {saved && !hasErrors && <span style={{ fontFamily: "'Sometype Mono',monospace", fontSize: 12, color: C.inkSoft }}>saved · the page follows within a minute</span>}
      </form>
    </div>
  );
}
