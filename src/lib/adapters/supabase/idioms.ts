import type { Locale } from "@/lib/constants/locales";
import type { IdiomCategory } from "@/lib/constants/idiom-categories";
import type { IdiomRegister } from "@/lib/constants/idiom-register";
import {
  mapIdiomDetail,
  mapIdiomSummary,
} from "@/lib/adapters/supabase/mappers/idioms";
import {
  loadIdiomBundleBySlug,
  loadIdiomBundles,
} from "@/lib/adapters/supabase/loaders/idioms";
import { filterPublishedTranslationRows } from "@/lib/adapters/supabase/mappers/translations";
import { matchesModuleTextQuery } from "@/lib/search/module-text-match";
import type { IdiomDetail, IdiomSummary } from "@/lib/types/idiom";
import type { IdiomFilterOptions, IdiomFilters } from "@/lib/types/module-filters";

function applyFilters(
  bundles: Awaited<ReturnType<typeof loadIdiomBundles>>,
  filters: IdiomFilters
) {
  let filtered = bundles;

  if (filters.category) {
    filtered = filtered.filter((bundle) =>
      bundle.categories.includes(filters.category!)
    );
  }

  if (filters.register) {
    filtered = filtered.filter(
      (bundle) => bundle.idiom.register === filters.register
    );
  }

  if (filters.q?.trim()) {
    filtered = filtered.filter((bundle) => {
      const published = filterPublishedTranslationRows(bundle.translations);
      return matchesModuleTextQuery(filters.q, [
        bundle.idiom.expression,
        bundle.idiom.expression_normalized,
        ...published.flatMap((row) => [
          row.literal_meaning ?? "",
          row.actual_meaning,
        ]),
      ]);
    });
  }

  return filtered;
}

export const supabaseIdiomsAdapter = {
  async listFilters(): Promise<IdiomFilterOptions> {
    const bundles = await loadIdiomBundles();
    const categories = [
      ...new Set(bundles.flatMap((bundle) => bundle.categories)),
    ] as IdiomCategory[];
    const registers = [
      ...new Set(bundles.map((bundle) => bundle.idiom.register)),
    ].sort() as IdiomRegister[];

    return { categories, registers };
  },

  async filterIdioms(
    filters: IdiomFilters,
    locale: Locale
  ): Promise<IdiomSummary[]> {
    const bundles = applyFilters(
      (await loadIdiomBundles()).sort((a, b) =>
        a.idiom.expression.localeCompare(b.idiom.expression, "ko")
      ),
      filters
    );

    return bundles.map((bundle) => mapIdiomSummary(bundle, locale));
  },

  async listIdioms(
    locale: Locale,
    category?: IdiomCategory
  ): Promise<IdiomSummary[]> {
    return this.filterIdioms({ category }, locale);
  },

  async getBySlug(slug: string, locale: Locale): Promise<IdiomDetail | null> {
    const bundle = await loadIdiomBundleBySlug(slug);
    if (!bundle) return null;

    const allBundles = await loadIdiomBundles();
    const sharedCategories = new Set(bundle.categories);
    const relatedIdioms = allBundles
      .filter(
        (item) =>
          item.idiom.id !== bundle.idiom.id &&
          item.categories.some((category) => sharedCategories.has(category))
      )
      .slice(0, 4)
      .map((item) => mapIdiomSummary(item, locale));

    return mapIdiomDetail(bundle, locale, relatedIdioms);
  },
};
