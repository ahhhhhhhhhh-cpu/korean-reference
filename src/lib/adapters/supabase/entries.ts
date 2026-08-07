import type { Locale } from "@/lib/constants/locales";
import {
  mapEntryDetail,
  mapEntrySummary,
} from "@/lib/adapters/supabase/mappers/entries";
import {
  loadEntryBundleBySlug,
  loadEntryBundles,
} from "@/lib/adapters/supabase/loaders/entries";
import type { EntryDetail, EntrySummary } from "@/lib/types/entry";

export const supabaseEntriesAdapter = {
  async listSummaries(locale: Locale): Promise<EntrySummary[]> {
    const bundles = await loadEntryBundles();
    return bundles
      .sort((a, b) =>
        a.entry.headword.localeCompare(b.entry.headword, "ko")
      )
      .map((bundle) => mapEntrySummary(bundle, locale));
  },

  async listFeatured(locale: Locale, limit = 6): Promise<EntrySummary[]> {
    const summaries = await this.listSummaries(locale);
    return summaries.slice(0, limit);
  },

  async getBySlug(slug: string, locale: Locale): Promise<EntryDetail | null> {
    const bundle = await loadEntryBundleBySlug(slug);
    if (!bundle) return null;
    return mapEntryDetail(bundle, locale);
  },
};
