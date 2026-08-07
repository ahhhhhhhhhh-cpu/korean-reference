import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SoundChangeRuleBundle } from "@/lib/adapters/supabase/mappers/sound-change";

export async function loadSoundChangeRuleBundles(): Promise<SoundChangeRuleBundle[]> {
  const supabase = createSupabaseServerClient();

  const [
    { data: rules, error: rulesError },
    { data: translations, error: translationsError },
    { data: steps, error: stepsError },
    { data: stepTranslations, error: stepTranslationsError },
    { data: entryLinks, error: entryLinksError },
    { data: exampleLinks, error: exampleLinksError },
  ] = await Promise.all([
    supabase.from("sound_change_rules").select("*").order("slug"),
    supabase.from("sound_change_translations").select("*"),
    supabase.from("sound_change_steps").select("*"),
    supabase.from("sound_change_step_translations").select("*"),
    supabase.from("entry_sound_changes").select("rule_id, entry_id"),
    supabase.from("sound_change_examples").select("rule_id, example_id"),
  ]);

  const error =
    rulesError ??
    translationsError ??
    stepsError ??
    stepTranslationsError ??
    entryLinksError ??
    exampleLinksError;

  if (error) {
    throw new Error(`Failed to load sound change rules: ${error.message}`);
  }

  const translationsByRule = new Map<string, NonNullable<typeof translations>>();
  for (const row of translations ?? []) {
    const bucket = translationsByRule.get(row.rule_id) ?? [];
    bucket.push(row);
    translationsByRule.set(row.rule_id, bucket);
  }

  const stepsByRule = new Map<string, NonNullable<typeof steps>>();
  for (const row of steps ?? []) {
    const bucket = stepsByRule.get(row.rule_id) ?? [];
    bucket.push(row);
    stepsByRule.set(row.rule_id, bucket);
  }

  const exampleIdsByRule = new Map<string, Set<string>>();
  for (const row of entryLinks ?? []) {
    const bucket = exampleIdsByRule.get(row.rule_id) ?? new Set<string>();
    bucket.add(row.entry_id);
    exampleIdsByRule.set(row.rule_id, bucket);
  }

  const { data: exampleEntryLinks } = await supabase
    .from("entry_examples")
    .select("entry_id, example_id");

  const exampleToEntry = new Map(
    (exampleEntryLinks ?? []).map((row) => [row.example_id, row.entry_id])
  );

  for (const row of exampleLinks ?? []) {
    const entryId = exampleToEntry.get(row.example_id);
    if (!entryId) continue;
    const bucket = exampleIdsByRule.get(row.rule_id) ?? new Set<string>();
    bucket.add(entryId);
    exampleIdsByRule.set(row.rule_id, bucket);
  }

  return (rules ?? []).map((rule, index) => ({
    rule,
    translations: translationsByRule.get(rule.id) ?? [],
    steps: stepsByRule.get(rule.id) ?? [],
    stepTranslations: stepTranslations ?? [],
    exampleEntryIds: [...(exampleIdsByRule.get(rule.id) ?? [])],
    sortOrder: index + 1,
  }));
}

export async function loadSoundChangeRuleBundleBySlug(
  slug: string
): Promise<SoundChangeRuleBundle | null> {
  const bundles = await loadSoundChangeRuleBundles();
  return bundles.find((bundle) => bundle.rule.slug === slug) ?? null;
}
