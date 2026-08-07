import type { DifficultyTier } from "@/lib/constants/difficulty-tier";
import type { EtymologyType } from "@/lib/constants/etymology-type";
import type { FrequencyLevel } from "@/lib/constants/frequency-level";
import type { IrregularType } from "@/lib/constants/irregular-type";
import type { PartOfSpeech } from "@/lib/constants/part-of-speech";
import type { PublicationStatus } from "@/lib/constants/publication-status";
import type { LocalizedContent, RomanizationFields, Timestamps } from "@/lib/types/common";
import type { ExampleDetail } from "@/lib/types/example";

export type Entry = Timestamps &
  RomanizationFields & {
  id: string;
  slug: string;
  headwordKo: string;
  headwordNormalized: string;
  partOfSpeech: PartOfSpeech;
  pronunciation: string;
  romanization?: string | null;
  irregularType: IrregularType | null;
  etymologyType?: EtymologyType | null;
  hanjaText?: string | null;
  status: PublicationStatus;
  frequencyLevel?: FrequencyLevel | null;
  difficultyLevel?: DifficultyTier | null;
  soundChangeRuleIds: string[];
  relatedEntrySlugs: string[];
};

export type EntryDetail = Entry & {
  definition: LocalizedContent<string>;
  notes: LocalizedContent<string | null>;
  usageNotes: LocalizedContent<string | null>;
  examples: ExampleDetail[];
};

export type EntrySummary = Pick<
  Entry,
  | "id"
  | "slug"
  | "headwordKo"
  | "partOfSpeech"
  | "pronunciation"
  | "romanization"
  | "irregularType"
  | "hanjaText"
> & {
  definition: LocalizedContent<string>;
};
