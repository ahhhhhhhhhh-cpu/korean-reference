import { describe, expect, it } from "vitest";

import {
  mapEntryDetail,
  mapEntrySummary,
  type EntryBundle,
} from "@/lib/adapters/supabase/mappers/entries";
import {
  mapConjugationResultSummary,
  mapConjugationRuleNameKo,
  type ConjugationResultBundle,
} from "@/lib/adapters/supabase/mappers/conjugation";
import {
  mapHanjaEntrySummary,
  mapHanjaCharacters,
  type HanjaTermBundle,
} from "@/lib/adapters/supabase/mappers/hanja";
import {
  mapIdiomDetail,
  mapIdiomSummary,
  type IdiomBundle,
} from "@/lib/adapters/supabase/mappers/idioms";
import {
  mapSoundChangeRuleSummary,
  type SoundChangeRuleBundle,
} from "@/lib/adapters/supabase/mappers/sound-change";
import {
  filterPublishedTranslationRows,
  pickLocalized,
} from "@/lib/adapters/supabase/mappers/translations";

const entryBundle: EntryBundle = {
  entry: {
    id: "entry-1",
    slug: "gada",
    headword: "가다",
    headword_normalized: "가다",
    romanization: "gada",
    romanization_normalized: "gada",
    pronunciation_hangul: "[가다]",
    pronunciation_romanization: null,
    part_of_speech: "verb",
    etymology_type: "native",
    stem: "가",
    irregular_type: null,
    difficulty_level: "beginner",
    frequency_level: "high",
    topik_level: null,
    status: "published",
    import_key: null,
    archived_at: null,
    published_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  senses: [
    {
      sense: {
        id: "sense-1",
        entry_id: "entry-1",
        sense_order: 1,
        is_primary: true,
        register: "neutral",
        status: "published",
        import_key: null,
        archived_at: null,
        published_at: null,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
      translations: [
        {
          id: "st-en",
          sense_id: "sense-1",
          locale: "en",
          short_definition: "to go",
          definition: "To move from one place to another.",
          usage_note: "Common daily verb.",
          nuance_note: null,
          status: "published",
          import_key: null,
          published_at: null,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
        {
          id: "st-zh-draft",
          sense_id: "sense-1",
          locale: "zh",
          short_definition: "去",
          definition: "draft only",
          usage_note: null,
          nuance_note: null,
          status: "draft",
          import_key: null,
          published_at: null,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ],
    },
  ],
  entryTranslations: [
    {
      id: "et-en",
      entry_id: "entry-1",
      locale: "en",
      general_note: "General entry note.",
      etymology_note: null,
      irregular_note: null,
      status: "published",
      import_key: null,
      published_at: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
  ],
  examples: [],
  hanjaText: null,
  soundChangeRuleIds: [],
  relatedEntrySlugs: [],
};

const soundChangeBundle: SoundChangeRuleBundle = {
  rule: {
    id: "rule-1",
    slug: "liaison-hakgyo",
    category: "liaison",
    difficulty: 2,
    frequency: 4,
    input_pattern: "ㄱ+ㄱ",
    output_pattern: "ㄲ",
    status: "published",
    import_key: null,
    archived_at: null,
    published_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  translations: [
    {
      id: "sct-en",
      rule_id: "rule-1",
      locale: "en",
      name: "Liaison in 학교",
      short_summary: "Consonant liaison at morpheme boundary.",
      description: "Full explanation.",
      conditions: "At boundaries.",
      exceptions: null,
      cautions: null,
      status: "published",
      import_key: null,
      published_at: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
  ],
  steps: [],
  stepTranslations: [],
  exampleEntryIds: [],
  sortOrder: 1,
};

const conjugationBundle: ConjugationResultBundle = {
  result: {
    id: "result-1",
    entry_id: "entry-1",
    form_id: "form-1",
    rule_id: "rule-1",
    result: "가요",
    result_normalized: "가요",
    stem_used: "가",
    is_irregular: false,
    irregular_type: null,
    variant_order: 1,
    is_preferred: true,
    status: "published",
    import_key: null,
    archived_at: null,
    published_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  form: {
    id: "form-1",
    code: "present_polite",
    sort_order: 1,
    status: "published",
    import_key: null,
    archived_at: null,
    published_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  entrySlug: "gada",
  entryHeadword: "가다",
  entryIrregularType: null,
  rule: {
    id: "rule-1",
    slug: "regular-eoyo",
    rule_code: "REGULAR_EOYO",
    is_irregular: false,
    irregular_type: null,
    rule_category: "regular",
    status: "published",
    import_key: null,
    archived_at: null,
    published_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  ruleTranslations: [],
  steps: [],
  stepTranslations: [],
};

const hanjaBundle: HanjaTermBundle = {
  term: {
    id: "term-1",
    entry_id: "entry-hakgyo",
    slug: "hakgyo-hanja",
    korean_hanja: "學校",
    simplified_chinese: "学校",
    japanese_shinjitai: null,
    is_primary: true,
    status: "published",
    import_key: null,
    archived_at: null,
    published_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  entry: {
    id: "entry-hakgyo",
    slug: "hakgyo",
    headword: "학교",
    headword_normalized: "학교",
    romanization: "hakgyo",
    romanization_normalized: "hakgyo",
    pronunciation_hangul: "[학꾜]",
    pronunciation_romanization: null,
    part_of_speech: "noun",
    etymology_type: "sino_korean",
    stem: null,
    irregular_type: null,
    difficulty_level: "intermediate",
    frequency_level: "high",
    topik_level: null,
    status: "published",
    import_key: null,
    archived_at: null,
    published_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  characters: [
    {
      slot: {
        id: "slot-1",
        term_id: "term-1",
        character_id: "char-1",
        reading_id: "read-1",
        position: 1,
        created_at: "2026-01-01T00:00:00Z",
      },
      character: {
        id: "char-1",
        character: "學",
        simplified_chinese: "学",
        radical: "子",
        stroke_count: 16,
        status: "published",
        import_key: null,
        archived_at: null,
        published_at: null,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
      reading: {
        id: "read-1",
        character_id: "char-1",
        reading_hangul: "학",
        reading_romanization: "hak",
        is_primary: true,
        display_order: 1,
        status: "published",
        import_key: null,
        published_at: null,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
      termMeaningTranslations: [
        {
          id: "tct-1",
          term_character_id: "slot-1",
          locale: "en",
          meaning_in_term: "study",
          status: "published",
          import_key: null,
          published_at: null,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ],
      characterMeaningTranslations: [],
    },
  ],
  entrySenseTranslations: [
    {
      id: "sense-hakgyo-en",
      sense_id: "sense-hakgyo",
      locale: "en",
      short_definition: "school",
      definition: "An institution for education.",
      usage_note: null,
      nuance_note: null,
      status: "published",
      import_key: null,
      published_at: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
  ],
  entryGeneralNotes: [],
};

const idiomBundle: IdiomBundle = {
  idiom: {
    id: "idiom-1",
    slug: "sikeun-juk-meokgi",
    expression: "식은 죽 먹기",
    expression_normalized: "식은죽먹기",
    romanization: "sikeun juk meokgi",
    romanization_normalized: "sikeun juk meokgi",
    register: "informal",
    status: "published",
    import_key: null,
    archived_at: null,
    published_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  translations: [
    {
      id: "it-en",
      idiom_id: "idiom-1",
      locale: "en",
      literal_meaning: "eat cold porridge",
      actual_meaning: "very easy; a piece of cake",
      usage_scenario: "Casual conversation.",
      common_misuse: "Do not use in formal writing.",
      nuance_note: "Lighthearted exaggeration.",
      status: "published",
      import_key: null,
      published_at: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
  ],
  categories: ["daily", "colloquial"],
  examples: [],
};

describe("Supabase mappers (Phase 6C)", () => {
  it("maps entry headword to headwordKo", () => {
    const summary = mapEntrySummary(entryBundle, "en");
    expect(summary.headwordKo).toBe("가다");
  });

  it("maps primary sense translation to definition", () => {
    const summary = mapEntrySummary(entryBundle, "en");
    expect(summary.definition.value).toBe("to go");
    expect(summary.definition.resolvedLocale).toBe("en");
  });

  it("maps entry_translations.general_note to notes", () => {
    const detail = mapEntryDetail(entryBundle, "en");
    expect(detail.notes.value).toBe("General entry note.");
  });

  it("maps sense usage_note to usageNotes", () => {
    const detail = mapEntryDetail(entryBundle, "en");
    expect(detail.usageNotes.value).toBe("Common daily verb.");
  });

  it("filters draft sense translations in definition", () => {
    const summary = mapEntrySummary(entryBundle, "zh");
    expect(summary.definition.resolvedLocale).toBe("en");
    expect(summary.definition.usedFallback).toBe(true);
  });

  it("maps sound change input_pattern to nameKo and translation fields", () => {
    const summary = mapSoundChangeRuleSummary(soundChangeBundle, "en");
    expect(summary.nameKo).toBe("ㄱ+ㄱ");
    expect(summary.title.value).toBe("Liaison in 학교");
    expect(summary.summary.value).toBe("Consonant liaison at morpheme boundary.");
  });

  it("maps conjugation form code, result, and rule_code", () => {
    const summary = mapConjugationResultSummary(conjugationBundle);
    expect(summary.targetForm).toBe("present_polite");
    expect(summary.resultKo).toBe("가요");
    expect(mapConjugationRuleNameKo(conjugationBundle.rule!)).toBe("REGULAR_EOYO");
  });

  it("maps hanja term and linked entry headword", () => {
    const summary = mapHanjaEntrySummary(hanjaBundle, "en");
    expect(summary.hanjaText).toBe("學校");
    expect(summary.wordKo).toBe("학교");
    expect(summary.definition.value).toBe("school");
  });

  it("builds hanja characters from term_characters", () => {
    const characters = mapHanjaCharacters(hanjaBundle);
    expect(characters).toHaveLength(1);
    expect(characters[0]?.character).toBe("學");
    expect(characters[0]?.readingKo).toBe("학");
    expect(characters[0]?.meaning).toBe("study");
  });

  it("maps idiom expression and translation nuance fields", () => {
    const summary = mapIdiomSummary(idiomBundle, "en");
    expect(summary.idiomKo).toBe("식은 죽 먹기");
    expect(summary.actualMeaning.value).toBe("very easy; a piece of cake");

    const detail = mapIdiomDetail(idiomBundle, "en", []);
    expect(detail.usageContext.value).toBe("Casual conversation.");
    expect(detail.commonMistakes.value).toBe("Do not use in formal writing.");
    expect(detail.explanation.value).toBe("Lighthearted exaggeration.");
  });

  it("filters unpublished translation rows", () => {
    const published = filterPublishedTranslationRows(entryBundle.senses[0]!.translations);
    expect(published).toHaveLength(1);
    expect(published[0]?.locale).toBe("en");
  });

  it("localizes with fallback through pickLocalized", () => {
    const localized = pickLocalized(
      entryBundle.senses[0]!.translations,
      "ja",
      (row) => row.short_definition ?? row.definition ?? ""
    );
    expect(localized.requestedLocale).toBe("ja");
    expect(localized.resolvedLocale).toBe("en");
    expect(localized.usedFallback).toBe(true);
    expect(localized.value).toBe("to go");
  });
});
