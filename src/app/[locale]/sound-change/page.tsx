import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/data/empty-state";
import { LocalizedText } from "@/components/content/localized-text";
import { PageHeader } from "@/components/layout/page-header";
import { SoundChangeFilterPanel } from "@/components/modules/sound-change-filter-panel";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/constants/locales";
import {
  filterSoundChangeRules,
  listSoundChangeFilters,
} from "@/lib/repositories/sound-change";
import { parseSoundChangeParams } from "@/lib/url/parse-module-params";

type SoundChangePageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: SoundChangePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.soundChange" });
  return { title: t("title") };
}

export default async function SoundChangePage({
  params,
  searchParams,
}: SoundChangePageProps) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  const filters = parseSoundChangeParams(resolvedSearchParams);
  const loc = locale as Locale;

  const t = await getTranslations("pages.soundChange");
  const tContent = await getTranslations("content");
  const tFilters = await getTranslations("moduleFilters");

  const [filterOptions, rules] = await Promise.all([
    listSoundChangeFilters(),
    filterSoundChangeRules(filters, loc),
  ]);

  const categoryLabels = Object.fromEntries(
    filterOptions.categories.map((value) => [
      value,
      tFilters(`categories.${value}`),
    ])
  );
  const difficultyLabels = Object.fromEntries(
    filterOptions.difficultyTiers.map((value) => [
      value,
      tFilters(`difficulties.${value}`),
    ])
  );

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <SoundChangeFilterPanel
          options={filterOptions}
          filters={filters}
          count={rules.length}
          labels={{
            search: tFilters("search"),
            searchPlaceholder: tFilters("searchPlaceholder"),
            category: tFilters("category"),
            difficulty: tFilters("difficulty"),
            all: tFilters("all"),
            resultCount: tFilters("resultCount"),
            clearFilters: tFilters("clearFilters"),
            categoryLabels,
            difficultyLabels,
          }}
        />

        {rules.length === 0 ? (
          <EmptyState message={tFilters("noFilterResults")} />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {rules.map((rule) => (
              <li key={rule.id}>
                <Link
                  href={`/sound-change/${rule.slug}`}
                  className="block rounded-xl border border-border/80 bg-card p-4 transition-shadow hover:shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{rule.nameKo}</p>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {categoryLabels[rule.category] ?? rule.category}
                    </span>
                  </div>
                  <div className="mt-3">
                    <LocalizedText
                      content={rule.summary}
                      inProgressLabel={tContent("contentInProgress")}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
