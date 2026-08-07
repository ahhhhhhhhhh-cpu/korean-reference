export const IDIOM_CATEGORIES = [
  "daily",
  "emotion",
  "relationship",
  "work-study",
  "body",
  "animal",
  "formal",
  "colloquial",
] as const;

export type IdiomCategory = (typeof IDIOM_CATEGORIES)[number];

export function isIdiomCategory(value: string): value is IdiomCategory {
  return (IDIOM_CATEGORIES as readonly string[]).includes(value);
}
