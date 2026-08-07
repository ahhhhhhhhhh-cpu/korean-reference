export const TRANSLATION_STATUSES = [
  "draft",
  "in_review",
  "published",
  "needs_revision",
] as const;

export type TranslationStatus = (typeof TRANSLATION_STATUSES)[number];

export function isTranslationStatus(value: string): value is TranslationStatus {
  return (TRANSLATION_STATUSES as readonly string[]).includes(value);
}
