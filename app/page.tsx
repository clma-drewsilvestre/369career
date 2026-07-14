import Link from "next/link";

const FORCES = [
  {
    name: "Presence",
    blurb:
      "How you carry yourself. Walking into an interview, staying calm during a rush, bouncing back after a mistake.",
  },
  {
    name: "Signal",
    blurb:
      "The impression you give. Your resume, your online profile, and the first impression you make.",
  },
  {
    name: "System",
    blurb:
      "How consistently you show up. Applications sent, follow-ups made, and practice repeated.",
  },
];

const TRACKS = ["Barista", "Cookery", "Bread & Pastry", "Food & Beverage Services"];

const STEPS = [
  "Answer 9 short questions — about 90 seconds.",
  "See your readiness score, out of 100.",
  "Screenshot it, then keep working on your job search.",
];

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-10">
      {/* Eyebrow */}
      <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">
        CLMA · From Graduate to Game Changer
      </p>

      {/* Hero */}
      <h1 className="mt-3 text-3xl font-bold leading-tight text-foreground">
        Are you ready for your first job?
      </h1>
      <p className="mt-4 text-base text-muted">
        The 369 Career Readiness Snapshot is a quick, honest check of how ready you
        are to get hired — no login, no right or wrong answers.
      </p>

      {/* What it is */}
      <div className="mt-8 rounded-2xl bg-accent-tint p-5">
        <p className="text-base text-foreground">
          In about 90 seconds, you&apos;ll get a readiness score from 0 to 100 —
          plus a look at the three things that help you land a job.
        </p>
      </div>

      {/* The 3 things it checks */}
      <h2 className="mt-10 text-xl font-bold text-foreground">
        The 3 things it checks
      </h2>
      <div className="mt-4 flex flex-col gap-3">
        {FORCES.map((force, i) => (
          <div
            key={force.name}
            className="flex gap-4 rounded-2xl border-2 border-border bg-white p-4"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
              {i + 1}
            </span>
            <div>
              <p className="text-base font-semibold text-foreground">{force.name}</p>
              <p className="mt-1 text-sm text-muted">{force.blurb}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Who it's for */}
      <h2 className="mt-10 text-xl font-bold text-foreground">Who it&apos;s for</h2>
      <p className="mt-2 text-base text-muted">
        Fresh TESDA graduates looking for their first job — across every track:
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {TRACKS.map((track) => (
          <span
            key={track}
            className="rounded-full border-2 border-border bg-white px-4 py-2 text-sm font-medium text-foreground"
          >
            {track}
          </span>
        ))}
      </div>

      {/* How it works */}
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

      {/* Final CTA */}
      <div className="mt-12 flex flex-col items-center">
        <Link
          href="/start"
          className="w-full rounded-full bg-accent px-8 py-4 text-center text-lg font-semibold text-white shadow-sm transition-transform active:scale-[0.98]"
        >
          Start the 90-second snapshot
        </Link>
        <p className="mt-3 text-center text-sm text-muted">
          No login. No right or wrong answers.
        </p>
      </div>
    </div>
  );
}
