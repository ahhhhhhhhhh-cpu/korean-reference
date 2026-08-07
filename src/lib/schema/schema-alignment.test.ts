import { describe, expect, it } from "vitest";

import { mockConjugationRules } from "@/data/mock/conjugation";
import { mockEntries } from "@/data/mock/entries";
import { CONJUGATION_FORM_KEYS } from "@/lib/constants/conjugation-forms";
import { CONJUGATION_FORM_I18N_KEYS } from "@/lib/i18n/conjugation-form-labels";
import { ETYMOLOGY_TYPES } from "@/lib/constants/etymology-type";
import { FEEDBACK_CATEGORIES, FEEDBACK_STATUSES, FEEDBACK_TARGET_KINDS } from "@/lib/types/feedback";
import { FREQUENCY_LEVELS } from "@/lib/constants/frequency-level";
import { IDIOM_CATEGORIES } from "@/lib/constants/idiom-categories";
import { IDIOM_REGISTERS } from "@/lib/constants/idiom-register";
import { IRREGULAR_TYPES } from "@/lib/constants/irregular-type";
import { PARTS_OF_SPEECH } from "@/lib/constants/part-of-speech";
import { PUBLICATION_STATUSES } from "@/lib/constants/publication-status";
import { SOUND_CHANGE_CATEGORIES } from "@/lib/constants/sound-change-categories";
import { SOURCE_TYPES } from "@/lib/types/source";
import { TRANSLATION_STATUSES } from "@/lib/constants/translation-status";
import {
  ENTRY_RELATION_TYPES,
  ENTRY_SOUND_CHANGE_RELATION_TYPES,
  IDIOM_RELATION_TYPES,
  SOUND_CHANGE_RELATION_TYPES,
} from "@/lib/types/relations";
import { DIFFICULTY_TIERS } from "@/lib/constants/difficulty-tier";
import { filterPublished } from "@/lib/adapters/mock/filter";
import { mockSearchAdapter } from "@/lib/adapters/mock/search";
import {
  difficultyTierForValue,
  matchesDifficultyTier,
} from "@/lib/modules/difficulty-tier";
import { getConjugationFormLabels } from "@/lib/i18n/conjugation-form-labels";
import { parseIdiomParams } from "@/lib/url/parse-module-params";

import en from "../../../messages/en.json";
import zh from "../../../messages/zh.json";
import ja from "../../../messages/ja.json";

function assertUnique(values: readonly string[]) {
  expect(new Set(values).size).toBe(values.length);
}

describe("schema alignment (Phase 5.1)", () => {
  it("excludes in_review entries from published results", () => {
    const published = filterPublished(mockEntries);
    expect(published.some((entry) => entry.slug === "review-sample")).toBe(false);
    expect(mockSearchAdapter.searchEntries("review-sample", "en")).toHaveLength(0);
    expect(mockSearchAdapter.searchEntries("심사단어", "en")).toHaveLength(0);
  });

  it("provides distinct trilingual labels for all six conjugation forms", () => {
    const locales = { en, zh, ja } as const;

    for (const form of CONJUGATION_FORM_KEYS) {
      const labels = Object.values(locales).map((messages) =>
        getConjugationFormLabels((key) => messages.data[key as keyof typeof messages.data] as string)[form]
      );
      expect(labels[0]).toBeTruthy();
      expect(labels[1]).toBeTruthy();
      expect(labels[2]).toBeTruthy();
      expect(new Set(labels).size).toBe(3);
    }

    const enLabels = getConjugationFormLabels((key) => en.data[key as keyof typeof en.data] as string);
    expect(enLabels.present_polite).not.toBe(enLabels.present_formal);
    expect(enLabels.past_polite).not.toBe(enLabels.past_formal);
    expect(enLabels.present_informal).not.toBe(enLabels.present_polite);
    expect(enLabels.propositive).not.toBe(enLabels.present_polite);
  });

  it("maps all four conjugation rule mocks to isIrregular + irregularType", () => {
    expect(mockConjugationRules).toHaveLength(4);

    const regular = mockConjugationRules.find((rule) => rule.slug === "regular-eoyo");
    expect(regular?.isIrregular).toBe(false);
    expect(regular?.irregularType).toBeNull();

    expect(
      mockConjugationRules.filter((rule) => rule.isIrregular).map((rule) => rule.irregularType)
    ).toEqual(["ㄷ", "ㅂ", "르"]);
  });

  it("maps sound change difficulty 1–5 to beginner/intermediate/advanced tiers", () => {
    expect(matchesDifficultyTier(1, "beginner")).toBe(true);
    expect(matchesDifficultyTier(2, "beginner")).toBe(true);
    expect(matchesDifficultyTier(3, "intermediate")).toBe(true);
    expect(matchesDifficultyTier(4, "advanced")).toBe(true);
    expect(matchesDifficultyTier(5, "advanced")).toBe(true);
    expect(difficultyTierForValue(5)).toBe("advanced");
  });

  it("ignores invalid idiom register URL values", () => {
    expect(parseIdiomParams({ register: "invalid-register" })).toEqual({
      category: undefined,
      register: undefined,
      q: undefined,
    });
  });

  it("keeps canonical code sets duplicate-free", () => {
    assertUnique(PUBLICATION_STATUSES);
    assertUnique(TRANSLATION_STATUSES);
    assertUnique(ETYMOLOGY_TYPES);
    assertUnique(IRREGULAR_TYPES);
    assertUnique(PARTS_OF_SPEECH);
    assertUnique(FREQUENCY_LEVELS);
    assertUnique(DIFFICULTY_TIERS);
    assertUnique(SOUND_CHANGE_CATEGORIES);
    assertUnique(CONJUGATION_FORM_KEYS);
    assertUnique(IDIOM_CATEGORIES);
    assertUnique(IDIOM_REGISTERS);
    assertUnique(ENTRY_RELATION_TYPES);
    assertUnique(SOUND_CHANGE_RELATION_TYPES);
    assertUnique(IDIOM_RELATION_TYPES);
    assertUnique(ENTRY_SOUND_CHANGE_RELATION_TYPES);
    assertUnique(SOURCE_TYPES);
    assertUnique(FEEDBACK_TARGET_KINDS);
    assertUnique(FEEDBACK_CATEGORIES);
    assertUnique(FEEDBACK_STATUSES);
    assertUnique(Object.values(CONJUGATION_FORM_I18N_KEYS));
  });
});
