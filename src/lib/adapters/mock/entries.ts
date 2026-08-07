import type { Locale } from "@/lib/constants/locales";
import {
  mockEntries,
  mockEntryTranslations,
  mockExampleTranslations,
  mockExamples,
} from "@/data/mock";
import { filterPublished, findPublishedBySlug } from "@/lib/adapters/mock/filter";
import { localize, translationsByLocale } from "@/lib/i18n/localize";
import type { EntryDetail, EntrySummary } from "@/lib/types/entry";
import type { ExampleDetail } from "@/lib/types/example";

function mapExample(exampleId: string, locale: Locale): ExampleDetail | null {
  const example = mockExamples.find((item) => item.id === exampleId);
  if (!example || example.status !== "published") return null;

  const translations = mockExampleTranslations.filter(
    (item) => item.exampleId === exampleId
  );

  return {
    ...example,
    translation: localize(
      translationsByLocale(translations, (item) => item.translation),
      locale
    ),
  };
}

function mapEntrySummary(entry: (typeof mockEntries)[number], locale: Locale): EntrySummary {
  const translations = mockEntryTranslations.filter(
    (item) => item.entryId === entry.id
  );

  return {
    id: entry.id,
    slug: entry.slug,
    headwordKo: entry.headwordKo,
    partOfSpeech: entry.partOfSpeech,
    pronunciation: entry.pronunciation,
    romanization: entry.romanization,
    irregularType: entry.irregularType,
    hanjaText: entry.hanjaText,
    definition: localize(
      translationsByLocale(translations, (item) => item.definition),
      locale
    ),
  };
}

function mapEntryDetail(entry: (typeof mockEntries)[number], locale: Locale): EntryDetail {
  const translations = mockEntryTranslations.filter(
    (item) => item.entryId === entry.id
  );
  const byLocale = (pick: (item: (typeof translations)[number]) => string | null | undefined) =>
    translationsByLocale(translations, pick);

  const examples = mockExamples
    .filter((item) => item.entryId === entry.id)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => mapExample(item.id, locale))
    .filter((item): item is ExampleDetail => item !== null);

  return {
    ...entry,
    definition: localize(byLocale((item) => item.definition), locale),
    notes: localize(byLocale((item) => item.notes ?? null), locale),
    usageNotes: localize(byLocale((item) => item.usageNotes ?? null), locale),
    examples,
  };
}

export const mockEntriesAdapter = {
  listSummaries(locale: Locale): EntrySummary[] {
    return filterPublished(mockEntries)
      .sort((a, b) => a.headwordKo.localeCompare(b.headwordKo, "ko"))
      .map((entry) => mapEntrySummary(entry, locale));
  },

  listFeatured(locale: Locale, limit = 6): EntrySummary[] {
    return this.listSummaries(locale).slice(0, limit);
  },

  getBySlug(slug: string, locale: Locale): EntryDetail | null {
    const entry = findPublishedBySlug(mockEntries, slug);
    if (!entry) return null;
    return mapEntryDetail(entry, locale);
  },
};
