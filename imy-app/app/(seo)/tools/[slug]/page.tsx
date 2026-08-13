import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { findEntry, entryPath, liveEntries } from "@/lib/seo/catalog";
import { seoPageMetadata } from "@/lib/seo/meta";
import ProgramMaker from "@/components/tools/ProgramMaker";

// Tool pages render only when their catalog entry is "live".
// Queued entries 404 — nothing half-made ever meets a family.

export function generateStaticParams() {
  return liveEntries("tools").map((e) => ({ slug: e.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const entry = findEntry("tools", [params.slug]);
  if (!entry || entry.status !== "live") return {};
  return seoPageMetadata({ title: entry.h1, description: entry.description, path: entryPath(entry) });
}

export default function ToolPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { variant?: string };
}) {
  const entry = findEntry("tools", [params.slug]);
  if (!entry || entry.status !== "live") notFound();

  return (
    <>
      <p className="km-label">Free tool</p>
      <h1 className="km-h1">{entry.h1}</h1>
      <p className="km-intro">{entry.description}</p>
      {entry.slug === "funeral-program-maker" && (
        <ProgramMaker variant={searchParams?.variant || "default"} />
      )}
    </>
  );
}
