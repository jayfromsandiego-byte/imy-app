import type { Metadata } from "next";
import { liveEntries, entryPath } from "@/lib/seo/catalog";
import { seoPageMetadata } from "@/lib/seo/meta";

export function generateMetadata(): Metadata {
  return seoPageMetadata({
    title: "Guides for a hard season",
    description:
      "Quiet, practical guides — writing an obituary, planning a service, what things cost, and what to do first.",
    path: "/guides",
    index: liveEntries("guides").length > 0,
  });
}

export default function GuidesIndex() {
  const live = liveEntries("guides");
  return (
    <>
      <p className="km-label">Guides</p>
      <h1 className="km-h1">Written slowly, meant to be useful</h1>
      <p className="km-intro">
        Practical guides for the season you are in — each one written and signed by a real
        person, with sources where sources are due.
      </p>
      {live.length === 0 ? (
        <div className="km-empty">The first guides are being written with care. They will be ready soon.</div>
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
