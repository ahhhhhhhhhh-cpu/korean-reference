import type { Locale } from "@/lib/constants/locales";
import {
  resolveLocalizedContent,
  type LocalizedRecord,
} from "@/lib/i18n/locale-fallback";
import type { LocalizedContent } from "@/lib/types/common";

export type { LocalizedContent };

export function localize<T>(
  translations: LocalizedRecord<T>,
  locale: Locale
): LocalizedContent<T> {
  const resolved = resolveLocalizedContent(translations, locale);

  return {
    requestedLocale: resolved.requestedLocale,
    resolvedLocale: resolved.resolvedLocale,
    value: resolved.content,
    usedFallback: resolved.usedFallback,
  };
}

export function translationsByLocale<TItem extends { locale: Locale }, TValue>(
  items: TItem[],
  pick: (item: TItem) => TValue
): LocalizedRecord<TValue> {
  return items.reduce<LocalizedRecord<TValue>>((acc, item) => {
    acc[item.locale] = pick(item);
    return acc;
  }, {});
}
