import type { IdiomCategory } from "@/lib/constants/idiom-categories";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { IdiomBundle } from "@/lib/adapters/supabase/mappers/idioms";

export async function loadIdiomBundles(): Promise<IdiomBundle[]> {
  const supabase = createSupabaseServerClient();

  const [
    { data: idioms, error: idiomsError },
    { data: translations, error: translationsError },
    { data: categoryLinks, error: categoryLinksError },
    { data: idiomExamples, error: idiomExamplesError },
    { data: examples, error: examplesError },
    { data: exampleTranslations, error: exampleTranslationsError },
  ] = await Promise.all([
    supabase.from("idioms").select("*").order("expression"),
    supabase.from("idiom_translations").select("*"),
    supabase.from("idiom_category_links").select("*"),
    supabase.from("idiom_examples").select("*"),
    supabase.from("examples").select("*"),
    supabase.from("example_translations").select("*"),
  ]);

  const error =
    idiomsError ??
    translationsError ??
    categoryLinksError ??
    idiomExamplesError ??
    examplesError ??
    exampleTranslationsError;

  if (error) {
    throw new Error(`Failed to load idioms: ${error.message}`);
  }

  const translationsByIdiom = new Map<string, NonNullable<typeof translations>>();
  for (const row of translations ?? []) {
    const bucket = translationsByIdiom.get(row.idiom_id) ?? [];
    bucket.push(row);
    translationsByIdiom.set(row.idiom_id, bucket);
  }

  const categoriesByIdiom = new Map<string, IdiomCategory[]>();
  for (const row of categoryLinks ?? []) {
    const bucket = categoriesByIdiom.get(row.idiom_id) ?? [];
    bucket.push(row.category as IdiomCategory);
    categoriesByIdiom.set(row.idiom_id, bucket);
  }

  const examplesById = new Map((examples ?? []).map((row) => [row.id, row]));
  const exampleTranslationsByExample = new Map<
    string,
    NonNullable<typeof exampleTranslations>
  >();
  for (const row of exampleTranslations ?? []) {
    const bucket = exampleTranslationsByExample.get(row.example_id) ?? [];
    bucket.push(row);
    exampleTranslationsByExample.set(row.example_id, bucket);
  }

  const examplesByIdiom = new Map<string, IdiomBundle["examples"]>();
  for (const link of idiomExamples ?? []) {
    const example = examplesById.get(link.example_id);
    if (!example) continue;
    const bucket = examplesByIdiom.get(link.idiom_id) ?? [];
    bucket.push({
      displayOrder: link.display_order,
      example,
      exampleTranslations: exampleTranslationsByExample.get(link.example_id) ?? [],
    });
    examplesByIdiom.set(link.idiom_id, bucket);
  }

  return (idioms ?? []).map((idiom) => ({
    idiom,
    translations: translationsByIdiom.get(idiom.id) ?? [],
    categories: categoriesByIdiom.get(idiom.id) ?? [],
    examples: examplesByIdiom.get(idiom.id) ?? [],
  }));
}

export async function loadIdiomBundleBySlug(slug: string): Promise<IdiomBundle | null> {
  const bundles = await loadIdiomBundles();
  return bundles.find((bundle) => bundle.idiom.slug === slug) ?? null;
}
