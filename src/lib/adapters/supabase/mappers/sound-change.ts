import type { Locale } from "@/lib/constants/locales";
import type { SoundChangeCategory } from "@/lib/constants/sound-change-categories";
import type { PublicationStatus } from "@/lib/constants/publication-status";
import type { Database } from "@/lib/supabase/types";
import { mapEntrySummary, type EntryBundle } from "@/lib/adapters/supabase/mappers/entries";
import {
  filterPublishedTranslationRows,
  pickLocalized,
  toLocale,
} from "@/lib/adapters/supabase/mappers/translations";
import { localize, translationsByLocale } from "@/lib/i18n/localize";
import type { EntrySummary } from "@/lib/types/entry";
import type {
  SoundChangeRuleDetail,
  SoundChangeRuleStep,
  SoundChangeRuleSummary,
} from "@/lib/types/sound-change";

type RuleRow = Database["public"]["Tables"]["sound_change_rules"]["Row"];
type TranslationRow =
  Database["public"]["Tables"]["sound_change_translations"]["Row"];
type StepRow = Database["public"]["Tables"]["sound_change_steps"]["Row"];
type StepTranslationRow =
  Database["public"]["Tables"]["sound_change_step_translations"]["Row"];

export type SoundChangeRuleBundle = {
  rule: RuleRow;
  translations: TranslationRow[];
  steps: StepRow[];
  stepTranslations: StepTranslationRow[];
  exampleEntryIds: string[];
  sortOrder: number;
};

function mapStep(
  step: StepRow,
  stepTranslations: StepTranslationRow[],
  locale: Locale
): SoundChangeRuleStep {
  const published = filterPublishedTranslationRows(stepTranslations).filter(
    (row) => row.step_id === step.id
  );
  const label =
    pickLocalized(published, locale, (row) => row.label ?? null).value ??
    published.find((row) => row.locale === "en")?.label ??
    null;

  return {
    id: step.id,
    soundChangeRuleId: step.rule_id,
    stepOrder: step.step_order,
    beforeText: step.before_form,
    afterText: step.after_form,
    label,
  };
}

export function mapSoundChangeRuleSummary(
  bundle: SoundChangeRuleBundle,
  locale: Locale
): SoundChangeRuleSummary {
  const { rule, translations } = bundle;
  const published = filterPublishedTranslationRows(translations);

  return {
    id: rule.id,
    slug: rule.slug,
    nameKo: rule.input_pattern ?? rule.slug,
    category: rule.category as SoundChangeCategory,
    difficulty: rule.difficulty,
    frequency: rule.frequency,
    title: pickLocalized(published, locale, (row) => row.name),
    summary: pickLocalized(
      published,
      locale,
      (row) => row.short_summary ?? ""
    ),
  };
}

export function mapSoundChangeRuleDetail(
  bundle: SoundChangeRuleBundle,
  locale: Locale,
  entryBundles: EntryBundle[],
  relatedSummaries: SoundChangeRuleSummary[]
): SoundChangeRuleDetail {
  const { rule, translations, steps, stepTranslations } = bundle;
  const published = filterPublishedTranslationRows(translations);

  const byLocale = (
    pick: (item: TranslationRow) => string | null | undefined
  ) =>
    translationsByLocale(
      published.flatMap((row) => {
        const resolved = toLocale(row.locale);
        return resolved ? [{ ...row, locale: resolved }] : [];
      }),
      pick
    );

  const exampleEntries = bundle.exampleEntryIds
    .map((entryId) => {
      const match = entryBundles.find((item) => item.entry.id === entryId);
      return match ? mapEntrySummary(match, locale) : null;
    })
    .filter((item): item is EntrySummary => item !== null);

  return {
    id: rule.id,
    slug: rule.slug,
    nameKo: rule.input_pattern ?? rule.slug,
    category: rule.category as SoundChangeCategory,
    difficulty: rule.difficulty,
    frequency: rule.frequency,
    sortOrder: bundle.sortOrder,
    status: rule.status as PublicationStatus,
    exampleWordIds: bundle.exampleEntryIds,
    createdAt: rule.created_at,
    updatedAt: rule.updated_at,
    publishedAt: rule.published_at,
    title: localize(byLocale((row) => row.name), locale),
    summary: localize(byLocale((row) => row.short_summary ?? ""), locale),
    explanation: localize(byLocale((row) => row.description ?? ""), locale),
    conditions: localize(byLocale((row) => row.conditions ?? ""), locale),
    exceptions: localize(byLocale((row) => row.exceptions ?? null), locale),
    steps: steps
      .sort((a, b) => a.step_order - b.step_order)
      .map((step) => mapStep(step, stepTranslations, locale)),
    exampleEntries,
    relatedRules: relatedSummaries,
  };
}
