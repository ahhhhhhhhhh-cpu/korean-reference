import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  EntryBundle,
  EntryExampleLink,
  EntrySenseBundle,
} from "@/lib/adapters/supabase/mappers/entries";

export async function loadEntryBundles(): Promise<EntryBundle[]> {
  const supabase = createSupabaseServerClient();

  const [
    { data: entries, error: entriesError },
    { data: senses, error: sensesError },
    { data: senseTranslations, error: senseTranslationsError },
    { data: entryTranslations, error: entryTranslationsError },
    { data: entryExamples, error: entryExamplesError },
    { data: exampleTranslations, error: exampleTranslationsError },
    { data: hanjaTerms, error: hanjaTermsError },
    { data: entrySoundChanges, error: entrySoundChangesError },
    { data: entryRelations, error: entryRelationsError },
    { data: relatedEntries, error: relatedEntriesError },
    { data: examples, error: examplesError },
  ] = await Promise.all([
    supabase.from("entries").select("*").order("headword"),
    supabase.from("senses").select("*"),
    supabase.from("sense_translations").select("*"),
    supabase.from("entry_translations").select("*"),
    supabase.from("entry_examples").select("*"),
    supabase.from("example_translations").select("*"),
    supabase.from("hanja_terms").select("entry_id, korean_hanja, is_primary"),
    supabase.from("entry_sound_changes").select("entry_id, rule_id"),
    supabase.from("entry_relations").select("source_entry_id, target_entry_id"),
    supabase.from("entries").select("id, slug"),
    supabase.from("examples").select("*"),
  ]);

  const error =
    entriesError ??
    sensesError ??
    senseTranslationsError ??
    entryTranslationsError ??
    entryExamplesError ??
    exampleTranslationsError ??
    hanjaTermsError ??
    entrySoundChangesError ??
    entryRelationsError ??
    relatedEntriesError ??
    examplesError;

  if (error) {
    throw new Error(`Failed to load entries: ${error.message}`);
  }

  const examplesById = new Map((examples ?? []).map((row) => [row.id, row]));
  const exampleTranslationsByExample = new Map<string, typeof exampleTranslations>();
  for (const row of exampleTranslations ?? []) {
    const bucket = exampleTranslationsByExample.get(row.example_id) ?? [];
    bucket.push(row);
    exampleTranslationsByExample.set(row.example_id, bucket);
  }

  const examplesByEntry = new Map<string, EntryExampleLink[]>();
  for (const link of entryExamples ?? []) {
    const example = examplesById.get(link.example_id);
    if (!example) continue;
    const bucket = examplesByEntry.get(link.entry_id) ?? [];
    bucket.push({
      entryId: link.entry_id,
      senseId: link.sense_id,
      displayOrder: link.display_order,
      example,
      exampleTranslations: exampleTranslationsByExample.get(link.example_id) ?? [],
    });
    examplesByEntry.set(link.entry_id, bucket);
  }

  const primaryHanjaByEntry = new Map<string, string>();
  for (const term of hanjaTerms ?? []) {
    if (term.is_primary) {
      primaryHanjaByEntry.set(term.entry_id, term.korean_hanja);
    }
  }

  const soundRulesByEntry = new Map<string, string[]>();
  for (const row of entrySoundChanges ?? []) {
    const bucket = soundRulesByEntry.get(row.entry_id) ?? [];
    bucket.push(row.rule_id);
    soundRulesByEntry.set(row.entry_id, bucket);
  }

  const slugById = new Map((relatedEntries ?? []).map((row) => [row.id, row.slug]));
  const relatedSlugsByEntry = new Map<string, string[]>();
  for (const row of entryRelations ?? []) {
    const slug = slugById.get(row.target_entry_id);
    if (!slug) continue;
    const bucket = relatedSlugsByEntry.get(row.source_entry_id) ?? [];
    bucket.push(slug);
    relatedSlugsByEntry.set(row.source_entry_id, bucket);
  }

  const senseTranslationsBySense = new Map<string, typeof senseTranslations>();
  for (const row of senseTranslations ?? []) {
    const bucket = senseTranslationsBySense.get(row.sense_id) ?? [];
    bucket.push(row);
    senseTranslationsBySense.set(row.sense_id, bucket);
  }

  const publishedSensesByEntry = new Map<string, EntrySenseBundle[]>();
  for (const sense of senses ?? []) {
    if (sense.status !== "published") continue;
    const bucket = publishedSensesByEntry.get(sense.entry_id) ?? [];
    bucket.push({
      sense,
      translations: senseTranslationsBySense.get(sense.id) ?? [],
    });
    publishedSensesByEntry.set(sense.entry_id, bucket);
  }

  for (const senseList of publishedSensesByEntry.values()) {
    senseList.sort((a, b) => a.sense.sense_order - b.sense.sense_order);
  }

  const entryTranslationsByEntry = new Map<string, typeof entryTranslations>();
  for (const row of entryTranslations ?? []) {
    const bucket = entryTranslationsByEntry.get(row.entry_id) ?? [];
    bucket.push(row);
    entryTranslationsByEntry.set(row.entry_id, bucket);
  }

  return (entries ?? []).map((entry) => ({
    entry,
    senses: publishedSensesByEntry.get(entry.id) ?? [],
    entryTranslations: entryTranslationsByEntry.get(entry.id) ?? [],
    examples: examplesByEntry.get(entry.id) ?? [],
    hanjaText: primaryHanjaByEntry.get(entry.id) ?? null,
    soundChangeRuleIds: soundRulesByEntry.get(entry.id) ?? [],
    relatedEntrySlugs: relatedSlugsByEntry.get(entry.id) ?? [],
  }));
}

export async function loadEntryBundleBySlug(
  slug: string
): Promise<EntryBundle | null> {
  const bundles = await loadEntryBundles();
  return bundles.find((bundle) => bundle.entry.slug === slug) ?? null;
}
