import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${BRAND.operator} handles the information you give the ${BRAND.name}.`,
};

const LAST_UPDATED = "28 October 2026";

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-10">
      <Link href="/" className="text-sm text-muted hover:text-foreground">
        &larr; Back
      </Link>

      <h1 className="mt-6 text-3xl font-bold leading-tight text-foreground">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-muted">Last updated: {LAST_UPDATED}</p>

      <div className="mt-8 flex flex-col gap-8">
        <section>
          <h2 className="text-lg font-bold text-foreground">What we collect</h2>
          <p className="mt-2 text-base leading-relaxed text-muted">
            When you complete the {BRAND.name} and ask to see your breakdown, we
            collect the name and email address you enter, your answers to the nine
            questions, the scores calculated from those answers, and the time you
            submitted them.
          </p>
          <p className="mt-3 text-base leading-relaxed text-muted">
            Your IP address is used momentarily to limit how many submissions can
            come from one source. It is not stored with your answers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">What we use it for</h2>
          <p className="mt-2 text-base leading-relaxed text-muted">
            To show you your results, to contact you about those results, and to
            understand in aggregate how people score so we can improve the
            assessment. We do not sell your information, and we do not share it with
            third parties for their own marketing.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">Where it is stored</h2>
          <p className="mt-2 text-base leading-relaxed text-muted">
            Submissions are processed through Make.com and stored in Google Sheets.
            Both providers may process data outside your country. The site itself is
            hosted on Vercel.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">Your rights</h2>
          <p className="mt-2 text-base leading-relaxed text-muted">
            Under the Philippine Data Privacy Act of 2012 (RA 10173) you may ask to
            see the information we hold about you, correct it, withdraw your consent,
            or have it deleted. Email{" "}
            <a
              href={`mailto:${BRAND.privacyEmail}`}
              className="underline hover:text-foreground"
            >
              {BRAND.privacyEmail}
            </a>{" "}
            and we will respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">Keeping it</h2>
          <p className="mt-2 text-base leading-relaxed text-muted">
            We keep your submission for as long as it is useful for the purposes
            above, or until you ask us to delete it.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">Changes</h2>
          <p className="mt-2 text-base leading-relaxed text-muted">
            If this policy changes, the date at the top of this page changes with it.
          </p>
        </section>
      </div>
    </div>
  );
}
