import type { Locale } from "@/lib/constants/locales";
import {
  mockExampleTranslations,
  mockExamples,
  mockIdiomTranslations,
  mockIdioms,
} from "@/data/mock";
import { filterPublished, findPublishedBySlug } from "@/lib/adapters/mock/filter";
import { localize, translationsByLocale } from "@/lib/i18n/localize";
import { matchesModuleTextQuery } from "@/lib/search/module-text-match";
import type { ExampleDetail } from "@/lib/types/example";
import type { IdiomCategory, IdiomDetail, IdiomSummary } from "@/lib/types/idiom";
import type { IdiomFilterOptions, IdiomFilters } from "@/lib/types/module-filters";

function mapExample(exampleId: string, locale: Locale): ExampleDetail | null {
  const example = mockExamples.find((item) => item.id === exampleId);
  if (!example || example.status !== "published") return null;

  const translations = mockExampleTranslations.filter(
    (item) => item.exampleId === exampleId
  );

  return {
    ...example,
    translation: localize(
      translationsByLocale(translations, (item) => item.translation),
      locale
    ),
  };
}

function mapSummary(idiom: (typeof mockIdioms)[number], locale: Locale): IdiomSummary {
  const translations = mockIdiomTranslations.filter(
    (item) => item.idiomId === idiom.id
  );

  return {
    id: idiom.id,
    slug: idiom.slug,
    idiomKo: idiom.idiomKo,
    register: idiom.register,
    categories: idiom.categories,
    actualMeaning: localize(
      translationsByLocale(translations, (item) => item.actualMeaning),
      locale
    ),
  };
}

function mapDetail(idiom: (typeof mockIdioms)[number], locale: Locale): IdiomDetail {
  const translations = mockIdiomTranslations.filter(
    (item) => item.idiomId === idiom.id
  );

  const byLocale = (
    pick: (item: (typeof translations)[number]) => string | null | undefined
  ) => translationsByLocale(translations, pick);

  const examples = mockExamples
    .filter((item) => item.idiomId === idiom.id)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => mapExample(item.id, locale))
    .filter((item): item is ExampleDetail => item !== null);

  const sharedCategories = new Set(idiom.categories);
  const relatedIdioms = filterPublished(mockIdioms)
    .filter(
      (item) =>
        item.id !== idiom.id &&
        item.categories.some((category) => sharedCategories.has(category))
    )
    .slice(0, 4)
    .map((item) => mapSummary(item, locale));

  return {
    ...idiom,
    literalMeaning: localize(byLocale((item) => item.literalMeaning), locale),
    actualMeaning: localize(byLocale((item) => item.actualMeaning), locale),
    explanation: localize(byLocale((item) => item.explanation ?? null), locale),
    usageContext: localize(byLocale((item) => item.usageContext ?? null), locale),
    commonMistakes: localize(
      byLocale((item) => item.commonMistakes ?? null),
      locale
    ),
    examples,
    relatedIdioms,
  };
}

function applyFilters(idioms: (typeof mockIdioms)[number][], filters: IdiomFilters) {
  let filtered = idioms;

  if (filters.category) {
    filtered = filtered.filter((idiom) =>
      idiom.categories.includes(filters.category!)
    );
  }

  if (filters.register) {
    filtered = filtered.filter((idiom) => idiom.register === filters.register);
  }

  if (filters.q?.trim()) {
    filtered = filtered.filter((idiom) => {
      const translations = mockIdiomTranslations.filter(
        (item) => item.idiomId === idiom.id
      );
      return matchesModuleTextQuery(filters.q, [
        idiom.idiomKo,
        idiom.idiomNormalized,
        ...translations.flatMap((item) => [
          item.literalMeaning,
          item.actualMeaning,
        ]),
      ]);
    });
  }

  return filtered;
}

export const mockIdiomsAdapter = {
  listFilters(): IdiomFilterOptions {
    const published = filterPublished(mockIdioms);
    const categories = [
      ...new Set(published.flatMap((idiom) => idiom.categories)),
    ] as IdiomCategory[];
    const registers = [...new Set(published.map((idiom) => idiom.register))].sort();

    return { categories, registers };
  },

  filterIdioms(filters: IdiomFilters, locale: Locale): IdiomSummary[] {
    const idioms = applyFilters(
      filterPublished(mockIdioms).sort((a, b) =>
        a.idiomKo.localeCompare(b.idiomKo, "ko")
      ),
      filters
    );

    return idioms.map((idiom) => mapSummary(idiom, locale));
  },

  listIdioms(locale: Locale, category?: IdiomCategory): IdiomSummary[] {
    return this.filterIdioms({ category }, locale);
  },

  getBySlug(slug: string, locale: Locale): IdiomDetail | null {
    const idiom = findPublishedBySlug(mockIdioms, slug);
    if (!idiom) return null;
    return mapDetail(idiom, locale);
  },
};
