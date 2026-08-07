import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { LanguageSelect } from "@/components/layout/language-select";
import { MobileNav, MobileSearchLink } from "@/components/layout/mobile-nav";
import { Link } from "@/i18n/navigation";
import { mainNavRoutes } from "@/lib/constants/navigation";

export async function Header() {
  const t = await getTranslations("common");
  const tNav = await getTranslations("nav");

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:h-16 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="shrink-0 text-base font-semibold tracking-tight text-foreground sm:text-lg"
        >
          <span className="text-primary">{t("siteShort")}</span>
          <span className="hidden sm:inline"> {t("siteName")}</span>
        </Link>

        <nav
          className="hidden flex-1 items-center gap-1 md:flex"
          aria-label={t("mainNav")}
        >
          {mainNavRoutes.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {tNav(item.key)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <MobileSearchLink />
          <div className="hidden md:block">
            <Suspense
              fallback={
                <div className="h-8 w-28 animate-pulse rounded-md bg-muted" />
              }
            >
              <LanguageSelect />
            </Suspense>
          </div>
          <div className="md:hidden">
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
