import type { Locale } from "@/lib/constants/locales";
import { getIdiomsAdapter } from "@/lib/adapters";
import type { IdiomCategory, IdiomDetail, IdiomSummary } from "@/lib/types/idiom";
import type { IdiomFilterOptions, IdiomFilters } from "@/lib/types/module-filters";

export async function listIdiomFilters(): Promise<IdiomFilterOptions> {
  return getIdiomsAdapter().listFilters();
}

export async function filterIdioms(
  filters: IdiomFilters,
  locale: Locale
): Promise<IdiomSummary[]> {
  return getIdiomsAdapter().filterIdioms(filters, locale);
}

export async function listIdioms(
  locale: Locale,
  category?: IdiomCategory
): Promise<IdiomSummary[]> {
  return getIdiomsAdapter().listIdioms(locale, category);
}

export async function getIdiomBySlug(
  slug: string,
  locale: Locale
): Promise<IdiomDetail | null> {
  return getIdiomsAdapter().getBySlug(slug, locale);
}

export async function listIdiomCategories(): Promise<IdiomCategory[]> {
  const filters = await listIdiomFilters();
  return filters.categories;
}
