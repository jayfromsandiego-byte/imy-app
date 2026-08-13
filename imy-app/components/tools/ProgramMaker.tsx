"use client";

import { useMemo, useState } from "react";

// The free funeral program maker.
// House rules:
// - The photo NEVER leaves the browser. It becomes a local data URL for the
//   preview and the print file only. We store nothing about the person.
// - Fact safety: every word on the program is typed or chosen by the family.
//   Nothing is generated, inferred, or invented.
// - The email gate sits AFTER the full preview is visible, and a failure to
//   store the email still unlocks printing. Never block the bereaved.
// - Terminal action: a quiet path to creating a memorial page.

interface OrderItem {
  label: string;
  detail: string;
}

const PRESETS: Record<string, { name: string; items: OrderItem[] }> = {
  default: {
    name: "Order of Service",
    items: [
      { label: "Prelude", detail: "" },
      { label: "Words of Welcome", detail: "" },
      { label: "Reading", detail: "" },
      { label: "Remembrance", detail: "" },
      { label: "Music", detail: "" },
      { label: "Eulogy", detail: "" },
      { label: "Closing Words", detail: "" },
    ],
  },
  catholic: {
    name: "Funeral Mass",
    items: [
      { label: "Introductory Rites", detail: "Reception of the Body" },
      { label: "Liturgy of the Word", detail: "First Reading · Psalm · Gospel" },
      { label: "Homily", detail: "" },
      { label: "Liturgy of the Eucharist", detail: "" },
      { label: "Holy Communion", detail: "" },
      { label: "Final Commendation", detail: "Song of Farewell" },
      { label: "Procession to the Place of Committal", detail: "" },
    ],
  },
  baptist: {
    name: "Homegoing Celebration",
    items: [
      { label: "Processional", detail: "" },
      { label: "Scripture Reading", detail: "Old and New Testament" },
      { label: "Prayer of Comfort", detail: "" },
      { label: "Selection", detail: "Choir" },
      { label: "Acknowledgments and Resolutions", detail: "" },
      { label: "Reading of the Obituary", detail: "" },
      { label: "Selection", detail: "Choir" },
      { label: "Eulogy", detail: "" },
      { label: "Recessional", detail: "" },
    ],
  },
  methodist: {
    name: "A Service of Death and Resurrection",
    items: [
      { label: "Gathering", detail: "" },
      { label: "Word of Grace and Greeting", detail: "" },
      { label: "Hymn", detail: "" },
      { label: "Proclamation of the Word", detail: "" },
      { label: "Witness", detail: "Family and friends" },
      { label: "Commendation", detail: "" },
      { label: "Hymn and Dismissal with Blessing", detail: "" },
    ],
  },
  lds: {
    name: "Funeral Service",
    items: [
      { label: "Conducting", detail: "" },
      { label: "Opening Hymn", detail: "" },
      { label: "Invocation", detail: "" },
      { label: "Life Sketch", detail: "" },
      { label: "Speaker", detail: "" },
      { label: "Musical Number", detail: "" },
      { label: "Closing Remarks", detail: "" },
      { label: "Closing Hymn", detail: "" },
      { label: "Benediction", detail: "" },
    ],
  },
  jewish: {
    name: "Levaya",
    items: [
      { label: "Psalm 23", detail: "" },
      { label: "Hesped", detail: "Words of remembrance" },
      { label: "El Malei Rachamim", detail: "" },
      { label: "Procession to the Grave", detail: "" },
      { label: "Mourner's Kaddish", detail: "" },
    ],
  },
  military: {
    name: "Order of Service",
    items: [
      { label: "Prelude", detail: "" },
      { label: "Words of Welcome", detail: "" },
      { label: "Reading", detail: "" },
      { label: "Eulogy", detail: "" },
      { label: "Military Funeral Honors", detail: "Folding and Presentation of the Flag · Taps" },
      { label: "Closing Words", detail: "" },
    ],
  },
  "celebration-of-life": {
    name: "Celebration of Life",
    items: [
      { label: "Gathering Music", detail: "Their favorites" },
      { label: "Welcome", detail: "" },
      { label: "Their Story", detail: "" },
      { label: "Open Remembrances", detail: "All are invited to speak" },
      { label: "Song", detail: "" },
      { label: "Closing Toast", detail: "" },
    ],
  },
};

export default function ProgramMaker({ variant = "default" }: { variant?: string }) {
  const preset = PRESETS[variant] || PRESETS.default;
  const [name, setName] = useState("");
  const [sunrise, setSunrise] = useState("");
  const [sunset, setSunset] = useState("");
  const [serviceLine, setServiceLine] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [items, setItems] = useState<OrderItem[]>(preset.items);
  const [thanks, setThanks] = useState(
    "The family gratefully acknowledges every kindness shown during this time."
  );
  const [email, setEmail] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [sending, setSending] = useState(false);

  const ready = useMemo(() => name.trim().length > 0, [name]);

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(f);
  }

  function setItem(i: number, patch: Partial<OrderItem>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await fetch("/api/tool-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tool: "funeral-program-maker", variant }),
      });
    } catch {
      /* storing the email must never block the family */
    }
    setSending(false);
    setUnlocked(true);
  }

  return (
    <div className="kb-root">
      <style
        dangerouslySetInnerHTML={{
          __html: `
.kb-root{display:grid;grid-template-columns:minmax(280px,420px) 1fr;gap:36px;align-items:start;}
@media(max-width:900px){.kb-root{grid-template-columns:1fr;}}
.kb-form{display:flex;flex-direction:column;gap:14px;}
.kb-form label{font-family:'Sometype Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#5F574E;display:block;margin-bottom:5px;}
.kb-form input[type=text],.kb-form input[type=email]{width:100%;padding:10px 12px;border:1px solid rgba(44,37,32,.25);background:#fff;font-family:inherit;font-size:15px;color:#2C2520;}
.kb-order{border:1px solid rgba(44,37,32,.14);background:#F3ECDD;padding:14px;}
.kb-order-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;}
.kb-order-row input{padding:8px 10px !important;font-size:14px !important;}
.kb-privacy{font-size:13px;color:#5F574E;border-left:3px solid #C9A572;padding-left:12px;}
.kb-gate{border:1px solid rgba(44,37,32,.18);background:#F3ECDD;padding:18px;margin-top:8px;}
.kb-gate p{font-size:14.5px;color:rgba(44,37,32,.8);margin:0 0 10px;}
.kb-btn{display:inline-block;padding:11px 20px;background:#3f2c1a;color:#FAF5EC;border:none;font-family:inherit;font-size:15px;cursor:pointer;border-radius:2px;}
.kb-btn:hover{background:#241711;}
.kb-btn[disabled]{opacity:.5;cursor:default;}
.kb-cta{margin-top:14px;font-size:14.5px;color:rgba(44,37,32,.8);}
.kb-cta a{color:#8A5F43;text-decoration:none;border-bottom:1px solid rgba(168,124,95,.4);}
.kb-preview{position:sticky;top:24px;}
.kb-sheet{background:#FDFBF6;border:1px solid rgba(44,37,32,.18);box-shadow:0 2px 14px rgba(44,37,32,.08);aspect-ratio:8.5/11;max-width:520px;display:grid;grid-template-columns:1fr 1fr;font-size:11px;}
.kb-panel{padding:7% 8%;display:flex;flex-direction:column;align-items:center;text-align:center;}
.kb-panel.kb-inside{align-items:flex-start;text-align:left;border-left:1px dashed rgba(44,37,32,.15);}
.kb-arch{width:58%;aspect-ratio:3/3.6;border-radius:50% 50% 4px 4px / 38% 38% 4px 4px;object-fit:cover;background:#E7DECB;margin:12% 0 10%;}
.kb-cover-name{font-size:16px;font-weight:600;line-height:1.2;margin:0;}
.kb-cover-dates{font-family:'Sometype Mono',ui-monospace,monospace;font-size:9px;letter-spacing:.1em;color:#8A5F43;margin:6px 0 0;}
.kb-cover-line{font-size:9.5px;color:rgba(44,37,32,.65);margin:8px 0 0;}
.kb-lim{font-family:'Sometype Mono',ui-monospace,monospace;font-size:8px;letter-spacing:.16em;text-transform:uppercase;color:#8A5F43;margin:0 0 4%;}
.kb-oi{margin:0 0 5%;width:100%;}
.kb-oi b{display:block;font-size:10.5px;font-weight:600;}
.kb-oi span{font-size:9px;color:rgba(44,37,32,.78);}
.kb-thanks{margin-top:auto;font-size:8.5px;color:#5F574E;font-style:italic;}
@media print{
  body *{visibility:hidden;}
  .kb-sheet,.kb-sheet *{visibility:visible;}
  .kb-sheet{position:fixed;inset:0;max-width:none;width:100%;height:100%;border:none;box-shadow:none;}
  @page{size:letter landscape;margin:0;}
}
`,
        }}
      />
      <div className="kb-form">
        <div>
          <label>Their name</label>
          <input type="text" aria-label="Their name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Eleanor Margaret Hayes" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label>Sunrise</label>
            <input type="text" aria-label="Sunrise date" value={sunrise} onChange={(e) => setSunrise(e.target.value)} placeholder="June 4, 1948" />
          </div>
          <div>
            <label>Sunset</label>
            <input type="text" aria-label="Sunset date" value={sunset} onChange={(e) => setSunset(e.target.value)} placeholder="November 18, 2024" />
          </div>
        </div>
        <div>
          <label>Service line</label>
          <input type="text" aria-label="Service details line" value={serviceLine} onChange={(e) => setServiceLine(e.target.value)} placeholder="Saturday, November 23 · 11 am · St. Mary's Chapel" />
        </div>
        <div>
          <label>Their photo</label>
          <input type="file" aria-label="Their photo" accept="image/*" onChange={onPhoto} />
        </div>
        <div className="kb-order">
          <label>{preset.name}</label>
          {items.map((it, i) => (
            <div className="kb-order-row" key={i}>
              <input type="text" aria-label={`Order line ${i + 1} title`} value={it.label} onChange={(e) => setItem(i, { label: e.target.value })} />
              <input type="text" aria-label={`Order line ${i + 1} detail`} value={it.detail} placeholder="detail (optional)" onChange={(e) => setItem(i, { detail: e.target.value })} />
            </div>
          ))}
          <button
            type="button"
            className="kb-btn"
            style={{ padding: "7px 14px", fontSize: 13 }}
            onClick={() => setItems((p) => [...p, { label: "", detail: "" }])}
          >
            Add a line
          </button>
        </div>
        <div>
          <label>Acknowledgment</label>
          <input type="text" aria-label="Acknowledgment line" value={thanks} onChange={(e) => setThanks(e.target.value)} />
        </div>
        <p className="kb-privacy">
          The photo never leaves your device. It lives in your browser, goes onto your print
          file, and is not sent to us.
        </p>

        {ready && !unlocked && (
          <form className="kb-gate" onSubmit={unlock}>
            <p>The program is ready on the right. Enter your email and the print file unlocks. We will not add you to anything without asking.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="email" aria-label="Your email address" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ flex: 1 }} />
              <button className="kb-btn" disabled={sending} type="submit">
                {sending ? "One moment" : "Unlock print file"}
              </button>
            </div>
          </form>
        )}
        {ready && unlocked && (
          <div className="kb-gate">
            <button className="kb-btn" type="button" onClick={() => window.print()}>
              Print / Save as PDF
            </button>
            <p className="kb-cta">
              When the service is planned, their memory deserves a place that stays.{" "}
              <a href="/onboarding?from=program-maker">Create their memorial page</a> · free, forever.
            </p>
          </div>
        )}
      </div>

      <div className="kb-preview" aria-label="Program preview">
        <div className="kb-sheet">
          <div className="kb-panel">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="kb-arch" src={photo} alt="" />
            ) : (
              <div className="kb-arch" />
            )}
            <p className="kb-lim">In Loving Memory</p>
            <h2 className="kb-cover-name">{name || "Their Name"}</h2>
            {(sunrise || sunset) && (
              <p className="kb-cover-dates">
                {sunrise || "—"} · {sunset || "—"}
              </p>
            )}
            {serviceLine && <p className="kb-cover-line">{serviceLine}</p>}
          </div>
          <div className="kb-panel kb-inside">
            <p className="kb-lim">{preset.name}</p>
            {items
              .filter((it) => it.label.trim())
              .map((it, i) => (
                <div className="kb-oi" key={i}>
                  <b>{it.label}</b>
                  {it.detail && <span>{it.detail}</span>}
                </div>
              ))}
            {thanks && <p className="kb-thanks">{thanks}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
