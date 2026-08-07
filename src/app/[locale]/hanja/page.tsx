import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { HanjaFilterPanel } from "@/components/modules/hanja-filter-panel";
import { HanjaList } from "@/components/modules/hanja-list";
import type { Locale } from "@/lib/constants/locales";
import { listHanjaFilters, searchHanjaWithinModule } from "@/lib/repositories/hanja";
import { parseHanjaParams } from "@/lib/url/parse-module-params";

type HanjaPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: HanjaPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.hanja" });
  return { title: t("title") };
}

export default async function HanjaPage({ params, searchParams }: HanjaPageProps) {
  const { locale } = await params;
  const filters = parseHanjaParams(await searchParams);
  const loc = locale as Locale;

  const t = await getTranslations("pages.hanja");
  const tData = await getTranslations("data");
  const tContent = await getTranslations("content");
  const tFilters = await getTranslations("moduleFilters");

  const [filterOptions, entries] = await Promise.all([
    listHanjaFilters(),
    searchHanjaWithinModule(filters, loc),
  ]);

  const posLabels = Object.fromEntries(
    filterOptions.partsOfSpeech.map((value) => [value, tFilters(`pos.${value}`)])
  );

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <HanjaFilterPanel
          options={filterOptions}
          filters={filters}
          count={entries.length}
          labels={{
            search: tFilters("search"),
            searchPlaceholder: tFilters("searchPlaceholder"),
            character: tFilters("character"),
            partOfSpeech: tFilters("partOfSpeech"),
            all: tFilters("all"),
            resultCount: tFilters("resultCount"),
            clearFilters: tFilters("clearFilters"),
            posLabels,
          }}
        />

        {entries.length === 0 ? (
          <EmptyState message={tFilters("noFilterResults")} />
        ) : (
          <HanjaList
            entries={entries}
            inProgressLabel={tContent("contentInProgress")}
            viewLabel={tData("viewDetails")}
            tableHeaders={{
              word: tFilters("hanjaTableWord"),
              character: tFilters("hanjaTableCharacter"),
              reading: tFilters("hanjaTableReading"),
              meaning: tFilters("hanjaTableMeaning"),
            }}
          />
        )}
      </div>
    </>
  );
}
