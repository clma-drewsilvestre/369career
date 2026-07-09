import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-8 text-center">
      <h1 className="text-3xl font-bold text-foreground">369 Career Readiness Snapshot</h1>
      <p className="mt-4 text-base text-muted">
        This app is meant to be opened via the workshop QR codes, at{" "}
        <code className="rounded bg-accent-tint px-1.5 py-0.5 text-sm text-accent-dark">/start</code>{" "}
        and{" "}
        <code className="rounded bg-accent-tint px-1.5 py-0.5 text-sm text-accent-dark">/end</code>.
      </p>
      <div className="mt-10 flex w-full flex-col gap-3">
        <Link
          href="/start"
          className="w-full rounded-full bg-accent px-8 py-4 text-lg font-semibold text-white shadow-sm transition-transform active:scale-[0.98]"
        >
          Go to /start
        </Link>
        <Link
          href="/end"
          className="w-full rounded-full border-2 border-accent px-8 py-4 text-lg font-semibold text-accent transition-transform active:scale-[0.98]"
        >
          Go to /end
        </Link>
      </div>
    </div>
  );
}
