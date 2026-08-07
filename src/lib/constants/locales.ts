export const locales = ["en", "zh", "ja"] as const;

export type Locale = (typeof locales)[number];

export type LocaleOption = {
  value: Locale;
  label: string;
};

/** Display names are fixed — not translated by UI locale. */
export const localeOptions: LocaleOption[] = [
  { value: "en", label: "English" },
  { value: "zh", label: "简体中文" },
  { value: "ja", label: "日本語" },
];

export const defaultLocale: Locale = "en";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
