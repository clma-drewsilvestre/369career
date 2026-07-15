const QUEUE_KEY = "369-webhook-queue";
const TIMEOUT_MS = 5000;

export interface WebhookPayload {
  submissionId: string;
  moment: "start" | "end";
  name: string;
  email: string;
  batch: string | null;
  track: string | null;
  timestamp: string;
  answers: Record<string, number>;
  composite: number;
  presence: number;
  signal: number;
  system: number;
}

/** Payload as built by the UI — submissionId is stamped by sendToWebhook. */
export type OutgoingPayload = Omit<WebhookPayload, "submissionId">;

interface QueuedItem {
  id: string;
  url: string;
  payload: WebhookPayload;
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

async function postWithTimeout(url: string, payload: WebhookPayload): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
      // Lets the request survive the page being backgrounded/closed —
      // participants lock their phone right after the score reveal.
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fire-and-forget: never await this in the UI.
 *
 * Write-ahead delivery: the payload is queued in localStorage BEFORE the
 * request goes out and removed only on confirmed success, so a killed page
 * or failed request can never lose it — worst case it is re-sent on the
 * next page load. The stamped submissionId makes re-sends safe to dedupe
 * downstream (same submission ⇒ same id).
 */
export function sendToWebhook(url: string | undefined, outgoing: OutgoingPayload): void {
  if (!url) return;
  const payload: WebhookPayload = { ...outgoing, submissionId: makeId() };
  const item: QueuedItem = {
    id: payload.submissionId,
    url,
    payload,
    queuedAt: new Date().toISOString(),
  };
  enqueue(item);
  postWithTimeout(url, payload).then((ok) => {
    if (ok) removeFromQueue(item.id);
  });
}

let retryInFlight = false;

/**
 * Attempts to resend any queued payloads from a previous failed submission.
 * Safe to call on every page load; it's a no-op when the queue is empty.
 * Each success removes only its own item from the live queue, so items
 * enqueued while retries are in flight are never clobbered.
 */
export function retryQueuedWebhooks(): void {
  if (retryInFlight) return;
  const items = readQueue();
  if (items.length === 0) return;
  retryInFlight = true;

  let settled = 0;
  items.forEach((item) => {
    postWithTimeout(item.url, item.payload).then((ok) => {
      if (ok) removeFromQueue(item.id);
      settled += 1;
      if (settled === items.length) retryInFlight = false;
    });
  });
}
