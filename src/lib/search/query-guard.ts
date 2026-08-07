import { normalizeQuery } from "@/lib/search/normalize-query";

const HANGUL_RE = /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/;
const HANJA_RE = /[\u4E00-\u9FFF]/;

export function containsHangul(text: string): boolean {
  return HANGUL_RE.test(text);
}

export function containsHanja(text: string): boolean {
  return HANJA_RE.test(text);
}

/** Korean/Hanja: 1+ chars; Latin/CJK meanings: 2+ chars. */
export function isQuerySearchable(raw: string): boolean {
  const query = normalizeQuery(raw);
  if (!query) return false;
  if (containsHangul(query) || containsHanja(query)) return query.length >= 1;
  return query.length >= 2;
}

/** Autocomplete trigger thresholds (same as search). */
export function isQuerySuggestable(raw: string): boolean {
  return isQuerySearchable(raw);
}
