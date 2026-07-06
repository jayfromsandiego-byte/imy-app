// /privacy — Privacy Policy. Same quiet voice as the rest of the product.
// A good-faith, accurate description of how data is handled; have counsel review.
export const metadata = {
  title: "Privacy Policy · I Miss You Memorial",
  description: "What we keep, what we never do, and how to take everything with you.",
};

const UPDATED = "29 June 2026";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Besley:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Sometype+Mono:wght@400;500&display=swap');
.legal{--cream:#FAF5EC;--cream-deep:#F3ECDD;--ink:#2C2520;--ink-soft:#6b5f52;--terra:#A87C5F;--gold:#C9A572;--line:#e7dcc8;
  background:var(--cream);color:var(--ink);font-family:'Besley',Georgia,serif;line-height:1.7;font-size:17px;min-height:100vh;-webkit-font-smoothing:antialiased}
.legal *{box-sizing:border-box}
.legal .wrap{max-width:720px;margin:0 auto;padding:40px 22px 90px}
.legal a{color:var(--terra)}
.legal .home{display:inline-block;font-family:'Sometype Mono',monospace;font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-soft);text-decoration:none;border-bottom:1px solid var(--line);padding-bottom:2px}
.legal .wm{font-size:1.5rem;margin:26px 0 4px;font-weight:500}
.legal .wm em{font-style:italic;color:var(--terra)}
.legal .updated{font-family:'Sometype Mono',monospace;font-size:.74rem;letter-spacing:.08em;color:var(--ink-soft);text-transform:uppercase;margin-bottom:30px}
.legal h1{font-size:2.2rem;font-weight:500;line-height:1.15;margin:8px 0 18px}
.legal h2{font-size:1.25rem;font-weight:600;margin:34px 0 8px}
.legal p{margin:0 0 14px;color:#3a332b}
.legal ul{margin:0 0 14px 1.1em;padding:0}.legal li{margin:0 0 8px}
.legal .pledge{background:var(--cream-deep);border:1px solid var(--line);border-left:3px solid var(--terra);border-radius:14px;padding:22px 24px;margin:22px 0;font-size:1.05rem;font-style:italic;color:#3a332b}
.legal .label{font-family:'Sometype Mono',monospace;font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:var(--terra);margin-bottom:8px}
.legal footer{margin-top:46px;padding-top:22px;border-top:1px solid var(--line);font-size:.92rem;color:var(--ink-soft)}
`;

export default function PrivacyPage() {
  return (
    <main className="legal">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="wrap">
        <a className="home" href="/">← I Miss You Memorial</a>
        <div className="wm">I m<em>iss</em> you</div>
        <h1>Privacy Policy</h1>
        <div className="updated">Last updated · {UPDATED}</div>

        <p>
          A memorial holds some of the most tender information a person can share. We treat it that way. This page
          explains, plainly, what we keep, what we never do, and how to take everything with you whenever you wish.
        </p>

        <h2>What we keep</h2>
        <ul>
          <li><b>Your account</b> — the email you sign in with. We use magic links, so we don't store passwords.</li>
          <li><b>Tribute content</b> — the names, dates, stories, photos, video, and audio you choose to add.</li>
          <li><b>Memories and candles</b> — words others leave, the name they sign, and a simple count of candles lit.</li>
          <li><b>Basic, aggregate usage</b> — only if analytics is enabled, and only in a cookieless, anonymous form (see below).</li>
        </ul>

        <h2>What we never do</h2>
        <ul>
          <li>We never sell your data, or a loved one's memory, to anyone.</li>
          <li>We never use your content to target advertising, and we run no ad trackers.</li>
          <li>We never email you to "re-engage." We write only when it matters — a receipt, a security note, an answer.</li>
        </ul>

        <h2>Cookies and analytics</h2>
        <p>
          We use a single essential cookie to keep you signed in. We do not use advertising or cross-site tracking
          cookies. If site analytics is enabled, it is a privacy-friendly, cookieless measure of page views in
          aggregate — it does not build a profile of you and does not follow you across the web.
        </p>

        <h2>Who helps us run the service</h2>
        <p>
          We rely on a small number of trusted providers, each only for what they do:
        </p>
        <ul>
          <li><b>Supabase</b> — secure database, sign-in, and storage.</li>
          <li><b>Cloudflare R2</b> — durable storage and delivery of photos and video.</li>
          <li><b>Stripe</b> — payments. Your card details go to Stripe, never to us.</li>
          <li><b>Resend</b> — sending sign-in links and receipts.</li>
          <li><b>Vercel</b> — hosting the application.</li>
        </ul>
        <p>These providers process data on our behalf under their own strong security commitments.</p>

        <h2>Public by intention</h2>
        <p>
          A published tribute is meant to be shared, so its contents are public to anyone with the link. Memories
          left by others stay private until the family welcomes them in. You can keep a tribute unlisted, or take
          it down, from your dashboard at any time.
        </p>

        <h2>Your content is yours</h2>
        <div className="label">Always exportable</div>
        <div className="pledge">
          Your photos and words are always yours to export. If we ever had to close, we'd give at least 90 days'
          notice and a complete copy of everything. We will never charge a family to keep a memory alive.
        </div>
        <p>
          You can request a full export or deletion of a tribute and its account data at any time by writing to us.
          We'll confirm and carry it out promptly.
        </p>

        <h2>Children</h2>
        <p>
          The service is intended for adults creating tributes. Tributes may, of course, honor a child who has
          passed; that is for the family to decide, with all the care it deserves.
        </p>

        <h2>Changes and contact</h2>
        <p>
          If we update this policy in a meaningful way, we'll say so. For any question about your privacy, or to
          request an export or deletion, write to{" "}
          <a href="mailto:hello@imissyoumemorial.com">hello@imissyoumemorial.com</a>.
        </p>

        <footer>
          With love, from I Miss You Memorial. See also our <a href="/terms">Terms of Service</a>.
        </footer>
      </div>
    </main>
  );
}
