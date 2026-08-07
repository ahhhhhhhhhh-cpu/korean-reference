import type { ConjugationFormKey } from "@/lib/constants/conjugation-forms";
import type { DifficultyTier } from "@/lib/constants/difficulty-tier";
import type { IdiomCategory } from "@/lib/constants/idiom-categories";
import type { IdiomRegister } from "@/lib/constants/idiom-register";
import type { PartOfSpeech } from "@/lib/constants/part-of-speech";
import type { SoundChangeCategory } from "@/lib/constants/sound-change-categories";

export type { DifficultyTier } from "@/lib/constants/difficulty-tier";

export type SoundChangeFilters = {
  category?: SoundChangeCategory;
  difficulty?: DifficultyTier;
  q?: string;
};

export type SoundChangeFilterOptions = {
  categories: SoundChangeCategory[];
  difficultyTiers: DifficultyTier[];
};

export type HanjaFilters = {
  character?: string;
  partOfSpeech?: PartOfSpeech;
  q?: string;
};

export type HanjaFilterOptions = {
  characters: string[];
  partsOfSpeech: PartOfSpeech[];
};

export type IdiomFilters = {
  category?: IdiomCategory;
  register?: IdiomRegister;
  q?: string;
};

export type IdiomFilterOptions = {
  categories: IdiomCategory[];
  registers: IdiomRegister[];
};

export type ConjugationCriteria = {
  entrySlug?: string;
  form?: ConjugationFormKey;
};

export type ConjugationEntryOption = {
  slug: string;
  headwordKo: string;
  romanization: string | null;
  partOfSpeech: PartOfSpeech;
};

export type ConjugationFormOption = {
  targetForm: ConjugationFormKey;
  available: boolean;
};

export type ConjugationModuleOptions = {
  entries: ConjugationEntryOption[];
  formsByEntry: Record<string, ConjugationFormOption[]>;
};
