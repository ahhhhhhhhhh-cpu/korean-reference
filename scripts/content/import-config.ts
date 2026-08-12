/**
 * Live import/promotion target configuration (no secrets).
 * Dev and Production are separate explicit targets — never inferred from "not Dev".
 */

/** Documented Production Supabase project ref (korean-reference-prod). */
export const DOCUMENTED_PRODUCTION_PROJECT_REF = "rpykfrvcynpwmbkogiou";

/** Documented Dev Supabase project ref (korean-reference-dev). */
export const DOCUMENTED_DEV_PROJECT_REF = "rwtkaplfvbvlibipnjin";

/** Fail-closed Dev allowlist: Dev mode may target ONLY korean-reference-dev. */
export const ALLOWED_DEV_PROJECT_REFS = new Set<string>([
  DOCUMENTED_DEV_PROJECT_REF,
]);

/** Fail-closed Production allowlist: Production mode may target ONLY korean-reference-prod. */
export const ALLOWED_PRODUCTION_PROJECT_REFS = new Set<string>([
  DOCUMENTED_PRODUCTION_PROJECT_REF,
]);

/**
 * Documented Production refs. In Dev mode these remain hard-blocked.
 * Production mode accepts them only with explicit Production confirmation.
 */
export const BLOCKED_PRODUCTION_PROJECT_REFS = ALLOWED_PRODUCTION_PROJECT_REFS;

export const PILOT_EXPECTED_COUNTS = {
  entries: 32,
  senses: 50,
  sense_translations: 150,
  entry_aliases: 1,
  examples: 48,
  example_translations: 144,
  entry_examples: 61,
} as const;

/** Statuses that may be overwritten by a draft-only live import. */
export const SAFE_IMPORT_STATUSES = new Set(["draft"]);

/** Entity tables keyed by import_key in the Pilot package. */
export const KEYED_PILOT_FILES = [
  "entries.csv",
  "senses.csv",
  "sense_translations.csv",
  "entry_aliases.csv",
  "examples.csv",
  "example_translations.csv",
] as const;

/** CSV files loaded for the formal Pilot entry package write path. */
export const PILOT_WRITE_FILES = [
  ...KEYED_PILOT_FILES,
  "entry_examples.csv",
] as const;
