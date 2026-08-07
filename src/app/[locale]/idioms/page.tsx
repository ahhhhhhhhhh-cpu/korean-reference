import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/data/empty-state";
import { LocalizedText } from "@/components/content/localized-text";
import { PageHeader } from "@/components/layout/page-header";
import { IdiomFilterPanel } from "@/components/modules/idiom-filter-panel";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/constants/locales";
import { filterIdioms, listIdiomFilters } from "@/lib/repositories/idioms";
import { parseIdiomParams } from "@/lib/url/parse-module-params";

type IdiomsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: IdiomsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.idioms" });
  return { title: t("title") };
}

export default async function IdiomsPage({ params, searchParams }: IdiomsPageProps) {
  const { locale } = await params;
  const filters = parseIdiomParams(await searchParams);
  const loc = locale as Locale;

  const t = await getTranslations("pages.idioms");
  const tContent = await getTranslations("content");
  const tFilters = await getTranslations("moduleFilters");

  const [filterOptions, idioms] = await Promise.all([
    listIdiomFilters(),
    filterIdioms(filters, loc),
  ]);

  const categoryLabels = Object.fromEntries(
    filterOptions.categories.map((value) => [
      value,
      tFilters(`idiomCategories.${value}`),
    ])
  );
  const registerLabels = Object.fromEntries(
    filterOptions.registers.map((value) => [value, tFilters(`registers.${value}`)])
  );

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <IdiomFilterPanel
          options={filterOptions}
          filters={filters}
          count={idioms.length}
          labels={{
            search: tFilters("search"),
            searchPlaceholder: tFilters("searchPlaceholder"),
            category: tFilters("category"),
            register: tFilters("register"),
            all: tFilters("all"),
            resultCount: tFilters("resultCount"),
            clearFilters: tFilters("clearFilters"),
            categoryLabels,
            registerLabels,
          }}
        />

        {idioms.length === 0 ? (
          <EmptyState message={tFilters("noFilterResults")} />
        ) : (
          <ul className="space-y-3">
            {idioms.map((idiom) => (
              <li key={idiom.id}>
                <Link
                  href={`/idioms/${idiom.slug}`}
                  className="block rounded-xl border border-border/80 bg-card p-4 transition-shadow hover:shadow-sm"
                >
                  <p className="font-medium break-words text-foreground">
                    {idiom.idiomKo}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {idiom.categories
                      .map((cat) => categoryLabels[cat] ?? cat)
                      .join(", ")}{" "}
                    · {registerLabels[idiom.register] ?? idiom.register}
                  </p>
                  <LocalizedText
                    content={idiom.actualMeaning}
                    inProgressLabel={tContent("contentInProgress")}
                    className="mt-2"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
