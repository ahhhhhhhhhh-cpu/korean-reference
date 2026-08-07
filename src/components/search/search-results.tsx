import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { moduleRoutes } from "@/lib/constants/navigation";
import type { SearchMatchReason, SearchModule, SearchResultItem } from "@/lib/types/search";

type SearchResultCardProps = {
  item: SearchResultItem;
  matchLabels: Record<SearchMatchReason, string>;
};

export function SearchResultCard({ item, matchLabels }: SearchResultCardProps) {
  const primaryMatch = item.matches[0];

  return (
    <Link
      href={item.href}
      className="block rounded-xl border border-border/80 bg-card p-4 transition-shadow hover:shadow-sm"
    >
      <p className="font-medium text-foreground">{item.title}</p>
      {item.subtitle ? (
        <p className="mt-1 text-sm text-muted-foreground">{item.subtitle}</p>
      ) : null}
      {primaryMatch ? (
        <p className="mt-2 text-xs text-primary">
          {matchLabels[primaryMatch.reason]} · {primaryMatch.matchedText}
        </p>
      ) : null}
    </Link>
  );
}

type SearchResultGroupSectionProps = {
  module: SearchModule;
  title: string;
  count: number;
  items: SearchResultItem[];
  matchLabels: Record<SearchMatchReason, string>;
};

export function SearchResultGroupSection({
  title,
  count,
  items,
  matchLabels,
}: SearchResultGroupSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <span className="text-sm text-muted-foreground">{count}</span>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.id}>
            <SearchResultCard item={item} matchLabels={matchLabels} />
          </li>
        ))}
      </ul>
    </section>
  );
}

type SearchEmptyStateProps = {
  query: string;
};

export async function SearchEmptyState({ query }: SearchEmptyStateProps) {
  const t = await getTranslations("search");

  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-10 text-center">
      <h2 className="text-lg font-semibold text-foreground">
        {t("noResultsTitle")}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("noResultsDescription", { query })}
      </p>
      <ul className="mt-6 space-y-2 text-left text-sm text-muted-foreground">
        <li>· {t("noResultsHintSpelling")}</li>
        <li>· {t("noResultsHintBaseForm")}</li>
        <li>· {t("noResultsHintBrowse")}</li>
      </ul>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {moduleRoutes.map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className="rounded-lg bg-muted px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/80"
          >
            {t(`browse.${module.key}`)}
          </Link>
        ))}
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        {t("noResultsFeedbackPlaceholder")}
      </p>
    </div>
  );
}

export async function SearchInitialState() {
  const t = await getTranslations("search");

  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-border/80 bg-muted/20 px-6 py-10 text-center">
      <h2 className="text-lg font-semibold text-foreground">
        {t("initialTitle")}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {t("initialDescription")}
      </p>
    </div>
  );
}
