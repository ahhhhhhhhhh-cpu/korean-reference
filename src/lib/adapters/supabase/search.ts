import type { Locale } from "@/lib/constants/locales";
import { buildSupabaseSearchIndex } from "@/lib/adapters/supabase/search-index";
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

export const supabaseSearchAdapter = {
  async searchAll(query: string, locale: Locale): Promise<SearchAllResult> {
    const index = await buildSupabaseSearchIndex();
    return runSearchAll(index, query, locale);
  },

  async searchEntries(query: string, locale: Locale): Promise<SearchResultItem[]> {
    const index = await buildSupabaseSearchIndex();
    return runSearchByModule(index, query, locale, "entries");
  },

  async searchSoundChangeRules(
    query: string,
    locale: Locale
  ): Promise<SearchResultItem[]> {
    const index = await buildSupabaseSearchIndex();
    return runSearchByModule(index, query, locale, "soundChange");
  },

  async searchConjugations(
    query: string,
    locale: Locale
  ): Promise<SearchResultItem[]> {
    const index = await buildSupabaseSearchIndex();
    return runSearchByModule(index, query, locale, "conjugation");
  },

  async searchHanja(query: string, locale: Locale): Promise<SearchResultItem[]> {
    const index = await buildSupabaseSearchIndex();
    return runSearchByModule(index, query, locale, "hanja");
  },

  async searchIdioms(query: string, locale: Locale): Promise<SearchResultItem[]> {
    const index = await buildSupabaseSearchIndex();
    return runSearchByModule(index, query, locale, "idioms");
  },

  async getSuggestions(
    query: string,
    locale: Locale,
    limit = 8
  ): Promise<SearchSuggestion[]> {
    const index = await buildSupabaseSearchIndex();
    return runSearchSuggestions(index, query, locale, limit);
  },
};
