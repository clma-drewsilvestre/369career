export interface Band {
  min: number;
  max: number;
  name: string;
  blurb: string;
}

/**
 * Band edges are deliberately NOT quartiles.
 *
 * The composite formula maps "all 2s" to exactly 25, "all 3s" to exactly 50
 * and "all 4s" to exactly 75. Quartile boundaries would drop the three most
 * common answer patterns precisely on a band edge, where a single question
 * flips someone's label. These edges sit each canonical pattern mid-band.
 */
export const BANDS: Band[] = [
  {
    min: 0,
    max: 30,
    name: "Spectator",
    blurb:
      "AI is something happening near your work rather than inside it. That's a more common place to be than the noise suggests — and the first move is smaller than you think.",
  },
  {
    min: 31,
    max: 55,
    name: "Dabbler",
    blurb:
      "You've tried it and it hasn't stuck. Usually that's not a tools problem or a talent problem — it's that nothing in your week actually depends on it yet.",
  },
  {
    min: 56,
    max: 78,
    name: "Operator",
    blurb:
      "AI is doing real work for you. You're past the novelty and into the part where judgment matters more than enthusiasm.",
  },
  {
    min: 79,
    max: 100,
    name: "Multiplier",
    blurb:
      "AI is compounding what you can do, not just speeding it up. Your risk now is misplaced trust rather than inexperience.",
  },
];

export function bandFor(score: number): Band {
  const clamped = Math.min(100, Math.max(0, score));
  // The last band is the fallback: edges are contiguous, so this only matters
  // if score is exactly 100.
  return BANDS.find((b) => clamped >= b.min && clamped <= b.max) ?? BANDS[BANDS.length - 1];
}

/**
 * One word per force bar. Force scores only have 13 possible values and the
 * lowest non-zero one is 8 — a bare "8" next to a force name reads as a
 * verdict on the person rather than a reading, so the bars carry a word.
 */
export function forceWordFor(score: number): string {
  if (score <= 30) return "Not yet";
  if (score <= 55) return "Starting";
  if (score <= 78) return "Solid";
  return "Strong";
}
