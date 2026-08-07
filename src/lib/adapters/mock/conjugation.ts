import type { Locale } from "@/lib/constants/locales";
import {
  mockConjugationResults,
  mockConjugationRules,
  mockConjugationRuleTranslations,
  mockEntries,
  mockExampleTranslations,
  mockExamples,
} from "@/data/mock";
import type { MockConjugationStep } from "@/data/mock/conjugation";
import { filterPublished } from "@/lib/adapters/mock/filter";
import { localize, translationsByLocale } from "@/lib/i18n/localize";
import { matchesModuleTextQuery } from "@/lib/search/module-text-match";
import type {
  ConjugationFormKey,
  ConjugationLookupDetail,
  ConjugationResultDetail,
  ConjugationResultSummary,
  ConjugationStep,
} from "@/lib/types/conjugation";
import type {
  ConjugationCriteria,
  ConjugationModuleOptions,
} from "@/lib/types/module-filters";
import type { ExampleDetail } from "@/lib/types/example";

function mapSteps(steps: MockConjugationStep[], locale: Locale): ConjugationStep[] {
  return steps
    .sort((a, b) => a.order - b.order)
    .map((step) => ({
      order: step.order,
      description: localize(step.descriptions, locale),
    }));
}

function mapExamples(entryId: string, locale: Locale): ExampleDetail[] {
  return mockExamples
    .filter((item) => item.entryId === entryId && item.status === "published")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((example) => {
      const translations = mockExampleTranslations.filter(
        (item) => item.exampleId === example.id
      );
      return {
        ...example,
        translation: localize(
          translationsByLocale(translations, (item) => item.translation),
          locale
        ),
      };
    });
}

function mapSummary(
  result: (typeof mockConjugationResults)[number]
): ConjugationResultSummary {
  const entry = mockEntries.find((item) => item.id === result.entryId);

  return {
    id: result.id,
    entrySlug: result.entrySlug,
    targetForm: result.targetForm,
    resultKo: result.resultKo,
    isIrregular: result.isIrregular,
    entryHeadword: entry?.headwordKo ?? result.entrySlug,
  };
}

function mapDetail(
  result: (typeof mockConjugationResults)[number],
  locale: Locale
): ConjugationResultDetail {
  const entry = mockEntries.find((item) => item.id === result.entryId);
  const rule = result.conjugationRuleId
    ? mockConjugationRules.find((item) => item.id === result.conjugationRuleId)
    : null;

  const ruleTranslations = rule
    ? mockConjugationRuleTranslations.filter(
        (item) => item.conjugationRuleId === rule.id
      )
    : [];

  return {
    ...result,
    entryHeadword: entry?.headwordKo ?? result.entrySlug,
    irregularType: entry?.irregularType ?? null,
    steps: mapSteps(result.steps, locale),
    ruleTitle: rule
      ? localize(
          translationsByLocale(ruleTranslations, (item) => item.title),
          locale
        )
      : {
          requestedLocale: locale,
          resolvedLocale: null,
          value: null,
          usedFallback: false,
        },
  };
}

function mapLookupDetail(
  result: (typeof mockConjugationResults)[number],
  locale: Locale
): ConjugationLookupDetail {
  return {
    ...mapDetail(result, locale),
    examples: mapExamples(result.entryId, locale),
  };
}

export const mockConjugationAdapter = {
  listResults(): ConjugationResultSummary[] {
    return filterPublished(mockConjugationResults).map((result) =>
      mapSummary(result)
    );
  },

  listOptions(locale: Locale, entrySlug?: string): ConjugationModuleOptions {
    void locale;
    const published = filterPublished(mockConjugationResults);
    const entrySlugs = [
      ...new Set(published.map((result) => result.entrySlug)),
    ].sort((a, b) => a.localeCompare(b, "ko"));

    const entries = entrySlugs
      .map((slug) => mockEntries.find((item) => item.slug === slug))
      .filter(
        (entry): entry is (typeof mockEntries)[number] =>
          Boolean(entry && entry.status === "published")
      )
      .map((entry) => ({
        slug: entry.slug,
        headwordKo: entry.headwordKo,
        romanization: entry.romanization ?? null,
        partOfSpeech: entry.partOfSpeech,
      }));

    const formsByEntry: ConjugationModuleOptions["formsByEntry"] = {};

    for (const slug of entrySlugs) {
      const forms = published
        .filter((result) => result.entrySlug === slug)
        .map((result) => result.targetForm);
      const uniqueForms = [...new Set(forms)] as ConjugationFormKey[];
      formsByEntry[slug] = uniqueForms.map((targetForm) => ({
        targetForm,
        available: true,
      }));
    }

    if (entrySlug && !formsByEntry[entrySlug]) {
      return { entries, formsByEntry };
    }

    return { entries, formsByEntry };
  },

  findResult(
    criteria: ConjugationCriteria,
    locale: Locale
  ): ConjugationLookupDetail | null {
    if (!criteria.entrySlug || !criteria.form) return null;

    const result = filterPublished(mockConjugationResults).find(
      (item) =>
        item.entrySlug === criteria.entrySlug &&
        item.targetForm === criteria.form
    );

    if (!result) return null;
    return mapLookupDetail(result, locale);
  },

  getById(id: string, locale: Locale): ConjugationResultDetail | null {
    const result = mockConjugationResults.find((item) => item.id === id);
    if (!result || result.status !== "published") return null;
    return mapDetail(result, locale);
  },

  listByEntrySlug(entrySlug: string, locale: Locale): ConjugationResultDetail[] {
    return filterPublished(mockConjugationResults)
      .filter((item) => item.entrySlug === entrySlug)
      .map((item) => mapDetail(item, locale));
  },

  searchWithinModule(query: string, locale: Locale): ConjugationResultSummary[] {
    void locale;
    if (!query.trim()) return this.listResults();

    return filterPublished(mockConjugationResults)
      .filter((result) => {
        const entry = mockEntries.find((item) => item.id === result.entryId);
        return matchesModuleTextQuery(query, [
          result.resultKo,
          result.entrySlug,
          entry?.headwordKo,
          entry?.romanization,
        ]);
      })
      .map((result) => mapSummary(result));
  },
};
