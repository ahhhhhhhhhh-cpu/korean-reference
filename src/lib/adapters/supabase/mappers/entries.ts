import type { Locale } from "@/lib/constants/locales";
import type { DifficultyTier } from "@/lib/constants/difficulty-tier";
import type { EtymologyType } from "@/lib/constants/etymology-type";
import type { FrequencyLevel } from "@/lib/constants/frequency-level";
import type { IrregularType } from "@/lib/constants/irregular-type";
import type { PartOfSpeech } from "@/lib/constants/part-of-speech";
import type { PublicationStatus } from "@/lib/constants/publication-status";
import type { Database } from "@/lib/supabase/types";
import {
  filterPublishedTranslationRows,
  pickLocalized,
  toLocale,
} from "@/lib/adapters/supabase/mappers/translations";
import { localize, translationsByLocale } from "@/lib/i18n/localize";
import type { Entry, EntryDetail, EntrySummary } from "@/lib/types/entry";
import type { ExampleDetail } from "@/lib/types/example";

type EntryRow = Database["public"]["Tables"]["entries"]["Row"];
type SenseRow = Database["public"]["Tables"]["senses"]["Row"];
type SenseTranslationRow =
  Database["public"]["Tables"]["sense_translations"]["Row"];
type EntryTranslationRow =
  Database["public"]["Tables"]["entry_translations"]["Row"];
type ExampleRow = Database["public"]["Tables"]["examples"]["Row"];
type ExampleTranslationRow =
  Database["public"]["Tables"]["example_translations"]["Row"];

export type EntryExampleLink = {
  entryId: string;
  displayOrder: number;
  example: ExampleRow;
  exampleTranslations: ExampleTranslationRow[];
};

export type EntryBundle = {
  entry: EntryRow;
  primarySense: SenseRow | null;
  senseTranslations: SenseTranslationRow[];
  entryTranslations: EntryTranslationRow[];
  examples: EntryExampleLink[];
  hanjaText: string | null;
  soundChangeRuleIds: string[];
  relatedEntrySlugs: string[];
};

function mapTimestamps(row: {
  created_at: string;
  updated_at: string;
  published_at: string | null;
}) {
  return {
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  };
}

function mapRomanization(entry: EntryRow) {
  const aliases = entry.pronunciation_romanization
    ? [entry.pronunciation_romanization]
    : [];
  return {
    romanization: entry.romanization,
    romanizationAliases:
      aliases.length > 0 && aliases[0] !== entry.romanization ? aliases : undefined,
  };
}

export function mapEntryBase(bundle: EntryBundle): Entry {
  const { entry } = bundle;
  return {
    id: entry.id,
    slug: entry.slug,
    headwordKo: entry.headword,
    headwordNormalized: entry.headword_normalized,
    partOfSpeech: entry.part_of_speech as PartOfSpeech,
    pronunciation: entry.pronunciation_hangul ?? `[${entry.headword}]`,
    irregularType: (entry.irregular_type as IrregularType | null) ?? null,
    etymologyType: (entry.etymology_type as EtymologyType | null) ?? null,
    hanjaText: bundle.hanjaText,
    status: entry.status as PublicationStatus,
    frequencyLevel: (entry.frequency_level as FrequencyLevel | null) ?? null,
    difficultyLevel: (entry.difficulty_level as DifficultyTier | null) ?? null,
    soundChangeRuleIds: bundle.soundChangeRuleIds,
    relatedEntrySlugs: bundle.relatedEntrySlugs,
    ...mapRomanization(entry),
    ...mapTimestamps(entry),
  };
}

function primarySenseTranslations(bundle: EntryBundle): SenseTranslationRow[] {
  if (!bundle.primarySense) return [];
  return filterPublishedTranslationRows(
    bundle.senseTranslations.filter(
      (row) => row.sense_id === bundle.primarySense!.id
    )
  );
}

function definitionFromSense(row: SenseTranslationRow): string {
  return row.short_definition ?? row.definition ?? "";
}

export function mapEntrySummary(bundle: EntryBundle, locale: Locale): EntrySummary {
  const base = mapEntryBase(bundle);
  const translations = primarySenseTranslations(bundle);

  return {
    id: base.id,
    slug: base.slug,
    headwordKo: base.headwordKo,
    partOfSpeech: base.partOfSpeech,
    pronunciation: base.pronunciation,
    romanization: base.romanization,
    irregularType: base.irregularType,
    hanjaText: base.hanjaText,
    definition: pickLocalized(translations, locale, definitionFromSense),
  };
}

function mapExample(
  link: EntryExampleLink,
  locale: Locale
): ExampleDetail | null {
  if (link.example.status !== "published") return null;

  const translations = filterPublishedTranslationRows(link.exampleTranslations);

  return {
    id: link.example.id,
    entryId: link.entryId,
    idiomId: null,
    soundChangeRuleId: null,
    sentenceKo: link.example.korean_text,
    sortOrder: link.displayOrder,
    status: link.example.status as PublicationStatus,
    createdAt: link.example.created_at,
    updatedAt: link.example.updated_at,
    publishedAt: link.example.published_at,
    translation: pickLocalized(translations, locale, (row) => row.translation),
  };
}

export function mapEntryDetail(bundle: EntryBundle, locale: Locale): EntryDetail {
  const base = mapEntryBase(bundle);
  const senseTranslations = primarySenseTranslations(bundle);
  const entryTranslations = filterPublishedTranslationRows(bundle.entryTranslations);

  const senseByLocale = <V>(pick: (item: SenseTranslationRow) => V) =>
    translationsByLocale(
      senseTranslations.flatMap((row) => {
        const resolved = toLocale(row.locale);
        return resolved ? [{ ...row, locale: resolved }] : [];
      }),
      pick
    );

  const entryByLocale = <V>(pick: (item: EntryTranslationRow) => V) =>
    translationsByLocale(
      entryTranslations.flatMap((row) => {
        const resolved = toLocale(row.locale);
        return resolved ? [{ ...row, locale: resolved }] : [];
      }),
      pick
    );

  const examples = bundle.examples
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((link) => mapExample(link, locale))
    .filter((item): item is ExampleDetail => item !== null);

  return {
    ...base,
    definition: localize(senseByLocale(definitionFromSense), locale),
    notes: localize(entryByLocale((row) => row.general_note ?? null), locale),
    usageNotes: localize(
      senseByLocale((row) => row.usage_note ?? null),
      locale
    ),
    examples,
  };
}
