import { getTranslations } from "next-intl/server";

import { EntrySummaryCard } from "@/components/data/entry-summary-card";
import { EmptyState } from "@/components/data/empty-state";
import { ModuleIcon } from "@/components/layout/module-icon";
import { SearchBar } from "@/components/search/search-bar";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { moduleRoutes } from "@/lib/constants/navigation";
import type { Locale } from "@/lib/constants/locales";
import { listFeaturedEntries } from "@/lib/repositories/entries";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const t = await getTranslations("common");
  const tHome = await getTranslations("home");
  const tModules = await getTranslations("modules");
  const tData = await getTranslations("data");
  const tContent = await getTranslations("content");

  const featuredEntries = await listFeaturedEntries(locale as Locale, 6);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <section className="border-b border-border/60 py-10 sm:py-14">
        <p className="text-sm font-medium text-primary">{t("siteName")}</p>
        <h1 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t("tagline")}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {t("description")}
        </p>

        <div className="mt-8 max-w-2xl">
          <label htmlFor="home-search" className="sr-only">
            {t("searchEntries")}
          </label>
          <SearchBar inputId="home-search" />
        </div>
      </section>

      <section className="border-b border-border/60 py-10 sm:py-12">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            {tData("featuredEntries")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {tData("featuredEntriesDescription")}
          </p>
        </div>
        {featuredEntries.length === 0 ? (
          <EmptyState message={tData("noPublishedItems")} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featuredEntries.map((entry) => (
              <EntrySummaryCard
                key={entry.id}
                entry={entry}
                inProgressLabel={tContent("contentInProgress")}
                viewDetailsLabel={tData("viewDetails")}
              />
            ))}
          </div>
        )}
      </section>

      <section className="py-10 sm:py-12">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            {tHome("browseModules")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {tHome("browseModulesDescription")}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {moduleRoutes.map((module) => (
            <Link key={module.href} href={module.href} className="group block">
              <Card className="h-full border-border/80 transition-shadow group-hover:shadow-sm">
                <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                  <ModuleIcon name={module.icon} />
                  <div className="min-w-0">
                    <CardTitle className="text-base">
                      {tModules(`${module.key}.title`)}
                    </CardTitle>
                    <CardDescription className="mt-1.5 leading-relaxed">
                      {tModules(`${module.key}.description`)}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-border/60 py-10 sm:py-12">
        <h2 className="text-lg font-semibold text-foreground">
          {tHome("multilingualPreview")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {tHome("multilingualPreviewDescription")}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="text-base">{tHome("sampleGada")}</CardTitle>
              <CardDescription className="whitespace-pre-line">
                {tHome("sampleGadaDescription")}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-l-4 border-l-accent">
            <CardHeader>
              <CardTitle className="text-base">{tHome("sampleSchool")}</CardTitle>
              <CardDescription>{tHome("sampleSchoolDescription")}</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-l-4 border-l-primary/60">
            <CardHeader>
              <CardTitle className="text-base">{tHome("sampleIdiom")}</CardTitle>
              <CardDescription className="whitespace-pre-line">
                {tHome("sampleIdiomDescription")}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  );
}
