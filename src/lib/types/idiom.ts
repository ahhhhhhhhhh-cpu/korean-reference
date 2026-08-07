import type { IdiomCategory } from "@/lib/constants/idiom-categories";
import type { IdiomRegister } from "@/lib/constants/idiom-register";

export type { IdiomCategory } from "@/lib/constants/idiom-categories";
export type { IdiomRegister } from "@/lib/constants/idiom-register";

import type { LocalizedContent, PublicationStatus, Timestamps } from "@/lib/types/common";
import type { ExampleDetail } from "@/lib/types/example";

export type Idiom = Timestamps & {
  id: string;
  slug: string;
  idiomKo: string;
  idiomNormalized: string;
  register: IdiomRegister;
  categories: IdiomCategory[];
  status: PublicationStatus;
};

export type IdiomDetail = Idiom & {
  literalMeaning: LocalizedContent<string>;
  actualMeaning: LocalizedContent<string>;
  explanation: LocalizedContent<string | null>;
  usageContext: LocalizedContent<string | null>;
  commonMistakes: LocalizedContent<string | null>;
  examples: ExampleDetail[];
  relatedIdioms: IdiomSummary[];
};

export type IdiomSummary = Pick<
  Idiom,
  "id" | "slug" | "idiomKo" | "register" | "categories"
> & {
  actualMeaning: LocalizedContent<string>;
};
