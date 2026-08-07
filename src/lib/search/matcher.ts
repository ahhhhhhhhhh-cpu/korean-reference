import type { Locale } from "@/lib/constants/locales";
import {
  normalizeKorean,
  normalizeLatin,
  normalizeQuery,
  normalizeRomanization,
} from "@/lib/search/normalize-query";
import { scoreForReason } from "@/lib/search/scoring";
import type { SearchMatch, SearchMatchReason } from "@/lib/types/search";

export type SearchFieldKind =
  | "headword"
  | "hanja"
  | "definition"
  | "conjugated_form"
  | "title"
  | "keyword"
  | "romanization"
  | "romanization_alias";

export type SearchField = {
  kind: SearchFieldKind;
  value: string;
  locale?: Locale;
};

export type SearchDocument = {
  id: string;
  module: import("@/lib/types/search").SearchModule;
  title: string;
  subtitle?: string | null;
  href: string;
  fields: SearchField[];
};

type MatchCandidate = {
  reason: SearchMatchReason;
  matchedText: string;
  locale?: Locale;
};

function matchKoreanText(
  query: string,
  text: string
): MatchCandidate | null {
  const q = normalizeKorean(query);
  const t = normalizeKorean(text);
  if (!q || !t) return null;

  if (t === q) {
    return { reason: "headword_exact", matchedText: text };
  }
  if (t.startsWith(q)) {
    return { reason: "headword_prefix", matchedText: text };
  }
  if (t.includes(q)) {
    return { reason: "headword_partial", matchedText: text };
  }
  return null;
}

function matchHanjaText(query: string, text: string): MatchCandidate | null {
  const q = normalizeQuery(query);
  const t = normalizeQuery(text);
  if (!q || !t) return null;

  if (t === q) {
    return { reason: "hanja_exact", matchedText: text };
  }
  if (t.includes(q)) {
    return { reason: "hanja_partial", matchedText: text };
  }
  return null;
}

function matchDefinitionText(
  query: string,
  text: string,
  locale: Locale,
  currentLocale: Locale
): MatchCandidate | null {
  const q = normalizeLatin(query);
  const t = normalizeLatin(text);
  if (!q || !t) return null;

  const isCurrent = locale === currentLocale;

  if (t === q) {
    return {
      reason: isCurrent ? "definition_current_exact" : "definition_other_exact",
      matchedText: text,
      locale,
    };
  }
  if (t.includes(q)) {
    return {
      reason: isCurrent
        ? "definition_current_partial"
        : "definition_other_partial",
      matchedText: text,
      locale,
    };
  }
  return null;
}

function matchTitleText(query: string, text: string): MatchCandidate | null {
  const q = normalizeLatin(query);
  const t = normalizeLatin(text);
  if (!q || !t) return null;

  if (t === q) {
    return { reason: "title_exact", matchedText: text };
  }
  if (t.startsWith(q)) {
    return { reason: "title_prefix", matchedText: text };
  }
  if (t.includes(q)) {
    return { reason: "title_partial", matchedText: text };
  }
  return null;
}

function matchConjugatedForm(query: string, text: string): MatchCandidate | null {
  const q = normalizeKorean(query);
  const t = normalizeKorean(text);
  if (!q || !t) return null;

  if (t === q) {
    return { reason: "conjugated_form_exact", matchedText: text };
  }
  if (t.includes(q)) {
    return { reason: "conjugated_form_partial", matchedText: text };
  }
  return null;
}

function matchKeyword(query: string, text: string): MatchCandidate | null {
  const q = normalizeLatin(query);
  const t = normalizeLatin(text);
  if (!q || !t || !t.includes(q)) return null;
  return { reason: "keyword_partial", matchedText: text };
}

function matchRomanizationText(
  query: string,
  text: string,
  isAlias: boolean
): MatchCandidate | null {
  const q = normalizeRomanization(query);
  const t = normalizeRomanization(text);
  if (!q || !t) return null;

  if (t === q) {
    return {
      reason: isAlias ? "romanization_alias_exact" : "romanization_exact",
      matchedText: text,
    };
  }
  if (t.startsWith(q)) {
    return {
      reason: isAlias ? "romanization_alias_prefix" : "romanization_prefix",
      matchedText: text,
    };
  }
  return null;
}

function reasonForHeadword(candidate: MatchCandidate): SearchMatchReason {
  return candidate.reason as SearchMatchReason;
}

export function matchDocument(
  document: SearchDocument,
  rawQuery: string,
  currentLocale: Locale
): { score: number; matches: SearchMatch[] } | null {
  const query = normalizeQuery(rawQuery);
  if (!query) return null;

  const matches: SearchMatch[] = [];
  let bestScore = 0;

  for (const field of document.fields) {
    let candidate: MatchCandidate | null = null;

    switch (field.kind) {
      case "headword":
        candidate = matchKoreanText(query, field.value);
        if (candidate) {
          candidate = { ...candidate, reason: reasonForHeadword(candidate) };
        }
        break;
      case "hanja":
        candidate = matchHanjaText(query, field.value);
        break;
      case "definition":
        if (field.locale) {
          candidate = matchDefinitionText(
            query,
            field.value,
            field.locale,
            currentLocale
          );
        }
        break;
      case "conjugated_form":
        candidate = matchConjugatedForm(query, field.value);
        break;
      case "title":
        candidate = matchTitleText(query, field.value);
        break;
      case "keyword":
        candidate = matchKeyword(query, field.value);
        break;
      case "romanization":
        candidate = matchRomanizationText(query, field.value, false);
        break;
      case "romanization_alias":
        candidate = matchRomanizationText(query, field.value, true);
        break;
    }

    if (!candidate) continue;

    const score = scoreForReason(candidate.reason);
    if (score > bestScore) bestScore = score;

    const isDuplicate = matches.some(
      (m) => m.reason === candidate!.reason && m.matchedText === candidate!.matchedText
    );
    if (!isDuplicate) {
      matches.push({
        reason: candidate.reason,
        matchedText: candidate.matchedText,
        locale: candidate.locale,
      });
    }
  }

  if (matches.length === 0) return null;

  matches.sort((a, b) => scoreForReason(b.reason) - scoreForReason(a.reason));

  return { score: bestScore, matches };
}

export function searchDocuments(
  documents: SearchDocument[],
  rawQuery: string,
  currentLocale: Locale
): import("@/lib/types/search").SearchResultItem[] {
  const results: import("@/lib/types/search").SearchResultItem[] = [];

  for (const document of documents) {
    const matched = matchDocument(document, rawQuery, currentLocale);
    if (!matched) continue;

    results.push({
      id: document.id,
      module: document.module,
      title: document.title,
      subtitle: document.subtitle,
      href: document.href,
      score: matched.score,
      matches: matched.matches,
    });
  }

  return results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.title.localeCompare(b.title, "ko");
  });
}
