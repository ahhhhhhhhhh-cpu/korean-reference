import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { searchResultsHref } from "@/lib/search/search-query";

type BackToSearchLinkProps = {
  query?: unknown;
};

export async function BackToSearchLink({ query }: BackToSearchLinkProps) {
  const t = await getTranslations("search");

  return (
    <Link
      href={searchResultsHref(query)}
      className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-3.5 shrink-0" aria-hidden />
      {t("backToSearch")}
    </Link>
  );
}
