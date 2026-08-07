import {
  CONJUGATION_FORM_KEYS,
  isConjugationFormKey,
} from "@/lib/constants/conjugation-forms";
import { isDifficultyTier } from "@/lib/constants/difficulty-tier";
import { isIdiomCategory } from "@/lib/constants/idiom-categories";
import { isIdiomRegister } from "@/lib/constants/idiom-register";
import { isPartOfSpeech } from "@/lib/constants/part-of-speech";
import { isSoundChangeCategory } from "@/lib/constants/sound-change-categories";
import type {
  HanjaFilters,
  IdiomFilters,
  SoundChangeFilters,
} from "@/lib/types/module-filters";

function pickString(
  params: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const value = params[key];
  if (Array.isArray(value)) return value[0];
  return value || undefined;
}

export function parseSoundChangeParams(
  params: Record<string, string | string[] | undefined>
): SoundChangeFilters {
  const categoryRaw = pickString(params, "category");
  const difficultyRaw = pickString(params, "difficulty");
  const q = pickString(params, "q");

  return {
    category:
      categoryRaw && isSoundChangeCategory(categoryRaw)
        ? categoryRaw
        : undefined,
    difficulty:
      difficultyRaw && isDifficultyTier(difficultyRaw)
        ? difficultyRaw
        : undefined,
    q,
  };
}

export function parseHanjaParams(
  params: Record<string, string | string[] | undefined>
): HanjaFilters {
  const partOfSpeechRaw = pickString(params, "partOfSpeech");

  return {
    character: pickString(params, "character"),
    partOfSpeech:
      partOfSpeechRaw && isPartOfSpeech(partOfSpeechRaw)
        ? partOfSpeechRaw
        : undefined,
    q: pickString(params, "q"),
  };
}

export function parseIdiomParams(
  params: Record<string, string | string[] | undefined>
): IdiomFilters {
  const categoryRaw = pickString(params, "category");
  const registerRaw = pickString(params, "register");

  return {
    category:
      categoryRaw && isIdiomCategory(categoryRaw) ? categoryRaw : undefined,
    register:
      registerRaw && isIdiomRegister(registerRaw) ? registerRaw : undefined,
    q: pickString(params, "q"),
  };
}

export function parseConjugationParams(
  params: Record<string, string | string[] | undefined>
) {
  const entrySlug = pickString(params, "entry");
  const formRaw = pickString(params, "form");
  const form =
    formRaw && isConjugationFormKey(formRaw) ? formRaw : undefined;

  return { entrySlug, form };
}

export { CONJUGATION_FORM_KEYS };

export function hasActiveSoundChangeFilters(filters: SoundChangeFilters): boolean {
  return Boolean(filters.category || filters.difficulty || filters.q?.trim());
}

export function hasActiveHanjaFilters(filters: HanjaFilters): boolean {
  return Boolean(
    filters.character || filters.partOfSpeech || filters.q?.trim()
  );
}

export function hasActiveIdiomFilters(filters: IdiomFilters): boolean {
  return Boolean(filters.category || filters.register || filters.q?.trim());
}
