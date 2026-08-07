import { containsHangul, containsHanja } from "@/lib/search/query-guard";
import {
  normalizeKorean,
  normalizeLatin,
  normalizeQuery,
  normalizeRomanization,
} from "@/lib/search/normalize-query";

/** Module-local text search — not cross-module. */
export function matchesModuleTextQuery(
  rawQuery: string | undefined,
  fields: (string | null | undefined)[]
): boolean {
  const query = normalizeQuery(rawQuery ?? "");
  if (!query) return true;

  const values = fields.filter((v): v is string => Boolean(v));
  if (values.length === 0) return false;

  const isKoreanOrHanja = containsHangul(query) || containsHanja(query);
  if (!isKoreanOrHanja && query.length < 2) return false;

  for (const field of values) {
    if (isKoreanOrHanja) {
      if (normalizeKorean(field).includes(normalizeKorean(query))) return true;
      if (normalizeQuery(field).includes(query)) return true;
    } else {
      if (normalizeRomanization(field).includes(normalizeRomanization(query))) {
        return true;
      }
      if (normalizeLatin(field).includes(normalizeLatin(query))) return true;
    }
  }

  return false;
}
