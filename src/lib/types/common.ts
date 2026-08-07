import type { Locale } from "@/lib/constants/locales";

export type { EtymologyType } from "@/lib/constants/etymology-type";
export type { FrequencyLevel } from "@/lib/constants/frequency-level";
export type { IrregularType } from "@/lib/constants/irregular-type";
export type { PartOfSpeech } from "@/lib/constants/part-of-speech";
export type { PublicationStatus } from "@/lib/constants/publication-status";
export type { TranslationStatus } from "@/lib/constants/translation-status";
export { isPublishedStatus as isPublished } from "@/lib/constants/publication-status";

export type Timestamps = {
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type LocalizedContent<T> = {
  requestedLocale: Locale;
  resolvedLocale: Locale | null;
  value: T | null;
  usedFallback: boolean;
};

/** Revised Romanization of Korean (RR) — see docs/10-content-guidelines.md */
export type RomanizationFields = {
  romanization?: string | null;
  romanizationAliases?: string[];
};
