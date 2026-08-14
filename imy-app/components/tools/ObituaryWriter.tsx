"use client";

import { useMemo, useState } from "react";

// The free obituary writer.
// House rules:
// - FACT SAFETY IS ABSOLUTE. Nothing is generated, inferred, or invented.
//   The draft is assembled from the family's own typed words with minimal
//   connective tissue, and every line is theirs to edit before anything
//   unlocks. Empty fields simply do not appear.
// - Pronouns are chosen by the family, never guessed.
// - The email gate sits AFTER the full draft is visible and editable, and a
//   storage failure still unlocks. Never block the bereaved.
// - Terminal action: a quiet path to creating a memorial page.

type Pronoun = "she" | "he" | "they";

const P = {
  she: { subj: "She", subjL: "she", poss: "her", possL: "her", obj: "her", was: "was" },
  he: { subj: "He", subjL: "he", poss: "his", possL: "his", obj: "him", was: "was" },
  they: { subj: "They", subjL: "they", poss: "their", possL: "their", obj: "them", was: "were" },
};

const VARIANT_PROMPTS: Record<string, { days: string; loved: string; remember: string }> = {
  default: {
    days: "How they spent their days",
    loved: "What they loved",
    remember: "What people will remember",
  },
  mother: {
    days: "How she spent her days, in and beyond the home",
    loved: "What she loved, her table, her garden, her people",
    remember: "What her children will always remember",
  },
  father: {
    days: "His work and how he filled his days",
    loved: "What he loved, spoken or unspoken",
    remember: "What he taught without saying",
  },
  husband: {
    days: "Your life together, how it began and what you built",
    loved: "What he loved",
    remember: "What you and the family will remember",
  },
  wife: {
    days: "Your life together, the daily things she held",
    loved: "What she loved",
    remember: "What you and the family will remember",
  },
  grandmother: {
    days: "How she spent her days, and the family that grew around her",
    loved: "What she loved",
    remember: "What the grandchildren will remember",
  },
  infant: {
    days: "The time you had, in your own words",
    loved: "Who was waiting to love them",
    remember: "What you want the world to know",
  },
  friend: {
    days: "How they spent their days, as the family tells it",
    loved: "What they loved, confirmed with the family",
    remember: "What their people will remember",
  },
  veteran: {
    days: "How they spent their days, in service and after",
    loved: "What they loved",
    remember: "What people will remember",
  },
};

export default function ObituaryWriter({ variant = "default" }: { variant?: string }) {
  const prompts = VARIANT_PROMPTS[variant] || VARIANT_PROMPTS.default;
  const isVeteran = variant === "veteran";

  const [name, setName] = useState("");
  const [pronoun, setPronoun] = useState<Pronoun>("she");
  const [word, setWord] = useState("passed away"); // the family's word, never ours
  const [age, setAge] = useState("");
  const [home, setHome] = useState("");
  const [passedOn, setPassedOn] = useState("");
  const [bornLine, setBornLine] = useState("");
  const [days, setDays] = useState("");
  const [loved, setLoved] = useState("");
  const [remember, setRemember] = useState("");
  const [branch, setBranch] = useState("");
  const [era, setEra] = useState("");
  const [survived, setSurvived] = useState("");
  const [predeceased, setPredeceased] = useState("");
  const [service, setService] = useState("");
  const [memorialLine, setMemorialLine] = useState("");

  const [draft, setDraft] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [copied, setCopied] = useState(false);

  const ready = name.trim().length > 0 && (days.trim() || loved.trim() || remember.trim());
  const p = P[pronoun];

  function assemble() {
    const parts: string[] = [];
    const opening = [
      name.trim(),
      age.trim() && `, ${age.trim()}`,
      home.trim() && `, of ${home.trim()}`,
      `, ${word}`,
      passedOn.trim() && ` on ${passedOn.trim()}`,
      ".",
      bornLine.trim() && ` ${p.subj} ${p.was} born ${bornLine.trim()}.`,
    ]
      .filter(Boolean)
      .join("");
    parts.push(opening);

    const story = [days.trim(), loved.trim(), remember.trim()].filter(Boolean).join(" ");
    if (story) parts.push(story);

    if (isVeteran && (branch.trim() || era.trim())) {
      parts.push(
        `${p.subj} served in the ${branch.trim() || "armed forces"}${era.trim() ? `, ${era.trim()}` : ""}.`
      );
    }

    const family: string[] = [];
    if (survived.trim()) family.push(`${p.subj} ${pronoun === "they" ? "are" : "is"} survived by ${survived.trim()}.`);
    if (predeceased.trim()) family.push(`${p.subj} ${pronoun === "they" ? "were" : "was"} preceded in death by ${predeceased.trim()}.`);
    if (family.length) parts.push(family.join(" "));

    if (service.trim()) parts.push(service.trim());
    if (memorialLine.trim()) parts.push(memorialLine.trim());

    setDraft(parts.join("\n\n"));
    setUnlocked(false);
  }

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await fetch("/api/tool-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tool: "obituary-writer", variant }),
      });
    } catch {
      /* storing the email must never block the family */
    }
    setSending(false);
    setUnlocked(true);
  }

  async function copy() {
    if (!draft) return;
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function downloadTxt() {
    if (!draft) return;
    const blob = new Blob([draft], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `obituary-${name.trim().toLowerCase().replace(/[^a-z]+/g, "-") || "draft"}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const fields: Array<[string, string, string, (v: string) => void, string?]> = useMemo(
    () => [
      ["Their full name", name, "Eleanor Margaret Hayes", setName],
      ["Age (optional)", age, "76", setAge],
      ["Their home (optional)", home, "Half Moon Bay, California", setHome],
      ["Date of passing (optional)", passedOn, "November 18, 2024", setPassedOn],
      ["Born (optional)", bornLine, "June 4, 1948, in Sacramento", setBornLine],
    ],
    [name, age, home, passedOn, bornLine]
  );

  return (
    <div className="ow-root">
      <style
        dangerouslySetInnerHTML={{
          __html: `
.ow-root{max-width:680px;}
.ow-form{display:flex;flex-direction:column;gap:14px;}
.ow-form label{font-family:'Sometype Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#5F574E;display:block;margin-bottom:5px;}
.ow-form input[type=text],.ow-form input[type=email],.ow-form textarea,.ow-form select{width:100%;padding:10px 12px;border:1px solid rgba(44,37,32,.25);background:#fff;font-family:inherit;font-size:15px;color:#2C2520;}
.ow-form textarea{min-height:74px;resize:vertical;}
.ow-two{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.ow-note{font-size:13px;color:#5F574E;border-left:3px solid #C9A572;padding-left:12px;}
.ow-btn{display:inline-block;padding:11px 20px;background:#3f2c1a;color:#FAF5EC;border:none;font-family:inherit;font-size:15px;cursor:pointer;border-radius:2px;}
.ow-btn:hover{background:#241711;}
.ow-btn[disabled]{opacity:.5;cursor:default;}
.ow-btn.ghost{background:transparent;color:#3f2c1a;border:1px solid rgba(44,37,32,.35);}
.ow-draft{margin-top:26px;border:1px solid rgba(44,37,32,.18);background:#FDFBF6;padding:22px;}
.ow-draft h2{font-size:18px;font-weight:600;margin:0 0 6px;}
.ow-draft p.hint{font-size:13.5px;color:#5F574E;margin:0 0 12px;}
.ow-draft textarea{width:100%;min-height:280px;padding:14px;border:1px solid rgba(44,37,32,.2);background:#fff;font-family:inherit;font-size:15.5px;line-height:1.7;color:#2C2520;resize:vertical;}
.ow-gate{border:1px solid rgba(44,37,32,.18);background:#F3ECDD;padding:18px;margin-top:14px;}
.ow-gate p{font-size:14.5px;color:rgba(44,37,32,.8);margin:0 0 10px;}
.ow-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;}
.ow-cta{margin-top:14px;padding-top:14px;border-top:1px solid rgba(44,37,32,.14);font-size:14.5px;color:rgba(44,37,32,.8);}
.ow-cta a{color:#8A5F43;text-decoration:none;border-bottom:1px solid rgba(138,95,67,.4);}
@media print{body *{visibility:hidden;} .ow-draft,.ow-draft *{visibility:visible;} .ow-draft{position:fixed;inset:0;border:none;} .ow-gate,.ow-actions,.ow-draft p.hint{display:none;}}
`,
        }}
      />
      <div className="ow-form">
        {fields.map(([label, val, ph, set]) => (
          <div key={label}>
            <label>{label}</label>
            <input type="text" aria-label={label} value={val} placeholder={ph} onChange={(e) => set(e.target.value)} />
          </div>
        ))}
        <div className="ow-two">
          <div>
            <label>Their pronouns</label>
            <select aria-label="Their pronouns" value={pronoun} onChange={(e) => setPronoun(e.target.value as Pronoun)}>
              <option value="she">she / her</option>
              <option value="he">he / him</option>
              <option value="they">they / them</option>
            </select>
          </div>
          <div>
            <label>The word that feels right</label>
            <select aria-label="The word that feels right" value={word} onChange={(e) => setWord(e.target.value)}>
              <option value="passed away">passed away</option>
              <option value="died">died</option>
              <option value="entered rest">entered rest</option>
              <option value="went home">went home</option>
            </select>
          </div>
        </div>
        {isVeteran && (
          <div className="ow-two">
            <div>
              <label>Branch of service</label>
              <input type="text" aria-label="Branch of service" value={branch} placeholder="United States Army" onChange={(e) => setBranch(e.target.value)} />
            </div>
            <div>
              <label>Years or era served</label>
              <input type="text" aria-label="Years or era served" value={era} placeholder="1966 to 1970" onChange={(e) => setEra(e.target.value)} />
            </div>
          </div>
        )}
        <div>
          <label>{prompts.days}</label>
          <textarea aria-label={prompts.days} value={days} onChange={(e) => setDays(e.target.value)} placeholder="Write in full sentences. Your words go into the draft exactly as you write them." />
        </div>
        <div>
          <label>{prompts.loved}</label>
          <textarea aria-label={prompts.loved} value={loved} onChange={(e) => setLoved(e.target.value)} />
        </div>
        <div>
          <label>{prompts.remember}</label>
          <textarea aria-label={prompts.remember} value={remember} onChange={(e) => setRemember(e.target.value)} />
        </div>
        <div>
          <label>Survived by (optional)</label>
          <textarea aria-label="Survived by" value={survived} onChange={(e) => setSurvived(e.target.value)} placeholder="her daughters Anna (Mark) and Claire, and four grandchildren" />
        </div>
        <div>
          <label>Preceded in death by (optional)</label>
          <input type="text" aria-label="Preceded in death by" value={predeceased} onChange={(e) => setPredeceased(e.target.value)} placeholder="her husband, Thomas" />
        </div>
        <div>
          <label>Service details (optional)</label>
          <input type="text" aria-label="Service details" value={service} onChange={(e) => setService(e.target.value)} placeholder="A service will be held Saturday, November 23 at 11 am at St. Mary's Chapel." />
        </div>
        <div>
          <label>Memorial suggestion (optional)</label>
          <input type="text" aria-label="Memorial suggestion" value={memorialLine} onChange={(e) => setMemorialLine(e.target.value)} placeholder="In lieu of flowers, the family suggests donations to the Half Moon Bay Library." />
        </div>
        <p className="ow-note">
          The draft is assembled from your words alone. Nothing is written for you, and every
          line waits for your eyes before it goes anywhere.
        </p>
        <div>
          <button className="ow-btn" type="button" disabled={!ready} onClick={assemble}>
            {draft ? "Assemble again from the form" : "Assemble the draft"}
          </button>
        </div>
      </div>

      {draft !== null && (
        <div className="ow-draft">
          <h2>Their obituary, in your words</h2>
          <p className="hint">Read every line. Edit anything, right here, until it is true.</p>
          <textarea aria-label="The obituary draft, editable" value={draft} onChange={(e) => setDraft(e.target.value)} />
          {!unlocked ? (
            <form className="ow-gate" onSubmit={unlock}>
              <p>The full draft is above and stays editable. Enter your email and copying, printing, and download unlock. We will not add you to anything without asking.</p>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="email" aria-label="Your email address" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ flex: 1 }} />
                <button className="ow-btn" disabled={sending} type="submit">
                  {sending ? "One moment" : "Unlock"}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="ow-actions">
                <button className="ow-btn" type="button" onClick={copy}>
                  {copied ? "Copied" : "Copy the text"}
                </button>
                <button className="ow-btn ghost" type="button" onClick={downloadTxt}>
                  Download .txt
                </button>
                <button className="ow-btn ghost" type="button" onClick={() => window.print()}>
                  Print
                </button>
              </div>
              <p className="ow-cta">
                An obituary tells the world. A memorial page holds what the world sends back.{" "}
                <a href="/onboarding?from=obituary-writer">Create their page</a> · free, forever.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
