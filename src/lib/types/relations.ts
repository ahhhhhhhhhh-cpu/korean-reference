export const ENTRY_RELATION_TYPES = [
  "related",
  "synonym",
  "antonym",
  "confusable",
  "see_also",
  "derived_from",
  "variant_of",
] as const;

export type EntryRelationType = (typeof ENTRY_RELATION_TYPES)[number];

export const SOUND_CHANGE_RELATION_TYPES = [
  "related",
  "confusable",
  "see_also",
] as const;

export type SoundChangeRelationType =
  (typeof SOUND_CHANGE_RELATION_TYPES)[number];

export const IDIOM_RELATION_TYPES = [
  "related",
  "synonym",
  "confusable",
  "see_also",
] as const;

export type IdiomRelationType = (typeof IDIOM_RELATION_TYPES)[number];

export const ENTRY_SOUND_CHANGE_RELATION_TYPES = [
  "applies_to",
  "demonstrates",
  "exception_to",
] as const;

export type EntrySoundChangeRelationType =
  (typeof ENTRY_SOUND_CHANGE_RELATION_TYPES)[number];
