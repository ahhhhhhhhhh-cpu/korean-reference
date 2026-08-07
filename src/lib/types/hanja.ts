import type { LocalizedContent } from "@/lib/types/common";
import type {
  PartOfSpeech,
  PublicationStatus,
  RomanizationFields,
  Timestamps,
} from "@/lib/types/common";

export type HanjaCharacter = {
  id: string;
  hanjaEntryId: string;
  character: string;
  readingKo: string;
  meaning: string;
  sortOrder: number;
};

export type HanjaEntry = Timestamps &
  RomanizationFields & {
    id: string;
    slug: string;
    wordKo: string;
    hanjaText: string;
    /** Legacy display field; search uses `romanization` when set. */
    pronunciation: string;
    partOfSpeech: PartOfSpeech;
    entryId?: string | null;
    entrySlug?: string | null;
    status: PublicationStatus;
  };

export type HanjaEntrySummary = Pick<
  HanjaEntry,
  "id" | "slug" | "wordKo" | "hanjaText" | "pronunciation" | "partOfSpeech"
> & {
  definition: LocalizedContent<string>;
};

export type HanjaEntryDetail = HanjaEntry & {
  definition: LocalizedContent<string>;
  notes: LocalizedContent<string | null>;
  characters: HanjaCharacter[];
  relatedByCharacter: HanjaEntrySummary[];
};
