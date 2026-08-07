import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { LocalizedText } from "@/components/content/localized-text";
import { PageHeader } from "@/components/layout/page-header";
import { RelatedEntryLinks } from "@/components/modules/related-entry-links";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/constants/locales";
import { getSoundChangeRuleBySlug } from "@/lib/repositories/sound-change";

type SoundChangeDetailPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function SoundChangeDetailPage({
  params,
}: SoundChangeDetailPageProps) {
  const { locale, slug } = await params;
  const rule = await getSoundChangeRuleBySlug(slug, locale as Locale);

  if (!rule) notFound();

  const t = await getTranslations("data");
  const tFilters = await getTranslations("moduleFilters");
  const tContent = await getTranslations("content");

  const categoryLabel = tFilters(`categories.${rule.category}`);

  return (
    <>
      <PageHeader
        title={rule.nameKo}
        description={categoryLabel}
      />
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <section className="space-y-2">
          <LocalizedText
            content={rule.summary}
            inProgressLabel={tContent("contentInProgress")}
          />
          <LocalizedText
            content={rule.explanation}
            inProgressLabel={tContent("contentInProgress")}
          />
        </section>

        {rule.steps.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">{t("steps")}</h2>
            <ol className="space-y-2">
              {rule.steps.map((step, index) => (
                <li
                  key={step.id}
                  className="rounded-lg border border-border/80 bg-muted/20 px-4 py-3 text-sm"
                >
                  <span className="mr-2 font-medium text-primary">
                    {index + 1}.
                  </span>
                  <span className="text-muted-foreground">{step.beforeText}</span>
                  <span className="mx-2" aria-hidden="true">
                    →
                  </span>
                  <span className="font-medium text-foreground">{step.afterText}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {rule.conditions.value ? (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">{t("conditions")}</h2>
            <LocalizedText
              content={rule.conditions}
              inProgressLabel={tContent("contentInProgress")}
            />
          </section>
        ) : null}

        {rule.exceptions.value ? (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">{t("exceptions")}</h2>
            <LocalizedText
              content={rule.exceptions}
              inProgressLabel={tContent("contentInProgress")}
            />
          </section>
        ) : null}

        <RelatedEntryLinks
          title={tFilters("exampleWords")}
          entries={rule.exampleEntries}
          viewLabel={t("viewDetails")}
        />

        {rule.relatedRules.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              {tFilters("relatedRules")}
            </h2>
            <ul className="space-y-2">
              {rule.relatedRules.map((related) => (
                <li key={related.id}>
                  <Link
                    href={`/sound-change/${related.slug}`}
                    className="block rounded-lg border border-border/80 bg-card px-4 py-3 text-sm hover:shadow-sm"
                  >
                    <span className="font-medium">{related.nameKo}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}
