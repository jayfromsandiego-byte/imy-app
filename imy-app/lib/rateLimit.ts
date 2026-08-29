// lib/rateLimit.ts — rate limiting for public endpoints.
//
// Two layers, chosen by environment:
//
//   · Distributed (Upstash Redis over REST) when UPSTASH_REDIS_REST_URL and
//     UPSTASH_REDIS_REST_TOKEN are present — one shared fixed window across
//     every serverless instance and region, which is what makes the limit a
//     real wall instead of a per-instance suggestion.
//   · In-memory otherwise — the original best-effort guard, unchanged, so this
//     module is safe to deploy dark: with no env vars set, behavior is
//     what it was before.
//
// Availability beats strictness here: if Redis is slow (>600ms), unreachable,
// or errors, the check falls back to the in-memory window for that request
// rather than blocking it. A storage hiccup must never stop a family in a
// funeral week from leaving a memory — the limiter fails open to the soft
// guard, never closed. (It is still paired with input caps + honeypots on the
// public routes.)
//
// The REST calls are plain fetch (INCR + PEXPIRE NX + PTTL in one pipeline) —
// no SDK dependency, nothing new to install.

type Result = { allowed: boolean; remaining: number; retryAfterMs: number };

const REST_URL = (process.env.UPSTASH_REDIS_REST_URL || "").replace(/\/$/, "");
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "";
const distributed = Boolean(REST_URL && REST_TOKEN);

// How long we're willing to wait for the shared window before falling back.
const REDIS_TIMEOUT_MS = 600;

// ── shared fixed window (Upstash REST pipeline) ──────────────────────────────
async function redisWindow(key: string, max: number, windowMs: number): Promise<Result | null> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), REDIS_TIMEOUT_MS);
  try {
    const res = await fetch(`${REST_URL}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${REST_TOKEN}`, "Content-Type": "application/json" },
      // INCR starts/advances the window; PEXPIRE … NX arms the expiry only on
      // the window's first hit; PTTL reports how long until it resets.
      body: JSON.stringify([
        ["INCR", key],
        ["PEXPIRE", key, String(windowMs), "NX"],
        ["PTTL", key],
      ]),
      cache: "no-store",
      signal: ctl.signal,
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{ result?: unknown; error?: string }>;
    if (!Array.isArray(rows) || rows.some((r) => r && r.error)) return null;
    const count = Number(rows[0]?.result);
    const pttl = Number(rows[2]?.result);
    if (!Number.isFinite(count) || count < 1) return null;
    return {
      allowed: count <= max,
      remaining: Math.max(0, max - count),
      retryAfterMs: pttl > 0 ? pttl : windowMs,
    };
  } catch {
    return null; // network/timeout — fall back, never block
  } finally {
    clearTimeout(timer);
  }
}

// ── in-memory window (the original guard; also the fallback) ─────────────────
type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();

function memoryWindow(key: string, max: number, windowMs: number): Result {
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

/**
 * Count a hit against `key`'s window and say whether it may pass.
 * Same contract as always — callers just `await` it now.
 */
export async function rateLimit(key: string, max: number, windowMs: number): Promise<Result> {
  if (distributed) {
    const r = await redisWindow(`rl:${key}`, max, windowMs);
    if (r) return r;
  }
  return memoryWindow(key, max, windowMs);
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") || "";
  const first = xff.split(",")[0].trim();
  return first || req.headers.get("x-real-ip") || "unknown";
}
