// app/blog/layout.tsx — the shell for "Notes on remembering".
// New pages, built in the house system (cream, Besley, Sometype Mono,
// terracotta) — the locked design finals are not touched by any of this.

const CSS = `
.nb{--cream:#FAF5EC;--cream-deep:#F3ECDD;--ink:#2C2520;--ink-soft:#6b5f52;--terracotta:#A87C5F;--gold:#C9A572;--night:#1A130D;--line:rgba(44,37,32,.14);
font-family:'Besley',Georgia,serif;background:var(--cream);color:var(--ink);-webkit-font-smoothing:antialiased;min-height:100vh;display:flex;flex-direction:column}
.nb *{box-sizing:border-box}
.nb a:focus-visible{outline:2px solid var(--terracotta);outline-offset:3px;border-radius:3px}
.nb-head{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:20px 6%;border-bottom:1px solid var(--line)}
.nb-wm{font-weight:800;font-size:19px;color:var(--ink);text-decoration:none;letter-spacing:-.01em}
.nb-wm em{font-style:italic;color:var(--terracotta)}
.nb-nav{display:flex;gap:20px;align-items:center}
.nb-nav a{font-family:'Sometype Mono',monospace;font-size:12.5px;letter-spacing:.04em;color:var(--ink-soft);text-decoration:none}
.nb-nav a:hover{color:var(--terracotta)}
.nb-nav a.nb-cta{color:#fff;background:var(--terracotta);padding:9px 18px;border-radius:24px}
.nb-nav a.nb-cta:hover{background:#96704f;color:#fff}
.nb-main{flex:1;width:100%;max-width:720px;margin:0 auto;padding:54px 24px 84px}
.nb-label{font-family:'Sometype Mono',monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--terracotta)}
.nb-h1{font-size:clamp(30px,5.4vw,44px);line-height:1.14;font-weight:700;margin:14px 0 18px;letter-spacing:-.01em}
.nb-intro{font-size:18px;line-height:1.65;color:var(--ink-soft);max-width:56ch}
.nb-lede{font-size:19px;line-height:1.6;color:var(--ink-soft);font-style:italic;margin:0 0 12px}
.nb-meta{font-family:'Sometype Mono',monospace;font-size:12px;color:var(--ink-soft);letter-spacing:.05em;margin:0 0 38px}
.nb-body{font-size:17.5px;line-height:1.75}
.nb-body h2{font-size:24px;line-height:1.25;margin:44px 0 14px;font-weight:700}
.nb-body p{margin:0 0 18px}
.nb-body a{color:var(--terracotta)}
.nb-body ul{padding-left:22px;margin:0 0 18px}
.nb-body li{margin-bottom:9px}
.nb-body blockquote{margin:28px 0;padding:4px 0 4px 20px;border-left:3px solid var(--gold);font-style:italic;color:var(--ink-soft)}
.nb-list{list-style:none;margin:36px 0 0;padding:0}
.nb-item{padding:26px 0;border-top:1px solid var(--line)}
.nb-item:first-child{border-top:0;padding-top:16px}
.nb-item a{text-decoration:none;color:inherit;display:block}
.nb-item h2{font-size:23px;line-height:1.3;margin:8px 0;font-weight:700}
.nb-item a:hover h2{color:var(--terracotta)}
.nb-item p{margin:0;color:var(--ink-soft);line-height:1.6;font-size:15.5px}
.nb-item .nb-when{font-family:'Sometype Mono',monospace;font-size:11.5px;letter-spacing:.06em;color:var(--ink-soft)}
.nb-end{margin-top:54px;background:var(--cream-deep);border:1px solid var(--line);border-radius:16px;padding:26px 26px 24px}
.nb-end p{margin:0 0 16px;line-height:1.65}
.nb-end a{display:inline-block;background:var(--terracotta);color:#fff;text-decoration:none;font-weight:600;padding:11px 22px;border-radius:26px;font-size:15px}
.nb-end a:hover{background:#96704f}
.nb-foot{background:var(--night);color:#e9ddc9;padding:44px 6%;text-align:center}
.nb-foot .nb-wm{color:#fff;font-size:21px}
.nb-foot .nb-perm{font-family:'Sometype Mono',monospace;font-size:12px;color:var(--gold);max-width:520px;margin:12px auto 20px;line-height:1.8}
.nb-foot nav{display:flex;gap:18px;justify-content:center;flex-wrap:wrap}
.nb-foot nav a{color:#cbb99b;font-size:13.5px;text-decoration:none}
.nb-foot nav a:hover{color:#fff}
@media (max-width:560px){.nb-head{padding:16px 5%}.nb-nav{gap:12px}.nb-main{padding:40px 20px 64px}}
`;

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="nb">
      {/* Same font service the rest of the site uses; body-rendered links are valid and apply globally. */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Besley:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700&family=Sometype+Mono:wght@400;500;700&display=swap"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: "body{margin:0}" + CSS }} />
      <header className="nb-head">
        <a className="nb-wm" href="/">
          I <em>Miss</em> You Memorial
        </a>
        <nav className="nb-nav">
          <a href="/blog">Notes</a>
          <a className="nb-cta" href="/onboarding">
            Begin a memorial
          </a>
        </nav>
      </header>
      <main className="nb-main">{children}</main>
      <footer className="nb-foot">
        <div className="nb-wm">
          I <em>Miss</em> You Memorial
        </div>
        <p className="nb-perm">
          Every tribute stays online. We never charge a family to keep a memory alive.
        </p>
        <nav>
          <a href="/">Home</a>
          <a href="/blog">Notes</a>
          <a href="/contact">Contact</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </nav>
      </footer>
    </div>
  );
}
