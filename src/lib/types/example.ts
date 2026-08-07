import type { LocalizedContent, PublicationStatus, Timestamps } from "@/lib/types/common";

export type Example = Timestamps & {
  id: string;
  entryId?: string | null;
  idiomId?: string | null;
  soundChangeRuleId?: string | null;
  sentenceKo: string;
  sortOrder: number;
  status: PublicationStatus;
};

export type ExampleDetail = Example & {
  translation: LocalizedContent<string>;
};
