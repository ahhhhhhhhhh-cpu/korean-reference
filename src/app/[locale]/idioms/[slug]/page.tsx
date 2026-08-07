import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { LocalizedText } from "@/components/content/localized-text";
import { PageHeader } from "@/components/layout/page-header";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/constants/locales";
import { getIdiomBySlug } from "@/lib/repositories/idioms";

type IdiomDetailPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function IdiomDetailPage({ params }: IdiomDetailPageProps) {
  const { locale, slug } = await params;
  const idiom = await getIdiomBySlug(slug, locale as Locale);

  if (!idiom) notFound();

  const t = await getTranslations("data");
  const tFilters = await getTranslations("moduleFilters");
  const tContent = await getTranslations("content");

  const registerLabel = tFilters(`registers.${idiom.register}`);

  return (
    <>
      <PageHeader title={idiom.idiomKo} description={registerLabel} />
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-border/80 bg-muted/20 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("literalMeaning")}
            </h2>
            <LocalizedText
              content={idiom.literalMeaning}
              inProgressLabel={tContent("contentInProgress")}
              className="mt-2"
            />
          </section>
          <section className="rounded-xl border border-l-4 border-l-primary border-border/80 bg-card p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("actualMeaning")}
            </h2>
            <LocalizedText
              content={idiom.actualMeaning}
              inProgressLabel={tContent("contentInProgress")}
              className="mt-2"
            />
          </section>
        </div>

        {idiom.explanation.value ? (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">{t("explanation")}</h2>
            <LocalizedText
              content={idiom.explanation}
              inProgressLabel={tContent("contentInProgress")}
            />
          </section>
        ) : null}

        {idiom.usageContext.value ? (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">
              {tFilters("usageContext")}
            </h2>
            <LocalizedText
              content={idiom.usageContext}
              inProgressLabel={tContent("contentInProgress")}
            />
          </section>
        ) : null}

        {idiom.commonMistakes.value ? (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">
              {tFilters("commonMistakes")}
            </h2>
            <LocalizedText
              content={idiom.commonMistakes}
              inProgressLabel={tContent("contentInProgress")}
            />
          </section>
        ) : null}

        {idiom.examples.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">{t("examples")}</h2>
            <ul className="space-y-3">
              {idiom.examples.map((example) => (
                <li
                  key={example.id}
                  className="rounded-lg border border-border/80 bg-card p-4"
                >
                  <p className="font-medium break-words">{example.sentenceKo}</p>
                  <LocalizedText
                    content={example.translation}
                    inProgressLabel={tContent("contentInProgress")}
                    className="mt-2"
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {idiom.relatedIdioms.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              {tFilters("relatedIdioms")}
            </h2>
            <ul className="space-y-2">
              {idiom.relatedIdioms.map((related) => (
                <li key={related.id}>
                  <Link
                    href={`/idioms/${related.slug}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {related.idiomKo}
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
