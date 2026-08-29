import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { findEntry, entryPath, liveEntries } from "@/lib/seo/catalog";
import { seoPageMetadata, jsonLdScript, SITE } from "@/lib/seo/meta";
import { getContent } from "@/lib/seo/content/registry";
import CostCalculator from "@/components/tools/CostCalculator";

// Guide pages render only when live. YMYL rules:
// - Personal-advice guides (how to write an obituary, a eulogy) ship ONLY with
//   a named human author (lib/seo/authors, published: true).
// - Data guides (costs) may ship under organizational authorship WITH cited
//   sources and an honest methodology note — the citations are the authority.

export function generateStaticParams() {
  return liveEntries("guides").map((e) => ({ parts: e.slug.split("/") }));
}

export function generateMetadata({ params }: { params: { parts: string[] } }): Metadata {
  const entry = findEntry("guides", params.parts);
  if (!entry || entry.status !== "live") return {};
  return seoPageMetadata({ title: entry.h1, description: entry.description, path: entryPath(entry) });
}

export default function GuidePage({ params }: { params: { parts: string[] } }) {
  const entry = findEntry("guides", params.parts);
  if (!entry || entry.status !== "live") notFound();
  const content = getContent(entry.slug);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: entry.h1,
    description: entry.description,
    author: { "@id": `${SITE}/#organization` },
    publisher: { "@id": `${SITE}/#organization` },
    mainEntityOfPage: `${SITE}${entryPath(entry)}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(articleLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Guides", item: `${SITE}/guides` },
              { "@type": "ListItem", position: 2, name: entry.h1, item: `${SITE}${entryPath(entry)}` },
            ],
          }),
        }}
      />
      <p className="km-label">Guide</p>
      <h1 className="km-h1">{entry.h1}</h1>
      <p className="km-intro">{content ? content.intro : entry.description}</p>

      {content && (
        <div className="km-sections">
          <style
            dangerouslySetInnerHTML={{
              __html: `
.km-sections h2{font-size:22px;font-weight:600;margin:40px 0 12px;}
.km-sections p{font-size:16.5px;color:rgba(44,37,32,.85);margin:0 0 16px;max-width:66ch;}
.km-sections ul{margin:0 0 16px;padding-left:22px;}
.km-sections li{font-size:16px;color:rgba(44,37,32,.85);margin-bottom:6px;}
.km-sections .km-listtitle{font-family:'Sometype Mono',ui-monospace,monospace;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#8A5F43;margin:0 0 8px;}
.km-faq{margin-top:48px;border-top:1px solid rgba(44,37,32,.14);padding-top:8px;}
.km-faq h3{font-size:17.5px;font-weight:600;margin:26px 0 8px;}
.km-sources{margin-top:48px;border-top:1px solid rgba(44,37,32,.14);padding-top:18px;}
.km-sources h2{font-size:16px;margin:0 0 10px;}
.km-sources li{font-size:13.5px;color:rgba(44,37,32,.7);}
.km-sources a{color:#8A5F43;text-decoration:none;border-bottom:1px solid rgba(138,95,67,.35);word-break:break-all;}
.km-calcslot{margin:34px 0;}
`,
            }}
          />
          {content.sections.map((s) => (
            <section key={s.heading}>
              <h2>{s.heading}</h2>
              {s.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              {s.list && (
                <>
                  {s.list.title && <p className="km-listtitle">{s.list.title}</p>}
                  <ul>
                    {s.list.items.map((it, i) => (
                      <li key={i}>{it}</li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          ))}

          {entry.slug === "average-funeral-cost" && (
            <div className="km-calcslot">
              <h2>Work out your own estimate</h2>
              <CostCalculator mode="funeral" />
            </div>
          )}

          {content.faq.length > 0 && (
            <div className="km-faq">
              <h2>Questions, answered plainly</h2>
              {content.faq.map((f) => (
                <div key={f.q}>
                  <h3>{f.q}</h3>
                  <p>{f.a}</p>
                </div>
              ))}
            </div>
          )}

          {content.sources && content.sources.length > 0 && (
            <div className="km-sources">
              <h2>Sources</h2>
              <ul>
                {content.sources.map((s) => (
                  <li key={s.url}>
                    {s.label} ·{" "}
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </>
  );
}
