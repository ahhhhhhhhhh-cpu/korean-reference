/**
 * Read-only publish-preflight checks mirroring DB validators/CHECK constraints.
 * DB triggers remain authoritative; these checks fail early before execute.
 */

import type {
  PromoteDbEntryRow,
  PromoteDbExampleRow,
  PromoteDbExampleTranslationRow,
  PromoteDbSenseRow,
  PromoteDbSenseTranslationRow,
  PromoteIssue,
} from "./promote-preflight";

const REQUIRED_LOCALES = ["en", "ja", "zh"] as const;

function trimmed(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

/** Matches entries_headword_nonempty / entries_headword_normalized_nonempty + validate_entry_publishable. */
export function checkEntryHeadwordFields(
  entries: PromoteDbEntryRow[],
  issues: PromoteIssue[],
): void {
  for (const entry of entries) {
    if (!trimmed(entry.headword)) {
      issues.push({
        kind: "publish_not_ready",
        entity: "entries",
        message: `Entry "${entry.import_key}" has empty headword (required for publication).`,
      });
    }
    if (!trimmed(entry.headword_normalized)) {
      issues.push({
        kind: "publish_not_ready",
        entity: "entries",
        message: `Entry "${entry.import_key}" has empty headword_normalized (required for publication).`,
      });
    }
  }
}

/** Matches sense_translations_has_content CHECK semantics for publish-bound rows. */
export function senseTranslationHasPublishableContent(
  row: Pick<PromoteDbSenseTranslationRow, "short_definition" | "definition">,
): boolean {
  return trimmed(row.short_definition) !== "" || trimmed(row.definition) !== "";
}

/** Matches example_translations_translation_nonempty CHECK. */
export function exampleTranslationHasContent(
  row: Pick<PromoteDbExampleTranslationRow, "translation">,
): boolean {
  return trimmed(row.translation) !== "";
}

/** Matches validate_entry_publishable EN requirement per published sense. */
export function englishSenseTranslationHasContent(
  row: Pick<PromoteDbSenseTranslationRow, "short_definition" | "definition">,
): boolean {
  return senseTranslationHasPublishableContent(row);
}

export type PrimarySenseExpectation = {
  entryImportKey: string;
  senseImportKey: string;
};

/**
 * Verify DB primary sense state (not CSV-only): is_primary=true, in_review before publish.
 */
export function checkPrimarySenseDbState(
  entries: PromoteDbEntryRow[],
  senses: PromoteDbSenseRow[],
  expectedPrimaryByEntry: Map<string, PrimarySenseExpectation>,
  sourceStatus: string,
  issues: PromoteIssue[],
): void {
  const sensesByEntryId = new Map<string, PromoteDbSenseRow[]>();
  for (const sense of senses) {
    const bucket = sensesByEntryId.get(sense.entry_id) ?? [];
    bucket.push(sense);
    sensesByEntryId.set(sense.entry_id, bucket);
  }

  for (const entry of entries) {
    const expected = expectedPrimaryByEntry.get(entry.import_key);
    const entrySenses = sensesByEntryId.get(entry.id) ?? [];

    const dbPrimarySenses = entrySenses.filter((s) => s.is_primary);
    if (dbPrimarySenses.length === 0) {
      issues.push({
        kind: "publish_not_ready",
        entity: "senses",
        message: `Entry "${entry.import_key}" has no primary sense (is_primary=true) in database.`,
      });
      continue;
    }

    if (dbPrimarySenses.length > 1) {
      issues.push({
        kind: "publish_not_ready",
        entity: "senses",
        message: `Entry "${entry.import_key}" has multiple primary senses in database.`,
      });
    }

    const dbPrimary = dbPrimarySenses[0]!;
    if (dbPrimary.status !== sourceStatus) {
      issues.push({
        kind: "publish_not_ready",
        entity: "senses",
        message: `Primary sense "${dbPrimary.import_key}" for entry "${entry.import_key}" must be "${sourceStatus}" before publication, found "${dbPrimary.status}".`,
      });
    }

    if (!expected) {
      issues.push({
        kind: "publish_not_ready",
        entity: "entries",
        message: `Entry "${entry.import_key}" has no primary sense declared in Pilot CSV.`,
      });
      continue;
    }

    if (dbPrimary.import_key !== expected.senseImportKey) {
      issues.push({
        kind: "publish_not_ready",
        entity: "senses",
        message: `Entry "${entry.import_key}" primary sense mismatch: database has "${dbPrimary.import_key}", Pilot CSV declares "${expected.senseImportKey}".`,
      });
    }
  }
}

export function checkSenseTranslationPublishContent(
  senseTranslations: PromoteDbSenseTranslationRow[],
  issues: PromoteIssue[],
): void {
  for (const row of senseTranslations) {
    if (!senseTranslationHasPublishableContent(row)) {
      issues.push({
        kind: "publish_not_ready",
        entity: "sense_translations",
        message: `Sense translation "${row.import_key}" (${row.locale}) lacks non-empty short_definition or definition (required for publication).`,
      });
    }
  }
}

export function checkEnglishDefinitionsForSenses(
  senses: PromoteDbSenseRow[],
  senseTranslations: PromoteDbSenseTranslationRow[],
  issues: PromoteIssue[],
): void {
  const translationsBySenseId = new Map<string, PromoteDbSenseTranslationRow[]>();
  for (const row of senseTranslations) {
    const bucket = translationsBySenseId.get(row.sense_id) ?? [];
    bucket.push(row);
    translationsBySenseId.set(row.sense_id, bucket);
  }

  for (const sense of senses) {
    const translations = translationsBySenseId.get(sense.id) ?? [];
    const en = translations.find((t) => t.locale === "en");
    if (!en || !englishSenseTranslationHasContent(en)) {
      issues.push({
        kind: "publish_not_ready",
        entity: "sense_translations",
        message: `Sense "${sense.import_key}" lacks non-empty English definition required for publication.`,
      });
    }

    for (const locale of REQUIRED_LOCALES) {
      const row = translations.find((t) => t.locale === locale);
      if (!row) continue;
      if (!senseTranslationHasPublishableContent(row)) {
        issues.push({
          kind: "publish_not_ready",
          entity: "sense_translations",
          message: `Sense translation for sense "${sense.import_key}" locale "${locale}" lacks publishable content.`,
        });
      }
    }
  }
}

export function checkExampleTranslationPublishContent(
  exampleTranslations: PromoteDbExampleTranslationRow[],
  issues: PromoteIssue[],
): void {
  for (const row of exampleTranslations) {
    if (!exampleTranslationHasContent(row)) {
      issues.push({
        kind: "publish_not_ready",
        entity: "example_translations",
        message: `Example translation "${row.import_key}" (${row.locale}) has empty translation (required for publication).`,
      });
    }
  }
}

/** Mirror validate_example_publishable() provenance rules (fail-closed without content_sources query). */
export function checkExampleProvenancePublishable(
  examples: PromoteDbExampleRow[],
  issues: PromoteIssue[],
): void {
  for (const example of examples) {
    if (!trimmed(example.korean_text)) {
      issues.push({
        kind: "publish_not_ready",
        entity: "examples",
        message: `Example "${example.import_key}" has empty korean_text.`,
      });
    }

    if (example.provenance_type === "unknown") {
      issues.push({
        kind: "publish_not_ready",
        entity: "examples",
        message: `Example "${example.import_key}" has provenance_type "unknown" and cannot be published.`,
      });
      continue;
    }

    if (
      example.provenance_type === "adapted" ||
      example.provenance_type === "quoted" ||
      example.provenance_type === "licensed" ||
      example.provenance_type === "public_domain"
    ) {
      if (!trimmed(example.source_note)) {
        issues.push({
          kind: "publish_not_ready",
          entity: "examples",
          message: `Example "${example.import_key}" with provenance_type "${example.provenance_type}" requires source_note or content_sources link (fail-closed preflight).`,
        });
      }
    }

    if (example.provenance_type === "licensed" && !trimmed(example.license_note)) {
      issues.push({
        kind: "publish_not_ready",
        entity: "examples",
        message: `Example "${example.import_key}" with provenance_type "licensed" requires license_note or linked source license (fail-closed preflight).`,
      });
    }
  }
}
