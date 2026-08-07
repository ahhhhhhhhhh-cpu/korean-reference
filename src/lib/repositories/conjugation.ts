import type { Locale } from "@/lib/constants/locales";
import { getConjugationAdapter } from "@/lib/adapters";
import type {
  ConjugationLookupDetail,
  ConjugationResultDetail,
  ConjugationResultSummary,
} from "@/lib/types/conjugation";
import type {
  ConjugationCriteria,
  ConjugationModuleOptions,
} from "@/lib/types/module-filters";

export async function listConjugationResults(
  locale: Locale
): Promise<ConjugationResultSummary[]> {
  void locale;
  return getConjugationAdapter().listResults();
}

export async function listConjugationOptions(
  locale: Locale,
  entrySlug?: string
): Promise<ConjugationModuleOptions> {
  return getConjugationAdapter().listOptions(locale, entrySlug);
}

export async function findConjugationResult(
  criteria: ConjugationCriteria,
  locale: Locale
): Promise<ConjugationLookupDetail | null> {
  return getConjugationAdapter().findResult(criteria, locale);
}

export async function getConjugationResultById(
  id: string,
  locale: Locale
): Promise<ConjugationResultDetail | null> {
  return getConjugationAdapter().getById(id, locale);
}

export async function listConjugationByEntrySlug(
  entrySlug: string,
  locale: Locale
): Promise<ConjugationResultDetail[]> {
  return getConjugationAdapter().listByEntrySlug(entrySlug, locale);
}

export async function searchConjugationsWithinModule(
  query: string,
  locale: Locale
): Promise<ConjugationResultSummary[]> {
  return getConjugationAdapter().searchWithinModule(query, locale);
}
