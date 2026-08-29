import type { Metadata } from "next";
import { liveEntries, entryPath } from "@/lib/seo/catalog";
import { seoPageMetadata } from "@/lib/seo/meta";

export function generateMetadata(): Metadata {
  return seoPageMetadata({
    title: "Memorial templates",
    description:
      "Free, printable templates for a service — funeral programs, obituaries, memorial cards, and checklists. Download and make them theirs.",
    path: "/templates",
    index: liveEntries("templates").length > 0,
  });
}

export default function TemplatesIndex() {
  const live = liveEntries("templates");
  return (
    <>
      <p className="km-label">Templates</p>
      <h1 className="km-h1">Printable things for the service</h1>
      <p className="km-intro">
        Programs, obituaries, cards, and checklists — free to download, made to be printed,
        with room for their photo and your words.
      </p>
      {live.length === 0 ? (
        <div className="km-empty">The first templates are being prepared with care. They will be ready soon.</div>
      ) : (
        <ul className="km-list">
          {live.map((e) => (
            <li className="km-item" key={e.slug}>
              <a href={entryPath(e)}>
                <h2>{e.h1}</h2>
                <p>{e.description}</p>
              </a>
            </li>
          ))}
        </ul>
      )}
      <p className="km-home">
        Made by <a href="/about">I Miss You Memorial</a> · a place to keep someone close, free, forever.
      </p>
    </>
  );
}
