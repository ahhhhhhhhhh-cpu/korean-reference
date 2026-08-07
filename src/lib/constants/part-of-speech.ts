export const PARTS_OF_SPEECH = [
  "verb",
  "adjective",
  "noun",
  "adverb",
  "particle",
  "other",
] as const;

export type PartOfSpeech = (typeof PARTS_OF_SPEECH)[number];

export function isPartOfSpeech(value: string): value is PartOfSpeech {
  return (PARTS_OF_SPEECH as readonly string[]).includes(value);
}
