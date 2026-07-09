import type { Answers } from "./questions";

export interface Scores {
  composite: number;
  presence: number;
  signal: number;
  system: number;
}

function scoreGroup(sum: number): number {
  return Math.round(((sum - 3) / 12) * 100);
}

export function computeScores(answers: Answers): Scores {
  const { q1, q2, q3, q4, q5, q6, q7, q8, q9 } = answers;

  const total = q1 + q2 + q3 + q4 + q5 + q6 + q7 + q8 + q9;
  const composite = Math.round(((total - 9) / 36) * 100);

  const presence = scoreGroup(q1 + q2 + q3);
  const signal = scoreGroup(q4 + q5 + q6);
  const system = scoreGroup(q7 + q8 + q9);

  return { composite, presence, signal, system };
}
