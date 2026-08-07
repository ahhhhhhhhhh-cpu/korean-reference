import type { IrregularType } from "@/lib/constants/irregular-type";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ConjugationResultBundle } from "@/lib/adapters/supabase/mappers/conjugation";

export async function loadConjugationResultBundles(): Promise<
  ConjugationResultBundle[]
> {
  const supabase = createSupabaseServerClient();

  const [
    { data: results, error: resultsError },
    { data: forms, error: formsError },
    { data: entries, error: entriesError },
    { data: rules, error: rulesError },
    { data: ruleTranslations, error: ruleTranslationsError },
    { data: steps, error: stepsError },
    { data: stepTranslations, error: stepTranslationsError },
  ] = await Promise.all([
    supabase.from("conjugation_results").select("*"),
    supabase.from("conjugation_forms").select("*"),
    supabase.from("entries").select("id, slug, headword, irregular_type"),
    supabase.from("conjugation_rules").select("*"),
    supabase.from("conjugation_rule_translations").select("*"),
    supabase.from("conjugation_result_steps").select("*"),
    supabase.from("conjugation_result_step_translations").select("*"),
  ]);

  const error =
    resultsError ??
    formsError ??
    entriesError ??
    rulesError ??
    ruleTranslationsError ??
    stepsError ??
    stepTranslationsError;

  if (error) {
    throw new Error(`Failed to load conjugation results: ${error.message}`);
  }

  const formsById = new Map((forms ?? []).map((row) => [row.id, row]));
  const entriesById = new Map((entries ?? []).map((row) => [row.id, row]));
  const rulesById = new Map((rules ?? []).map((row) => [row.id, row]));

  const ruleTranslationsByRule = new Map<
    string,
    NonNullable<typeof ruleTranslations>
  >();
  for (const row of ruleTranslations ?? []) {
    const bucket = ruleTranslationsByRule.get(row.rule_id) ?? [];
    bucket.push(row);
    ruleTranslationsByRule.set(row.rule_id, bucket);
  }

  const stepsByResult = new Map<string, NonNullable<typeof steps>>();
  for (const row of steps ?? []) {
    const bucket = stepsByResult.get(row.result_id) ?? [];
    bucket.push(row);
    stepsByResult.set(row.result_id, bucket);
  }

  return (results ?? []).map((result) => {
    const entry = entriesById.get(result.entry_id);
    const form = formsById.get(result.form_id);
    const rule = result.rule_id ? rulesById.get(result.rule_id) ?? null : null;

    if (!form) {
      throw new Error(`Missing conjugation form for result ${result.id}`);
    }

    return {
      result,
      form,
      entrySlug: entry?.slug ?? result.entry_id,
      entryHeadword: entry?.headword ?? entry?.slug ?? result.entry_id,
      entryIrregularType:
        (entry?.irregular_type as IrregularType | null) ?? null,
      rule,
      ruleTranslations: rule
        ? ruleTranslationsByRule.get(rule.id) ?? []
        : [],
      steps: stepsByResult.get(result.id) ?? [],
      stepTranslations: stepTranslations ?? [],
    };
  });
}

export async function loadConjugationExamplesByEntry(entryId: string) {
  const supabase = createSupabaseServerClient();

  const [{ data: links, error: linksError }, { data: examples, error: examplesError }, { data: translations, error: translationsError }] =
    await Promise.all([
      supabase
        .from("entry_examples")
        .select("example_id, display_order")
        .eq("entry_id", entryId),
      supabase.from("examples").select("*"),
      supabase.from("example_translations").select("*"),
    ]);

  const error = linksError ?? examplesError ?? translationsError;
  if (error) {
    throw new Error(`Failed to load conjugation examples: ${error.message}`);
  }

  const examplesById = new Map((examples ?? []).map((row) => [row.id, row]));
  const translationsByExample = new Map<
    string,
    NonNullable<typeof translations>
  >();
  for (const row of translations ?? []) {
    const bucket = translationsByExample.get(row.example_id) ?? [];
    bucket.push(row);
    translationsByExample.set(row.example_id, bucket);
  }

  return (links ?? [])
    .map((link) => {
      const example = examplesById.get(link.example_id);
      if (!example) return null;
      return {
        displayOrder: link.display_order,
        example,
        translations: translationsByExample.get(link.example_id) ?? [],
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}
