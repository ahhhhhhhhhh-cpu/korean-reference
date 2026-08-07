import type { Locale } from "@/lib/constants/locales";

export type SearchModule =
  | "entries"
  | "soundChange"
  | "conjugation"
  | "hanja"
  | "idioms";

export type SearchMatchReason =
  | "headword_exact"
  | "headword_prefix"
  | "headword_partial"
  | "hanja_exact"
  | "hanja_partial"
  | "definition_current_exact"
  | "definition_current_partial"
  | "definition_other_exact"
  | "definition_other_partial"
  | "conjugated_form_exact"
  | "conjugated_form_partial"
  | "title_exact"
  | "title_prefix"
  | "title_partial"
  | "keyword_partial"
  | "romanization_exact"
  | "romanization_prefix"
  | "romanization_alias_exact"
  | "romanization_alias_prefix";

export type SearchMatch = {
  reason: SearchMatchReason;
  matchedText: string;
  locale?: Locale;
};

export type SearchResultItem = {
  id: string;
  module: SearchModule;
  title: string;
  subtitle?: string | null;
  href: string;
  score: number;
  matches: SearchMatch[];
};

export type SearchResultGroup = {
  module: SearchModule;
  count: number;
  items: SearchResultItem[];
};

export type SearchAllResult = {
  query: string;
  groups: SearchResultGroup[];
  totalCount: number;
};

export type SearchSuggestion = {
  id: string;
  module: SearchModule;
  title: string;
  subtitle?: string | null;
  href: string;
  matchReason: SearchMatchReason;
  matchedText: string;
  score: number;
};
