export const FEEDBACK_TARGET_KINDS = [
  "page",
  "entry",
  "sense",
  "sense_translation",
  "example",
  "example_translation",
  "sound_change_rule",
  "conjugation_result",
  "hanja_character",
  "hanja_term",
  "idiom",
] as const;

export type FeedbackTargetKind = (typeof FEEDBACK_TARGET_KINDS)[number];

export const FEEDBACK_CATEGORIES = [
  "incorrect_content",
  "translation_issue",
  "pronunciation_issue",
  "sound_change_issue",
  "conjugation_issue",
  "hanja_issue",
  "example_issue",
  "broken_link",
  "display_issue",
  "technical_issue",
  "copyright_issue",
  "other",
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export const FEEDBACK_STATUSES = [
  "new",
  "reviewing",
  "resolved",
  "rejected",
  "duplicate",
  "spam",
] as const;

export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export function isFeedbackTargetKind(value: string): value is FeedbackTargetKind {
  return (FEEDBACK_TARGET_KINDS as readonly string[]).includes(value);
}

export function isFeedbackCategory(value: string): value is FeedbackCategory {
  return (FEEDBACK_CATEGORIES as readonly string[]).includes(value);
}

export function isFeedbackStatus(value: string): value is FeedbackStatus {
  return (FEEDBACK_STATUSES as readonly string[]).includes(value);
}
