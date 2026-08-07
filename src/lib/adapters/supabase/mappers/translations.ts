import type { Locale } from "@/lib/constants/locales";
import { isLocale } from "@/lib/constants/locales";
import { localize, translationsByLocale } from "@/lib/i18n/localize";
import type { LocalizedContent } from "@/lib/types/common";

export type TranslationRow = {
  locale: string;
  status: string;
};

export function isPublishedTranslationRow(row: { status: string }): boolean {
  return row.status === "published";
}

export function filterPublishedTranslationRows<T extends TranslationRow>(
  rows: T[]
): T[] {
  return rows.filter(isPublishedTranslationRow);
}

export function toLocale(value: string): Locale | null {
  return isLocale(value) ? value : null;
}

export function pickLocalized<T extends TranslationRow, V>(
  rows: T[],
  locale: Locale,
  pick: (item: T) => V
): LocalizedContent<V> {
  const published = filterPublishedTranslationRows(rows);
  const byLocale = translationsByLocale(
    published.flatMap((row) => {
      const resolved = toLocale(row.locale);
      return resolved ? [{ ...row, locale: resolved }] : [];
    }),
    pick
  );
  return localize(byLocale, locale);
}
