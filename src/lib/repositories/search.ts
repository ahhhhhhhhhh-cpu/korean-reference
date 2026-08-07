import type { Locale } from "@/lib/constants/locales";
import { getSearchAdapter } from "@/lib/adapters";
import type {
  SearchAllResult,
  SearchResultItem,
  SearchSuggestion,
} from "@/lib/types/search";

export async function searchAll(
  query: string,
  locale: Locale
): Promise<SearchAllResult> {
  return getSearchAdapter().searchAll(query, locale);
}

export async function searchEntries(
  query: string,
  locale: Locale
): Promise<SearchResultItem[]> {
  return getSearchAdapter().searchEntries(query, locale);
}

export async function searchSoundChangeRules(
  query: string,
  locale: Locale
): Promise<SearchResultItem[]> {
  return getSearchAdapter().searchSoundChangeRules(query, locale);
}

export async function searchConjugations(
  query: string,
  locale: Locale
): Promise<SearchResultItem[]> {
  return getSearchAdapter().searchConjugations(query, locale);
}

export async function searchHanja(
  query: string,
  locale: Locale
): Promise<SearchResultItem[]> {
  return getSearchAdapter().searchHanja(query, locale);
}

export async function searchIdioms(
  query: string,
  locale: Locale
): Promise<SearchResultItem[]> {
  return getSearchAdapter().searchIdioms(query, locale);
}

export async function getSearchSuggestions(
  query: string,
  locale: Locale,
  limit = 8
): Promise<SearchSuggestion[]> {
  return getSearchAdapter().getSuggestions(query, locale, limit);
}
