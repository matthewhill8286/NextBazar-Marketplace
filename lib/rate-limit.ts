/**
 * Lightweight in-memory rate limiter.
 *
 * Uses a sliding window over `windowMs` and counts distinct hits per key.
 * State lives on the module-scope `Map`, which means it is **per Node
 * process / per Vercel lambda instance**. That gives us effective protection
 * against burst abuse from a single caller, but will not coordinate across
 * lambdas.
 *
 * For production-grade limits (cross-instance, durable), swap the backing
 * store for Upstash Redis or Vercel KV — the public `limit()` signature is
 * designed to be a drop-in replacement.
 *
 * Usage:
 *
 *   const { success, retryAfter } = await limit(`ai:describe:${userId}`, {
 *     max: 20,
 *     windowMs: 60_000,
 *   });
 *   if (!success) return new Response("Too many requests", {
 *     status: 429, headers: { "retry-after": String(retryAfter) },
 *   });
 */

type Bucket = {
  hits: number[]; // timestamps in ms
};

const buckets = new Map<string, Bucket>();

// House-keeping: evict stale buckets every so often so the Map doesn't grow
// unbounded on long-running workers.
const EVICT_INTERVAL_MS = 5 * 60_000;
let lastEvict = 0;

function evictStale(now: number) {
  if (now - lastEvict < EVICT_INTERVAL_MS) return;
  lastEvict = now;
  const cutoff = now - 15 * 60_000;
  for (const [k, b] of buckets) {
    if (b.hits.length === 0 || b.hits[b.hits.length - 1] < cutoff) {
      buckets.delete(k);
    }
  }
}

export type LimitResult = {
  success: boolean;
  remaining: number;
  retryAfter: number; // seconds until the caller can try again
};

export async function limit(
  key: string,
  opts: { max: number; windowMs: number },
): Promise<LimitResult> {
  const { max, windowMs } = opts;
  const now = Date.now();
  evictStale(now);

  const bucket = buckets.get(key) ?? { hits: [] };
  // Drop timestamps older than the window
  const cutoff = now - windowMs;
  while (bucket.hits.length && bucket.hits[0] <= cutoff) bucket.hits.shift();

  if (bucket.hits.length >= max) {
    const oldest = bucket.hits[0];
    const retryAfter = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    buckets.set(key, bucket);
    return { success: false, remaining: 0, retryAfter };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { success: true, remaining: max - bucket.hits.length, retryAfter: 0 };
}

/** Derive a stable key for an HTTP request when we don't have an auth id. */
export function ipKey(request: Request): string {
  const hdr = request.headers;
  const xff = hdr.get("x-forwarded-for");
  const ip =
    hdr.get("x-real-ip") ??
    (xff ? xff.split(",")[0]?.trim() : null) ??
    "unknown";
  return ip;
}

/** Test-only: clear all rate-limit buckets. Exposed so unit tests can run
 * many requests against the same key without triggering 429s. Do NOT call
 * this from application code. */
export function __resetRateLimit(): void {
  buckets.clear();
  lastEvict = 0;
}

/** Build a Response for a 429 with the correct retry-after header. */
export function tooManyRequests(result: LimitResult) {
  return new Response(
    JSON.stringify({
      error: "Too many requests",
      retry_after_seconds: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": String(result.retryAfter),
      },
    },
  );
}
