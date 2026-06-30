// lib/rateLimit.ts — best-effort in-memory rate limiting for public endpoints.
// NOTE: serverless instances are ephemeral and not shared between regions, so
// this is a soft guard against bursts and casual abuse, not a hard global quota.
// It is paired with input caps + a honeypot on the public routes. If we ever
// need strict global limits, move this to a shared store (e.g. Upstash Redis).

type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  max: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now > b.reset) {
    b = { count: 0, reset: now + windowMs };
    buckets.set(key, b);
  }
  b.count += 1;
  // Opportunistic cleanup so the map can't grow without bound.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (now > v.reset) buckets.delete(k);
  }
  return {
    allowed: b.count <= max,
    remaining: Math.max(0, max - b.count),
    retryAfterMs: Math.max(0, b.reset - now),
  };
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") || "";
  const first = xff.split(",")[0].trim();
  return first || req.headers.get("x-real-ip") || "unknown";
}
