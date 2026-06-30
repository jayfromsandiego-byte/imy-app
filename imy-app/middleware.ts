// Routes {slug}.imissyoumemorial.com to the tribute renderer, and on the apex/www
// refreshes the Supabase session and protects /dashboard.
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const ROOT = "imissyoumemorial.com";
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const config = {
  matcher: ["/((?!api/|_next/|_static/|favicon.ico|robots.txt).*)"],
};

export async function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0];

  // 1) Tribute subdomain -> /sites/{slug}
  if (host.endsWith(`.${ROOT}`)) {
    const sub = host.slice(0, -1 * (ROOT.length + 1));
    if (sub && sub !== "www") {
      const url = req.nextUrl.clone();
      url.pathname = `/sites/${sub}`;
      return NextResponse.rewrite(url);
    }
  }

  // 2) Session refresh + /dashboard protection (only where auth matters, to avoid latency on public pages)
  const path = req.nextUrl.pathname;
  const needsAuth = path.startsWith("/dashboard") || path.startsWith("/auth");
  if (!needsAuth || !URL || !ANON) return NextResponse.next();

  const res = NextResponse.next({ request: req });
  const supabase = createServerClient(URL, ANON, {
    cookies: {
      getAll() { return req.cookies.getAll(); },
      setAll(list) {
        list.forEach(({ name, value, options }) => {
          req.cookies.set(name, value);
          res.cookies.set(name, value, options as any);
        });
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (path.startsWith("/dashboard") && !user) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  return res;
}
