import { QUESTIONS, type Answers, type ForceId } from "./questions";

export interface Scores {
  composite: number;
  posture: number;
  fluency: number;
  practice: number;
}

/**
 * Three questions at 1-5 each => raw sum of 3..15, mapped to 0..100.
 * Only 13 discrete values are possible, which is why force scores are shown
 * as a bar plus a word rather than a number (see lib/bands.ts).
 */
function scoreForce(sum: number): number {
  return Math.round(((sum - 3) / 12) * 100);
}

export function computeScores(answers: Answers): Scores {
  const sums: Record<ForceId, number> = { posture: 0, fluency: 0, practice: 0 };
  let total = 0;

  for (const q of QUESTIONS) {
    const value = answers[q.id];
    sums[q.force] += value;
    total += value;
  }

  return {
    // Nine questions at 1-5 each => raw total of 9..45, mapped to 0..100.
    composite: Math.round(((total - 9) / 36) * 100),
    posture: scoreForce(sums.posture),
    fluency: scoreForce(sums.fluency),
    practice: scoreForce(sums.practice),
  };
}

/**
 * Ties break toward Practice, then Fluency, then Posture — the order runs
 * from most to least actionable, so a tied result still sends someone
 * somewhere they can do something this week.
 */
const TIE_BREAK_ORDER: ForceId[] = ["practice", "fluency", "posture"];

export function weakestForce(scores: Scores): ForceId {
  return TIE_BREAK_ORDER.reduce((weakest, force) =>
    scores[force] < scores[weakest] ? force : weakest,
  );
}
