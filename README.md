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

If a webhook POST fails (bad wifi, Make.com hiccup, etc.), the result screen still shows
immediately — scoring is entirely client-side and doesn't depend on the webhook
succeeding. The failed payload is queued in `localStorage` and automatically retried the
next time any `/start` or `/end` page loads on that device. This is silent by design; it
never blocks or alarms the person taking the assessment.
