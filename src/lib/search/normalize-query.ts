/** Normalize user input for consistent matching. */
export function normalizeQuery(raw: string): string {
  return raw.normalize("NFC").trim();
}

export function normalizeLatin(text: string): string {
  return text.normalize("NFC").trim().toLowerCase();
}

export function normalizeKorean(text: string): string {
  return text.normalize("NFC").trim();
}

/** Strip case and separators for stored romanization matching (RR). */
export function normalizeRomanization(text: string): string {
  return text
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/[\s\-''`]/g, "");
}
