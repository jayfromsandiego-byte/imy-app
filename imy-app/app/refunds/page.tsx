// /refunds — the refund policy, written the way we actually behave.
// The generous stance already lives in code (a refund rests features and the
// page stays up); this page says it out loud. Have counsel read before leaning on it.
export const metadata = {
  title: "Refunds · I Miss You Memorial",
  description: "Plain words about money: how refunds work, and the one thing that never changes.",
};

const UPDATED = "6 July 2026";

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

export default function RefundsPage() {
  return (
    <main className="legal">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="wrap">
        <a className="home" href="/">← I Miss You Memorial</a>
        <div className="wm">I <em>Miss</em> You Memorial</div>
        <h1>Refunds</h1>
        <div className="updated">Last updated · {UPDATED}</div>

        <div className="pledge">
          <div className="label">The one thing that never changes</div>
          A refund is about money, never about the memorial. If we return your payment,
          the page stays online. We never take a tribute down over a bill.
        </div>

        <h2>Plus, paid once ($97)</h2>
        <p>
          If Plus is not what you hoped, write to us within 30 days and we will refund it in full —
          no forms, no questions that make you justify your grief. The page returns to the free plan:
          premium features rest, everything you added is kept, and nothing is deleted.
        </p>

        <h2>Plus, monthly ($12 a month)</h2>
        <p>
          The first three days are free, and we send a note before the first charge. Cancel any time
          from Billing — the month you paid for stays yours to the end, and we do not charge again.
          If a charge lands that you did not mean to keep, tell us within 14 days and we will return it.
        </p>

        <h2>A gift from someone else (Family Unlock)</h2>
        <p>
          When a friend opens the full memorial for a family, that gift can be refunded within 30 days
          at the giver&rsquo;s request. The family keeps every word and photograph; the wall simply
          returns to its free shape.
        </p>

        <h2>Concierge work</h2>
        <p>
          Hand-built tributes are agreed person to person, and so are their refunds: if we have not
          started, everything comes back; if we are mid-work, we return what is fair and finish what
          you ask us to. It is a conversation, not a policy.
        </p>

        <h2>How to ask</h2>
        <p>
          Reply to any receipt, or write to <a href="mailto:hello@imissyoumemorial.com">hello@imissyoumemorial.com</a>.
          Refunds return to the card that paid within 5&ndash;10 business days, through Stripe.
        </p>

        <footer>
          Questions sit better in an inbox than in a policy. Write to us.
        </footer>
      </div>
    </main>
  );
}
