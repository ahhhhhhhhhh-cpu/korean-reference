import { Link } from "@/i18n/navigation";
import type { EntrySummary } from "@/lib/types/entry";

import { LocalizedText } from "@/components/content/localized-text";

type EntrySummaryCardProps = {
  entry: EntrySummary;
  inProgressLabel: string;
  viewDetailsLabel: string;
};

export function EntrySummaryCard({
  entry,
  inProgressLabel,
  viewDetailsLabel,
}: EntrySummaryCardProps) {
  return (
    <Link
      href={`/entries/${entry.slug}`}
      className="block rounded-xl border border-border/80 bg-card p-4 transition-shadow hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-semibold text-foreground">{entry.headwordKo}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {entry.partOfSpeech}
            {entry.irregularType ? ` · ${entry.irregularType} irregular` : ""}
            {entry.hanjaText ? ` · ${entry.hanjaText}` : ""}
          </p>
        </div>
        <span className="shrink-0 text-xs font-medium text-primary">{viewDetailsLabel}</span>
      </div>
      <div className="mt-3">
        <LocalizedText
          content={entry.definition}
          inProgressLabel={inProgressLabel}
        />
      </div>
    </Link>
  );
}
