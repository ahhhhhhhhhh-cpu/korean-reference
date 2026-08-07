import type { Locale } from "@/lib/constants/locales";
import { getEntriesAdapter } from "@/lib/adapters";
import type { EntryDetail, EntrySummary } from "@/lib/types/entry";

export async function listEntrySummaries(locale: Locale): Promise<EntrySummary[]> {
  return getEntriesAdapter().listSummaries(locale);
}

export async function listFeaturedEntries(
  locale: Locale,
  limit = 6
): Promise<EntrySummary[]> {
  return getEntriesAdapter().listFeatured(locale, limit);
}

export async function getEntryBySlug(
  slug: string,
  locale: Locale
): Promise<EntryDetail | null> {
  return getEntriesAdapter().getBySlug(slug, locale);
}
