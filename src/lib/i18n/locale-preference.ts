export const LOCALE_PREFERENCE_KEY = "kr-locale-preference";

export function saveLocalePreference(locale: string) {
  try {
    localStorage.setItem(LOCALE_PREFERENCE_KEY, locale);
  } catch {
    // Ignore storage errors (private mode, etc.)
  }
}

export function readLocalePreference(): string | null {
  try {
    return localStorage.getItem(LOCALE_PREFERENCE_KEY);
  } catch {
    return null;
  }
}
