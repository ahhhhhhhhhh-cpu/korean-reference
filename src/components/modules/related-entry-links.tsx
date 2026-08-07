import { Link } from "@/i18n/navigation";
import type { EntrySummary } from "@/lib/types/entry";

type RelatedEntryLinksProps = {
  title: string;
  entries: EntrySummary[];
  viewLabel: string;
};

export function RelatedEntryLinks({
  title,
  entries,
  viewLabel,
}: RelatedEntryLinksProps) {
  if (entries.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <ul className="flex flex-wrap gap-2">
        {entries.map((entry) => (
          <li key={entry.id}>
            <Link
              href={`/entries/${entry.slug}`}
              className="inline-flex items-center rounded-lg border border-border/80 bg-muted/30 px-3 py-1.5 text-sm font-medium hover:bg-muted/60"
            >
              {entry.headwordKo}
              <span className="ml-2 text-xs text-primary">{viewLabel}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
