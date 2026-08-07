import type { ConjugationResult, ConjugationRule } from "@/lib/types/conjugation";
import type { ConjugationRuleTranslation } from "@/lib/types/translation";

import { ids, ts } from "./_shared";

export const mockConjugationRules: ConjugationRule[] = [
  {
    id: "cgr-001",
    slug: "d-irregular",
    nameKo: "ㄷ 불규칙",
    isIrregular: true,
    irregularType: "ㄷ",
    status: "published",
    ...ts(),
  },
  {
    id: "cgr-002",
    slug: "regular-eoyo",
    nameKo: "어/아요",
    isIrregular: false,
    irregularType: null,
    status: "published",
    ...ts(),
  },
  {
    id: "cgr-003",
    slug: "b-irregular",
    nameKo: "ㅂ 불규칙",
    isIrregular: true,
    irregularType: "ㅂ",
    status: "published",
    ...ts(),
  },
  {
    id: "cgr-004",
    slug: "reu-irregular",
    nameKo: "르 불규칙",
    isIrregular: true,
    irregularType: "르",
    status: "published",
    ...ts(),
  },
];

export const mockConjugationRuleTranslations: ConjugationRuleTranslation[] = [
  {
    id: "cgrt-d-en",
    conjugationRuleId: "cgr-001",
    locale: "en",
    title: "ㄷ irregular",
    explanation: "When the stem ends in ㄷ, it often changes to ㄹ before a vowel.",
  },
  {
    id: "cgrt-d-zh",
    conjugationRuleId: "cgr-001",
    locale: "zh",
    title: "ㄷ 不规则",
    explanation: "词干末 ㄷ 在元音前常变为 ㄹ。",
  },
  {
    id: "cgrt-d-ja",
    conjugationRuleId: "cgr-001",
    locale: "ja",
    title: "ㄷ 不規則",
    explanation: "語幹末の ㄷ は母音の前で ㄹ になることが多い。",
  },
  {
    id: "cgrt-reg-en",
    conjugationRuleId: "cgr-002",
    locale: "en",
    title: "Present polite ending",
    explanation: "Attach 어요/아요 to the stem.",
  },
  {
    id: "cgrt-reg-zh",
    conjugationRuleId: "cgr-002",
    locale: "zh",
    title: "现在敬语结尾",
    explanation: "在词干后接 어요/아요。",
  },
  {
    id: "cgrt-reg-ja",
    conjugationRuleId: "cgr-002",
    locale: "ja",
    title: "現在の敬語語尾",
    explanation: "語幹に 어요/아요 を付けます。",
  },
  {
    id: "cgrt-b-en",
    conjugationRuleId: "cgr-003",
    locale: "en",
    title: "ㅂ irregular",
    explanation: "When the stem ends in ㅂ, it changes to 우 before a vowel ending.",
  },
  {
    id: "cgrt-b-zh",
    conjugationRuleId: "cgr-003",
    locale: "zh",
    title: "ㅂ 不规则",
    explanation: "词干末 ㅂ 在元音语尾前变为 우。",
  },
  {
    id: "cgrt-b-ja",
    conjugationRuleId: "cgr-003",
    locale: "ja",
    title: "ㅂ 不規則",
    explanation: "語幹末の ㅂ は母音語尾の前で 우 に変化します。",
  },
  {
    id: "cgrt-reu-en",
    conjugationRuleId: "cgr-004",
    locale: "en",
    title: "르 irregular",
    explanation: "When the stem contains 르, an extra ㄹ is inserted and one ㄹ is dropped.",
  },
  {
    id: "cgrt-reu-zh",
    conjugationRuleId: "cgr-004",
    locale: "zh",
    title: "르 不规则",
    explanation: "词干含 르 时，插入 ㄹ 并脱落其中一个 ㄹ。",
  },
  {
    id: "cgrt-reu-ja",
    conjugationRuleId: "cgr-004",
    locale: "ja",
    title: "르 不規則",
    explanation: "語幹に 르 がある場合、ㄹ を挿入し一方を脱落します。",
  },
];

export type MockConjugationStep = {
  order: number;
  descriptions: Partial<Record<"en" | "zh" | "ja", string>>;
};

export type MockConjugationResult = ConjugationResult & {
  steps: MockConjugationStep[];
};

export const mockConjugationResults: MockConjugationResult[] = [
  {
    id: ids.conjugation.deutdaEoyo,
    entryId: ids.entries.deutda,
    entrySlug: "deutda",
    conjugationRuleId: "cgr-001",
    targetForm: "present_polite",
    resultKo: "들어요",
    stemKo: "들",
    isIrregular: true,
    irregularNote: "ㄷ → ㄹ before vowel",
    status: "published",
    steps: [
      {
        order: 1,
        descriptions: {
          en: "Remove 다 from the dictionary form.",
          zh: "去掉词尾 다。",
          ja: "辞書形から 다 を取り除きます。",
        },
      },
      {
        order: 2,
        descriptions: {
          en: "Identify ㄷ irregular: stem ㄷ becomes ㄹ.",
          zh: "识别 ㄷ 不规则：词干 ㄷ 变为 ㄹ。",
          ja: "ㄷ 不規則を確認：ㄷ が ㄹ に変化。",
        },
      },
      {
        order: 3,
        descriptions: {
          en: "Attach 어요 to form 들어요.",
          zh: "接 어요 得到 들어요。",
          ja: "어요 を付けて 들어요 になります。",
        },
      },
    ],
    ...ts(),
  },
  {
    id: ids.conjugation.gadaPast,
    entryId: ids.entries.gada,
    entrySlug: "gada",
    conjugationRuleId: "cgr-002",
    targetForm: "past_polite",
    resultKo: "갔어요",
    stemKo: "가",
    isIrregular: false,
    irregularNote: null,
    status: "published",
    steps: [
      {
        order: 1,
        descriptions: {
          en: "Remove 다 → stem 가.",
          zh: "去掉 다，词干为 가。",
          ja: "다 を取り除き、語幹は 가。",
        },
      },
      {
        order: 2,
        descriptions: {
          en: "Add past marker and ending → 갔어요.",
          zh: "加过去时标记与语尾 → 갔어요。",
          ja: "過去形マーカーと語尾を付けて 갔어요。",
        },
      },
    ],
    ...ts(),
  },
  {
    id: ids.conjugation.yeppeudaEoyo,
    entryId: ids.entries.yeppeuda,
    entrySlug: "yeppeuda",
    conjugationRuleId: "cgr-002",
    targetForm: "present_polite",
    resultKo: "예뻐요",
    stemKo: "예쁘",
    isIrregular: false,
    irregularNote: null,
    status: "published",
    steps: [
      {
        order: 1,
        descriptions: {
          en: "Remove 다 from 예쁘다.",
          zh: "去掉 예쁘다 的 다。",
          ja: "예쁘다 から 다 を取り除きます。",
        },
      },
      {
        order: 2,
        descriptions: {
          en: "Attach 어요 → 예뻐요 (ㅡ deletion applies).",
          zh: "接 어요 → 예뻐요（含 ㅡ 脱落）。",
          ja: "어요 を付けて 예뻐요（ㅡ 脱落）。",
        },
      },
    ],
    ...ts(),
  },
  {
    id: ids.conjugation.meokdaEoyo,
    entryId: ids.entries.meokda,
    entrySlug: "meokda",
    conjugationRuleId: "cgr-002",
    targetForm: "present_polite",
    resultKo: "먹어요",
    stemKo: "먹",
    isIrregular: false,
    irregularNote: null,
    status: "published",
    steps: [
      {
        order: 1,
        descriptions: {
          en: "Remove 다 from 먹다 → stem 먹.",
          zh: "去掉 먹다 的 다，词干为 먹。",
          ja: "먹다 から 다 を取り除き、語幹は 먹。",
        },
      },
      {
        order: 2,
        descriptions: {
          en: "Attach 어요 → 먹어요 (regular conjugation).",
          zh: "接 어요 → 먹어요（规则活用）。",
          ja: "어요 を付けて 먹어요（規則活用）。",
        },
      },
    ],
    ...ts(),
  },
  {
    id: ids.conjugation.sipdaEoyo,
    entryId: ids.entries.sipda,
    entrySlug: "sipda",
    conjugationRuleId: "cgr-003",
    targetForm: "present_polite",
    resultKo: "쉬워요",
    stemKo: "쉬",
    isIrregular: true,
    irregularNote: "ㅂ → 우 before vowel",
    status: "published",
    steps: [
      {
        order: 1,
        descriptions: {
          en: "Remove 다 from 쉽다.",
          zh: "去掉 쉽다 的 다。",
          ja: "쉽다 から 다 を取り除きます。",
        },
      },
      {
        order: 2,
        descriptions: {
          en: "Identify ㅂ irregular: stem ㅂ becomes 우 → 쉬.",
          zh: "识别 ㅂ 不规则：词干 ㅂ 变为 우 → 쉬。",
          ja: "ㅂ 不規則を確認：ㅂ が 우 になり語幹は 쉬。",
        },
      },
      {
        order: 3,
        descriptions: {
          en: "Attach 어요 → 쉬워요.",
          zh: "接 어요 → 쉬워요。",
          ja: "어요 を付けて 쉬워요。",
        },
      },
    ],
    ...ts(),
  },
  {
    id: ids.conjugation.oreudaEoyo,
    entryId: ids.entries.oreuda,
    entrySlug: "oreuda",
    conjugationRuleId: "cgr-004",
    targetForm: "present_polite",
    resultKo: "올라요",
    stemKo: "올라",
    isIrregular: true,
    irregularNote: "르 → ㄹㄹ, then one ㄹ drops",
    status: "published",
    steps: [
      {
        order: 1,
        descriptions: {
          en: "Remove 다 from 오르다.",
          zh: "去掉 오르다 的 다。",
          ja: "오르다 から 다 を取り除きます。",
        },
      },
      {
        order: 2,
        descriptions: {
          en: "Identify 르 irregular: 오르 + 아요 → 올라요.",
          zh: "识别 르 不规则：오르 + 아요 → 올라요。",
          ja: "르 不規則を確認：오르 + 아요 → 올라요。",
        },
      },
    ],
    ...ts(),
  },
  {
    id: ids.conjugation.draftConj,
    entryId: ids.entries.draftWord,
    entrySlug: "draft-sample",
    conjugationRuleId: null,
    targetForm: "present_polite",
    resultKo: "초안이에요",
    stemKo: "초안",
    isIrregular: false,
    irregularNote: null,
    status: "draft",
    steps: [],
    ...ts(false),
  },
];
