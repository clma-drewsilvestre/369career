/**
 * Rate limiting for the public submit endpoint.
 *
 * Two backends, picked at runtime:
 *
 *   1. Upstash Redis, when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 *      are set. Shared across every serverless instance, survives cold starts.
 *      This is the real one.
 *
 *   2. An in-memory Map, when they are not. Per-instance and wiped on every
 *      cold start, so a determined caller gets far more than LIMIT. It is a
 *      speed bump that stops a naive loop from one tab, nothing more.
 *
 * Backend 2 exists so the app keeps working locally and does not hard-fail if
 * the Redis credentials go missing in production. It is NOT a substitute for
 * backend 1 on a public URL. `rateLimitBackend()` reports which is live.
 */

/** Requests allowed per IP per window. */
const LIMIT = 10;
/** Window length in seconds. */
const WINDOW_SECONDS = 600;

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export function rateLimitBackend(): "redis" | "memory" {
  return UPSTASH_URL && UPSTASH_TOKEN ? "redis" : "memory";
}

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the window resets. Only meaningful when ok is false. */
  retryAfter: number;
}

// --- Backend 2: in-memory fallback ------------------------------------------

const hits = new Map<string, { count: number; resetAt: number }>();

/** Bounded cleanup so the Map can't grow without limit on a warm instance. */
function sweep(now: number): void {
  if (hits.size < 5000) return;
  for (const [key, entry] of hits) {
    if (now > entry.resetAt) hits.delete(key);
  }
}

function checkMemory(ip: string): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_SECONDS * 1000 });
    return { ok: true, retryAfter: 0 };
  }

  entry.count += 1;
  if (entry.count > LIMIT) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

// --- Backend 1: Upstash Redis -----------------------------------------------

/**
 * Fixed window keyed on the window index, so the key expires on its own and
 * there is no cleanup to run. EXPIRE is NX so a later request in the same
 * window can't slide the window forward.
 */
async function checkRedis(ip: string): Promise<RateLimitResult> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const windowIndex = Math.floor(nowSeconds / WINDOW_SECONDS);
  const key = `rl:${ip}:${windowIndex}`;
  const resetAt = (windowIndex + 1) * WINDOW_SECONDS;

  const res = await fetch(`${UPSTASH_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, String(WINDOW_SECONDS), "NX"],
    ]),
    signal: AbortSignal.timeout(2000),
  });

  if (!res.ok) throw new Error(`upstash responded ${res.status}`);

  const body = (await res.json()) as Array<{ result?: number; error?: string }>;
  const count = body?.[0]?.result;
  if (typeof count !== "number") throw new Error("unexpected upstash response");

  if (count > LIMIT) {
    return { ok: false, retryAfter: Math.max(1, resetAt - nowSeconds) };
  }
  return { ok: true, retryAfter: 0 };
}

// --- Entry point ------------------------------------------------------------

/**
 * Fails OPEN: if Redis is unreachable the request is allowed through.
 *
 * This is a deliberate trade for a lead-capture form. Failing closed would
 * turn a Redis blip into lost submissions from real people, which is a worse
 * outcome than briefly letting an abuser through. The failure is logged so it
 * is visible rather than silent.
 */
export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  if (rateLimitBackend() === "memory") return checkMemory(ip);

  try {
    return await checkRedis(ip);
  } catch (err) {
    console.error("[ratelimit] redis check failed, allowing request", err);
    return { ok: true, retryAfter: 0 };
  }
}
