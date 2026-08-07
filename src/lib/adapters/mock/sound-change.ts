import type { Locale } from "@/lib/constants/locales";
import {
  mockEntries,
  mockEntryTranslations,
  mockSoundChangeRules,
  mockSoundChangeRuleSteps,
  mockSoundChangeRuleTranslations,
} from "@/data/mock";
import { filterPublished, findPublishedBySlug } from "@/lib/adapters/mock/filter";
import {
  DIFFICULTY_TIERS,
  matchesDifficultyTier,
} from "@/lib/modules/difficulty-tier";
import { localize, translationsByLocale } from "@/lib/i18n/localize";
import { matchesModuleTextQuery } from "@/lib/search/module-text-match";
import type { EntrySummary } from "@/lib/types/entry";
import type {
  SoundChangeCategory,
  SoundChangeRuleDetail,
  SoundChangeRuleSummary,
} from "@/lib/types/sound-change";
import type {
  SoundChangeFilterOptions,
  SoundChangeFilters,
} from "@/lib/types/module-filters";

function mapEntrySummary(entryId: string, locale: Locale): EntrySummary | null {
  const entry = mockEntries.find((item) => item.id === entryId);
  if (!entry || entry.status !== "published") return null;

  const translations = mockEntryTranslations.filter(
    (item) => item.entryId === entry.id
  );

  return {
    id: entry.id,
    slug: entry.slug,
    headwordKo: entry.headwordKo,
    partOfSpeech: entry.partOfSpeech,
    pronunciation: entry.pronunciation,
    romanization: entry.romanization,
    irregularType: entry.irregularType,
    hanjaText: entry.hanjaText,
    definition: localize(
      translationsByLocale(translations, (item) => item.definition),
      locale
    ),
  };
}

function mapSummary(
  rule: (typeof mockSoundChangeRules)[number],
  locale: Locale
): SoundChangeRuleSummary {
  const translations = mockSoundChangeRuleTranslations.filter(
    (item) => item.soundChangeRuleId === rule.id
  );

  const byLocale = (pick: (item: (typeof translations)[number]) => string) =>
    translationsByLocale(translations, pick);

  return {
    id: rule.id,
    slug: rule.slug,
    nameKo: rule.nameKo,
    category: rule.category,
    difficulty: rule.difficulty,
    frequency: rule.frequency,
    title: localize(byLocale((item) => item.title), locale),
    summary: localize(byLocale((item) => item.summary), locale),
  };
}

function mapDetail(
  rule: (typeof mockSoundChangeRules)[number],
  locale: Locale
): SoundChangeRuleDetail {
  const translations = mockSoundChangeRuleTranslations.filter(
    (item) => item.soundChangeRuleId === rule.id
  );

  const byLocale = (
    pick: (item: (typeof translations)[number]) => string | null | undefined
  ) => translationsByLocale(translations, pick);

  const steps = mockSoundChangeRuleSteps
    .filter((item) => item.soundChangeRuleId === rule.id)
    .sort((a, b) => a.stepOrder - b.stepOrder);

  const exampleEntries = rule.exampleWordIds
    .map((id) => mapEntrySummary(id, locale))
    .filter((item): item is EntrySummary => item !== null);

  const relatedRules = filterPublished(mockSoundChangeRules)
    .filter(
      (item) => item.id !== rule.id && item.category === rule.category
    )
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => mapSummary(item, locale));

  return {
    ...rule,
    title: localize(byLocale((item) => item.title), locale),
    summary: localize(byLocale((item) => item.summary), locale),
    explanation: localize(byLocale((item) => item.explanation), locale),
    conditions: localize(byLocale((item) => item.conditions), locale),
    exceptions: localize(byLocale((item) => item.exceptions ?? null), locale),
    steps,
    exampleEntries,
    relatedRules,
  };
}

function applyFilters(
  rules: (typeof mockSoundChangeRules)[number][],
  filters: SoundChangeFilters
) {
  let filtered = rules;

  if (filters.category) {
    filtered = filtered.filter((rule) => rule.category === filters.category);
  }

  if (filters.difficulty) {
    filtered = filtered.filter((rule) =>
      matchesDifficultyTier(rule.difficulty, filters.difficulty!)
    );
  }

  if (filters.q?.trim()) {
    filtered = filtered.filter((rule) => {
      const translations = mockSoundChangeRuleTranslations.filter(
        (item) => item.soundChangeRuleId === rule.id
      );
      return matchesModuleTextQuery(filters.q, [
        rule.nameKo,
        ...translations.map((item) => item.title),
        ...translations.map((item) => item.summary),
      ]);
    });
  }

  return filtered;
}

export const mockSoundChangeAdapter = {
  listFilters(): SoundChangeFilterOptions {
    const published = filterPublished(mockSoundChangeRules);
    const categories = [
      ...new Set(published.map((rule) => rule.category)),
    ] as SoundChangeCategory[];

    const difficultyTiers = DIFFICULTY_TIERS.filter((tier) =>
      published.some((rule) => matchesDifficultyTier(rule.difficulty, tier))
    );

    return { categories, difficultyTiers };
  },

  filterRules(
    filters: SoundChangeFilters,
    locale: Locale
  ): SoundChangeRuleSummary[] {
    const rules = applyFilters(
      filterPublished(mockSoundChangeRules).sort(
        (a, b) => a.sortOrder - b.sortOrder
      ),
      filters
    );

    return rules.map((rule) => mapSummary(rule, locale));
  },

  listRules(
    locale: Locale,
    category?: SoundChangeCategory
  ): SoundChangeRuleSummary[] {
    return this.filterRules({ category }, locale);
  },

  getBySlug(slug: string, locale: Locale): SoundChangeRuleDetail | null {
    const rule = findPublishedBySlug(mockSoundChangeRules, slug);
    if (!rule) return null;
    return mapDetail(rule, locale);
  },
};
