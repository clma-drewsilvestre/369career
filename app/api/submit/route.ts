import { NextResponse } from "next/server";
import { QUESTIONS, type Answers } from "@/lib/questions";
import { computeScores, weakestForce } from "@/lib/scoring";
import { bandFor } from "@/lib/bands";
import { checkRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const limit = await checkRateLimit(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
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
