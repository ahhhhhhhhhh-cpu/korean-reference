import type { Locale } from "@/lib/constants/locales";
import type { ConjugationFormKey } from "@/lib/constants/conjugation-forms";
import {
  mapConjugationLookupDetail,
  mapConjugationResultDetail,
  mapConjugationResultSummary,
  mapConjugationTargetForm,
} from "@/lib/adapters/supabase/mappers/conjugation";
import {
  loadConjugationExamplesByEntry,
  loadConjugationResultBundles,
} from "@/lib/adapters/supabase/loaders/conjugation";
import { matchesModuleTextQuery } from "@/lib/search/module-text-match";
import type {
  ConjugationLookupDetail,
  ConjugationResultDetail,
  ConjugationResultSummary,
} from "@/lib/types/conjugation";
import type {
  ConjugationCriteria,
  ConjugationModuleOptions,
} from "@/lib/types/module-filters";

export const supabaseConjugationAdapter = {
  async listResults(): Promise<ConjugationResultSummary[]> {
    const bundles = await loadConjugationResultBundles();
    return bundles.map((bundle) => mapConjugationResultSummary(bundle));
  },

  async listOptions(
    locale: Locale,
    entrySlug?: string
  ): Promise<ConjugationModuleOptions> {
    void locale;
    const bundles = await loadConjugationResultBundles();
    const entrySlugs = [...new Set(bundles.map((bundle) => bundle.entrySlug))].sort(
      (a, b) => a.localeCompare(b, "ko")
    );

    const entries = entrySlugs.map((slug) => {
      const bundle = bundles.find((item) => item.entrySlug === slug);
      return {
        slug,
        headwordKo: bundle?.entryHeadword ?? slug,
        romanization: null,
        partOfSpeech: "verb" as const,
      };
    });

    const formsByEntry: ConjugationModuleOptions["formsByEntry"] = {};
    for (const slug of entrySlugs) {
      const forms = bundles
        .filter((bundle) => bundle.entrySlug === slug)
        .map((bundle) => mapConjugationTargetForm(bundle.form));
      const uniqueForms = [...new Set(forms)] as ConjugationFormKey[];
      formsByEntry[slug] = uniqueForms.map((targetForm) => ({
        targetForm,
        available: true,
      }));
    }

    if (entrySlug && !formsByEntry[entrySlug]) {
      return { entries, formsByEntry };
    }

    return { entries, formsByEntry };
  },

  async findResult(
    criteria: ConjugationCriteria,
    locale: Locale
  ): Promise<ConjugationLookupDetail | null> {
    if (!criteria.entrySlug || !criteria.form) return null;

    const bundles = await loadConjugationResultBundles();
    const bundle = bundles.find(
      (item) =>
        item.entrySlug === criteria.entrySlug &&
        mapConjugationTargetForm(item.form) === criteria.form
    );

    if (!bundle) return null;

    const examples = await loadConjugationExamplesByEntry(bundle.result.entry_id);
    return mapConjugationLookupDetail(bundle, locale, examples);
  },

  async getById(id: string, locale: Locale): Promise<ConjugationResultDetail | null> {
    const bundles = await loadConjugationResultBundles();
    const bundle = bundles.find((item) => item.result.id === id);
    if (!bundle) return null;
    return mapConjugationResultDetail(bundle, locale);
  },

  async listByEntrySlug(
    entrySlug: string,
    locale: Locale
  ): Promise<ConjugationResultDetail[]> {
    const bundles = await loadConjugationResultBundles();
    return bundles
      .filter((bundle) => bundle.entrySlug === entrySlug)
      .map((bundle) => mapConjugationResultDetail(bundle, locale));
  },

  async searchWithinModule(
    query: string,
    locale: Locale
  ): Promise<ConjugationResultSummary[]> {
    void locale;
    const bundles = await loadConjugationResultBundles();
    if (!query.trim()) {
      return bundles.map((bundle) => mapConjugationResultSummary(bundle));
    }

    return bundles
      .filter((bundle) =>
        matchesModuleTextQuery(query, [
          bundle.result.result,
          bundle.entrySlug,
          bundle.entryHeadword,
        ])
      )
      .map((bundle) => mapConjugationResultSummary(bundle));
  },
};
