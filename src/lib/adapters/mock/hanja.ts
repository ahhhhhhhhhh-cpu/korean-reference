import type { Locale } from "@/lib/constants/locales";
import {
  mockHanjaCharacters,
  mockHanjaEntries,
  mockHanjaEntryTranslations,
} from "@/data/mock";
import { filterPublished, findPublishedBySlug } from "@/lib/adapters/mock/filter";
import { localize, translationsByLocale } from "@/lib/i18n/localize";
import { matchesModuleTextQuery } from "@/lib/search/module-text-match";
import type { PartOfSpeech } from "@/lib/types/common";
import type { HanjaEntryDetail, HanjaEntrySummary } from "@/lib/types/hanja";
import type { HanjaFilterOptions, HanjaFilters } from "@/lib/types/module-filters";

function mapSummary(
  entry: (typeof mockHanjaEntries)[number],
  locale: Locale
): HanjaEntrySummary {
  const translations = mockHanjaEntryTranslations.filter(
    (item) => item.hanjaEntryId === entry.id
  );

  return {
    id: entry.id,
    slug: entry.slug,
    wordKo: entry.wordKo,
    hanjaText: entry.hanjaText,
    pronunciation: entry.pronunciation,
    partOfSpeech: entry.partOfSpeech,
    definition: localize(
      translationsByLocale(translations, (item) => item.definition),
      locale
    ),
  };
}

function mapDetail(
  entry: (typeof mockHanjaEntries)[number],
  locale: Locale
): HanjaEntryDetail {
  const translations = mockHanjaEntryTranslations.filter(
    (item) => item.hanjaEntryId === entry.id
  );

  const characters = mockHanjaCharacters
    .filter((item) => item.hanjaEntryId === entry.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const characterSet = new Set(characters.map((item) => item.character));
  const relatedIds = new Set<string>();

  for (const character of characterSet) {
    mockHanjaCharacters
      .filter((item) => item.character === character)
      .forEach((item) => relatedIds.add(item.hanjaEntryId));
  }

  const relatedByCharacter = filterPublished(mockHanjaEntries)
    .filter((item) => relatedIds.has(item.id) && item.id !== entry.id)
    .map((item) => mapSummary(item, locale));

  return {
    ...entry,
    definition: localize(
      translationsByLocale(translations, (item) => item.definition),
      locale
    ),
    notes: localize(
      translationsByLocale(translations, (item) => item.notes ?? null),
      locale
    ),
    characters,
    relatedByCharacter,
  };
}

function applyFilters(
  entries: (typeof mockHanjaEntries)[number][],
  filters: HanjaFilters
) {
  let filtered = entries;

  if (filters.character) {
    const entryIds = new Set(
      mockHanjaCharacters
        .filter((item) => item.character === filters.character)
        .map((item) => item.hanjaEntryId)
    );
    filtered = filtered.filter((entry) => entryIds.has(entry.id));
  }

  if (filters.partOfSpeech) {
    filtered = filtered.filter(
      (entry) => entry.partOfSpeech === filters.partOfSpeech
    );
  }

  if (filters.q?.trim()) {
    filtered = filtered.filter((entry) => {
      const translations = mockHanjaEntryTranslations.filter(
        (item) => item.hanjaEntryId === entry.id
      );
      return matchesModuleTextQuery(filters.q, [
        entry.wordKo,
        entry.hanjaText,
        entry.romanization ?? entry.pronunciation,
        ...translations.map((item) => item.definition),
      ]);
    });
  }

  return filtered;
}

export const mockHanjaAdapter = {
  listFilters(): HanjaFilterOptions {
    const published = filterPublished(mockHanjaEntries);
    const entryIds = new Set(published.map((entry) => entry.id));
    const characters = [
      ...new Set(
        mockHanjaCharacters
          .filter((item) => entryIds.has(item.hanjaEntryId))
          .map((item) => item.character)
      ),
    ].sort();

    const partsOfSpeech = [
      ...new Set(published.map((entry) => entry.partOfSpeech)),
    ] as PartOfSpeech[];

    return { characters, partsOfSpeech };
  },

  searchWithinModule(
    filters: HanjaFilters,
    locale: Locale
  ): HanjaEntrySummary[] {
    const entries = applyFilters(
      filterPublished(mockHanjaEntries).sort((a, b) =>
        a.wordKo.localeCompare(b.wordKo, "ko")
      ),
      filters
    );

    return entries.map((entry) => mapSummary(entry, locale));
  },

  listEntries(locale: Locale): HanjaEntrySummary[] {
    return this.searchWithinModule({}, locale);
  },

  getBySlug(slug: string, locale: Locale): HanjaEntryDetail | null {
    const entry = findPublishedBySlug(mockHanjaEntries, slug);
    if (!entry) return null;
    return mapDetail(entry, locale);
  },

  listByCharacter(character: string, locale: Locale): HanjaEntrySummary[] {
    return this.searchWithinModule({ character }, locale);
  },
};
