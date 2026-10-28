import type { Answers } from "./questions";

const QUEUE_KEY = "ai-readiness-queue";
const TIMEOUT_MS = 8000;

/** Same-origin route handler. The upstream webhook URL never reaches the browser. */
const SUBMIT_URL = "/api/submit";

export interface SubmitPayload {
  submissionId: string;
  name: string;
  email: string;
  consent: true;
  timestamp: string;
  answers: Answers;
}

/** Payload as built by the UI — submissionId is stamped by submit(). */
export type OutgoingPayload = Omit<SubmitPayload, "submissionId">;

interface QueuedItem {
  id: string;
  payload: SubmitPayload;
  queuedAt: string;
}

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readQueue(): QueuedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedItem[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  } catch {
    // localStorage unavailable or full — nothing more we can do here.
  }
}

function enqueue(item: QueuedItem): void {
  writeQueue([...readQueue(), item]);
}

/** Remove by id against the FRESH queue state, never a stale snapshot. */
function removeFromQueue(id: string): void {
  writeQueue(readQueue().filter((item) => item.id !== id));
}

async function post(payload: SubmitPayload): Promise<"ok" | "retry" | "drop"> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(SUBMIT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
      // Lets the request survive the page being backgrounded or closed —
      // people lock their phone the moment the score appears.
      keepalive: true,
    });

    if (res.ok) return "ok";
    // 4xx means this payload will never be accepted; retrying it forever
    // would just pin a bad item at the head of the queue.
    if (res.status >= 400 && res.status < 500 && res.status !== 429) return "drop";
    return "retry";
  } catch {
    return "retry";
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fire-and-forget: never await this in the UI.
 *
 * Write-ahead delivery: the payload is queued in localStorage BEFORE the
 * request goes out and removed only once it is confirmed delivered or
 * confirmed unacceptable, so a killed page can't lose it — worst case it is
 * re-sent on a later page load. The stamped submissionId makes re-sends safe
 * to dedupe downstream (same submission => same id).
 */
export function submit(outgoing: OutgoingPayload): void {
  const payload: SubmitPayload = { ...outgoing, submissionId: makeId() };
  const item: QueuedItem = {
    id: payload.submissionId,
    payload,
    queuedAt: new Date().toISOString(),
  };
  enqueue(item);
  post(payload).then((result) => {
    if (result !== "retry") removeFromQueue(item.id);
  });
}

let retryInFlight = false;

/**
 * Resends anything left over from an earlier failed submission. Safe to call
 * on every page load; a no-op when the queue is empty. Each success removes
 * only its own item from the live queue, so items enqueued while retries are
 * in flight are never clobbered.
 */
export function retryQueued(): void {
  if (retryInFlight) return;
  const items = readQueue();
  if (items.length === 0) return;
  retryInFlight = true;

  let settled = 0;
  items.forEach((item) => {
    post(item.payload).then((result) => {
      if (result !== "retry") removeFromQueue(item.id);
      settled += 1;
      if (settled === items.length) retryInFlight = false;
    });
  });
}
