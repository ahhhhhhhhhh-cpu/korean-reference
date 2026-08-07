import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { LocalizedText } from "@/components/content/localized-text";
import { PageHeader } from "@/components/layout/page-header";
import { ConjugationLookupForm } from "@/components/modules/conjugation-lookup-form";
import { Link } from "@/i18n/navigation";
import { getConjugationFormLabels } from "@/lib/i18n/conjugation-form-labels";
import type { Locale } from "@/lib/constants/locales";
import {
  findConjugationResult,
  listConjugationOptions,
} from "@/lib/repositories/conjugation";
import { parseConjugationParams } from "@/lib/url/parse-module-params";

type ConjugationPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: ConjugationPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.conjugation" });
  return { title: t("title") };
}

export default async function ConjugationPage({
  params,
  searchParams,
}: ConjugationPageProps) {
  const { locale } = await params;
  const { entrySlug, form } = parseConjugationParams(await searchParams);
  const loc = locale as Locale;

  const t = await getTranslations("pages.conjugation");
  const tFilters = await getTranslations("moduleFilters");
  const tData = await getTranslations("data");
  const tContent = await getTranslations("content");

  const options = await listConjugationOptions(loc, entrySlug);
  const result =
    entrySlug && form
      ? await findConjugationResult({ entrySlug, form }, loc)
      : null;

  const formLabels = getConjugationFormLabels((key) => tData(key));

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-muted" />}>
          <ConjugationLookupForm
            options={options}
            selectedEntry={entrySlug}
            selectedForm={form}
            labels={{
              entry: tFilters("conjugationEntry"),
              form: tFilters("conjugationForm"),
              allEntries: tFilters("conjugationAllEntries"),
              allForms: tFilters("conjugationAllForms"),
              reset: tFilters("conjugationReset"),
              formLabels,
            }}
          />
        </Suspense>

        {!entrySlug || !form ? (
          <p className="text-sm text-muted-foreground">
            {tFilters("conjugationSelectPrompt")}
          </p>
        ) : null}

        {entrySlug && form && !result ? (
          <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
            {tFilters("conjugationNotRecorded")}
          </div>
        ) : null}

        {result ? (
          <div className="space-y-8">
            <section className="rounded-xl border border-border/80 bg-card p-5">
              <p className="text-2xl font-semibold text-foreground">{result.resultKo}</p>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">{tData("stem")}</dt>
                  <dd className="font-medium">{result.stemKo}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{tData("result")}</dt>
                  <dd className="font-medium">{result.resultKo}</dd>
                </div>
              </dl>
              {result.isIrregular ? (
                <p className="mt-3 text-sm text-primary">
                  {tData("irregular")}
                  {result.irregularNote ? ` · ${result.irregularNote}` : ""}
                </p>
              ) : null}
              {result.ruleTitle.value ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {result.ruleTitle.value}
                </p>
              ) : null}
            </section>

            {result.steps.length > 0 ? (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground">{tData("steps")}</h2>
                <ol className="space-y-3">
                  {result.steps.map((step) => (
                    <li
                      key={step.order}
                      className="rounded-lg border border-border/80 bg-muted/20 px-4 py-3 text-sm"
                    >
                      <span className="mr-2 font-medium text-primary">
                        {step.order}.
                      </span>
                      <LocalizedText
                        content={step.description}
                        inProgressLabel={tContent("contentInProgress")}
                      />
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {result.examples.length > 0 ? (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground">{tData("examples")}</h2>
                <ul className="space-y-3">
                  {result.examples.map((example) => (
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

            <p className="text-sm">
              <Link
                href={`/entries/${result.entrySlug}`}
                className="font-medium text-primary hover:underline"
              >
                {tFilters("linkedEntry")}: {result.entryHeadword}
              </Link>
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}
