"use client";

import { useLocale, useTranslations } from "next-intl";
import { ChevronDownIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  localeOptions,
  type Locale,
} from "@/lib/constants/locales";
import { saveLocalePreference } from "@/lib/i18n/locale-preference";

type LanguageSelectProps = {
  className?: string;
};

export function LanguageSelect({ className }: LanguageSelectProps) {
  const t = useTranslations("common");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const current = localeOptions.find((option) => option.value === locale);

  function handleLocaleChange(nextLocale: Locale) {
    saveLocalePreference(nextLocale);
    const query = searchParams.toString();
    const href = query ? `${pathname}?${query}` : pathname;
    router.replace(href, { locale: nextLocale });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={className}
            aria-label={t("selectLanguage")}
          >
            <span className="max-w-[8rem] truncate">
              {current?.label ?? "English"}
            </span>
            <ChevronDownIcon className="size-3.5 opacity-60" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-40">
        {localeOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleLocaleChange(option.value)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
