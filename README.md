# AI Readiness Snapshot

A mobile-first, public self-assessment. Nine questions on a 1–5 scale produce a
0–100 readiness score across three forces — **Posture**, **Fluency** and
**Practice** — plus a band, a diagnosis of the weakest force, and three actions
to take this week.

Scoring runs in the browser so the result never waits on the network.
Submissions are posted to a same-origin API route, which recomputes the scores
server-side and forwards them to a Make.com webhook.

> This is the public, individual-professional version of the tool. The original
> facilitated workshop version (two-moment `/start` + `/end`, batches, tech-voc
> tracks) lives on the `main` branch and is unaffected by anything here.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- One API route; no database, no auth

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the env example and fill it in:

   ```bash
   cp .env.example .env.local
   ```

   ```
   MAKE_WEBHOOK_URL=https://hook.eu1.make.com/your-webhook-id
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   ```

   `MAKE_WEBHOOK_URL` is **server-only on purpose**. Do not prefix it with
   `NEXT_PUBLIC_` — that is what put the webhook URL in the public bundle on the
   workshop version, where anyone could scrape it and post straight into the
   sheet.

3. Run the dev server:

   ```bash
   npm run dev
   ```

## Project structure

- `app/page.tsx` — public landing page
- `app/assessment/page.tsx` — the assessment itself (`noindex`)
- `app/privacy/page.tsx` — privacy policy
- `app/api/submit/route.ts` — validates, rate-limits, rescores, forwards to Make
- `components/AssessmentFlow.tsx` — questions → result → email gate → breakdown
- `lib/brand.ts` — product name, operator, privacy contact, result CTA
- `lib/questions.ts` — the three forces and the nine questions
- `lib/scoring.ts` — scoring math and weakest-force selection
- `lib/bands.ts` — score bands and the per-force word labels
- `lib/recommendations.ts` — the actions shown for each weakest force
- `lib/webhook.ts` — write-ahead queue and retry against `/api/submit`

Everything market-specific is in `lib/brand.ts`, `lib/questions.ts`,
`lib/bands.ts` and `lib/recommendations.ts`. Retargeting to another audience
should not require touching a component.

## How scoring works

Nine questions at 1–5 give a raw total of 9–45, mapped to 0–100. Each force is
three questions, so 3–15 raw, mapped the same way.

Band edges are deliberately **not** quartiles:

| Range | Band |
|---|---|
| 0–30 | Spectator |
| 31–55 | Dabbler |
| 56–78 | Operator |
| 79–100 | Multiplier |

The formula maps "all 2s" to exactly 25, "all 3s" to exactly 50 and "all 4s" to
exactly 75. Quartile edges would land the three most common answer patterns
precisely on a boundary, where one question flips someone's label. These edges
sit each pattern mid-band.

Force scores have only 13 possible values and the lowest non-zero one is 8, so
the force bars show a word (`Not yet` / `Starting` / `Solid` / `Strong`) rather
than a number. The composite is the only number on screen.

Ties for weakest force break toward Practice, then Fluency, then Posture — most
to least actionable. If every force is at or above `DEEP_THRESHOLD` (79), the
weak-spot framing is replaced by a "go deeper" set.

## The email gate

Questions come first; the composite score and band appear immediately on
finishing. The three force bars and the recommended actions sit behind a name +
email + consent gate on the same screen.

This is a deliberate trade: people who abandon at the gate leave no data at all.
In exchange, completion is higher than gating the entry, and every captured lead
is someone who finished all nine questions.

## Webhook payload

The browser posts to `/api/submit`. That route rescores from the raw answers —
client-sent scores are never trusted — and forwards:

```json
{
  "submissionId": "6f1d2c3e-8a4b-4c5d-9e6f-7a8b9c0d1e2f",
  "name": "Juan Dela Cruz",
  "email": "juan@email.com",
  "consent": true,
  "timestamp": "2026-10-28T09:03:00.000Z",
  "receivedAt": "2026-10-28T09:03:01.000Z",
  "answers": { "q1": 4, "q2": 3, "q3": 5, "q4": 4, "q5": 2, "q6": 4, "q7": 1, "q8": 1, "q9": 3 },
  "composite": 51,
  "posture": 75,
  "fluency": 58,
  "practice": 8,
  "band": "Dabbler",
  "weakestForce": "practice"
}
```

Delivery is **at-least-once**: the payload is written to `localStorage` before
the request goes out and removed only once delivery is confirmed, so a locked
phone or dead wifi can't lose it. Re-sends carry the same `submissionId`, so
duplicates are filtered downstream with a `submissionId` router in Make or a
`COUNTIF` in Sheets. A 4xx response (other than 429) drops the item instead of
retrying it forever.

## Before going public

1. **Real rate limiting.** The limiter in `app/api/submit/route.ts` is
   per-instance and resets on cold start — a speed bump, not a wall. Put Vercel
   firewall rules or an Upstash/Vercel KV counter in front of it before
   promoting the link anywhere.
2. **Have a lawyer read `app/privacy/page.tsx`.** It is an honest description of
   what the code actually does, written against RA 10173, but it is a draft and
   not legal advice. Fill in the real operator name and privacy contact in
   `lib/brand.ts`.
3. **Set `NEXT_PUBLIC_SITE_URL`**, or canonical links, the sitemap and the
   social card will all point at localhost.
4. **Make scenario on and healthy**, with auto-retry enabled so a Sheets hiccup
   doesn't drop a submission.
5. **Smoke test** one real submission end to end and confirm the row lands.

## Deploying

Push this branch to its own repo and import it as a **separate** Vercel project
— the workshop version keeps `main` and its own domain. Set `MAKE_WEBHOOK_URL`
and `NEXT_PUBLIC_SITE_URL` under Environment Variables.

## Roadmap

1. **Emailed report** — the full breakdown as a PDF or HTML email. Needs an
   email service.
2. **Real datastore** — Supabase, to support retakes, score history and
   "you scored higher than N% of people".
3. **Share cards** — a generated image of the score for social.
4. **Role segmentation** — one optional field at the gate, so results can be
   compared across job families.
5. **Question validation** — once a few hundred submissions exist, check which
   questions actually discriminate and retune the difficulty curve.
