import type { Locale } from "@/lib/constants/locales";
import type { TranslationStatus } from "@/lib/constants/translation-status";

/** Base shape for locale-specific knowledge text. */
export type Translation = {
  id: string;
  locale: Locale;
  /** Optional workflow status for Supabase rows; mock data may omit this field. */
  status?: TranslationStatus;
};

export type ExampleTranslation = Translation & {
  exampleId: string;
  translation: string;
};

export type EntryTranslation = Translation & {
  entryId: string;
  definition: string;
  notes?: string | null;
  usageNotes?: string | null;
};

export type SoundChangeRuleTranslation = Translation & {
  soundChangeRuleId: string;
  title: string;
  summary: string;
  explanation: string;
  conditions: string;
  exceptions?: string | null;
};

export type HanjaEntryTranslation = Translation & {
  hanjaEntryId: string;
  definition: string;
  notes?: string | null;
};

export type IdiomTranslation = Translation & {
  idiomId: string;
  literalMeaning: string;
  actualMeaning: string;
  explanation?: string | null;
  usageContext?: string | null;
  commonMistakes?: string | null;
};

export type ConjugationRuleTranslation = Translation & {
  conjugationRuleId: string;
  title: string;
  explanation: string;
};

export type { TranslationStatus } from "@/lib/constants/translation-status";
