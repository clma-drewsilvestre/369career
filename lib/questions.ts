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

export interface Question {
  id: QuestionId;
  category: "presence" | "signal" | "system";
  text: string;
}

// Order matters: rendered 1 to 9 exactly as listed, not grouped visually by category.
export const QUESTIONS: Question[] = [
  { id: "q1", category: "presence", text: "I feel confident walking into a job interview." },
  { id: "q2", category: "presence", text: "When something goes wrong at work, I know how to stay calm and keep going." },
  { id: "q3", category: "presence", text: "I feel ready — not anxious — about starting my career." },
  { id: "q4", category: "signal", text: "I know how I come across to an employer or customer when I speak or write." },
  { id: "q5", category: "signal", text: "My online profile (Facebook, email, etc.) looks professional enough to show an employer." },
  { id: "q6", category: "signal", text: "I can clearly explain my skills and strengths to someone who doesn't know me." },
  { id: "q7", category: "system", text: "I have a resume that is ready to send today." },
  { id: "q8", category: "system", text: "I have a specific plan for what I'll do in the next 30 days to find work." },
  { id: "q9", category: "system", text: "I know how to use AI tools to help me in my job search." },
];

export const SCALE_LABELS = [
  "Strongly Disagree",
  "Disagree",
  "Neutral",
  "Agree",
  "Strongly Agree",
] as const;

export type Answers = Record<QuestionId, number>;
