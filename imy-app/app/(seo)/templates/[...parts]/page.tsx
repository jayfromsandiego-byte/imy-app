import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { findEntry, entryPath, liveEntries } from "@/lib/seo/catalog";
import { seoPageMetadata } from "@/lib/seo/meta";

export function generateStaticParams() {
  return liveEntries("templates").map((e) => ({ parts: e.slug.split("/") }));
}

export function generateMetadata({ params }: { params: { parts: string[] } }): Metadata {
  const entry = findEntry("templates", params.parts);
  if (!entry || entry.status !== "live") return {};
  return seoPageMetadata({ title: entry.h1, description: entry.description, path: entryPath(entry) });
}

export default function TemplatePage({ params }: { params: { parts: string[] } }) {
  const entry = findEntry("templates", params.parts);
  if (!entry || entry.status !== "live") notFound();

  // W2+: each live template mounts its content module here — the variant-specific
  // section, the ArtifactDownload, and the quiet path to a memorial page.
  return (
    <>
      <p className="km-label">Template</p>
      <h1 className="km-h1">{entry.h1}</h1>
      <p className="km-intro">{entry.description}</p>
    </>
  );
}
