import type { Locale } from "@/lib/constants/locales";
import { mapEntrySummary, type EntryBundle } from "@/lib/adapters/supabase/mappers/entries";
import { mapHanjaEntrySummary } from "@/lib/adapters/supabase/mappers/hanja";
import { mapIdiomSummary } from "@/lib/adapters/supabase/mappers/idioms";
import {
  mapSoundChangeRuleSummary,
  type SoundChangeRuleBundle,
} from "@/lib/adapters/supabase/mappers/sound-change";
import { filterPublishedTranslationRows } from "@/lib/adapters/supabase/mappers/translations";
import { loadConjugationResultBundles } from "@/lib/adapters/supabase/loaders/conjugation";
import { loadEntryBundles } from "@/lib/adapters/supabase/loaders/entries";
import { loadHanjaTermBundles } from "@/lib/adapters/supabase/loaders/hanja";
import { loadIdiomBundles } from "@/lib/adapters/supabase/loaders/idioms";
import { loadSoundChangeRuleBundles } from "@/lib/adapters/supabase/loaders/sound-change";
import type { SearchDocument, SearchField } from "@/lib/search/matcher";
import { romanizationFields } from "@/lib/search/romanization-fields";
import type { SearchModule } from "@/lib/types/search";

function definitionFields(
  translations: {
    locale: string;
    status: string;
    definition?: string | null;
    short_definition?: string | null;
  }[]
): SearchField[] {
  return filterPublishedTranslationRows(translations).flatMap((item) => {
    const value = item.short_definition ?? item.definition;
    if (!value) return [];
    return [
      {
        kind: "definition" as const,
        value,
        locale: item.locale as Locale,
      },
    ];
  });
}

function buildEntryDocuments(bundles: EntryBundle[]): SearchDocument[] {
  return bundles.map((bundle) => {
    const summary = mapEntrySummary(bundle, "en");
    const fields: SearchField[] = [
      { kind: "headword", value: bundle.entry.headword },
      { kind: "headword", value: bundle.entry.headword_normalized },
      ...romanizationFields({
        romanization: bundle.entry.romanization,
        romanizationAliases: bundle.entry.pronunciation_romanization
          ? [bundle.entry.pronunciation_romanization]
          : undefined,
      }),
      ...definitionFields(bundle.senses.flatMap((item) => item.translations)),
    ];

    if (bundle.hanjaText) {
      fields.push({ kind: "hanja", value: bundle.hanjaText });
    }

    return {
      id: bundle.entry.id,
      module: "entries",
      title: bundle.entry.headword,
      subtitle: summary.definition.value,
      href: `/entries/${bundle.entry.slug}`,
      fields,
    };
  });
}

function buildSoundChangeDocuments(bundles: SoundChangeRuleBundle[]): SearchDocument[] {
  return bundles.map((bundle) => {
    const summary = mapSoundChangeRuleSummary(bundle, "en");
    const published = filterPublishedTranslationRows(bundle.translations);

    const fields: SearchField[] = [
      { kind: "headword", value: bundle.rule.input_pattern ?? bundle.rule.slug },
      ...published.flatMap((item) => [
        { kind: "title" as const, value: item.name },
        { kind: "keyword" as const, value: item.short_summary ?? "" },
        ...(item.description
          ? [{ kind: "keyword" as const, value: item.description }]
          : []),
      ]),
    ];

    return {
      id: bundle.rule.id,
      module: "soundChange",
      title: bundle.rule.input_pattern ?? bundle.rule.slug,
      subtitle: summary.title.value,
      href: `/sound-change/${bundle.rule.slug}`,
      fields,
    };
  });
}

async function buildConjugationDocuments(): Promise<SearchDocument[]> {
  const bundles = await loadConjugationResultBundles();
  const entryBundles = await loadEntryBundles();
  const entriesById = new Map(entryBundles.map((bundle) => [bundle.entry.id, bundle]));

  return bundles.map((bundle) => {
    const entry = entriesById.get(bundle.result.entry_id);
    const fields: SearchField[] = [
      { kind: "conjugated_form", value: bundle.result.result },
    ];

    if (entry) {
      fields.push({ kind: "headword", value: entry.entry.headword });
      fields.push(
        ...romanizationFields({
          romanization: entry.entry.romanization,
          romanizationAliases: entry.entry.pronunciation_romanization
            ? [entry.entry.pronunciation_romanization]
            : undefined,
        })
      );
    }

    return {
      id: bundle.result.id,
      module: "conjugation",
      title: entry
        ? `${entry.entry.headword} → ${bundle.result.result}`
        : bundle.result.result,
      subtitle: bundle.form.code,
      href: entry ? `/entries/${entry.entry.slug}` : `/conjugation`,
      fields,
    };
  });
}

async function buildHanjaDocuments(): Promise<SearchDocument[]> {
  const bundles = await loadHanjaTermBundles();

  return bundles.map((bundle) => {
    const summary = mapHanjaEntrySummary(bundle, "en");
    const fields: SearchField[] = [
      {
        kind: "headword",
        value: bundle.entry?.headword ?? bundle.term.korean_hanja,
      },
      { kind: "hanja", value: bundle.term.korean_hanja },
      ...romanizationFields({
        romanization: bundle.entry?.romanization,
      }),
      ...bundle.characters.map((item) => ({
        kind: "hanja" as const,
        value: item.character.character,
      })),
      ...definitionFields(bundle.entrySenseTranslations),
    ];

    return {
      id: bundle.term.id,
      module: "hanja",
      title: `${bundle.entry?.headword ?? bundle.term.korean_hanja} · ${bundle.term.korean_hanja}`,
      subtitle: summary.definition.value,
      href: `/hanja/${bundle.term.slug}`,
      fields,
    };
  });
}

async function buildIdiomDocuments(): Promise<SearchDocument[]> {
  const bundles = await loadIdiomBundles();

  return bundles.map((bundle) => {
    const summary = mapIdiomSummary(bundle, "en");
    const published = filterPublishedTranslationRows(bundle.translations);

    const fields: SearchField[] = [
      { kind: "headword", value: bundle.idiom.expression },
      { kind: "headword", value: bundle.idiom.expression_normalized },
      ...published.flatMap((item) => [
        {
          kind: "definition" as const,
          value: item.literal_meaning ?? "",
          locale: item.locale as Locale,
        },
        {
          kind: "definition" as const,
          value: item.actual_meaning,
          locale: item.locale as Locale,
        },
      ]),
    ];

    return {
      id: bundle.idiom.id,
      module: "idioms",
      title: bundle.idiom.expression,
      subtitle: summary.actualMeaning.value,
      href: `/idioms/${bundle.idiom.slug}`,
      fields,
    };
  });
}

let cachedDocuments: SearchDocument[] | null = null;

export async function buildSupabaseSearchIndex(): Promise<SearchDocument[]> {
  if (cachedDocuments) return cachedDocuments;

  const [entryBundles, soundChangeBundles, conjugationDocs, hanjaDocs, idiomDocs] =
    await Promise.all([
      loadEntryBundles(),
      loadSoundChangeRuleBundles(),
      buildConjugationDocuments(),
      buildHanjaDocuments(),
      buildIdiomDocuments(),
    ]);

  cachedDocuments = [
    ...buildEntryDocuments(entryBundles),
    ...buildSoundChangeDocuments(soundChangeBundles),
    ...conjugationDocs,
    ...hanjaDocs,
    ...idiomDocs,
  ];

  return cachedDocuments;
}

/** Test helper — rebuild index after seed changes in tests. */
export function resetSupabaseSearchIndexCache(): void {
  cachedDocuments = null;
}

export async function getDocumentsByModule(
  module: SearchModule
): Promise<SearchDocument[]> {
  const documents = await buildSupabaseSearchIndex();
  return documents.filter((doc) => doc.module === module);
}
