/**
 * CSV schemas and validation enums for formal content import.
 * Mirrors PostgreSQL CHECK constraints in supabase/migrations/.
 */

export const LOCALES = ["en", "zh", "ja"] as const;
export type Locale = (typeof LOCALES)[number];

export const PUBLICATION_STATUSES = [
  "draft",
  "in_review",
  "published",
  "archived",
] as const;

export const TRANSLATION_STATUSES = [
  "draft",
  "in_review",
  "published",
  "needs_revision",
] as const;

export const PARTS_OF_SPEECH = [
  "verb",
  "adjective",
  "noun",
  "bound_noun",
  "adverb",
  "particle",
  "other",
] as const;

export const ETYMOLOGY_TYPES = [
  "native",
  "sino_korean",
  "loanword",
  "hybrid",
  "unknown",
] as const;

export const IRREGULAR_TYPES = ["ㄷ", "ㅂ", "ㅅ", "ㅎ", "르", "러", "여", "우"] as const;

export const DIFFICULTY_LEVELS = ["beginner", "intermediate", "advanced"] as const;

export const FREQUENCY_LEVELS = ["high", "medium", "low"] as const;

export const REGISTERS = ["formal", "informal", "neutral"] as const;

export const PROVENANCE_TYPES = [
  "original",
  "adapted",
  "quoted",
  "licensed",
  "public_domain",
  "unknown",
] as const;

export const SOUND_CHANGE_CATEGORIES = [
  "liaison",
  "nasalization",
  "liquidization",
  "tensification",
  "aspiration",
  "h_changes",
  "batchim",
  "other",
] as const;

export const CONJUGATION_FORM_CODES = [
  "present_polite",
  "past_polite",
  "present_formal",
  "past_formal",
  "present_informal",
  "propositive",
] as const;

export const IDIOM_CATEGORIES = [
  "daily",
  "emotion",
  "relationship",
  "work-study",
  "body",
  "animal",
  "formal",
  "colloquial",
] as const;

export const ALIAS_TYPES = [
  "formal_variant",
  "common_variant",
  "old_romanization",
  "search_keyword",
  "abbreviation",
  "common_misspelling",
] as const;

export const ENTRY_RELATION_TYPES = [
  "related",
  "synonym",
  "antonym",
  "confusable",
  "see_also",
  "derived_from",
  "variant_of",
] as const;

export const SOUND_CHANGE_ENTRY_RELATION_TYPES = [
  "applies_to",
  "demonstrates",
  "exception_to",
] as const;

export const IDIOM_RELATION_TYPES = [
  "related",
  "synonym",
  "confusable",
  "see_also",
] as const;

export const SOURCE_TYPES = [
  "dictionary",
  "academic_paper",
  "book",
  "textbook",
  "article",
  "official_website",
  "corpus",
  "licensed_dataset",
  "original_editorial",
  "other",
] as const;

export const VERIFICATION_STATUSES = [
  "unverified",
  "verified",
  "deprecated",
  "rejected",
] as const;

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type CsvSchema = {
  /** Filename relative to content directory */
  file: string;
  requiredHeaders: readonly string[];
  optionalHeaders?: readonly string[];
  /** Rows with import_key column name, if any */
  importKeyColumn?: string;
};

/** Known CSV files and expected headers (snake_case). */
export const CSV_SCHEMAS: CsvSchema[] = [
  {
    file: "entries.csv",
    requiredHeaders: [
      "import_key",
      "slug",
      "headword",
      "headword_normalized",
      "part_of_speech",
    ],
    optionalHeaders: [
      "romanization",
      "romanization_normalized",
      "pronunciation_hangul",
      "pronunciation_romanization",
      "etymology_type",
      "stem",
      "irregular_type",
      "difficulty_level",
      "frequency_level",
      "topik_level",
      "status",
    ],
    importKeyColumn: "import_key",
  },
  {
    file: "entry_translations.csv",
    requiredHeaders: ["import_key", "entry_import_key", "locale", "status"],
    optionalHeaders: ["irregular_note", "etymology_note", "general_note"],
    importKeyColumn: "import_key",
  },
  {
    file: "senses.csv",
    requiredHeaders: [
      "import_key",
      "entry_import_key",
      "sense_order",
      "is_primary",
      "status",
    ],
    optionalHeaders: ["register"],
    importKeyColumn: "import_key",
  },
  {
    file: "sense_translations.csv",
    requiredHeaders: ["import_key", "sense_import_key", "locale", "status"],
    optionalHeaders: [
      "short_definition",
      "definition",
      "usage_note",
      "nuance_note",
    ],
    importKeyColumn: "import_key",
  },
  {
    file: "entry_aliases.csv",
    requiredHeaders: [
      "import_key",
      "entry_import_key",
      "alias_type",
      "alias",
      "alias_normalized",
      "status",
    ],
    optionalHeaders: ["script", "locale", "is_searchable"],
    importKeyColumn: "import_key",
  },
  {
    file: "examples.csv",
    requiredHeaders: [
      "import_key",
      "korean_text",
      "korean_text_normalized",
      "provenance_type",
      "status",
    ],
    optionalHeaders: [
      "romanization",
      "register",
      "difficulty_level",
      "source_note",
      "license_note",
    ],
    importKeyColumn: "import_key",
  },
  {
    file: "example_translations.csv",
    requiredHeaders: [
      "import_key",
      "example_import_key",
      "locale",
      "translation",
      "status",
    ],
    importKeyColumn: "import_key",
  },
  {
    file: "entry_examples.csv",
    requiredHeaders: ["entry_import_key", "example_import_key", "display_order"],
    optionalHeaders: ["sense_import_key"],
  },
  {
    file: "sound_change_rules.csv",
    requiredHeaders: ["import_key", "slug", "category", "status"],
    optionalHeaders: [
      "difficulty",
      "frequency",
      "input_pattern",
      "output_pattern",
    ],
    importKeyColumn: "import_key",
  },
  {
    file: "sound_change_translations.csv",
    requiredHeaders: [
      "import_key",
      "rule_import_key",
      "locale",
      "name",
      "status",
    ],
    optionalHeaders: [
      "short_summary",
      "description",
      "conditions",
      "exceptions",
      "cautions",
    ],
    importKeyColumn: "import_key",
  },
  {
    file: "sound_change_steps.csv",
    requiredHeaders: [
      "import_key",
      "rule_import_key",
      "step_order",
      "before_form",
      "after_form",
    ],
    optionalHeaders: ["environment_pattern", "is_optional"],
    importKeyColumn: "import_key",
  },
  {
    file: "sound_change_step_translations.csv",
    requiredHeaders: ["import_key", "step_import_key", "locale", "status"],
    optionalHeaders: ["label", "explanation"],
    importKeyColumn: "import_key",
  },
  {
    file: "entry_sound_changes.csv",
    requiredHeaders: [
      "entry_import_key",
      "rule_import_key",
      "relation_type",
    ],
    optionalHeaders: ["context_note"],
  },
  {
    file: "sound_change_examples.csv",
    requiredHeaders: ["rule_import_key", "example_import_key", "display_order"],
    optionalHeaders: ["step_import_key"],
  },
  {
    file: "conjugation_rules.csv",
    requiredHeaders: [
      "import_key",
      "slug",
      "rule_code",
      "is_irregular",
      "status",
    ],
    optionalHeaders: ["irregular_type", "rule_category"],
    importKeyColumn: "import_key",
  },
  {
    file: "conjugation_rule_translations.csv",
    requiredHeaders: [
      "import_key",
      "rule_import_key",
      "locale",
      "title",
      "status",
    ],
    optionalHeaders: ["explanation"],
    importKeyColumn: "import_key",
  },
  {
    file: "conjugation_results.csv",
    requiredHeaders: [
      "import_key",
      "entry_import_key",
      "form_code",
      "result",
      "result_normalized",
      "is_irregular",
      "variant_order",
      "is_preferred",
      "status",
    ],
    optionalHeaders: ["rule_import_key", "stem_used", "irregular_type"],
    importKeyColumn: "import_key",
  },
  {
    file: "conjugation_result_steps.csv",
    requiredHeaders: [
      "import_key",
      "result_import_key",
      "step_order",
      "before_form",
      "after_form",
    ],
    optionalHeaders: ["operation_code", "applied_rule_import_key"],
    importKeyColumn: "import_key",
  },
  {
    file: "conjugation_result_step_translations.csv",
    requiredHeaders: [
      "import_key",
      "step_import_key",
      "locale",
      "description",
      "status",
    ],
    importKeyColumn: "import_key",
  },
  {
    file: "conjugation_examples.csv",
    requiredHeaders: ["result_import_key", "example_import_key", "display_order"],
  },
  {
    file: "hanja_characters.csv",
    requiredHeaders: ["import_key", "character", "status"],
    optionalHeaders: [
      "simplified_chinese",
      "japanese_shinjitai",
      "radical",
      "stroke_count",
    ],
    importKeyColumn: "import_key",
  },
  {
    file: "hanja_readings.csv",
    requiredHeaders: [
      "import_key",
      "character_import_key",
      "reading_hangul",
      "display_order",
      "status",
    ],
    optionalHeaders: ["reading_romanization", "is_primary"],
    importKeyColumn: "import_key",
  },
  {
    file: "hanja_character_translations.csv",
    requiredHeaders: [
      "import_key",
      "character_import_key",
      "locale",
      "meaning",
      "status",
    ],
    optionalHeaders: ["note"],
    importKeyColumn: "import_key",
  },
  {
    file: "hanja_terms.csv",
    requiredHeaders: [
      "import_key",
      "entry_import_key",
      "slug",
      "korean_hanja",
      "status",
    ],
    optionalHeaders: ["simplified_chinese", "japanese_shinjitai", "is_primary"],
    importKeyColumn: "import_key",
  },
  {
    file: "hanja_term_characters.csv",
    requiredHeaders: [
      "term_import_key",
      "character_import_key",
      "position",
    ],
    optionalHeaders: ["reading_import_key"],
  },
  {
    file: "hanja_term_character_translations.csv",
    requiredHeaders: [
      "import_key",
      "term_import_key",
      "position",
      "locale",
      "meaning_in_term",
      "status",
    ],
    optionalHeaders: ["note"],
    importKeyColumn: "import_key",
  },
  {
    file: "idioms.csv",
    requiredHeaders: [
      "import_key",
      "slug",
      "expression",
      "expression_normalized",
      "status",
    ],
    optionalHeaders: [
      "romanization",
      "romanization_normalized",
      "register",
    ],
    importKeyColumn: "import_key",
  },
  {
    file: "idiom_translations.csv",
    requiredHeaders: [
      "import_key",
      "idiom_import_key",
      "locale",
      "actual_meaning",
      "status",
    ],
    optionalHeaders: [
      "literal_meaning",
      "usage_scenario",
      "common_misuse",
      "nuance_note",
    ],
    importKeyColumn: "import_key",
  },
  {
    file: "idiom_category_links.csv",
    requiredHeaders: ["idiom_import_key", "category"],
  },
  {
    file: "idiom_examples.csv",
    requiredHeaders: ["idiom_import_key", "example_import_key", "display_order"],
  },
  {
    file: "idiom_entry_links.csv",
    requiredHeaders: ["idiom_import_key", "entry_import_key"],
    optionalHeaders: ["link_note"],
  },
  {
    file: "idiom_relations.csv",
    requiredHeaders: [
      "source_idiom_import_key",
      "target_idiom_import_key",
      "relation_type",
    ],
  },
  {
    file: "sources.csv",
    requiredHeaders: ["import_key", "source_type", "title"],
    optionalHeaders: [
      "author_or_org",
      "publisher",
      "url",
      "publication_date",
      "accessed_at",
      "license",
      "notes",
      "verification_status",
      "is_publicly_displayed",
    ],
    importKeyColumn: "import_key",
  },
  {
    file: "content_sources.csv",
    requiredHeaders: ["source_import_key"],
    optionalHeaders: [
      "entry_import_key",
      "sense_import_key",
      "example_import_key",
      "sound_change_rule_import_key",
      "conjugation_rule_import_key",
      "conjugation_result_import_key",
      "hanja_character_import_key",
      "hanja_term_import_key",
      "idiom_import_key",
      "citation_note",
    ],
  },
];

export const CONTENT_TARGET_COLUMNS = [
  "entry_import_key",
  "sense_import_key",
  "example_import_key",
  "sound_change_rule_import_key",
  "conjugation_rule_import_key",
  "conjugation_result_import_key",
  "hanja_character_import_key",
  "hanja_term_import_key",
  "idiom_import_key",
] as const;

export function schemaForFile(filename: string): CsvSchema | undefined {
  return CSV_SCHEMAS.find((s) => s.file === filename);
}

export function allKnownHeaders(schema: CsvSchema): string[] {
  return [...schema.requiredHeaders, ...(schema.optionalHeaders ?? [])];
}
