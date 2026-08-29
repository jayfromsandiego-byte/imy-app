import type { Metadata } from "next";
import { liveEntries, entryPath } from "@/lib/seo/catalog";
import { seoPageMetadata } from "@/lib/seo/meta";

export function generateMetadata(): Metadata {
  // Index stays noindex until the first tool is live — no thin pages in the index.
  return seoPageMetadata({
    title: "Free memorial tools",
    description:
      "Free tools for a hard week — a funeral program maker, an obituary writer, and more. Each one ends with something you can hold.",
    path: "/tools",
    index: liveEntries("tools").length > 0,
  });
}

export default function ToolsIndex() {
  const live = liveEntries("tools");
  return (
    <>
      <p className="km-label">Free tools</p>
      <h1 className="km-h1">Help for the week you are in</h1>
      <p className="km-intro">
        Small, free tools for the practical parts of loss. Each one gives you a finished,
        printable thing — and a quiet place to keep their memory, if you want it.
      </p>
      {live.length === 0 ? (
        <div className="km-empty">The first tools are being prepared with care. They will be ready soon.</div>
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
