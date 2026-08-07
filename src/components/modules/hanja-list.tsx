import { LocalizedText } from "@/components/content/localized-text";
import { Link } from "@/i18n/navigation";
import type { HanjaEntrySummary } from "@/lib/types/hanja";

type HanjaListProps = {
  entries: HanjaEntrySummary[];
  inProgressLabel: string;
  viewLabel: string;
  tableHeaders: { character: string; reading: string; meaning: string; word: string };
};

export function HanjaList({
  entries,
  inProgressLabel,
  viewLabel,
  tableHeaders,
}: HanjaListProps) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border/80 md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{tableHeaders.word}</th>
              <th className="px-4 py-3 font-medium">{tableHeaders.character}</th>
              <th className="px-4 py-3 font-medium">{tableHeaders.reading}</th>
              <th className="px-4 py-3 font-medium">{tableHeaders.meaning}</th>
              <th className="px-4 py-3 font-medium sr-only">Action</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-t border-border/60">
                <td className="px-4 py-3 font-medium">{entry.wordKo}</td>
                <td className="px-4 py-3">{entry.hanjaText}</td>
                <td className="px-4 py-3">{entry.pronunciation}</td>
                <td className="max-w-xs px-4 py-3">
                  <LocalizedText
                    content={entry.definition}
                    inProgressLabel={inProgressLabel}
                  />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/hanja/${entry.slug}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {viewLabel}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="grid gap-3 md:hidden">
        {entries.map((entry) => (
          <li key={entry.id}>
            <Link
              href={`/hanja/${entry.slug}`}
              className="block rounded-xl border border-border/80 bg-card p-4"
            >
              <p className="text-lg font-semibold break-words text-foreground">
                {entry.wordKo}{" "}
                <span className="text-base font-normal text-muted-foreground">
                  {entry.hanjaText}
                </span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {entry.pronunciation}
              </p>
              <LocalizedText
                content={entry.definition}
                inProgressLabel={inProgressLabel}
                className="mt-2"
              />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
