import { getTranslations } from "next-intl/server";

import { SearchBar } from "@/components/search/search-bar";
import {
  SearchEmptyState,
  SearchInitialState,
  SearchResultGroupSection,
} from "@/components/search/search-results";
import { PageHeader } from "@/components/layout/page-header";
import type { Locale } from "@/lib/constants/locales";
import { isQuerySearchable } from "@/lib/search/query-guard";
import { searchAll } from "@/lib/repositories/search";
import type { SearchMatchReason, SearchModule } from "@/lib/types/search";

type SearchPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
};

const MATCH_REASONS: SearchMatchReason[] = [
  "headword_exact",
  "headword_prefix",
  "headword_partial",
  "hanja_exact",
  "hanja_partial",
  "definition_current_exact",
  "definition_current_partial",
  "definition_other_exact",
  "definition_other_partial",
  "conjugated_form_exact",
  "conjugated_form_partial",
  "title_exact",
  "title_prefix",
  "title_partial",
  "keyword_partial",
  "romanization_exact",
  "romanization_prefix",
  "romanization_alias_exact",
  "romanization_alias_prefix",
];

async function getMatchLabels(): Promise<Record<SearchMatchReason, string>> {
  const t = await getTranslations("search.match");
  return MATCH_REASONS.reduce(
    (acc, reason) => {
      acc[reason] = t(reason);
      return acc;
    },
    {} as Record<SearchMatchReason, string>
  );
}

function groupTitleKey(module: SearchModule): string {
  const keys: Record<SearchModule, string> = {
    entries: "groupEntries",
    soundChange: "groupSoundChange",
    conjugation: "groupConjugation",
    hanja: "groupHanja",
    idioms: "groupIdioms",
  };
  return keys[module];
}

export async function generateMetadata({ params }: SearchPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.search" });
  return { title: t("title") };
}

export default async function SearchPage({
  params,
  searchParams,
}: SearchPageProps) {
  const { locale } = await params;
  const { q = "" } = await searchParams;
  const t = await getTranslations("pages.search");
  const tSearch = await getTranslations("search");

  const query = q.trim();
  const searchable = isQuerySearchable(query);
  const results = searchable
    ? await searchAll(query, locale as Locale)
    : { query, groups: [], totalCount: 0 };

  const matchLabels = await getMatchLabels();

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <SearchBar key={query} initialQuery={query} autoFocus />

        {!searchable ? (
          <SearchInitialState />
        ) : results.totalCount === 0 ? (
          <SearchEmptyState query={query} />
        ) : (
          <div className="space-y-8">
            <p className="text-sm text-muted-foreground">
              {tSearch("resultsFor", { query, count: results.totalCount })}
            </p>
            {results.groups.map((group) => (
              <SearchResultGroupSection
                key={group.module}
                module={group.module}
                title={tSearch(groupTitleKey(group.module))}
                count={group.count}
                items={group.items}
                matchLabels={matchLabels}
                query={query}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
