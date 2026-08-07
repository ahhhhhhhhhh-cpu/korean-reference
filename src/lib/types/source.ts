export const SOURCE_TYPES = [
  "dictionary",
  "academic_paper",
  "book",
  "textbook",
  "article",
  "official_website",
  "corpus",
  "licensed_dataset",
  "original_editorial",
  "other",
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

export function isSourceType(value: string): value is SourceType {
  return (SOURCE_TYPES as readonly string[]).includes(value);
}
