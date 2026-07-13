// /contact · a quiet way to reach us. One form, no account, answered by a person.
// Same paper as the legal pages; the concierge door and the footer both land here.
export const metadata = {
  title: "Contact us · I Miss You Memorial",
  description: "Write to us about a page, a concierge tribute, or anything at all. A person answers.",
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Besley:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Sometype+Mono:wght@400;500&display=swap');
.legal{--cream:#FAF5EC;--cream-deep:#F3ECDD;--ink:#2C2520;--ink-soft:#6b5f52;--terra:#A87C5F;--gold:#C9A572;--line:#e7dcc8;
  background:var(--cream);color:var(--ink);font-family:'Besley',Georgia,serif;line-height:1.7;font-size:17px;min-height:100vh;-webkit-font-smoothing:antialiased}
.legal *{box-sizing:border-box}
.legal .wrap{max-width:620px;margin:0 auto;padding:40px 22px 90px}
.legal a{color:var(--terra)}
.legal .home{display:inline-block;font-family:'Sometype Mono',monospace;font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-soft);text-decoration:none;border-bottom:1px solid var(--line);padding-bottom:2px}
.legal .wm{font-size:1.5rem;margin:26px 0 4px;font-weight:500}
.legal .wm em{font-style:italic;color:var(--terra)}
.legal h1{font-size:2.2rem;font-weight:500;line-height:1.15;margin:8px 0 10px}
.legal p{margin:0 0 14px;color:#3a332b}
.legal .sub{font-family:'Sometype Mono',monospace;font-size:.74rem;letter-spacing:.08em;color:var(--ink-soft);text-transform:uppercase;margin-bottom:26px}
.legal form{margin-top:8px}
.legal label{display:block;margin-bottom:14px}
.legal .fl{display:block;font-family:'Sometype Mono',monospace;font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-soft);margin-bottom:6px}
.legal input,.legal textarea{width:100%;border:1px solid var(--line);border-radius:10px;background:#fff;padding:12px 13px;font-family:'Besley',Georgia,serif;font-size:15.5px;color:var(--ink);outline:none}
.legal input:focus,.legal textarea:focus{border-color:var(--terra)}
.legal textarea{min-height:170px;resize:vertical}
.legal .row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:560px){.legal .row{grid-template-columns:1fr}}
.legal .send{margin-top:6px;background:var(--terra);color:#fff;border:none;border-radius:26px;padding:13px 30px;font-family:'Besley',Georgia,serif;font-weight:600;font-size:16px;cursor:pointer}
.legal .send:hover{background:#946a4f}
.legal .sent{background:var(--cream-deep);border:1px solid var(--line);border-left:3px solid var(--terra);border-radius:14px;padding:20px 22px;margin:18px 0;font-style:italic;color:#3a332b}
.legal .hp{position:absolute;left:-9999px;top:-9999px;height:0;overflow:hidden}
.legal footer{margin-top:46px;padding-top:22px;border-top:1px solid var(--line);font-size:.92rem;color:var(--ink-soft)}
`;

export default function ContactPage({ searchParams }: { searchParams?: { subject?: string; sent?: string } }) {
  const sent = searchParams?.sent === "1";
  const subject = (searchParams?.subject || "").slice(0, 120);
  return (
    <main className="legal">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="wrap">
        <a className="home" href="/">← I Miss You Memorial</a>
        <div className="wm">I <em>Miss</em> You Memorial</div>
        <h1>Write to us.</h1>
        <div className="sub">a person reads every note · usually within a day</div>

        {sent ? (
          <div className="sent">
            Your note is with us. We will write back soon — usually within a day, often sooner.
            Thank you for trusting us with it.
          </div>
        ) : null}

        <p>
          About a page, a concierge tribute, a memorial book, or anything that is on your mind.
          If it is easier, email us directly at <a href="mailto:imissyoumemorial@gmail.com">imissyoumemorial@gmail.com</a>.
        </p>

        <form method="POST" action="/api/contact">
          <div className="row">
            <label>
              <span className="fl">Your name</span>
              <input name="name" required maxLength={120} autoComplete="name" />
            </label>
            <label>
              <span className="fl">Your email</span>
              <input name="email" type="email" required maxLength={200} autoComplete="email" />
            </label>
          </div>
          <label>
            <span className="fl">What it is about</span>
            <input name="subject" maxLength={140} defaultValue={subject} placeholder="A concierge tribute · a question about a page" />
          </label>
          <label>
            <span className="fl">Your note</span>
            <textarea name="message" required maxLength={5000} placeholder="Take your time. There is no rush here." />
          </label>
          {/* a hidden field real people never see */}
          <label className="hp" aria-hidden="true">
            <span className="fl">Company</span>
            <input name="company" tabIndex={-1} autoComplete="off" />
          </label>
          <button className="send" type="submit">Send the note</button>
        </form>

        <footer>
          Every page stays online. We never charge a family to keep a memory alive.
        </footer>
      </div>
    </main>
  );
}
