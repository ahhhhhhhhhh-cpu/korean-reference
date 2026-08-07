import type { Locale } from "@/lib/constants/locales";
import { isQuerySearchable } from "@/lib/search/query-guard";
import { searchDocuments, type SearchDocument } from "@/lib/search/matcher";
import type {
  SearchAllResult,
  SearchModule,
  SearchResultGroup,
  SearchResultItem,
  SearchSuggestion,
} from "@/lib/types/search";

const MODULE_ORDER: SearchModule[] = [
  "entries",
  "soundChange",
  "conjugation",
  "hanja",
  "idioms",
];

function groupByModule(items: SearchResultItem[]): SearchResultGroup[] {
  const grouped = new Map<SearchModule, SearchResultItem[]>();

  for (const item of items) {
    const list = grouped.get(item.module) ?? [];
    list.push(item);
    grouped.set(item.module, list);
  }

  return MODULE_ORDER.filter((module) => grouped.has(module)).map((module) => {
    const moduleItems = grouped.get(module)!;
    return {
      module,
      count: moduleItems.length,
      items: moduleItems,
    };
  });
}

export function runSearchAll(
  documents: SearchDocument[],
  rawQuery: string,
  locale: Locale
): SearchAllResult {
  const query = rawQuery.trim();

  if (!isQuerySearchable(query)) {
    return { query, groups: [], totalCount: 0 };
  }

  const items = searchDocuments(documents, query, locale);
  const groups = groupByModule(items);

  return {
    query,
    groups,
    totalCount: items.length,
  };
}

export function runSearchByModule(
  documents: SearchDocument[],
  rawQuery: string,
  locale: Locale,
  module: SearchModule
): SearchResultItem[] {
  const query = rawQuery.trim();
  if (!isQuerySearchable(query)) return [];

  return searchDocuments(documents, query, locale).filter(
    (item) => item.module === module
  );
}

export function runSearchSuggestions(
  documents: SearchDocument[],
  rawQuery: string,
  locale: Locale,
  limit = 8
): SearchSuggestion[] {
  const query = rawQuery.trim();
  if (!isQuerySearchable(query)) return [];

  return searchDocuments(documents, query, locale)
    .slice(0, limit)
    .map((item) => ({
      id: item.id,
      module: item.module,
      title: item.title,
      subtitle: item.subtitle,
      href: item.href,
      matchReason: item.matches[0]!.reason,
      matchedText: item.matches[0]!.matchedText,
      score: item.score,
    }));
}
