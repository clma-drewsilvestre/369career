export type QuestionId =
  | "q1"
  | "q2"
  | "q3"
  | "q4"
  | "q5"
  | "q6"
  | "q7"
  | "q8"
  | "q9";

export type ForceId = "posture" | "fluency" | "practice";

export interface Question {
  id: QuestionId;
  force: ForceId;
  text: string;
}

export interface Force {
  id: ForceId;
  name: string;
  blurb: string;
}

/**
 * Three forces, three questions each — the 3x9 structure the name comes from.
 * Order matters: rendered 1 to 9 exactly as listed, not grouped visually by
 * force, so the shape of the instrument isn't obvious while answering.
 */
export const FORCES: Force[] = [
  {
    id: "posture",
    name: "Posture",
    blurb:
      "How you carry yourself around AI. Confidence using it, staying level when it gets things wrong, and how you feel about where your field is heading.",
  },
  {
    id: "fluency",
    name: "Fluency",
    blurb:
      "How well you actually work with it. Getting a better answer on the second try, spotting output that's wrong, and knowing what not to hand over.",
  },
  {
    id: "practice",
    name: "Practice",
    blurb:
      "Whether any of it is real. How often you use AI, whether you have a plan to get better, and whether your work has actually changed.",
  },
];

export const QUESTIONS: Question[] = [
  { id: "q1", force: "posture", text: "I feel confident using AI tools in my day-to-day work." },
  { id: "q2", force: "posture", text: "I stay calm, not frustrated, when AI gets something wrong." },
  { id: "q3", force: "posture", text: "I feel ready — not anxious — about how AI is changing my field." },
  { id: "q4", force: "fluency", text: "When I don't get a good answer, I know how to rework my request to get a better one." },
  { id: "q5", force: "fluency", text: "I can tell when an AI answer is wrong or needs checking." },
  { id: "q6", force: "fluency", text: "I know which parts of my work I shouldn't hand to AI." },
  { id: "q7", force: "practice", text: "I use AI in my work most days." },
  { id: "q8", force: "practice", text: "I have a specific plan for what I'll learn or try with AI in the next 30 days." },
  { id: "q9", force: "practice", text: "There's at least one task I now do completely differently because of AI." },
];

export const SCALE_LABELS = [
  "Strongly Disagree",
  "Disagree",
  "Neutral",
  "Agree",
  "Strongly Agree",
] as const;

export type Answers = Record<QuestionId, number>;
