import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { LocalizedText } from "@/components/content/localized-text";
import { PageHeader } from "@/components/layout/page-header";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/constants/locales";
import { getHanjaEntryBySlug } from "@/lib/repositories/hanja";

type HanjaDetailPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function HanjaDetailPage({ params }: HanjaDetailPageProps) {
  const { locale, slug } = await params;
  const entry = await getHanjaEntryBySlug(slug, locale as Locale);

  if (!entry) notFound();

  const t = await getTranslations("data");
  const tFilters = await getTranslations("moduleFilters");
  const tContent = await getTranslations("content");

  return (
    <>
      <PageHeader
        title={`${entry.wordKo} · ${entry.hanjaText}`}
        description={entry.pronunciation}
      />
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <LocalizedText
          content={entry.definition}
          inProgressLabel={tContent("contentInProgress")}
        />

        {entry.notes.value ? (
          <LocalizedText
            content={entry.notes}
            inProgressLabel={tContent("contentInProgress")}
          />
        ) : null}

        {entry.characters.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              {t("hanjaCharacters")}
            </h2>
            <div className="overflow-x-auto rounded-lg border border-border/80">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/40 text-left">
                  <tr>
                    <th className="px-4 py-2 font-medium">{tFilters("hanjaTableCharacter")}</th>
                    <th className="px-4 py-2 font-medium">{tFilters("hanjaTableReading")}</th>
                    <th className="px-4 py-2 font-medium">{tFilters("hanjaTableMeaning")}</th>
                  </tr>
                </thead>
                <tbody>
                  {entry.characters.map((char) => (
                    <tr key={char.id} className="border-t border-border/60">
                      <td className="px-4 py-2 font-medium">{char.character}</td>
                      <td className="px-4 py-2">{char.readingKo}</td>
                      <td className="px-4 py-2 break-words">{char.meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {entry.relatedByCharacter.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              {tFilters("relatedHanja")}
            </h2>
            <ul className="space-y-2">
              {entry.relatedByCharacter.map((related) => (
                <li key={related.id}>
                  <Link
                    href={`/hanja/${related.slug}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {related.wordKo} ({related.hanjaText})
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {entry.entrySlug ? (
          <p className="text-sm">
            <Link
              href={`/entries/${entry.entrySlug}`}
              className="font-medium text-primary hover:underline"
            >
              {tFilters("linkedEntry")}: {entry.wordKo}
            </Link>
          </p>
        ) : null}
      </div>
    </>
  );
}
