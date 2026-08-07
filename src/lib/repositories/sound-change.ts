import type { Locale } from "@/lib/constants/locales";
import { getSoundChangeAdapter } from "@/lib/adapters";
import type {
  SoundChangeFilterOptions,
  SoundChangeFilters,
} from "@/lib/types/module-filters";
import type {
  SoundChangeCategory,
  SoundChangeRuleDetail,
  SoundChangeRuleSummary,
} from "@/lib/types/sound-change";

export async function listSoundChangeFilters(): Promise<SoundChangeFilterOptions> {
  return getSoundChangeAdapter().listFilters();
}

export async function filterSoundChangeRules(
  filters: SoundChangeFilters,
  locale: Locale
): Promise<SoundChangeRuleSummary[]> {
  return getSoundChangeAdapter().filterRules(filters, locale);
}

export async function listSoundChangeRules(
  locale: Locale,
  category?: SoundChangeCategory
): Promise<SoundChangeRuleSummary[]> {
  return getSoundChangeAdapter().listRules(locale, category);
}

export async function getSoundChangeRuleBySlug(
  slug: string,
  locale: Locale
): Promise<SoundChangeRuleDetail | null> {
  return getSoundChangeAdapter().getBySlug(slug, locale);
}
