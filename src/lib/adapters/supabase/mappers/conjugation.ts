import type { Locale } from "@/lib/constants/locales";
import type { ConjugationFormKey } from "@/lib/constants/conjugation-forms";
import { isConjugationFormKey } from "@/lib/constants/conjugation-forms";
import type { IrregularType } from "@/lib/constants/irregular-type";
import type { PublicationStatus } from "@/lib/constants/publication-status";
import type { Database } from "@/lib/supabase/types";
import {
  filterPublishedTranslationRows,
  pickLocalized,
} from "@/lib/adapters/supabase/mappers/translations";
import type {
  ConjugationLookupDetail,
  ConjugationResultDetail,
  ConjugationResultSummary,
  ConjugationStep,
} from "@/lib/types/conjugation";
import type { ExampleDetail } from "@/lib/types/example";

type ResultRow = Database["public"]["Tables"]["conjugation_results"]["Row"];
type FormRow = Database["public"]["Tables"]["conjugation_forms"]["Row"];
type RuleRow = Database["public"]["Tables"]["conjugation_rules"]["Row"];
type RuleTranslationRow =
  Database["public"]["Tables"]["conjugation_rule_translations"]["Row"];
type StepRow = Database["public"]["Tables"]["conjugation_result_steps"]["Row"];
type StepTranslationRow =
  Database["public"]["Tables"]["conjugation_result_step_translations"]["Row"];
type ExampleRow = Database["public"]["Tables"]["examples"]["Row"];
type ExampleTranslationRow =
  Database["public"]["Tables"]["example_translations"]["Row"];

export type ConjugationResultBundle = {
  result: ResultRow;
  form: FormRow;
  entrySlug: string;
  entryHeadword: string;
  entryIrregularType: IrregularType | null;
  rule: RuleRow | null;
  ruleTranslations: RuleTranslationRow[];
  steps: StepRow[];
  stepTranslations: StepTranslationRow[];
};

export function mapConjugationTargetForm(form: FormRow): ConjugationFormKey {
  if (isConjugationFormKey(form.code)) return form.code;
  return "present_polite";
}

export function mapConjugationResultSummary(
  bundle: ConjugationResultBundle
): ConjugationResultSummary {
  const { result } = bundle;
  return {
    id: result.id,
    entrySlug: bundle.entrySlug,
    targetForm: mapConjugationTargetForm(bundle.form),
    resultKo: result.result,
    isIrregular: result.is_irregular,
    entryHeadword: bundle.entryHeadword,
  };
}

function mapSteps(bundle: ConjugationResultBundle, locale: Locale): ConjugationStep[] {
  const { steps, stepTranslations } = bundle;

  return steps
    .sort((a, b) => a.step_order - b.step_order)
    .map((step) => {
      const translations = filterPublishedTranslationRows(
        stepTranslations.filter((row) => row.step_id === step.id)
      );

      return {
        order: step.step_order,
        description: pickLocalized(translations, locale, (row) => row.description),
      };
    });
}

export function mapConjugationResultDetail(
  bundle: ConjugationResultBundle,
  locale: Locale
): ConjugationResultDetail {
  const { result, rule, ruleTranslations } = bundle;
  const publishedRuleTranslations = rule
    ? filterPublishedTranslationRows(ruleTranslations)
    : [];

  return {
    id: result.id,
    entryId: result.entry_id,
    entrySlug: bundle.entrySlug,
    conjugationRuleId: result.rule_id,
    targetForm: mapConjugationTargetForm(bundle.form),
    resultKo: result.result,
    stemKo: result.stem_used ?? "",
    isIrregular: result.is_irregular,
    irregularNote: result.irregular_type,
    status: result.status as PublicationStatus,
    createdAt: result.created_at,
    updatedAt: result.updated_at,
    publishedAt: result.published_at,
    entryHeadword: bundle.entryHeadword,
    irregularType: bundle.entryIrregularType,
    steps: mapSteps(bundle, locale),
    ruleTitle: rule
      ? pickLocalized(publishedRuleTranslations, locale, (row) => row.title)
      : {
          requestedLocale: locale,
          resolvedLocale: null,
          value: null,
          usedFallback: false,
        },
  };
}

export function mapConjugationLookupDetail(
  bundle: ConjugationResultBundle,
  locale: Locale,
  examples: Array<{
    example: ExampleRow;
    translations: ExampleTranslationRow[];
    displayOrder: number;
  }>
): ConjugationLookupDetail {
  const exampleDetails: ExampleDetail[] = examples
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(({ example, translations, displayOrder }) => {
      const published = filterPublishedTranslationRows(translations);
      return {
        id: example.id,
        entryId: bundle.result.entry_id,
        idiomId: null,
        soundChangeRuleId: null,
        sentenceKo: example.korean_text,
        sortOrder: displayOrder,
        status: example.status as PublicationStatus,
        createdAt: example.created_at,
        updatedAt: example.updated_at,
        publishedAt: example.published_at,
        translation: pickLocalized(published, locale, (row) => row.translation),
      };
    });

  return {
    ...mapConjugationResultDetail(bundle, locale),
    examples: exampleDetails,
  };
}

export function mapConjugationRuleNameKo(rule: RuleRow): string {
  return rule.rule_code;
}
