import type { Locale } from "@/lib/constants/locales";
import { buildMockSearchIndex } from "@/lib/adapters/mock/search-index";
import {
  runSearchAll,
  runSearchByModule,
  runSearchSuggestions,
} from "@/lib/search/engine";
import type {
  SearchAllResult,
  SearchResultItem,
  SearchSuggestion,
} from "@/lib/types/search";

export const mockSearchAdapter = {
  searchAll(query: string, locale: Locale): SearchAllResult {
    return runSearchAll(buildMockSearchIndex(), query, locale);
  },

  searchEntries(query: string, locale: Locale): SearchResultItem[] {
    return runSearchByModule(buildMockSearchIndex(), query, locale, "entries");
  },

  searchSoundChangeRules(query: string, locale: Locale): SearchResultItem[] {
    return runSearchByModule(
      buildMockSearchIndex(),
      query,
      locale,
      "soundChange"
    );
  },

  searchConjugations(query: string, locale: Locale): SearchResultItem[] {
    return runSearchByModule(
      buildMockSearchIndex(),
      query,
      locale,
      "conjugation"
    );
  },

  searchHanja(query: string, locale: Locale): SearchResultItem[] {
    return runSearchByModule(buildMockSearchIndex(), query, locale, "hanja");
  },

  searchIdioms(query: string, locale: Locale): SearchResultItem[] {
    return runSearchByModule(buildMockSearchIndex(), query, locale, "idioms");
  },

  getSuggestions(
    query: string,
    locale: Locale,
    limit = 8
  ): SearchSuggestion[] {
    return runSearchSuggestions(buildMockSearchIndex(), query, locale, limit);
  },
};
