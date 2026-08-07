import type { Locale } from "@/lib/constants/locales";
import {
  mockConjugationResults,
  mockEntries,
  mockEntryTranslations,
  mockHanjaCharacters,
  mockHanjaEntries,
  mockHanjaEntryTranslations,
  mockIdiomTranslations,
  mockIdioms,
  mockSoundChangeRuleTranslations,
  mockSoundChangeRules,
} from "@/data/mock";
import { filterPublished } from "@/lib/adapters/mock/filter";
import type { SearchDocument, SearchField } from "@/lib/search/matcher";
import { romanizationFields } from "@/lib/search/romanization-fields";

function definitionFields(
  translations: { locale: Locale; definition: string }[]
): SearchField[] {
  return translations.map((item) => ({
    kind: "definition" as const,
    value: item.definition,
    locale: item.locale,
  }));
}

function buildEntryDocuments(): SearchDocument[] {
  return filterPublished(mockEntries).map((entry) => {
    const translations = mockEntryTranslations.filter(
      (item) => item.entryId === entry.id
    );

    const fields: SearchField[] = [
      { kind: "headword", value: entry.headwordKo },
      { kind: "headword", value: entry.headwordNormalized },
      ...romanizationFields(entry),
      ...definitionFields(translations),
    ];

    if (entry.hanjaText) {
      fields.push({ kind: "hanja", value: entry.hanjaText });
    }

    return {
      id: entry.id,
      module: "entries",
      title: entry.headwordKo,
      subtitle: translations.find((t) => t.locale === "en")?.definition ?? null,
      href: `/entries/${entry.slug}`,
      fields,
    };
  });
}

function buildSoundChangeDocuments(): SearchDocument[] {
  return filterPublished(mockSoundChangeRules).map((rule) => {
    const translations = mockSoundChangeRuleTranslations.filter(
      (item) => item.soundChangeRuleId === rule.id
    );

    const fields: SearchField[] = [
      { kind: "headword", value: rule.nameKo },
      ...translations.flatMap((item) => [
        { kind: "title" as const, value: item.title },
        { kind: "keyword" as const, value: item.summary },
        ...(item.explanation
          ? [{ kind: "keyword" as const, value: item.explanation }]
          : []),
      ]),
    ];

    return {
      id: rule.id,
      module: "soundChange",
      title: rule.nameKo,
      subtitle: translations.find((t) => t.locale === "en")?.title ?? null,
      href: `/sound-change/${rule.slug}`,
      fields,
    };
  });
}

function buildConjugationDocuments(): SearchDocument[] {
  return filterPublished(mockConjugationResults).map((result) => {
    const entry = mockEntries.find((item) => item.id === result.entryId);

    const fields: SearchField[] = [
      { kind: "conjugated_form", value: result.resultKo },
    ];

    if (entry && entry.status === "published") {
      fields.push({ kind: "headword", value: entry.headwordKo });
      fields.push(...romanizationFields(entry));
    }

    return {
      id: result.id,
      module: "conjugation",
      title: entry?.headwordKo
        ? `${entry.headwordKo} → ${result.resultKo}`
        : result.resultKo,
      subtitle: result.targetForm,
      href: entry ? `/entries/${entry.slug}` : `/conjugation`,
      fields,
    };
  });
}

function buildHanjaDocuments(): SearchDocument[] {
  return filterPublished(mockHanjaEntries).map((entry) => {
    const translations = mockHanjaEntryTranslations.filter(
      (item) => item.hanjaEntryId === entry.id
    );
    const characters = mockHanjaCharacters.filter(
      (item) => item.hanjaEntryId === entry.id
    );

    const fields: SearchField[] = [
      { kind: "headword", value: entry.wordKo },
      { kind: "hanja", value: entry.hanjaText },
      ...romanizationFields({
        romanization: entry.romanization ?? entry.pronunciation,
        romanizationAliases: entry.romanizationAliases,
      }),
      ...characters.map((item) => ({
        kind: "hanja" as const,
        value: item.character,
      })),
      ...definitionFields(translations),
    ];

    return {
      id: entry.id,
      module: "hanja",
      title: `${entry.wordKo} · ${entry.hanjaText}`,
      subtitle: translations.find((t) => t.locale === "en")?.definition ?? null,
      href: `/hanja/${entry.slug}`,
      fields,
    };
  });
}

function buildIdiomDocuments(): SearchDocument[] {
  return filterPublished(mockIdioms).map((idiom) => {
    const translations = mockIdiomTranslations.filter(
      (item) => item.idiomId === idiom.id
    );

    const fields: SearchField[] = [
      { kind: "headword", value: idiom.idiomKo },
      { kind: "headword", value: idiom.idiomNormalized },
      ...translations.flatMap((item) => [
        { kind: "definition" as const, value: item.literalMeaning, locale: item.locale },
        { kind: "definition" as const, value: item.actualMeaning, locale: item.locale },
      ]),
    ];

    return {
      id: idiom.id,
      module: "idioms",
      title: idiom.idiomKo,
      subtitle:
        translations.find((t) => t.locale === "en")?.actualMeaning ?? null,
      href: `/idioms/${idiom.slug}`,
      fields,
    };
  });
}

let cachedDocuments: SearchDocument[] | null = null;

export function buildMockSearchIndex(): SearchDocument[] {
  if (cachedDocuments) return cachedDocuments;

  cachedDocuments = [
    ...buildEntryDocuments(),
    ...buildSoundChangeDocuments(),
    ...buildConjugationDocuments(),
    ...buildHanjaDocuments(),
    ...buildIdiomDocuments(),
  ];

  return cachedDocuments;
}

/** Test helper — rebuild index after seed changes in tests. */
export function resetMockSearchIndexCache(): void {
  cachedDocuments = null;
}

export function getDocumentsByModule(
  module: import("@/lib/types/search").SearchModule
): SearchDocument[] {
  return buildMockSearchIndex().filter((doc) => doc.module === module);
}
