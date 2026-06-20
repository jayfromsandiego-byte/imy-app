// Serves a fully-rendered tribute for {slug}.imissyoumemorial.com (and /sites/{slug}).
// Reads the token-based template and injects the person's data.
// Special slug "example" renders a built-in sample so "See an example" always works.

import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getTributeBySlug } from "@/lib/airtable";
import { renderTribute, recordToTribute, Tribute } from "@/lib/renderTribute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXAMPLE: Tribute = {
  fullName: "Eleanor Margaret Hayes",
  birth: "1948-03-12",
  passing: "2024-10-22",
  place: "Half Moon Bay, CA",
  portrait: "/photos/eleanor.jpg",
  portraitCap: "Eleanor, in her garden",
  candleCount: 2850,
  tier: "Free",
  story:
    "Eleanor was born by the sea, the eldest of four. She taught third grade for thirty-eight years, kept a garden that drew the whole street to her gate, and was the kind of grandmother who always had butterscotch in her pocket. She believed the small things were the whole of a life.",
  quote: "Find the smallest beautiful thing in the day, and tell someone about it.",
  details: [
    { k: "She loved most", v: "First light over her garden" },
    { k: "Always carried", v: "A handful of seeds, just in case" },
    { k: "Known for", v: "Feeding anyone who came to the door" },
    { k: "Family", v: "Two children, four grandchildren" },
  ],
  loved: [
    { label: "Black coffee, no sugar", photo: "/photos/candle.jpg" },
    { label: "Her garden at dawn", photo: "/themes/garden.jpg" },
    { label: "A full kitchen table", photo: "/photos/table.jpg" },
    { label: "Letters, written by hand", photo: "/themes/letters.jpg" },
  ],
  timeline: [
    { year: "1948", title: "Born by the sea", text: "The eldest of four, raised on the coast." },
    { year: "1971", title: "Began teaching", text: "Thirty-eight years of third graders who never forgot her." },
    { year: "1996", title: "Planted the garden", text: "The one the whole street still stops to admire." },
  ],
  photos: [
    { url: "/photos/hands.jpg" },
    { url: "/themes/garden.jpg" },
    { url: "/photos/table.jpg" },
    { url: "/photos/candle.jpg" },
    { url: "/hero.jpg" },
    { url: "/themes/ocean.jpg" },
  ],
  reel: [
    { poster: "/themes/ocean.jpg", label: "Eulogy" },
    { poster: "/photos/table.jpg", label: "A song for her" },
  ],
  message: {
    text: "Don't be sad for too long. Put the kettle on, sit in the garden, and notice something lovely. I'll be in all of it.",
    sign: "Eleanor",
  },
  memories: [
    {
      text: "She taught me that the best part of any morning was the quiet before everyone woke. I still get up early, just to feel close to her.",
      name: "Daniel", rel: "her son",
      writerPhoto: "/photos/hands.jpg", subjectPhoto: "/photos/eleanor.jpg",
      photos: ["/themes/garden.jpg", "/photos/table.jpg"],
    },
    {
      text: "Every child on the street learned to plant something in her garden. She made the world feel a little gentler.",
      name: "Marie", rel: "a neighbour",
      subjectPhoto: "/photos/eleanor.jpg",
    },
  ],
  service: {
    date: "2026-06-13", time: "11:00 AM",
    place: "Linden Community Chapel",
    address: "142 Seaside Avenue, Half Moon Bay, CA 94019",
    charity: "American Cancer Society",
  },
};

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const templatePath = path.join(process.cwd(), "templates", "tribute-template.html");
  const template = await fs.readFile(templatePath, "utf8");

  let tribute: Tribute | null = null;
  if (params.slug === "example") {
    tribute = EXAMPLE;
  } else {
    const rec = await getTributeBySlug(params.slug);
    if (rec) tribute = recordToTribute(rec);
  }

  if (!tribute) {
    return new Response("This tribute could not be found.", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const html = renderTribute(template, tribute);
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=60, s-maxage=300",
    },
  });
}
