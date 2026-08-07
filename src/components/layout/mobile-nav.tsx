"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { MenuIcon, SearchIcon } from "lucide-react";

import { LanguageSelect } from "@/components/layout/language-select";
import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { mainNavRoutes } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const t = useTranslations("common");
  const tNav = useTranslations("nav");
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" aria-label={t("openMenu")}>
            <MenuIcon className="size-5" />
          </Button>
        }
      />
      <SheetContent side="right" className="flex w-[min(100vw-2rem,20rem)] flex-col">
        <SheetHeader>
          <SheetTitle>{t("siteName")}</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4">
          {mainNavRoutes.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <SheetClose
                key={item.href}
                render={
                  <Link
                    href={item.href}
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted"
                    )}
                  />
                }
              >
                {tNav(item.key)}
              </SheetClose>
            );
          })}
        </nav>
        <div className="mt-auto border-t px-4 py-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            {t("language")}
          </p>
          <Suspense
            fallback={
              <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
            }
          >
            <LanguageSelect className="w-full justify-between" />
          </Suspense>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function MobileSearchLink() {
  const t = useTranslations("common");

  return (
    <Link
      href="/search"
      aria-label={t("search")}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted md:hidden"
      )}
    >
      <SearchIcon className="size-5" />
    </Link>
  );
}
