// POST /api/intake — receives the onboarding form, reserves a unique subdomain,
// and writes the tribute into Airtable. This is what makes generation automatic:
// onboarding form -> here -> Airtable -> Hyperagent enriches -> {slug}.imissyoumemorial.com.

import { NextRequest, NextResponse } from "next/server";
import { createRecord, getTributeBySlug } from "@/lib/airtable";

export const runtime = "nodejs";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  let slug = slugify(body.slug || body.fullName || "");
  if (!slug) return NextResponse.json({ ok: false, error: "A name or subdomain is required." }, { status: 400 });

  // Ensure the subdomain is unique.
  const base = slug;
  let n = 1;
  while (await getTributeBySlug(slug)) slug = `${base}-${++n}`;

  await createRecord("Tributes", {
    "Slug": slug,
    "Loved One": body.fullName,
    "AKA": body.aka,
    "Customer Email": body.email,
    "Relationship": body.relationship,
    "Birth Date": body.birth,
    "Passing Date": body.passing,
    "Place": body.place,
    "Story": body.story,
    "Quote": body.quote,
    "Song": body.song,
    "Theme": body.theme || "The Vigil",
    "Cover Photo": body.coverPhoto,
    "Video URL": body.video,
    "Service Date": [body.serviceDate, body.serviceTime].filter(Boolean).join(" · "),
    "Service Location": body.serviceLocation,
    "Charity": body.charity,
    "Privacy": body.privacy || "Public",
    "Status": "New",
  });

  // Optionally also record the buyer in Customers.
  if (body.email) {
    try {
      await createRecord("Customers", {
        Name: body.purchaserName || body.fullName,
        Email: body.email,
        Tier: body.tier || "Plus",
        Created: new Date().toISOString().slice(0, 10),
      });
    } catch {
      /* non-fatal */
    }
  }

  return NextResponse.json({ ok: true, slug, url: `https://${slug}.imissyoumemorial.com` });
}
