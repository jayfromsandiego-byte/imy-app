import type { Metadata } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://imissyoumemorial.com";

export const metadata: Metadata = {
  // The root layout's title template appends "· I Miss You Memorial" —
  // a full title here doubled the brand name in the tab and the SERP.
  title: "About",
  description:
    "Why we built a place to keep someone close — and the promise that every memorial stays online, free, forever.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About · I Miss You Memorial",
    description:
      "Why we built a place to keep someone close — and the promise that every memorial stays online, free, forever.",
    url: "/about",
    type: "website",
    siteName: "I Miss You Memorial",
  },
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}/#organization`,
    name: "I Miss You Memorial",
    url: SITE,
    logo: `${SITE}/brand/imy-mark.svg`,
    description:
      "A place to keep someone close. Memorial pages with their photos, their story, and the voices of everyone who misses them — free, forever.",
    contactPoint: { "@type": "ContactPoint", url: `${SITE}/contact` },
  };
  return (
    <div className="ab-page">
      <style
        dangerouslySetInnerHTML={{
          __html: `
.ab-page{background:#FAF5EC;color:#2C2520;min-height:100vh;font-family:Besley,Georgia,'Times New Roman',serif;line-height:1.7;}
.ab-wrap{max-width:680px;margin:0 auto;padding:64px 6% 96px;}
.ab-label{font-family:'Sometype Mono',ui-monospace,monospace;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#A87C5F;margin:0 0 18px;}
.ab-h1{font-size:clamp(30px,5vw,42px);font-weight:600;line-height:1.15;margin:0 0 26px;letter-spacing:-0.01em;}
.ab-wrap p{font-size:17.5px;color:rgba(44,37,32,.85);margin:0 0 22px;}
.ab-pledge{border-left:3px solid #C9A572;padding:4px 0 4px 24px;margin:36px 0;}
.ab-pledge h2{font-size:21px;font-weight:600;margin:0 0 10px;}
.ab-links{margin-top:48px;padding-top:26px;border-top:1px solid rgba(44,37,32,.14);font-size:15.5px;}
.ab-links a{color:#A87C5F;text-decoration:none;border-bottom:1px solid rgba(168,124,95,.4);}
`,
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <main className="ab-wrap">
        <p className="ab-label">About</p>
        <h1 className="ab-h1">A place to keep someone close</h1>
        <p>
          I Miss You Memorial began with a simple observation. When someone dies, the people
          who love them are handed a hundred practical tasks and almost nowhere to put the
          love itself. The photos scatter. The stories stay untold. The voice fades.
        </p>
        <p>
          So we build memorial pages — a portrait held in a stone arch, a wall of memories
          from everyone who knew them, flowers laid by real visitors, candles lit on real
          nights. A page is free to make and takes minutes. Everything on it waits for the
          family before it appears.
        </p>
        <p>
          We also make free tools for the hardest week — programs, obituaries, checklists —
          because the practical parts deserve care too. Nothing about grief should be upsold.
        </p>
        <div className="ab-pledge">
          <h2>The Permanence Pledge</h2>
          <p>
            Every tribute stays online. We never charge a family to keep a memory alive. Free
            pages stay free forever. If a paid plan lapses, the page stays and its premium
            features rest — nothing is ever deleted.
          </p>
        </div>
        <p className="ab-links">
          <a href="/onboarding">Create a memorial page</a> · <a href="/sites/eleanor">See a living example</a> ·{" "}
          <a href="/contact">Write to us</a>
        </p>
      </main>
    </div>
  );
}
