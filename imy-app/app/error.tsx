"use client";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Besley:ital,wght@0,500;0,700;1,500&display=swap');
.er{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#FAF5EC;color:#2C2520;font-family:'Besley',Georgia,serif;text-align:center;padding:24px;-webkit-font-smoothing:antialiased}
.er .b{max-width:30rem}
.er .wm{font-weight:700;font-size:1.05rem;margin-bottom:24px}.er .wm em{font-style:italic;color:#A87C5F}
.er h1{font-weight:500;font-size:1.8rem;line-height:1.2;margin:0 0 12px}
.er p{color:#6b5f52;line-height:1.6;margin:0 0 24px}
.er .row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.er button{background:#A87C5F;color:#fff;border:none;font-family:inherit;font-weight:600;font-size:1rem;padding:12px 26px;border-radius:30px;cursor:pointer}
.er a{display:inline-block;color:#A87C5F;text-decoration:none;font-weight:600;padding:12px 22px;border:1px solid #e7dcc8;border-radius:30px}
`;

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="er">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="b">
        <div className="wm">I <em>Miss</em> You Memorial</div>
        <h1>Something went quiet for a moment.</h1>
        <p>A small hitch on our end — nothing you did, and nothing is lost. Please try again.</p>
        <div className="row">
          <button type="button" onClick={() => reset()}>Try again</button>
          <a href="/">Return home</a>
        </div>
      </div>
    </main>
  );
}
