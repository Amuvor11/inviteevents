import type { PublicInviteEvent } from "@/types/invite";

type Question = PublicInviteEvent["questions"][number];

/** Parse stored defaultValue into the shape used by the RSVP form. */
export function parseQuestionDefault(q: Question): unknown {
  const raw = q.defaultValue?.trim();
  if (!raw) return undefined;
  if (q.type === "MULTIPLE_CHOICE") {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return raw;
}

/** Build initial answers map from question defaults (public invite + preview). */
export function buildDefaultAnswers(questions: Question[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const q of questions) {
    const parsed = parseQuestionDefault(q);
    if (parsed === undefined) continue;
    out[q.id] = parsed;
  }
  return out;
}

/** Prefer explicit answer; fall back to question default for display. */
export function resolveQuestionAnswer(
  q: Question,
  answers: Record<string, unknown>,
): unknown {
  if (Object.prototype.hasOwnProperty.call(answers, q.id)) return answers[q.id];
  return parseQuestionDefault(q);
}
