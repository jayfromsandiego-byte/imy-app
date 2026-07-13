import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { articles, getArticle, readingMinutes } from "@/lib/blog/articles";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://imissyoumemorial.com";

export const dynamicParams = false;

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const a = getArticle(params.slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.description,
    alternates: { canonical: `/blog/${a.slug}` },
    openGraph: {
      type: "article",
      title: `${a.title} · I Miss You Memorial`,
      description: a.description,
      url: `/blog/${a.slug}`,
      siteName: "I Miss You Memorial",
      publishedTime: a.datePublished,
      modifiedTime: a.dateModified || a.datePublished,
      images: [`${SITE}/hero.jpg`],
    },
    twitter: { card: "summary_large_image", title: a.title, description: a.description },
  };
}

const fmt = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

export default function BlogArticlePage({ params }: { params: { slug: string } }) {
  const a = getArticle(params.slug);
  if (!a) notFound();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: a.title,
      description: a.description,
      datePublished: a.datePublished,
      dateModified: a.dateModified || a.datePublished,
      image: [`${SITE}/hero.jpg`],
      mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}/blog/${a.slug}` },
      author: { "@type": "Organization", name: "I Miss You Memorial", url: SITE },
      publisher: { "@id": `${SITE}/#organization` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE },
        { "@type": "ListItem", position: 2, name: "Notes on remembering", item: `${SITE}/blog` },
        { "@type": "ListItem", position: 3, name: a.title, item: `${SITE}/blog/${a.slug}` },
      ],
    },
  ];

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <p className="nb-label">Notes on remembering</p>
      <h1 className="nb-h1">{a.title}</h1>
      <p className="nb-lede">{a.lede}</p>
      <p className="nb-meta">
        {fmt(a.datePublished)} · {readingMinutes(a)} minute read · I Miss You Memorial
      </p>
      <div className="nb-body" dangerouslySetInnerHTML={{ __html: a.bodyHtml }} />
      <aside className="nb-end">
        <p>
          If you are gathering memories of someone you love, a tribute page can hold them — their
          photos, their story, and the voices of everyone who misses them. Free, forever.
        </p>
        <a href="/onboarding">Begin their page</a>
      </aside>
    </article>
  );
}
