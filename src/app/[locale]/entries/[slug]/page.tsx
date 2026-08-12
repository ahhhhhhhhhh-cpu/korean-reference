import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { LocalizedText } from "@/components/content/localized-text";
import { PageHeader } from "@/components/layout/page-header";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/constants/locales";
import { getEntryBySlug } from "@/lib/repositories/entries";
import { listConjugationByEntrySlug } from "@/lib/repositories/conjugation";
import type { ExampleDetail } from "@/lib/types/example";
import type { SenseDetail } from "@/lib/types/entry";

type EntryPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

function ExampleList({
  examples,
  inProgressLabel,
}: {
  examples: ExampleDetail[];
  inProgressLabel: string;
}) {
  if (examples.length === 0) return null;

  return (
    <ul className="space-y-3">
      {examples.map((example) => (
        <li
          key={example.id}
          className="rounded-lg border border-border/80 bg-card p-4"
        >
          <p className="font-medium text-foreground">{example.sentenceKo}</p>
          <LocalizedText
            content={example.translation}
            inProgressLabel={inProgressLabel}
            className="mt-2"
          />
        </li>
      ))}
    </ul>
  );
}

function MultiSenseBlock({
  sense,
  inProgressLabel,
}: {
  sense: SenseDetail;
  inProgressLabel: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <span className="shrink-0 text-sm font-semibold text-muted-foreground">
          {sense.senseOrder}.
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <LocalizedText
            content={sense.definition}
            inProgressLabel={inProgressLabel}
          />
          {sense.usageNotes.value ? (
            <LocalizedText
              content={sense.usageNotes}
              inProgressLabel={inProgressLabel}
              className="text-sm text-muted-foreground"
            />
          ) : null}
        </div>
      </div>
      <div className="ml-6">
        <ExampleList examples={sense.examples} inProgressLabel={inProgressLabel} />
      </div>
    </div>
  );
}

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
  const inProgressLabel = tContent("contentInProgress");
  const multiSense = entry.senses.length > 1;
  const primarySense = entry.senses[0];

  return (
    <>
      <PageHeader
        title={entry.headwordKo}
        description={`${entry.partOfSpeech} · ${entry.pronunciation}`}
      />
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        {multiSense ? (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">{t("explanation")}</h2>
            <ol className="space-y-8">
              {entry.senses.map((sense) => (
                <li key={sense.senseOrder}>
                  <MultiSenseBlock sense={sense} inProgressLabel={inProgressLabel} />
                </li>
              ))}
            </ol>
          </section>
        ) : primarySense ? (
          <>
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-foreground">{t("explanation")}</h2>
              <LocalizedText
                content={primarySense.definition}
                inProgressLabel={inProgressLabel}
              />
            </section>

            {entry.usageNotes.value ? (
              <section className="space-y-2">
                <h2 className="text-sm font-semibold text-foreground">{t("usageNotes")}</h2>
                <LocalizedText content={entry.usageNotes} inProgressLabel={inProgressLabel} />
              </section>
            ) : null}

            {primarySense.examples.length > 0 ? (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground">{t("examples")}</h2>
                <ExampleList
                  examples={primarySense.examples}
                  inProgressLabel={inProgressLabel}
                />
              </section>
            ) : null}
          </>
        ) : null}

        {entry.notes.value ? (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">{t("notes")}</h2>
            <LocalizedText content={entry.notes} inProgressLabel={inProgressLabel} />
          </section>
        ) : null}

        {entry.examples.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">{t("examples")}</h2>
            <ExampleList examples={entry.examples} inProgressLabel={inProgressLabel} />
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
