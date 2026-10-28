import type { ForceId } from "./questions";

export interface Recommendation {
  heading: string;
  actions: string[];
}

/**
 * Shown for the weakest of the three forces. Each action is meant to be
 * startable this week — a score that only produces agreement doesn't move
 * anyone.
 */
export const RECOMMENDATIONS: Record<ForceId, Recommendation> = {
  posture: {
    heading: "Start with Posture",
    actions: [
      "Pick one low-stakes task this week — a draft email, a summary, a first pass at notes — and do it with AI where nobody is watching.",
      "Write down the single thing about AI in your field that worries you most. Specific fears can be answered; vague ones just sit there.",
      "Find one person in a role like yours who uses AI well, and ask what they actually do with it on a normal day.",
    ],
  },
  fluency: {
    heading: "Start with Fluency",
    actions: [
      "Next time an answer is bad, don't start over. Tell the AI exactly what was wrong with it and ask again — the second try is where the skill lives.",
      "Fact-check one AI answer end to end this week. You have to watch it fail once before you can reliably spot it failing.",
      "Write a short list of what you will never hand to AI. Knowing the edge of the tool is most of the skill of using it.",
    ],
  },
  practice: {
    heading: "Start with Practice",
    actions: [
      "Pick the task you do every week that you most dislike. That's your first candidate, not the most impressive one.",
      "Block 20 minutes this week to try one tool on real work rather than on a demo.",
      "Name the one task you'll be doing differently 30 days from now, and put the check-in in your calendar today.",
    ],
  },
};

/** At or above this on every force, the weak-spot framing stops being true. */
export const DEEP_THRESHOLD = 79;

export const DEEP_RECOMMENDATION: Recommendation = {
  heading: "No obvious weak spot",
  actions: [
    "The next gain isn't a better prompt. It's redesigning a whole workflow around AI instead of bolting AI onto the old one.",
    "Teach it to someone. Explaining your approach out loud is the fastest way to find the parts you only half understand.",
    "Audit where it's costing you. At your level the risk isn't under-using AI — it's trusting it somewhere you shouldn't.",
  ],
};
