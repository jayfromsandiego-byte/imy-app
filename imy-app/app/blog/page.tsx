import type { Metadata } from "next";
import { articles, readingMinutes } from "@/lib/blog/articles";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://imissyoumemorial.com";

export const metadata: Metadata = {
  title: "Notes on remembering",
  description:
    "Quiet, practical guides for remembering someone you love — what to write, how to gather memories, and how to keep a page for them.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Notes on remembering · I Miss You Memorial",
    description:
      "Quiet, practical guides for remembering someone you love — what to write, how to gather memories, and how to keep a page for them.",
    url: "/blog",
    type: "website",
    siteName: "I Miss You Memorial",
  },
};

const fmt = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

export default function BlogIndex() {
  const list = [...articles].sort((a, b) => b.datePublished.localeCompare(a.datePublished));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Notes on remembering",
    url: `${SITE}/blog`,
    description:
      "Quiet, practical guides for remembering someone you love — what to write, how to gather memories, and how to keep a page for them.",
    publisher: { "@id": `${SITE}/#organization` },
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <p className="nb-label">Notes on remembering</p>
      <h1 className="nb-h1">Small guides for a hard season</h1>
      <p className="nb-intro">
        What to write, how to gather the photos and the voices, and how to keep someone close.
        Written slowly, meant to be useful.
      </p>
      <ul className="nb-list">
        {list.map((a) => (
          <li className="nb-item" key={a.slug}>
            <a href={`/blog/${a.slug}`}>
              <span className="nb-when">
                {fmt(a.datePublished)} · {readingMinutes(a)} minute read
              </span>
              <h2>{a.title}</h2>
              <p>{a.description}</p>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
