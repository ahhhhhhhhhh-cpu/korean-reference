import type { Locale } from "@/lib/constants/locales";
import {
  DIFFICULTY_TIERS,
  matchesDifficultyTier,
} from "@/lib/modules/difficulty-tier";
import {
  mapSoundChangeRuleDetail,
  mapSoundChangeRuleSummary,
} from "@/lib/adapters/supabase/mappers/sound-change";
import { loadEntryBundles } from "@/lib/adapters/supabase/loaders/entries";
import {
  loadSoundChangeRuleBundleBySlug,
  loadSoundChangeRuleBundles,
} from "@/lib/adapters/supabase/loaders/sound-change";
import { matchesModuleTextQuery } from "@/lib/search/module-text-match";
import { filterPublishedTranslationRows } from "@/lib/adapters/supabase/mappers/translations";
import type {
  SoundChangeCategory,
  SoundChangeRuleDetail,
  SoundChangeRuleSummary,
} from "@/lib/types/sound-change";
import type {
  SoundChangeFilterOptions,
  SoundChangeFilters,
} from "@/lib/types/module-filters";

function applyFilters(
  bundles: Awaited<ReturnType<typeof loadSoundChangeRuleBundles>>,
  filters: SoundChangeFilters
) {
  let filtered = bundles;

  if (filters.category) {
    filtered = filtered.filter(
      (bundle) => bundle.rule.category === filters.category
    );
  }

  if (filters.difficulty) {
    filtered = filtered.filter((bundle) =>
      matchesDifficultyTier(bundle.rule.difficulty, filters.difficulty!)
    );
  }

  if (filters.q?.trim()) {
    filtered = filtered.filter((bundle) => {
      const published = filterPublishedTranslationRows(bundle.translations);
      return matchesModuleTextQuery(filters.q, [
        bundle.rule.input_pattern ?? bundle.rule.slug,
        ...published.map((row) => row.name),
        ...published.map((row) => row.short_summary ?? ""),
      ]);
    });
  }

  return filtered;
}

export const supabaseSoundChangeAdapter = {
  async listFilters(): Promise<SoundChangeFilterOptions> {
    const bundles = await loadSoundChangeRuleBundles();
    const categories = [
      ...new Set(bundles.map((bundle) => bundle.rule.category)),
    ] as SoundChangeCategory[];

    const difficultyTiers = DIFFICULTY_TIERS.filter((tier) =>
      bundles.some((bundle) =>
        matchesDifficultyTier(bundle.rule.difficulty, tier)
      )
    );

    return { categories, difficultyTiers };
  },

  async filterRules(
    filters: SoundChangeFilters,
    locale: Locale
  ): Promise<SoundChangeRuleSummary[]> {
    const bundles = applyFilters(
      (await loadSoundChangeRuleBundles()).sort(
        (a, b) => a.sortOrder - b.sortOrder
      ),
      filters
    );

    return bundles.map((bundle) => mapSoundChangeRuleSummary(bundle, locale));
  },

  async listRules(
    locale: Locale,
    category?: SoundChangeCategory
  ): Promise<SoundChangeRuleSummary[]> {
    return this.filterRules({ category }, locale);
  },

  async getBySlug(
    slug: string,
    locale: Locale
  ): Promise<SoundChangeRuleDetail | null> {
    const bundle = await loadSoundChangeRuleBundleBySlug(slug);
    if (!bundle) return null;

    const allBundles = await loadSoundChangeRuleBundles();
    const entryBundles = await loadEntryBundles();
    const relatedSummaries = allBundles
      .filter(
        (item) =>
          item.rule.id !== bundle.rule.id &&
          item.rule.category === bundle.rule.category
      )
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => mapSoundChangeRuleSummary(item, locale));

    return mapSoundChangeRuleDetail(
      bundle,
      locale,
      entryBundles,
      relatedSummaries
    );
  },
};
