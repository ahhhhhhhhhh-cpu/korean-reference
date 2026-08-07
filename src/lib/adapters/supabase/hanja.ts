import type { Locale } from "@/lib/constants/locales";
import type { PartOfSpeech } from "@/lib/constants/part-of-speech";
import {
  mapHanjaEntryDetail,
  mapHanjaEntrySummary,
} from "@/lib/adapters/supabase/mappers/hanja";
import {
  loadHanjaTermBundleBySlug,
  loadHanjaTermBundles,
  loadHanjaTermBundlesByCharacter,
} from "@/lib/adapters/supabase/loaders/hanja";
import { filterPublishedTranslationRows } from "@/lib/adapters/supabase/mappers/translations";
import { matchesModuleTextQuery } from "@/lib/search/module-text-match";
import type { HanjaEntryDetail, HanjaEntrySummary } from "@/lib/types/hanja";
import type { HanjaFilterOptions, HanjaFilters } from "@/lib/types/module-filters";

function applyFilters(
  bundles: Awaited<ReturnType<typeof loadHanjaTermBundles>>,
  filters: HanjaFilters
) {
  let filtered = bundles;

  if (filters.character) {
    filtered = filtered.filter((bundle) =>
      bundle.characters.some(
        (item) => item.character.character === filters.character
      )
    );
  }

  if (filters.partOfSpeech) {
    filtered = filtered.filter(
      (bundle) => bundle.entry?.part_of_speech === filters.partOfSpeech
    );
  }

  if (filters.q?.trim()) {
    filtered = filtered.filter((bundle) => {
      const published = filterPublishedTranslationRows(
        bundle.entrySenseTranslations
      );
      return matchesModuleTextQuery(filters.q, [
        bundle.entry?.headword ?? bundle.term.korean_hanja,
        bundle.term.korean_hanja,
        bundle.entry?.romanization ?? bundle.entry?.pronunciation_hangul ?? "",
        ...published.map(
          (row) => row.short_definition ?? row.definition ?? ""
        ),
      ]);
    });
  }

  return filtered;
}

export const supabaseHanjaAdapter = {
  async listFilters(): Promise<HanjaFilterOptions> {
    const bundles = await loadHanjaTermBundles();
    const characters = [
      ...new Set(
        bundles.flatMap((bundle) =>
          bundle.characters.map((item) => item.character.character)
        )
      ),
    ].sort();

    const partsOfSpeech = [
      ...new Set(
        bundles
          .map((bundle) => bundle.entry?.part_of_speech)
          .filter((value): value is string => Boolean(value))
      ),
    ] as PartOfSpeech[];

    return { characters, partsOfSpeech };
  },

  async searchWithinModule(
    filters: HanjaFilters,
    locale: Locale
  ): Promise<HanjaEntrySummary[]> {
    const bundles = applyFilters(
      (await loadHanjaTermBundles()).sort((a, b) => {
        const wordA = a.entry?.headword ?? a.term.korean_hanja;
        const wordB = b.entry?.headword ?? b.term.korean_hanja;
        return wordA.localeCompare(wordB, "ko");
      }),
      filters
    );

    return bundles.map((bundle) => mapHanjaEntrySummary(bundle, locale));
  },

  async listEntries(locale: Locale): Promise<HanjaEntrySummary[]> {
    return this.searchWithinModule({}, locale);
  },

  async getBySlug(slug: string, locale: Locale): Promise<HanjaEntryDetail | null> {
    const bundle = await loadHanjaTermBundleBySlug(slug);
    if (!bundle) return null;

    const allBundles = await loadHanjaTermBundles();
    const characterSet = new Set(
      bundle.characters.map((item) => item.character.character)
    );
    const relatedIds = new Set<string>();

    for (const character of characterSet) {
      allBundles
        .filter((item) =>
          item.characters.some((slot) => slot.character.character === character)
        )
        .forEach((item) => relatedIds.add(item.term.id));
    }

    const relatedSummaries = allBundles
      .filter((item) => relatedIds.has(item.term.id) && item.term.id !== bundle.term.id)
      .map((item) => mapHanjaEntrySummary(item, locale));

    return mapHanjaEntryDetail(bundle, locale, relatedSummaries);
  },

  async listByCharacter(
    character: string,
    locale: Locale
  ): Promise<HanjaEntrySummary[]> {
    const bundles = await loadHanjaTermBundlesByCharacter(character);
    return bundles
      .sort((a, b) => {
        const wordA = a.entry?.headword ?? a.term.korean_hanja;
        const wordB = b.entry?.headword ?? b.term.korean_hanja;
        return wordA.localeCompare(wordB, "ko");
      })
      .map((bundle) => mapHanjaEntrySummary(bundle, locale));
  },
};
