import type { Locale } from "@/lib/constants/locales";

export type LocalizedRecord<T> = Partial<Record<Locale, T | null | undefined>>;

export type ResolvedLocalized<T> = {
  content: T | null;
  requestedLocale: Locale;
  resolvedLocale: Locale | null;
  usedFallback: boolean;
};

function hasValue<T>(value: T | null | undefined): value is T {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

/**
 * Resolve knowledge content for a locale.
 * 1. Current locale if present
 * 2. English with explicit fallback flag
 * 3. null → show "content in progress"
 */
export function resolveLocalizedContent<T>(
  translations: LocalizedRecord<T>,
  locale: Locale
): ResolvedLocalized<T> {
  const current = translations[locale];
  if (hasValue(current)) {
    return {
      content: current,
      requestedLocale: locale,
      resolvedLocale: locale,
      usedFallback: false,
    };
  }

  if (locale !== "en") {
    const english = translations.en;
    if (hasValue(english)) {
      return {
        content: english,
        requestedLocale: locale,
        resolvedLocale: "en",
        usedFallback: true,
      };
    }
  }

  return {
    content: null,
    requestedLocale: locale,
    resolvedLocale: null,
    usedFallback: false,
  };
}
