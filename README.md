# 369 Career Readiness Snapshot

A mobile-first, two-moment self-assessment for a live 4-hour career readiness workshop.
Participants scan a QR code at the start of the workshop (`/start`) and again at the end
(`/end`), answer 9 questions, and get an instant score reveal. No login, no database —
answers are scored client-side and posted to a Make.com webhook for later analysis in a
Google Sheet (matched across `/start` and `/end` by email).

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- No backend, no database, no auth — pure client + webhook POST

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the env example and fill in your two Make.com webhook URLs:

   ```bash
   cp .env.example .env.local
   ```

   Then edit `.env.local`:

   ```
   NEXT_PUBLIC_MAKE_WEBHOOK_START=https://hook.us1.make.com/your-start-webhook-id
   NEXT_PUBLIC_MAKE_WEBHOOK_END=https://hook.us1.make.com/your-end-webhook-id
   ```

3. Run the dev server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000/start](http://localhost:3000/start) and
   [http://localhost:3000/end](http://localhost:3000/end).

## Project structure

- `app/start/page.tsx` — opening assessment (name, email, batch, track + 9 questions)
- `app/end/page.tsx` — closing assessment (name, email, batch + the same 9 questions)
- `components/AssessmentFlow.tsx` — shared flow: landing → intake → questions → result
- `lib/questions.ts` — the 9 question strings, in order (swap in a Taglish variant here
  later without touching any component logic)
- `lib/scoring.ts` — composite / presence / signal / system scoring math
- `lib/webhook.ts` — fire-and-forget POST to Make.com with a 5s timeout, plus a
  `localStorage`-backed retry queue for failed submissions (retried automatically on the
  next page load)

## How scoring works

Each of the 9 questions is answered on a 1–5 scale. See `lib/scoring.ts` for the exact
formulas. All four scores (`composite`, `presence`, `signal`, `system`) are 0–100 and are
computed entirely in the browser — the result screen never waits on the network.

## Webhook payload

Both `/start` and `/end` POST the same JSON shape to their respective webhook, with a
`"moment"` field (`"start"` or `"end"`) so Make.com/Sheets can route or filter:

```json
{
  "submissionId": "6f1d2c3e-8a4b-4c5d-9e6f-7a8b9c0d1e2f",
  "moment": "start",
  "name": "Juan Dela Cruz",
  "email": "juan@email.com",
  "batch": "Batch 1",
  "track": "Barista",
  "timestamp": "2026-07-09T09:03:00.000Z",
  "answers": { "q1": 4, "q2": 3, "q3": 5, "q4": 4, "q5": 2, "q6": 4, "q7": 1, "q8": 1, "q9": 3 },
  "composite": 51,
  "presence": 78,
  "signal": 67,
  "system": 8
}
```

`track` is `null` on `/end` submissions; `batch` is collected on both `/start` and `/end`.

Delivery is **at-least-once**: if a request times out on bad venue wifi but was
actually received, the client may re-send it on a later page load. Every
attempt for the same submission carries the same `submissionId`, so duplicates
are trivially filtered in Make (a `submissionId` router/filter) or in Sheets
(`COUNTIF` on the `submissionId` column). Emails are trimmed and lowercased
client-side so `/start` and `/end` rows join cleanly.

## Deploying to Vercel

1. Push this repo to GitHub:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

2. In [Vercel](https://vercel.com/new), click **Import Project** and select the GitHub
   repo. Vercel auto-detects Next.js — no config changes needed.

3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_MAKE_WEBHOOK_START`
   - `NEXT_PUBLIC_MAKE_WEBHOOK_END`

4. Click **Deploy**.

5. Once deployed, generate your two workshop QR codes pointing at:
   - `https://<your-deployment>.vercel.app/start`
   - `https://<your-deployment>.vercel.app/end`

Both routes work standalone with no query params, so any static QR code generator works.

## Notes on the offline/queue behavior

The result screen always shows immediately — scoring is entirely client-side and doesn't
depend on the webhook succeeding. Delivery uses a **write-ahead queue**: every payload is
saved to `localStorage` *before* the request is sent (with `keepalive`, so it survives the
phone being locked right after the reveal) and removed only on confirmed success. Anything
still queued is retried silently the next time any `/start` or `/end` page loads on that
device. In-progress answers are also kept in `sessionStorage`, so an accidental refresh
resumes at the same question instead of restarting.

## Running a live event (80–100 participants)

The app itself is static and scales effortlessly; the checklist below is about the
downstream pipeline:

1. **Make.com scenarios ON and healthy** — confirm both scenarios are enabled and that
   scenario settings have auto-retry enabled ("Allow storing of incomplete executions" +
   retry), so a Google Sheets hiccup doesn't drop a submission.
2. **Ops budget** — each participant fires 2 webhooks (start + end). 100 participants ≈
   200 scenario runs; multiply by modules per scenario and check it fits your Make plan's
   monthly operations.
3. **Sheets write quota** — Google Sheets allows roughly 60 writes/min; a 2–3 minute burst
   from 100 phones queues up inside Make and drains automatically. Expect rows to trail
   the live moment by a few minutes; this is normal.
4. **Dedupe** — filter duplicates by `submissionId` (see payload section). Duplicates are
   rare and expected by design (at-least-once delivery beats losing data).
5. **Smoke test** — before doors open: submit one real test on `/start` and one on `/end`
   from a phone on the venue wifi, and confirm both rows land in the Sheet. Delete the
   test rows after.
6. **QR fallback** — keep the URLs (`/start`, `/end`) written on a slide/whiteboard in
   case a phone camera won't scan.

## Next stage (roadmap)

1. **Week 3/6/9 re-scans (Gate 3/6/9)** — new route reusing `AssessmentFlow` with
   `moment: "week3" | "week6" | "week9"`; links sent by Make email/SMS scheduler.
2. **Score history** — store submissions in a real datastore (Supabase is the natural
   fit), match by email, and show each graduate their Gate 0 → 9 progression line.
3. **Facilitator live dashboard** — live submission count and batch averages during the
   seminar.
4. **Taglish language toggle** — `lib/questions.ts` is already externalized for a drop-in
   translated variant.
5. **PWA/offline caching** — service worker so the app opens even on dead venue wifi.
6. **Result-screen score bands** — short "what your score means" copy under the ring.
7. **Automated cadence messaging** — Make scheduler sends the Week 3/6/9 links
   automatically from the Sheet.
8. **Vercel Analytics** — funnel visibility (landing → start → complete).
