import type { ReactNode } from "react";

// Shared shell for /tools, /templates, and /guides — the keepsakes pages.
// Self-contained styles in the house system (cream, ink, terracotta, Besley).
// These classes (km-*) are scoped to this route group only.

export default function SeoSectionLayout({ children }: { children: ReactNode }) {
  return (
    <div className="km-page">
      <style
        // Scoped, self-contained — no global stylesheet dependency.
        dangerouslySetInnerHTML={{
          __html: `
.km-page{background:#FAF5EC;color:#2C2520;min-height:100vh;font-family:Besley,Georgia,'Times New Roman',serif;line-height:1.65;}
.km-wrap{max-width:760px;margin:0 auto;padding:56px 6% 96px;}
.km-label{font-family:'Sometype Mono',ui-monospace,monospace;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#A87C5F;margin:0 0 18px;}
.km-h1{font-size:clamp(30px,5vw,42px);font-weight:600;line-height:1.15;margin:0 0 18px;letter-spacing:-0.01em;}
.km-intro{font-size:18px;color:rgba(44,37,32,.82);margin:0 0 36px;max-width:58ch;}
.km-list{list-style:none;margin:0;padding:0;}
.km-item{border-top:1px solid rgba(44,37,32,.14);}
.km-item:last-child{border-bottom:1px solid rgba(44,37,32,.14);}
.km-item a{display:block;padding:22px 4px;text-decoration:none;color:inherit;}
.km-item a:hover h2{color:#A87C5F;}
.km-item h2{font-size:20px;font-weight:600;margin:0 0 6px;transition:color .15s;}
.km-item p{font-size:15px;color:rgba(44,37,32,.72);margin:0;max-width:64ch;}
.km-empty{border:1px dashed rgba(44,37,32,.25);background:#F3ECDD;padding:28px;font-size:16px;color:rgba(44,37,32,.75);}
.km-home{margin-top:64px;padding-top:28px;border-top:1px solid rgba(44,37,32,.14);font-size:15px;color:rgba(44,37,32,.72);}
.km-home a{color:#A87C5F;text-decoration:none;border-bottom:1px solid rgba(168,124,95,.4);}
`,
        }}
      />
      <main className="km-wrap">{children}</main>
    </div>
  );
}
