import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { FORCES } from "@/lib/questions";
import { BANDS } from "@/lib/bands";

const STEPS = [
  "Answer 9 short questions — about 90 seconds.",
  "See your readiness score, out of 100.",
  "Get the one force holding you back, and three things to do this week.",
];

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-10">
      <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">
        {BRAND.name}
      </p>

      <h1 className="mt-3 text-3xl font-bold leading-tight text-foreground">
        How ready are you, really?
      </h1>
      <p className="mt-4 text-base text-muted">
        Most people can&apos;t tell whether they&apos;re genuinely working with AI or
        just occasionally poking at it. This is an honest read — no login, no right
        or wrong answers.
      </p>

      <div className="mt-8 rounded-2xl border-l-4 border-accent-2 bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-2">
          What you&apos;ll get
        </p>
        <p className="mt-2 text-base text-foreground">
          A readiness score from 0 to 100, which of the three forces is dragging it
          down, and three specific things to do about it this week.
        </p>
      </div>

      <h2 className="mt-10 text-xl font-bold text-foreground">
        The 3 things it checks
      </h2>
      <div className="mt-4 flex flex-col gap-3">
        {FORCES.map((force, i) => (
          <div
            key={force.id}
            className="flex gap-4 rounded-2xl border-2 border-border bg-card p-4"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-on-accent">
              {i + 1}
            </span>
            <div>
              <p className="text-base font-semibold text-foreground">{force.name}</p>
              <p className="mt-1 text-sm text-muted">{force.blurb}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-xl font-bold text-foreground">Where you&apos;ll land</h2>
      <p className="mt-2 text-base text-muted">
        Everyone comes out somewhere on this ladder. Most people are further down it
        than they expect.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {BANDS.map((band) => (
          <span
            key={band.name}
            className="rounded-full border-2 border-border bg-card px-4 py-2 text-sm font-medium text-foreground"
          >
            {band.name}
          </span>
        ))}
      </div>

      <h2 className="mt-10 text-xl font-bold text-foreground">Who it&apos;s for</h2>
      <p className="mt-2 text-base text-muted">
        Anyone whose work is mostly thinking, writing, deciding or organising — and
        who suspects their field is changing faster than they are.
      </p>

      <h2 className="mt-10 text-xl font-bold text-foreground">How it works</h2>
      <ol className="mt-4 flex flex-col gap-4">
        {STEPS.map((step, i) => (
          <li key={i} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-accent text-sm font-semibold text-accent">
              {i + 1}
            </span>
            <span className="pt-1 text-base text-foreground">{step}</span>
          </li>
        ))}
      </ol>

      <div className="mt-12 flex flex-col items-center">
        <Link
          href="/assessment"
          className="w-full rounded-full bg-accent px-8 py-4 text-center text-lg font-semibold text-on-accent shadow-sm transition-transform active:scale-[0.98]"
        >
          Start the 90-second snapshot
        </Link>
        <p className="mt-3 text-center text-sm text-muted">
          No login. No right or wrong answers.
        </p>
      </div>

      <footer className="mt-16 border-t border-border pt-6 text-center">
        <Link href="/privacy" className="text-sm text-muted hover:text-foreground">
          Privacy Policy
        </Link>
      </footer>
    </div>
  );
}
