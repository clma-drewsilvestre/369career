const QUEUE_KEY = "369-webhook-queue";
const TIMEOUT_MS = 5000;

export interface WebhookPayload {
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

interface QueuedItem {
  url: string;
  payload: WebhookPayload;
  queuedAt: string;
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

function enqueue(url: string, payload: WebhookPayload): void {
  const items = readQueue();
  items.push({ url, payload, queuedAt: new Date().toISOString() });
  writeQueue(items);
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
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fire-and-forget: never await this in the UI. Queues the payload in
 * localStorage on failure so it can be retried on the next page load.
 */
export function sendToWebhook(url: string | undefined, payload: WebhookPayload): void {
  if (!url) return;
  postWithTimeout(url, payload).then((ok) => {
    if (!ok) enqueue(url, payload);
  });
}

/**
 * Attempts to resend any queued payloads from a previous failed submission.
 * Safe to call on every page load; it's a no-op when the queue is empty.
 */
export function retryQueuedWebhooks(): void {
  const items = readQueue();
  if (items.length === 0) return;

  const remaining: QueuedItem[] = [];
  let settled = 0;

  items.forEach((item) => {
    postWithTimeout(item.url, item.payload).then((ok) => {
      if (!ok) remaining.push(item);
      settled += 1;
      if (settled === items.length) writeQueue(remaining);
    });
  });
}
