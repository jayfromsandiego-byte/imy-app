"use client";

import { useState } from "react";

// The free memorial card maker.
// Front: their photo in the arch, name, dates. Back: a verse or their own words.
// House rules: photo never leaves the browser; every word is the family's or a
// public-domain text they chose; email gate after the full preview; print
// renders front and back at 2.5 x 4.25 inches with crop marks.

const VERSES: Record<string, { name: string; text: string }> = {
  default: { name: "Your own words", text: "" },
  catholic: {
    name: "Eternal Rest (traditional)",
    text: "Eternal rest grant unto her, O Lord,\nand let perpetual light shine upon her.\nMay her soul, and the souls of all the faithful departed,\nthrough the mercy of God, rest in peace. Amen.",
  },
  christian: {
    name: "Psalm 23 (KJV, excerpt)",
    text: "The Lord is my shepherd; I shall not want.\nHe maketh me to lie down in green pastures:\nhe leadeth me beside the still waters.\nHe restoreth my soul.",
  },
  jewish: {
    name: "In blessing",
    text: "May her memory be a blessing.\nזיכרונה לברכה",
  },
  secular: {
    name: "Remember (Christina Rossetti, excerpt)",
    text: "Better by far you should forget and smile\nthan that you should remember and be sad.",
  },
};

export default function CardMaker({ variant = "default" }: { variant?: string }) {
  const preset = VERSES[variant] || VERSES.default;
  const [name, setName] = useState("");
  const [dates, setDates] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [verse, setVerse] = useState(preset.text);
  const [closing, setClosing] = useState("Forever in our hearts");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const ready = name.trim().length > 0;

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(f);
  }

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await fetch("/api/tool-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tool: "memorial-card-maker", variant }),
      });
    } catch {
      /* never block the family */
    }
    setSending(false);
    setUnlocked(true);
  }

  return (
    <div className="cm-root">
      <style
        dangerouslySetInnerHTML={{
          __html: `
.cm-root{display:grid;grid-template-columns:minmax(260px,380px) 1fr;gap:36px;align-items:start;}
@media(max-width:860px){.cm-root{grid-template-columns:1fr;}}
.cm-form{display:flex;flex-direction:column;gap:14px;}
.cm-form label{font-family:'Sometype Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#5F574E;display:block;margin-bottom:5px;}
.cm-form input[type=text],.cm-form textarea{width:100%;padding:10px 12px;border:1px solid rgba(44,37,32,.25);background:#fff;font-family:inherit;font-size:15px;color:#2C2520;}
.cm-form textarea{min-height:110px;resize:vertical;}
.cm-note{font-size:13px;color:#5F574E;border-left:3px solid #C9A572;padding-left:12px;}
.cm-btn{display:inline-block;padding:11px 20px;background:#3f2c1a;color:#FAF5EC;border:none;font-family:inherit;font-size:15px;cursor:pointer;border-radius:2px;}
.cm-btn:hover{background:#241711;}
.cm-gate{border:1px solid rgba(44,37,32,.18);background:#F3ECDD;padding:18px;}
.cm-gate p{font-size:14.5px;color:rgba(44,37,32,.8);margin:0 0 10px;}
.cm-cta{margin-top:12px;padding-top:12px;border-top:1px solid rgba(44,37,32,.14);font-size:14.5px;color:rgba(44,37,32,.8);}
.cm-cta a{color:#8A5F43;text-decoration:none;border-bottom:1px solid rgba(138,95,67,.4);}
.cm-preview{position:sticky;top:24px;display:flex;gap:18px;flex-wrap:wrap;}
.cm-card{width:250px;aspect-ratio:2.5/4.25;background:#FDFBF6;border:1px solid rgba(44,37,32,.2);box-shadow:0 2px 12px rgba(44,37,32,.09);padding:9%;display:flex;flex-direction:column;align-items:center;text-align:center;}
.cm-arch{width:62%;aspect-ratio:3/3.6;border-radius:50% 50% 4px 4px / 38% 38% 4px 4px;object-fit:cover;background:#E7DECB;margin:8% 0 9%;}
.cm-lim{font-family:'Sometype Mono',ui-monospace,monospace;font-size:7.5px;letter-spacing:.16em;text-transform:uppercase;color:#8A5F43;margin:0 0 5%;}
.cm-name{font-size:14px;font-weight:600;line-height:1.25;margin:0;}
.cm-dates{font-family:'Sometype Mono',ui-monospace,monospace;font-size:8px;letter-spacing:.1em;color:#8A5F43;margin:5% 0 0;}
.cm-verse{white-space:pre-line;font-size:9.5px;font-style:italic;line-height:1.7;color:rgba(44,37,32,.85);margin:auto 0;}
.cm-closing{font-size:8.5px;color:#5F574E;margin-top:auto;}
.cm-side{font-family:'Sometype Mono',ui-monospace,monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#5F574E;margin:8px 0 0;text-align:center;width:250px;}
@media print{
  body *{visibility:hidden;}
  .cm-preview,.cm-preview *{visibility:visible;}
  .cm-preview{position:fixed;inset:0;display:flex;flex-direction:row;justify-content:center;align-items:center;gap:40px;}
  .cm-card{width:2.5in;height:4.25in;box-shadow:none;outline:1px dashed #999;}
  .cm-side{display:none;}
  @page{size:letter landscape;margin:0.5in;}
}
`,
        }}
      />
      <div className="cm-form">
        <div>
          <label>Their name</label>
          <input type="text" aria-label="Their name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Eleanor Margaret Hayes" />
        </div>
        <div>
          <label>Dates</label>
          <input type="text" aria-label="Dates" value={dates} onChange={(e) => setDates(e.target.value)} placeholder="1948 · 2024" />
        </div>
        <div>
          <label>Their photo</label>
          <input type="file" aria-label="Their photo" accept="image/*" onChange={onPhoto} />
        </div>
        <div>
          <label>The back of the card {preset.name !== "Your own words" ? `· ${preset.name}` : ""}</label>
          <textarea aria-label="Verse or words for the back of the card" value={verse} onChange={(e) => setVerse(e.target.value)} placeholder="A verse, a line of theirs, or your own two lines" />
        </div>
        <div>
          <label>Closing line</label>
          <input type="text" aria-label="Closing line" value={closing} onChange={(e) => setClosing(e.target.value)} />
        </div>
        <p className="cm-note">The photo never leaves your device. Prints front and back at 2.5 by 4.25 inches with cut guides; a print shop can impose four to a sheet.</p>
        {ready && !unlocked && (
          <form className="cm-gate" onSubmit={unlock}>
            <p>The card is ready on the right. Enter your email and printing unlocks. We will not add you to anything without asking.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="email" aria-label="Your email address" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ flex: 1, padding: "10px 12px", border: "1px solid rgba(44,37,32,.25)", fontFamily: "inherit", fontSize: 15 }} />
              <button className="cm-btn" disabled={sending} type="submit">{sending ? "One moment" : "Unlock printing"}</button>
            </div>
          </form>
        )}
        {ready && unlocked && (
          <div className="cm-gate">
            <button className="cm-btn" type="button" onClick={() => window.print()}>Print / Save as PDF</button>
            <p className="cm-cta">
              A card fits in a wallet. Their whole story deserves more room.{" "}
              <a href="/onboarding?from=card-maker">Create their memorial page</a> · free, forever.
            </p>
          </div>
        )}
      </div>
      <div className="cm-preview" aria-label="Card preview, front and back">
        <div>
          <div className="cm-card">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="cm-arch" src={photo} alt="" />
            ) : (
              <div className="cm-arch" />
            )}
            <p className="cm-lim">In Loving Memory</p>
            <h2 className="cm-name">{name || "Their Name"}</h2>
            {dates && <p className="cm-dates">{dates}</p>}
          </div>
          <p className="cm-side">Front</p>
        </div>
        <div>
          <div className="cm-card">
            <p className="cm-lim">In Loving Memory</p>
            {verse && <p className="cm-verse">{verse}</p>}
            {closing && <p className="cm-closing">{closing}</p>}
          </div>
          <p className="cm-side">Back</p>
        </div>
      </div>
    </div>
  );
}
