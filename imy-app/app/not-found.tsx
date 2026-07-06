export const metadata = { title: "Not found" };

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Besley:ital,wght@0,500;0,700;1,500&display=swap');
.nf{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#FAF5EC;color:#2C2520;font-family:'Besley',Georgia,serif;text-align:center;padding:24px;-webkit-font-smoothing:antialiased}
.nf .b{max-width:30rem}
.nf .wm{font-weight:700;font-size:1.05rem;margin-bottom:24px}.nf .wm em{font-style:italic;color:#A87C5F}
.nf h1{font-weight:500;font-size:1.8rem;line-height:1.2;margin:0 0 12px}
.nf p{color:#6b5f52;line-height:1.6;margin:0 0 24px}
.nf a{display:inline-block;background:#A87C5F;color:#fff;text-decoration:none;font-weight:600;padding:12px 26px;border-radius:30px}
`;

export default function NotFound() {
  return (
    <main className="nf">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="b">
        <div className="wm">I <em>Miss</em> You Memorial</div>
        <h1>This page couldn&rsquo;t be found.</h1>
        <p>The link may be mistyped, or the page may have moved. Let&rsquo;s get you back.</p>
        <a href="/">Return home</a>
      </div>
    </main>
  );
}
