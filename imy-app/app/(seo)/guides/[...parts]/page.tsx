import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { findEntry, entryPath, liveEntries } from "@/lib/seo/catalog";
import { seoPageMetadata } from "@/lib/seo/meta";

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

  // W2+: guide content modules mount here. Every guide carries a real author
  // block (lib/seo/authors) and an Article JSON-LD — YMYL rules, no exceptions.
  return (
    <>
      <p className="km-label">Guide</p>
      <h1 className="km-h1">{entry.h1}</h1>
      <p className="km-intro">{entry.description}</p>
    </>
  );
}
