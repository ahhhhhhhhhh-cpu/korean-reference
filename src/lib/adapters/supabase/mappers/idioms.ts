import type { Locale } from "@/lib/constants/locales";
import type { IdiomCategory } from "@/lib/constants/idiom-categories";
import type { IdiomRegister } from "@/lib/constants/idiom-register";
import type { PublicationStatus } from "@/lib/constants/publication-status";
import type { Database } from "@/lib/supabase/types";
import {
  filterPublishedTranslationRows,
  pickLocalized,
  toLocale,
} from "@/lib/adapters/supabase/mappers/translations";
import { localize, translationsByLocale } from "@/lib/i18n/localize";
import type { ExampleDetail } from "@/lib/types/example";
import type { IdiomDetail, IdiomSummary } from "@/lib/types/idiom";

type IdiomRow = Database["public"]["Tables"]["idioms"]["Row"];
type TranslationRow = Database["public"]["Tables"]["idiom_translations"]["Row"];
type ExampleRow = Database["public"]["Tables"]["examples"]["Row"];
type ExampleTranslationRow =
  Database["public"]["Tables"]["example_translations"]["Row"];

export type IdiomBundle = {
  idiom: IdiomRow;
  translations: TranslationRow[];
  categories: IdiomCategory[];
  examples: Array<{
    displayOrder: number;
    example: ExampleRow;
    exampleTranslations: ExampleTranslationRow[];
  }>;
};

function mapExample(
  link: IdiomBundle["examples"][number],
  idiomId: string,
  locale: Locale
): ExampleDetail | null {
  if (link.example.status !== "published") return null;

  const translations = filterPublishedTranslationRows(link.exampleTranslations);

  return {
    id: link.example.id,
    entryId: null,
    idiomId,
    soundChangeRuleId: null,
    sentenceKo: link.example.korean_text,
    sortOrder: link.displayOrder,
    status: link.example.status as PublicationStatus,
    createdAt: link.example.created_at,
    updatedAt: link.example.updated_at,
    publishedAt: link.example.published_at,
    translation: pickLocalized(translations, locale, (row) => row.translation),
  };
}

export function mapIdiomSummary(bundle: IdiomBundle, locale: Locale): IdiomSummary {
  const { idiom, translations, categories } = bundle;
  const published = filterPublishedTranslationRows(translations);

  return {
    id: idiom.id,
    slug: idiom.slug,
    idiomKo: idiom.expression,
    register: idiom.register as IdiomRegister,
    categories,
    actualMeaning: pickLocalized(published, locale, (row) => row.actual_meaning),
  };
}

export function mapIdiomDetail(
  bundle: IdiomBundle,
  locale: Locale,
  relatedIdioms: IdiomSummary[]
): IdiomDetail {
  const { idiom, translations, categories, examples } = bundle;
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

  return {
    id: idiom.id,
    slug: idiom.slug,
    idiomKo: idiom.expression,
    idiomNormalized: idiom.expression_normalized,
    register: idiom.register as IdiomRegister,
    categories,
    status: idiom.status as PublicationStatus,
    createdAt: idiom.created_at,
    updatedAt: idiom.updated_at,
    publishedAt: idiom.published_at,
    literalMeaning: localize(
      byLocale((row) => row.literal_meaning ?? ""),
      locale
    ),
    actualMeaning: localize(byLocale((row) => row.actual_meaning), locale),
    explanation: localize(byLocale((row) => row.nuance_note ?? null), locale),
    usageContext: localize(byLocale((row) => row.usage_scenario ?? null), locale),
    commonMistakes: localize(byLocale((row) => row.common_misuse ?? null), locale),
    examples: examples
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((link) => mapExample(link, idiom.id, locale))
      .filter((item): item is ExampleDetail => item !== null),
    relatedIdioms,
  };
}
