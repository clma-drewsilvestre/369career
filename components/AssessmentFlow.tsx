"use client";

import { useEffect, useState } from "react";
import { QUESTIONS, type Answers, type QuestionId } from "@/lib/questions";
import { computeScores } from "@/lib/scoring";
import { retryQueuedWebhooks, sendToWebhook } from "@/lib/webhook";
import ProgressBar from "./ProgressBar";
import ScalePicker from "./ScalePicker";
import ScoreRing from "./ScoreRing";
import SubBar from "./SubBar";

const BATCH_OPTIONS = ["Batch 1", "Batch 2", "Batch 3", "Batch 4"];
const TRACK_OPTIONS = ["Barista", "Cookery", "Bread & Pastry", "Food & Beverage Services"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = "landing" | "intake" | "question" | "result";

interface AssessmentFlowProps {
  moment: "start" | "end";
  webhookUrl: string | undefined;
  title: string;
  description: string;
  includeBatch: boolean;
  includeTrack: boolean;
  beginLabel?: string;
  resultHeading: string;
  resultCopy: string;
}

interface FormState {
  name: string;
  email: string;
  batch: string;
  track: string;
}

export default function AssessmentFlow({
  moment,
  webhookUrl,
  title,
  description,
  includeBatch,
  includeTrack,
  beginLabel = "Begin",
  resultHeading,
  resultCopy,
}: AssessmentFlowProps) {
  const [step, setStep] = useState<Step>("landing");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [form, setForm] = useState<FormState>({ name: "", email: "", batch: "", track: "" });
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [scores, setScores] = useState<ReturnType<typeof computeScores> | null>(null);

  useEffect(() => {
    retryQueuedWebhooks();
  }, []);

  const formValid =
    form.name.trim().length > 0 &&
    EMAIL_RE.test(form.email.trim()) &&
    (!includeBatch || form.batch !== "") &&
    (!includeTrack || form.track !== "");

  function handleAnswer(id: QuestionId, value: number) {
    const nextAnswers = { ...answers, [id]: value };
    setAnswers(nextAnswers);

    if (questionIndex < QUESTIONS.length - 1) {
      setTimeout(() => setQuestionIndex((i) => i + 1), 180);
      return;
    }

    const finalAnswers = nextAnswers as Answers;
    const computed = computeScores(finalAnswers);
    setScores(computed);

    sendToWebhook(webhookUrl, {
      moment,
      name: form.name.trim(),
      email: form.email.trim(),
      batch: includeBatch ? form.batch : null,
      track: includeTrack ? form.track : null,
      timestamp: new Date().toISOString(),
      answers: finalAnswers,
      composite: computed.composite,
      presence: computed.presence,
      signal: computed.signal,
      system: computed.system,
    });

    setTimeout(() => setStep("result"), 180);
  }

  function goBack() {
    if (step === "question" && questionIndex > 0) {
      setQuestionIndex((i) => i - 1);
    } else if (step === "question" && questionIndex === 0) {
      setStep("intake");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-8">
      {step === "landing" && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <h1 className="text-3xl font-bold leading-tight text-foreground">{title}</h1>
          <p className="mt-4 text-base text-muted">{description}</p>
          <button
            type="button"
            onClick={() => setStep("intake")}
            className="mt-10 w-full rounded-full bg-accent px-8 py-4 text-lg font-semibold text-white shadow-sm transition-transform active:scale-[0.98]"
          >
            {beginLabel}
          </button>
        </div>
      )}

      {step === "intake" && (
        <div className="flex flex-1 flex-col">
          <h2 className="text-2xl font-bold text-foreground">A few details first</h2>
          <p className="mt-2 text-sm text-muted">
            This is how we&apos;ll match your results later — no account needed.
          </p>

          <div className="mt-8 flex flex-col gap-5">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">Full Name</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Juan Dela Cruz"
                className="rounded-xl border-2 border-border bg-white px-4 py-3.5 text-base text-foreground outline-none focus:border-accent"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="juan@email.com"
                className="rounded-xl border-2 border-border bg-white px-4 py-3.5 text-base text-foreground outline-none focus:border-accent"
              />
            </label>

            {includeBatch && (
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-foreground">Batch</span>
                <select
                  value={form.batch}
                  onChange={(e) => setForm((f) => ({ ...f, batch: e.target.value }))}
                  className="rounded-xl border-2 border-border bg-white px-4 py-3.5 text-base text-foreground outline-none focus:border-accent"
                >
                  <option value="" disabled>
                    Select your batch
                  </option>
                  {BATCH_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {includeTrack && (
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-foreground">Track</span>
                <select
                  value={form.track}
                  onChange={(e) => setForm((f) => ({ ...f, track: e.target.value }))}
                  className="rounded-xl border-2 border-border bg-white px-4 py-3.5 text-base text-foreground outline-none focus:border-accent"
                >
                  <option value="" disabled>
                    Select your track
                  </option>
                  {TRACK_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <button
            type="button"
            disabled={!formValid}
            onClick={() => setStep("question")}
            className="mt-10 w-full rounded-full bg-accent px-8 py-4 text-lg font-semibold text-white shadow-sm transition-transform enabled:active:scale-[0.98] disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      )}

      {step === "question" && (
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goBack}
              aria-label="Back"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-border"
            >
              ←
            </button>
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

      {step === "result" && scores && (
        <div className="flex flex-1 flex-col items-center py-4 text-center">
          <h2 className="text-2xl font-bold text-foreground">{resultHeading}</h2>

          <div className="mt-8">
            <ScoreRing score={scores.composite} label="Career Readiness Score" />
          </div>

          <div className="mt-10 flex w-full flex-col gap-5">
            <SubBar label="Presence" value={scores.presence} delayMs={200} />
            <SubBar label="Signal" value={scores.signal} delayMs={350} />
            <SubBar label="System" value={scores.system} delayMs={500} />
          </div>

          <p className="mt-10 text-sm font-medium text-accent-dark">{resultCopy}</p>
        </div>
      )}
    </div>
  );
}
