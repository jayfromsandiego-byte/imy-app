// /terms · Terms of Service. Plain, dignified language in the brand voice.
// Carries the canonical soft Permanence Pledge (never a fixed-year guarantee).
// This is a clear, good-faith starting point; have counsel review before launch.
export const metadata = {
  title: "Terms of Service · I Miss You Memorial",
  description: "The promises we make to you, and the few we ask in return.",
};

const UPDATED = "30 June 2026";

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

export default function TermsPage() {
  return (
    <main className="legal">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="wrap">
        <a className="home" href="/">← I Miss You Memorial</a>
        <div className="wm">I m<em>iss</em> you</div>
        <h1>Terms of Service</h1>
        <div className="updated">Last updated · {UPDATED}</div>

        <p>
          I Miss You Memorial helps you build a beautiful, lasting tribute page for someone you love.
          These terms explain how the service works and the few things we ask of you. We have tried to
          write them the way we write everything here: plainly, and without fine print meant to trip you up.
        </p>

        <h2>Your words and photos are yours</h2>
        <p>
          Everything you add to a tribute · names, stories, photographs, recordings, the small details that
          made a person themselves · belongs to you and your family. You grant us only the permission we need
          to host it, display it on the tribute page, and back it up safely. You can export your content at any
          time, and you can ask us to remove it.
        </p>

        <h2>Creating a tribute</h2>
        <p>
          By creating a tribute, you confirm you have the standing to memorialize the person and to share what
          you upload. Tribute pages you publish are public by design · they are meant to be shared with the people
          who loved them. You can keep a tribute unlisted or take it down at any time from your dashboard.
        </p>

        <h2>Memories left by others</h2>
        <p>
          Anyone with the link can light a candle or leave a memory. Memories are held privately until you, the
          family, welcome them in. You decide what appears. We add quiet safeguards against spam, but the page is
          yours to tend.
        </p>

        <h2>Plans, payments, and refunds</h2>
        <ul>
          <li><b>Free</b> · a complete tribute page, online for as long as we exist.</li>
          <li><b>Plus</b> · $97 once, or $12 a month: unlimited photos and video, audio memories, a custom design built around what they loved, a custom web address, and no footer credit.</li>
          <li><b>Concierge</b> · from $499: done for you. We meet with you, build a fully custom site, produce a memorial film, and mail a printed keepsake book and a framed portrait.</li>
        </ul>
        <p>
          Payments are handled securely by Stripe; we never see or store your card details. If something isn't
          right, write to us within 30 days of a purchase and we'll make it right, including a refund where fair.
          A lapsed Plus subscription never takes a page offline · premium features simply rest, and the tribute
          stays.
        </p>

        <h2>The Permanence Pledge</h2>
        <div className="label">Our promise</div>
        <div className="pledge">
          Your tribute stays online for as long as we exist · backed by a dedicated reserve fund and an independent
          backup archive, and your photos and words are always yours to export. If we ever had to close, we'd give
          at least 90 days' notice and a complete copy of everything. We will never charge a family to keep a memory alive.
        </div>
        <p>
          We do not promise a fixed number of years, because no honest company can. We promise something better:
          that we will not paywall the dead, that your memories remain yours, and that you will never be cut off
          without warning and a full copy in hand.
        </p>

        <h2>Acceptable use</h2>
        <p>
          Please use I Miss You Memorial for its purpose: honoring real people. Don't upload unlawful content,
          impersonate someone, or use the service to harass. We may remove content or close accounts that do
          serious harm, and we'll explain why when we can.
        </p>

        <h2>Availability and changes</h2>
        <p>
          We work hard to keep tributes online and loading quickly, but we can't promise the service will never be
          interrupted. We may improve or change features over time. If we ever make a material change to these
          terms, we'll let you know.
        </p>

        <h2>Liability</h2>
        <p>
          The service is provided as-is. To the extent the law allows, our liability is limited to the amount you
          paid us in the prior twelve months. Nothing here limits rights that can't be limited by law.
        </p>

        <h2>Talk to us</h2>
        <p>
          If anything here is unclear, or you need help with a tribute, write to{" "}
          <a href="mailto:imissyoumemorial@gmail.com">imissyoumemorial@gmail.com</a>. A person will answer.
        </p>

        <footer>
          With love, from I Miss You Memorial. See also our{" "}
          <a href="/privacy">Privacy Policy</a>.
        </footer>
      </div>
    </main>
  );
}
