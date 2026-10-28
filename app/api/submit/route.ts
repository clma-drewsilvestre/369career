import { NextResponse } from "next/server";
import { QUESTIONS, type Answers } from "@/lib/questions";
import { computeScores, weakestForce } from "@/lib/scoring";
import { bandFor } from "@/lib/bands";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_PER_WINDOW = 5;
const WINDOW_MS = 10 * 60 * 1000;

/**
 * Per-instance rate limiting.
 *
 * This is a speed bump, not a wall: serverless spreads requests across
 * instances, each with its own Map, and the whole thing resets on cold start.
 * It stops a naive loop from one tab. Before promoting the link anywhere
 * public, put real limiting in front of this — Vercel's firewall rules, or a
 * shared counter in Upstash/Vercel KV.
 */
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

/** Bounded cleanup so the Map can't grow without limit on a warm instance. */
function sweep(): void {
  if (hits.size < 5000) return;
  const now = Date.now();
  for (const [ip, entry] of hits) {
    if (now > entry.resetAt) hits.delete(ip);
  }
}

interface SubmitBody {
  submissionId?: unknown;
  name?: unknown;
  email?: unknown;
  consent?: unknown;
  timestamp?: unknown;
  answers?: unknown;
}

function parseAnswers(raw: unknown): Answers | null {
  if (typeof raw !== "object" || raw === null) return null;
  const source = raw as Record<string, unknown>;
  const answers = {} as Answers;

  for (const q of QUESTIONS) {
    const value = source[q.id];
    if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 5) {
      return null;
    }
    answers[q.id] = value;
  }

  return answers;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";

  sweep();
  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: SubmitBody;
  try {
    body = (await req.json()) as SubmitBody;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const submissionId = typeof body.submissionId === "string" ? body.submissionId : "";
  const answers = parseAnswers(body.answers);

  if (
    !submissionId ||
    name.length === 0 ||
    name.length > 120 ||
    email.length > 200 ||
    !EMAIL_RE.test(email) ||
    body.consent !== true ||
    !answers
  ) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  // Scores are recomputed here rather than trusted from the client, so the
  // numbers that reach the sheet are always the ones the answers imply.
  const scores = computeScores(answers);

  const payload = {
    submissionId,
    name,
    email,
    consent: true,
    timestamp:
      typeof body.timestamp === "string" ? body.timestamp : new Date().toISOString(),
    receivedAt: new Date().toISOString(),
    answers,
    ...scores,
    band: bandFor(scores.composite).name,
    weakestForce: weakestForce(scores),
  };

  const target = process.env.MAKE_WEBHOOK_URL;
  if (!target) {
    // Misconfiguration, not a client error. Accept the submission so the
    // browser doesn't queue and retry it forever, and make the loss loud in
    // the server logs.
    console.error("[submit] MAKE_WEBHOOK_URL is not set — submission dropped", {
      submissionId,
    });
    return NextResponse.json({ ok: true, forwarded: false });
  }

  try {
    const res = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: "upstream" }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ ok: false, error: "upstream" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, forwarded: true });
}
