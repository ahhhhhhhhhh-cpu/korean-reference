import type { Example } from "@/lib/types/example";
import type { ExampleTranslation } from "@/lib/types/translation";

import { ids, ts } from "./_shared";

export const mockExamples: Example[] = [
  {
    id: "ex-gada-1",
    entryId: ids.entries.gada,
    idiomId: null,
    soundChangeRuleId: null,
    sentenceKo: "학교에 가요.",
    sortOrder: 1,
    status: "published",
    ...ts(),
  },
  {
    id: "ex-deutda-1",
    entryId: ids.entries.deutda,
    idiomId: null,
    soundChangeRuleId: null,
    sentenceKo: "음악을 들어요.",
    sortOrder: 1,
    status: "published",
    ...ts(),
  },
  {
    id: "ex-hakgyo-1",
    entryId: ids.entries.hakgyo,
    idiomId: null,
    soundChangeRuleId: null,
    sentenceKo: "학교가 커요.",
    sortOrder: 1,
    status: "published",
    ...ts(),
  },
  {
    id: "ex-idiom-1",
    entryId: null,
    idiomId: ids.idioms.sikeunJuk,
    soundChangeRuleId: null,
    sentenceKo: "이 문제는 식은 죽 먹기예요.",
    sortOrder: 1,
    status: "published",
    ...ts(),
  },
  {
    id: "ex-draft",
    entryId: ids.entries.draftWord,
    idiomId: null,
    soundChangeRuleId: null,
    sentenceKo: "초안 예문입니다.",
    sortOrder: 1,
    status: "draft",
    ...ts(false),
  },
];

export const mockExampleTranslations: ExampleTranslation[] = [
  {
    id: "ext-gada-1-en",
    exampleId: "ex-gada-1",
    locale: "en",
    translation: "I go to school.",
  },
  {
    id: "ext-gada-1-zh",
    exampleId: "ex-gada-1",
    locale: "zh",
    translation: "我去学校。",
  },
  {
    id: "ext-gada-1-ja",
    exampleId: "ex-gada-1",
    locale: "ja",
    translation: "学校へ行きます。",
  },
  {
    id: "ext-deutda-1-en",
    exampleId: "ex-deutda-1",
    locale: "en",
    translation: "I listen to music.",
  },
  {
    id: "ext-deutda-1-zh",
    exampleId: "ex-deutda-1",
    locale: "zh",
    translation: "我听音乐。",
  },
  {
    id: "ext-deutda-1-ja",
    exampleId: "ex-deutda-1",
    locale: "ja",
    translation: "音楽を聞きます。",
  },
  {
    id: "ext-hakgyo-1-en",
    exampleId: "ex-hakgyo-1",
    locale: "en",
    translation: "The school is big.",
  },
  {
    id: "ext-hakgyo-1-zh",
    exampleId: "ex-hakgyo-1",
    locale: "zh",
    translation: "学校很大。",
  },
  {
    id: "ext-idiom-1-en",
    exampleId: "ex-idiom-1",
    locale: "en",
    translation: "This problem is a piece of cake.",
  },
  {
    id: "ext-idiom-1-zh",
    exampleId: "ex-idiom-1",
    locale: "zh",
    translation: "这个问题轻而易举。",
  },
];
