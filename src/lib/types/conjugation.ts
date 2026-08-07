import type { ConjugationFormKey } from "@/lib/constants/conjugation-forms";
import type { IrregularType } from "@/lib/constants/irregular-type";
import type { PublicationStatus } from "@/lib/constants/publication-status";
import type { LocalizedContent, Timestamps } from "@/lib/types/common";
import type { ExampleDetail } from "@/lib/types/example";

export type { ConjugationFormKey } from "@/lib/constants/conjugation-forms";

export type ConjugationStep = {
  order: number;
  description: LocalizedContent<string>;
};

export type ConjugationRule = Timestamps & {
  id: string;
  slug: string;
  nameKo: string;
  isIrregular: boolean;
  irregularType: IrregularType | null;
  status: PublicationStatus;
};

export type ConjugationRuleDetail = ConjugationRule & {
  title: LocalizedContent<string>;
  explanation: LocalizedContent<string>;
};

/** Recorded conjugation result for a specific entry + form. */
export type ConjugationResult = Timestamps & {
  id: string;
  entryId: string;
  entrySlug: string;
  conjugationRuleId?: string | null;
  targetForm: ConjugationFormKey;
  resultKo: string;
  stemKo: string;
  isIrregular: boolean;
  irregularNote?: string | null;
  status: PublicationStatus;
};

export type ConjugationResultDetail = ConjugationResult & {
  entryHeadword: string;
  irregularType: IrregularType | null;
  steps: ConjugationStep[];
  ruleTitle: LocalizedContent<string | null>;
};

export type ConjugationLookupDetail = ConjugationResultDetail & {
  examples: ExampleDetail[];
};

export type ConjugationResultSummary = Pick<
  ConjugationResult,
  "id" | "entrySlug" | "targetForm" | "resultKo" | "isIrregular"
> & {
  entryHeadword: string;
};
