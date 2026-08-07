import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export async function Footer() {
  const t = await getTranslations("common");
  const tNav = await getTranslations("nav");

  return (
    <footer className="mt-auto border-t border-border/80 bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>
          <span className="font-medium text-foreground">{t("siteName")}</span>
          <span className="mx-2 text-border">·</span>
          {t("tagline")}
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href="/about" className="transition-colors hover:text-foreground">
            {tNav("about")}
          </Link>
          <Link href="/search" className="transition-colors hover:text-foreground">
            {tNav("search")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
