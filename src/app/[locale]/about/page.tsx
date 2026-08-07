import { getTranslations } from "next-intl/server";

import { LocalizedContentBlock } from "@/components/content/localized-content";
import { PageHeader } from "@/components/layout/page-header";
import {
  demoFallbackNote,
  demoMissingNote,
} from "@/data/mock/demo-content";
import type { Locale } from "@/lib/constants/locales";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.about" });
  return { title: t("title") };
}

type AboutPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  const t = await getTranslations("pages.about");
  const tContent = await getTranslations("content");

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <div className="mx-auto max-w-3xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>{t("introEn")}</p>
          <p>{t("introZh")}</p>
          <p>{t("introJa")}</p>
        </div>

        <section className="space-y-4 border-t border-border/60 pt-8">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {tContent("demoSectionTitle")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {tContent("demoSectionDescription")}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">
              {tContent("demoFallbackLabel")}
            </h3>
            <LocalizedContentBlock
              locale={locale as Locale}
              translations={demoFallbackNote}
              inProgressLabel={tContent("contentInProgress")}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">
              {tContent("demoMissingLabel")}
            </h3>
            <LocalizedContentBlock
              locale={locale as Locale}
              translations={demoMissingNote}
              inProgressLabel={tContent("contentInProgress")}
            />
          </div>
        </section>
      </div>
    </>
  );
}
