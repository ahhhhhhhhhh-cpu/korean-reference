import type { SearchMatchReason } from "@/lib/types/search";

/** Higher score = higher relevance. */
export const MATCH_SCORES: Record<SearchMatchReason, number> = {
  headword_exact: 1000,
  romanization_exact: 950,
  romanization_alias_exact: 945,
  definition_current_exact: 900,
  hanja_exact: 850,
  conjugated_form_exact: 800,
  title_exact: 800,
  headword_prefix: 700,
  romanization_prefix: 650,
  romanization_alias_prefix: 645,
  definition_current_partial: 600,
  definition_other_exact: 550,
  definition_other_partial: 500,
  headword_partial: 400,
  hanja_partial: 380,
  conjugated_form_partial: 350,
  title_prefix: 320,
  title_partial: 300,
  keyword_partial: 200,
};

export function scoreForReason(reason: SearchMatchReason): number {
  return MATCH_SCORES[reason];
}

export function compareSearchResults(
  a: { score: number; title: string },
  b: { score: number; title: string }
): number {
  if (b.score !== a.score) return b.score - a.score;
  return a.title.localeCompare(b.title, "ko");
}
