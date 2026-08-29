// POST /api/csp-report — where Content-Security-Policy violation reports land.
//
// The CSP has run Report-Only since Gate 0 (#31), but without a report
// destination every violation vanished into the browser console of whoever
// hit it. This route is the destination vercel.json's report-uri / report-to
// now name: it accepts both wire formats browsers send (the classic
// application/csp-report single-report body and the Reporting-API
// application/reports+json batch), logs each violation as one compact
// structured line (visible in Vercel function logs, greppable as
// "csp-violation"), and returns 204.
//
// Privacy: a report is about the PAGE, not the person. Only the fields needed
// to fix the policy are logged — directive, blocked URI, document, source,
// line — each clipped short. No cookies, no IP, no user agent, nothing stored;
// the log line is the whole footprint. Rate-limited per IP like every other
// public door (the IP feeds only the limiter key, never the log).
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 32 * 1024; // a violation report is small; a big body is not a report
const MAX_REPORTS_PER_BODY = 5;
const clip = (v: unknown, n: number) => String(v ?? "").slice(0, n);

/** One compact, greppable line per violation — the fields that fix policies. */
function logViolation(r: Record<string, unknown>) {
  console.warn(
    "csp-violation " +
      JSON.stringify({
        directive: clip(r["effective-directive"] || r["effectiveDirective"] || r["violated-directive"] || r["violatedDirective"], 60),
        blocked: clip(r["blocked-uri"] || r["blockedURL"] || r["blockedURI"], 200),
        document: clip(r["document-uri"] || r["documentURL"] || r["documentURI"], 200),
        source: clip(r["source-file"] || r["sourceFile"], 200),
        line: Number(r["line-number"] ?? r["lineNumber"]) || undefined,
        disposition: clip(r["disposition"], 10) || undefined,
      })
  );
}

export async function POST(req: NextRequest) {
  {
    const { allowed } = await rateLimit(`csp-report:${clientIp(req)}`, 20, 60_000);
    // A limited reporter gets the same 204 — there is nothing to retry and
    // nothing for a probe to learn from the difference.
    if (!allowed) return new NextResponse(null, { status: 204 });
  }

  const type = (req.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (!["application/csp-report", "application/reports+json", "application/json"].includes(type)) {
    return new NextResponse(null, { status: 415 });
  }

  let text = "";
  try {
    text = await req.text();
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  if (!text || text.length > MAX_BODY) return new NextResponse(null, { status: 204 });

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      // Reporting API batch: [{ type: "csp-violation", body: {…} }, …]
      for (const item of parsed.slice(0, MAX_REPORTS_PER_BODY)) {
        if (item && typeof item === "object" && item.body && typeof item.body === "object") {
          logViolation(item.body as Record<string, unknown>);
        }
      }
    } else if (parsed && typeof parsed === "object") {
      // Classic body: { "csp-report": {…} } — or a bare report object.
      const r = (parsed["csp-report"] && typeof parsed["csp-report"] === "object" ? parsed["csp-report"] : parsed) as Record<string, unknown>;
      logViolation(r);
    }
  } catch {
    /* not JSON — nothing to learn, nothing to log */
  }
  return new NextResponse(null, { status: 204 });
}
