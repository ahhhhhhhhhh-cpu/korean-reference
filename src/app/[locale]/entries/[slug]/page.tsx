import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { LocalizedText } from "@/components/content/localized-text";
import { PageHeader } from "@/components/layout/page-header";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/constants/locales";
import { getEntryBySlug } from "@/lib/repositories/entries";
import { listConjugationByEntrySlug } from "@/lib/repositories/conjugation";

type EntryPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: EntryPageProps) {
  const { locale, slug } = await params;
  const entry = await getEntryBySlug(slug, locale as Locale);
  if (!entry) return { title: "Not found" };
  return { title: entry.headwordKo };
}

export default async function EntryPage({ params }: EntryPageProps) {
  const { locale, slug } = await params;
  const entry = await getEntryBySlug(slug, locale as Locale);

  if (!entry) notFound();

  const conjugations = await listConjugationByEntrySlug(slug, locale as Locale);
  const t = await getTranslations("data");
  const tContent = await getTranslations("content");

  return (
    <>
      <PageHeader
        title={entry.headwordKo}
        description={`${entry.partOfSpeech} · ${entry.pronunciation}`}
      />
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">{t("explanation")}</h2>
          <LocalizedText
            content={entry.definition}
            inProgressLabel={tContent("contentInProgress")}
          />
        </section>

        {entry.notes.value ? (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">{t("notes")}</h2>
            <LocalizedText
              content={entry.notes}
              inProgressLabel={tContent("contentInProgress")}
            />
          </section>
        ) : null}

        {entry.usageNotes.value ? (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">{t("usageNotes")}</h2>
            <LocalizedText
              content={entry.usageNotes}
              inProgressLabel={tContent("contentInProgress")}
            />
          </section>
        ) : null}

        {entry.examples.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">{t("examples")}</h2>
            <ul className="space-y-3">
              {entry.examples.map((example) => (
                <li
                  key={example.id}
                  className="rounded-lg border border-border/80 bg-card p-4"
                >
                  <p className="font-medium text-foreground">{example.sentenceKo}</p>
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

        {conjugations.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">{t("steps")}</h2>
            <ul className="space-y-2">
              {conjugations.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-border/80 bg-muted/20 px-4 py-3 text-sm"
                >
                  <span className="font-medium">{item.resultKo}</span>
                  {item.isIrregular ? (
                    <span className="ml-2 text-xs text-primary">({t("irregular")})</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {entry.relatedEntrySlugs.length > 0 ? (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Related</h2>
            <div className="flex flex-wrap gap-2">
              {entry.relatedEntrySlugs.map((relatedSlug) => (
                <Link
                  key={relatedSlug}
                  href={`/entries/${relatedSlug}`}
                  className="rounded-lg bg-muted px-3 py-1.5 text-sm text-foreground hover:bg-muted/80"
                >
                  {relatedSlug}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
