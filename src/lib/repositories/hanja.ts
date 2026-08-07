import type { Locale } from "@/lib/constants/locales";
import { getHanjaAdapter } from "@/lib/adapters";
import type { HanjaEntryDetail, HanjaEntrySummary } from "@/lib/types/hanja";
import type { HanjaFilterOptions, HanjaFilters } from "@/lib/types/module-filters";

export async function listHanjaFilters(): Promise<HanjaFilterOptions> {
  return getHanjaAdapter().listFilters();
}

export async function searchHanjaWithinModule(
  filters: HanjaFilters,
  locale: Locale
): Promise<HanjaEntrySummary[]> {
  return getHanjaAdapter().searchWithinModule(filters, locale);
}

export async function listHanjaEntries(locale: Locale): Promise<HanjaEntrySummary[]> {
  return getHanjaAdapter().listEntries(locale);
}

export async function getHanjaEntryBySlug(
  slug: string,
  locale: Locale
): Promise<HanjaEntryDetail | null> {
  return getHanjaAdapter().getBySlug(slug, locale);
}

export async function listHanjaByCharacter(
  character: string,
  locale: Locale
): Promise<HanjaEntrySummary[]> {
  return getHanjaAdapter().listByCharacter(character, locale);
}
