// Routes {slug}.imissyoumemorial.com to the dynamic tribute renderer,
// while the apex and www serve the marketing site normally.

import { NextRequest, NextResponse } from "next/server";

const ROOT = "imissyoumemorial.com";

export const config = {
  matcher: ["/((?!api/|_next/|_static/|favicon.ico|robots.txt).*)"],
};

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0];

  // Marketing site (apex / www / local dev) — no rewrite.
  if (host === ROOT || host === `www.${ROOT}` || host === "localhost") {
    return NextResponse.next();
  }

  // Tribute subdomain -> /sites/{slug}
  if (host.endsWith(`.${ROOT}`)) {
    const sub = host.slice(0, -1 * (ROOT.length + 1));
    if (sub && sub !== "www") {
      const url = req.nextUrl.clone();
      url.pathname = `/sites/${sub}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}
