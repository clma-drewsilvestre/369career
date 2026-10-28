"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BRAND, RESULT_CTA } from "@/lib/brand";
import { FORCES, QUESTIONS, type Answers, type QuestionId } from "@/lib/questions";
import { computeScores, weakestForce, type Scores } from "@/lib/scoring";
import { bandFor, forceWordFor } from "@/lib/bands";
import {
  DEEP_RECOMMENDATION,
  DEEP_THRESHOLD,
  RECOMMENDATIONS,
} from "@/lib/recommendations";
import { retryQueued, submit } from "@/lib/webhook";
import ProgressBar from "./ProgressBar";
import ScalePicker from "./ScalePicker";
import ScoreRing from "./ScoreRing";
import SubBar from "./SubBar";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DRAFT_KEY = "ai-readiness-draft";

/** Answering advances after a short delay; questions are one per screen. */
const ADVANCE_MS = 180;

/**
 * There is no landing step here on purpose — `/` does the selling, and a
 * second "Begin" screen right after the first is pure friction.
 */
type Step = "question" | "result";

interface FormState {
  name: string;
  email: string;
  consent: boolean;
}

interface Draft {
  step: Step;
  questionIndex: number;
  answers: Partial<Answers>;
}

function recommendationFor(scores: Scores) {
  const weakest = weakestForce(scores);
  // Once every force clears the threshold, a weak-spot framing stops being a
  // true description of the person in front of us.
  if (scores[weakest] >= DEEP_THRESHOLD) return DEEP_RECOMMENDATION;
  return RECOMMENDATIONS[weakest];
}

export default function AssessmentFlow() {
  const [step, setStep] = useState<Step>("question");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [scores, setScores] = useState<Scores | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [form, setForm] = useState<FormState>({ name: "", email: "", consent: false });

  // Blocks double-taps during the answer -> advance transition. A second tap
  // inside the window would otherwise skip a question or finish twice.
  const advancingRef = useRef(false);

  useEffect(() => {
    retryQueued();
  }, []);

  // Restore an in-progress assessment after an accidental refresh.
  //
  // This has to run as an effect rather than as lazy initial state: the server
  // render has no sessionStorage, so seeding state from it during render would
  // be a hydration mismatch. React batches both updates into a single extra
  // render, which is the cost of resuming at the right question.
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as Draft;
      if (draft.step !== "question") return;
      /* eslint-disable-next-line react-hooks/set-state-in-effect --
         Restoring persisted state post-hydration; see comment above. */
      setQuestionIndex(
        Math.min(Math.max(draft.questionIndex, 0), QUESTIONS.length - 1),
      );
      setAnswers(draft.answers);
    } catch {
      // Corrupt draft — start fresh.
    }
  }, []);

  // Keep the draft current while answering; clear it once the result shows.
  useEffect(() => {
    try {
      if (step === "question") {
        const draft: Draft = { step, questionIndex, answers };
        window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } else if (step === "result") {
        window.sessionStorage.removeItem(DRAFT_KEY);
      }
    } catch {
      // sessionStorage unavailable — persistence is best-effort only.
    }
  }, [step, questionIndex, answers]);

  function handleAnswer(id: QuestionId, value: number) {
    if (advancingRef.current) return;
    advancingRef.current = true;

    const nextAnswers = { ...answers, [id]: value };
    setAnswers(nextAnswers);

    if (questionIndex < QUESTIONS.length - 1) {
      setTimeout(() => {
        setQuestionIndex((i) => i + 1);
        advancingRef.current = false;
      }, ADVANCE_MS);
      return;
    }

    // Guard: every question needs a numeric answer before scoring — otherwise
    // send them back to the first one they missed.
    const firstMissing = QUESTIONS.findIndex(
      (q) => typeof nextAnswers[q.id] !== "number",
    );
    if (firstMissing !== -1) {
      setQuestionIndex(firstMissing);
      advancingRef.current = false;
      return;
    }

    setScores(computeScores(nextAnswers as Answers));
    // advancingRef stays true on purpose: the questions are done and no
    // further answer taps should register.
    setTimeout(() => setStep("result"), ADVANCE_MS);
  }

  function goBack() {
    if (step !== "question" || questionIndex === 0) return;
    setQuestionIndex((i) => i - 1);
  }

  const gateValid =
    form.name.trim().length > 0 && EMAIL_RE.test(form.email.trim()) && form.consent;

  function handleUnlock() {
    if (!gateValid || !scores) return;
    // Fire-and-forget: the breakdown must never wait on the network.
    submit({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      consent: true,
      timestamp: new Date().toISOString(),
      answers: answers as Answers,
    });
    setUnlocked(true);
  }

  const band = scores ? bandFor(scores.composite) : null;
  const recommendation = scores ? recommendationFor(scores) : null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-8">
      {step === "question" && (
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-3">
            {questionIndex > 0 ? (
              <button
                type="button"
                onClick={goBack}
                aria-label="Back"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-border"
              >
                &larr;
              </button>
            ) : (
              <Link
                href="/"
                aria-label="Back"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-border"
              >
                &larr;
              </Link>
            )}
            <div className="flex-1">
              <ProgressBar current={questionIndex + 1} total={QUESTIONS.length} />
            </div>
          </div>

          <div className="mt-10 flex flex-1 flex-col">
            <p className="text-xl font-semibold leading-snug text-foreground">
              {QUESTIONS[questionIndex].text}
            </p>
            <div className="mt-8">
              <ScalePicker
                value={answers[QUESTIONS[questionIndex].id]}
                onSelect={(value) => handleAnswer(QUESTIONS[questionIndex].id, value)}
              />
            </div>
          </div>
        </div>
      )}

      {step === "result" && scores && band && recommendation && (
        <div className="flex flex-1 flex-col items-center py-4">
          <div className="flex flex-col items-center text-center">
            <ScoreRing score={scores.composite} label="AI Readiness Score" />
            <p className="mt-6 text-2xl font-bold text-accent">{band.name}</p>
          </div>

          {!unlocked && (
            <div className="mt-10 w-full rounded-2xl border-2 border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent-2">
                Your breakdown
              </p>
              <p className="mt-2 text-base text-foreground">
                See which of the three forces is holding your score down — and the
                three things to do about it this week.
              </p>

              <div className="mt-6 flex flex-col gap-4">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-foreground">Full Name</span>
                  <input
                    type="text"
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="rounded-xl border-2 border-border bg-background px-4 py-3.5 text-base text-foreground outline-none placeholder:text-muted focus:border-accent"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-foreground">Email</span>
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="rounded-xl border-2 border-border bg-background px-4 py-3.5 text-base text-foreground outline-none placeholder:text-muted focus:border-accent"
                  />
                </label>

                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.consent}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, consent: e.target.checked }))
                    }
                    className="mt-1 h-5 w-5 shrink-0"
                  />
                  <span className="text-sm leading-snug text-muted">
                    I agree to {BRAND.operator} storing my answers and contacting me
                    about my results, as described in the{" "}
                    <Link href="/privacy" className="underline hover:text-foreground">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
              </div>

              <button
                type="button"
                disabled={!gateValid}
                onClick={handleUnlock}
                className="mt-6 w-full rounded-full bg-accent px-8 py-4 text-lg font-semibold text-on-accent shadow-sm transition-transform enabled:active:scale-[0.98] disabled:opacity-40"
              >
                Show my breakdown
              </button>
            </div>
          )}

          {unlocked && (
            <>
              <div className="mt-10 flex w-full flex-col gap-5">
                {FORCES.map((force, i) => (
                  <SubBar
                    key={force.id}
                    label={force.name}
                    value={scores[force.id]}
                    caption={forceWordFor(scores[force.id])}
                    delayMs={200 + i * 150}
                  />
                ))}
              </div>

              <div className="mt-10 w-full rounded-2xl border-l-4 border-accent-2 bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent-2">
                  {recommendation.heading}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">{band.blurb}</p>
                <ol className="mt-5 flex flex-col gap-4">
                  {recommendation.actions.map((action, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-accent text-xs font-semibold text-accent">
                        {i + 1}
                      </span>
                      <span className="pt-0.5 text-sm leading-relaxed text-foreground">
                        {action}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-10 w-full text-center">
                <p className="text-base font-semibold text-foreground">
                  {RESULT_CTA.heading}
                </p>
                <p className="mt-2 text-sm text-muted">{RESULT_CTA.copy}</p>
                {RESULT_CTA.href && RESULT_CTA.buttonLabel && (
                  <a
                    href={RESULT_CTA.href}
                    className="mt-6 inline-block w-full rounded-full bg-accent px-8 py-4 text-lg font-semibold text-on-accent shadow-sm transition-transform active:scale-[0.98]"
                  >
                    {RESULT_CTA.buttonLabel}
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
