import type { SoundChangeCategory } from "@/lib/constants/sound-change-categories";

export type { SoundChangeCategory } from "@/lib/constants/sound-change-categories";

import type { LocalizedContent, PublicationStatus, Timestamps } from "@/lib/types/common";
import type { EntrySummary } from "@/lib/types/entry";

export type SoundChangeRuleStep = {
  id: string;
  soundChangeRuleId: string;
  stepOrder: number;
  beforeText: string;
  afterText: string;
  label?: string | null;
};

export type SoundChangeRule = Timestamps & {
  id: string;
  slug: string;
  nameKo: string;
  category: SoundChangeCategory;
  difficulty?: number | null;
  frequency?: number | null;
  sortOrder: number;
  status: PublicationStatus;
  exampleWordIds: string[];
};

export type SoundChangeRuleSummary = Pick<
  SoundChangeRule,
  "id" | "slug" | "nameKo" | "category" | "difficulty" | "frequency"
> & {
  title: LocalizedContent<string>;
  summary: LocalizedContent<string>;
};

export type SoundChangeRuleDetail = SoundChangeRule & {
  title: LocalizedContent<string>;
  summary: LocalizedContent<string>;
  explanation: LocalizedContent<string>;
  conditions: LocalizedContent<string>;
  exceptions: LocalizedContent<string | null>;
  steps: SoundChangeRuleStep[];
  exampleEntries: EntrySummary[];
  relatedRules: SoundChangeRuleSummary[];
};
