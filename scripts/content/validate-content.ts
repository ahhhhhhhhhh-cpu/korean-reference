import {
  ALIAS_TYPES,
  CONJUGATION_FORM_CODES,
  CONTENT_TARGET_COLUMNS,
  CSV_SCHEMAS,
  DIFFICULTY_LEVELS,
  ETYMOLOGY_TYPES,
  FREQUENCY_LEVELS,
  IDIOM_CATEGORIES,
  IDIOM_RELATION_TYPES,
  IRREGULAR_TYPES,
  LOCALES,
  PARTS_OF_SPEECH,
  PROVENANCE_TYPES,
  PUBLICATION_STATUSES,
  REGISTERS,
  SLUG_PATTERN,
  SOUND_CHANGE_CATEGORIES,
  SOUND_CHANGE_ENTRY_RELATION_TYPES,
  SOURCE_TYPES,
  TRANSLATION_STATUSES,
  VERIFICATION_STATUSES,
  allKnownHeaders,
} from "./schemas";
import { loadContentDirectory, rowNumber, type CsvRow } from "./csv-parse";

export type ValidationIssue = {
  file: string;
  line?: number;
  field?: string;
  message: string;
  severity: "error" | "warning";
};

export type ValidationResult = {
  ok: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
};

export type ValidateOptions = {
  allowPublish?: boolean;
  /** When true, header-only packages (no data rows) produce warnings not errors */
  templatesMode?: boolean;
};

export function validateContentDirectory(
  dir: string,
  options: ValidateOptions = {},
): ValidationResult {
  const files = loadContentDirectory(dir);
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const push = (issue: ValidationIssue) => {
    if (issue.severity === "warning") warnings.push(issue);
    else errors.push(issue);
  };

  // 1–3: parse + headers + unknown columns
  validateFilePresenceAndHeaders(files, push, options);

  const keys = collectImportKeys(files);

  // Per-file row validation
  validateEntries(files, keys, push, options);
  validateEntryTranslations(files, keys, push);
  validateSenses(files, keys, push, options);
  validateSenseTranslations(files, keys, push);
  validateEntryAliases(files, keys, push);
  validateExamples(files, keys, push, options);
  validateExampleTranslations(files, keys, push);
  validateEntryExamples(files, keys, push);
  validateSoundChange(files, keys, push, options);
  validateConjugation(files, keys, push, options);
  validateHanja(files, keys, push, options);
  validateIdioms(files, keys, push, options);
  validateSources(files, keys, push);

  // English core content
  validateEnglishCore(files, keys, push, options);

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

function validateFilePresenceAndHeaders(
  files: Map<string, import("./csv-parse").ParsedCsv>,
  push: (issue: ValidationIssue) => void,
  options: ValidateOptions,
) {
  for (const schema of CSV_SCHEMAS) {
    const parsed = files.get(schema.file);
    if (!parsed) continue;

    for (const required of schema.requiredHeaders) {
      if (!parsed.headers.includes(required)) {
        push({
          file: schema.file,
          field: required,
          message: `Missing required header: ${required}`,
          severity: "error",
        });
      }
    }

    const known = new Set(allKnownHeaders(schema));
    for (const header of parsed.headers) {
      if (!known.has(header)) {
        push({
          file: schema.file,
          field: header,
          message: `Unknown column "${header}"`,
          severity: "warning",
        });
      }
    }

    if (parsed.rows.length === 0 && !options.templatesMode) {
      // empty optional files are fine; only warn for files that exist but empty
      push({
        file: schema.file,
        message: "File has headers but no data rows",
        severity: "warning",
      });
    }
  }
}

type KeyRegistry = {
  entries: Set<string>;
  entryTranslations: Set<string>;
  senses: Set<string>;
  senseTranslations: Set<string>;
  entryAliases: Set<string>;
  examples: Set<string>;
  exampleTranslations: Set<string>;
  soundChangeRules: Set<string>;
  soundChangeSteps: Set<string>;
  conjugationRules: Set<string>;
  conjugationResults: Set<string>;
  conjugationResultSteps: Set<string>;
  hanjaCharacters: Set<string>;
  hanjaReadings: Set<string>;
  hanjaTerms: Set<string>;
  idioms: Set<string>;
  idiomTranslations: Set<string>;
  sources: Set<string>;
};

function collectImportKeys(
  files: Map<string, import("./csv-parse").ParsedCsv>,
): KeyRegistry {
  const reg: KeyRegistry = {
    entries: new Set(),
    entryTranslations: new Set(),
    senses: new Set(),
    senseTranslations: new Set(),
    entryAliases: new Set(),
    examples: new Set(),
    exampleTranslations: new Set(),
    soundChangeRules: new Set(),
    soundChangeSteps: new Set(),
    conjugationRules: new Set(),
    conjugationResults: new Set(),
    conjugationResultSteps: new Set(),
    hanjaCharacters: new Set(),
    hanjaReadings: new Set(),
    hanjaTerms: new Set(),
    idioms: new Set(),
    idiomTranslations: new Set(),
    sources: new Set(),
  };

  const addKeys = (
    file: string,
    column: string,
    target: Set<string>,
  ) => {
    const parsed = files.get(file);
    if (!parsed) return;
    for (let i = 0; i < parsed.rows.length; i++) {
      const v = parsed.rows[i]![column]?.trim();
      if (v) target.add(v);
    }
  };

  addKeys("entries.csv", "import_key", reg.entries);
  addKeys("entry_translations.csv", "import_key", reg.entryTranslations);
  addKeys("senses.csv", "import_key", reg.senses);
  addKeys("sense_translations.csv", "import_key", reg.senseTranslations);
  addKeys("entry_aliases.csv", "import_key", reg.entryAliases);
  addKeys("examples.csv", "import_key", reg.examples);
  addKeys("example_translations.csv", "import_key", reg.exampleTranslations);
  addKeys("sound_change_rules.csv", "import_key", reg.soundChangeRules);
  addKeys("sound_change_steps.csv", "import_key", reg.soundChangeSteps);
  addKeys("conjugation_rules.csv", "import_key", reg.conjugationRules);
  addKeys("conjugation_results.csv", "import_key", reg.conjugationResults);
  addKeys("conjugation_result_steps.csv", "import_key", reg.conjugationResultSteps);
  addKeys("hanja_characters.csv", "import_key", reg.hanjaCharacters);
  addKeys("hanja_readings.csv", "import_key", reg.hanjaReadings);
  addKeys("hanja_terms.csv", "import_key", reg.hanjaTerms);
  addKeys("idioms.csv", "import_key", reg.idioms);
  addKeys("idiom_translations.csv", "import_key", reg.idiomTranslations);
  addKeys("sources.csv", "import_key", reg.sources);

  return reg;
}

function checkImportKeyUnique(
  file: string,
  rows: CsvRow[],
  column: string,
  push: (issue: ValidationIssue) => void,
) {
  const seen = new Map<string, number>();
  for (let i = 0; i < rows.length; i++) {
    const key = rows[i]![column]?.trim();
    if (!key) {
      push({
        file,
        line: rowNumber(i),
        field: column,
        message: "import_key must not be empty",
        severity: "error",
      });
      continue;
    }
    if (seen.has(key)) {
      push({
        file,
        line: rowNumber(i),
        field: column,
        message: `Duplicate import_key "${key}" (first at line ${seen.get(key)})`,
        severity: "error",
      });
    } else {
      seen.set(key, rowNumber(i));
    }
  }
}

function checkSlug(file: string, row: CsvRow, line: number, push: (i: ValidationIssue) => void) {
  const slug = row.slug?.trim();
  if (!slug) return;
  if (!SLUG_PATTERN.test(slug)) {
    push({
      file,
      line,
      field: "slug",
      message: `Invalid slug format: "${slug}"`,
      severity: "error",
    });
  }
}

function checkLocale(file: string, row: CsvRow, line: number, push: (i: ValidationIssue) => void) {
  const locale = row.locale?.trim();
  if (!locale) return;
  if (!LOCALES.includes(locale as (typeof LOCALES)[number])) {
    push({
      file,
      line,
      field: "locale",
      message: `Invalid locale "${locale}" — expected en, zh, or ja`,
      severity: "error",
    });
  }
}

function checkPublicationStatus(
  file: string,
  row: CsvRow,
  line: number,
  push: (i: ValidationIssue) => void,
  options: ValidateOptions,
) {
  const status = (row.status?.trim() || "draft") as string;
  if (!PUBLICATION_STATUSES.includes(status as (typeof PUBLICATION_STATUSES)[number])) {
    push({
      file,
      line,
      field: "status",
      message: `Invalid publication status "${status}"`,
      severity: "error",
    });
  }
  if (status === "published" && !options.allowPublish) {
    push({
      file,
      line,
      field: "status",
      message: 'status=published not allowed without --allow-publish (importer defaults to draft)',
      severity: "warning",
    });
  }
}

function checkTranslationStatus(
  file: string,
  row: CsvRow,
  line: number,
  push: (i: ValidationIssue) => void,
) {
  const status = (row.status?.trim() || "draft") as string;
  if (!TRANSLATION_STATUSES.includes(status as (typeof TRANSLATION_STATUSES)[number])) {
    push({
      file,
      line,
      field: "status",
      message: `Invalid translation status "${status}"`,
      severity: "error",
    });
  }
}

function checkEnum(
  file: string,
  row: CsvRow,
  line: number,
  field: string,
  allowed: readonly string[],
  push: (i: ValidationIssue) => void,
  optional = true,
) {
  const value = row[field]?.trim();
  if (!value) {
    if (!optional) {
      push({ file, line, field, message: `${field} is required`, severity: "error" });
    }
    return;
  }
  if (!allowed.includes(value)) {
    push({
      file,
      line,
      field,
      message: `Invalid ${field} "${value}"`,
      severity: "error",
    });
  }
}

function checkRange(
  file: string,
  row: CsvRow,
  line: number,
  field: string,
  min: number,
  max: number,
  push: (i: ValidationIssue) => void,
) {
  const raw = row[field]?.trim();
  if (!raw) return;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) {
    push({
      file,
      line,
      field,
      message: `${field} must be integer ${min}–${max}`,
      severity: "error",
    });
  }
}

function resolveRef(
  file: string,
  line: number,
  field: string,
  value: string | undefined,
  registry: Set<string>,
  label: string,
  push: (i: ValidationIssue) => void,
) {
  const key = value?.trim();
  if (!key) {
    push({ file, line, field, message: `${field} is required`, severity: "error" });
    return;
  }
  if (!registry.has(key)) {
    push({
      file,
      line,
      field,
      message: `Unresolved ${label} "${key}"`,
      severity: "error",
    });
  }
}

function validateEntries(
  files: Map<string, import("./csv-parse").ParsedCsv>,
  _keys: KeyRegistry,
  push: (i: ValidationIssue) => void,
  options: ValidateOptions,
) {
  const parsed = files.get("entries.csv");
  if (!parsed) return;
  checkImportKeyUnique("entries.csv", parsed.rows, "import_key", push);

  for (let i = 0; i < parsed.rows.length; i++) {
    const row = parsed.rows[i]!;
    const line = rowNumber(i);
    checkSlug("entries.csv", row, line, push);
    checkEnum("entries.csv", row, line, "part_of_speech", PARTS_OF_SPEECH, push, false);
    checkEnum("entries.csv", row, line, "etymology_type", ETYMOLOGY_TYPES, push);
    checkEnum("entries.csv", row, line, "irregular_type", IRREGULAR_TYPES, push);
    checkEnum("entries.csv", row, line, "difficulty_level", DIFFICULTY_LEVELS, push);
    checkEnum("entries.csv", row, line, "frequency_level", FREQUENCY_LEVELS, push);
    checkRange("entries.csv", row, line, "topik_level", 1, 6, push);
    checkPublicationStatus("entries.csv", row, line, push, options);
    if (!row.headword?.trim()) {
      push({ file: "entries.csv", line, field: "headword", message: "headword required", severity: "error" });
    }
  }
}

function validateEntryTranslations(
  files: Map<string, import("./csv-parse").ParsedCsv>,
  keys: KeyRegistry,
  push: (i: ValidationIssue) => void,
) {
  const parsed = files.get("entry_translations.csv");
  if (!parsed) return;
  checkImportKeyUnique("entry_translations.csv", parsed.rows, "import_key", push);
  for (let i = 0; i < parsed.rows.length; i++) {
    const row = parsed.rows[i]!;
    const line = rowNumber(i);
    checkLocale("entry_translations.csv", row, line, push);
    checkTranslationStatus("entry_translations.csv", row, line, push);
    resolveRef("entry_translations.csv", line, "entry_import_key", row.entry_import_key, keys.entries, "entry_import_key", push);
  }
}

function validateSenses(
  files: Map<string, import("./csv-parse").ParsedCsv>,
  keys: KeyRegistry,
  push: (i: ValidationIssue) => void,
  options: ValidateOptions,
) {
  const parsed = files.get("senses.csv");
  if (!parsed) return;
  checkImportKeyUnique("senses.csv", parsed.rows, "import_key", push);

  const primaryByEntry = new Map<string, number>();
  for (let i = 0; i < parsed.rows.length; i++) {
    const row = parsed.rows[i]!;
    const line = rowNumber(i);
    resolveRef("senses.csv", line, "entry_import_key", row.entry_import_key, keys.entries, "entry_import_key", push);
    checkEnum("senses.csv", row, line, "register", REGISTERS, push);
    checkPublicationStatus("senses.csv", row, line, push, options);
    const order = Number(row.sense_order);
    if (!Number.isInteger(order) || order < 1) {
      push({ file: "senses.csv", line, field: "sense_order", message: "sense_order must be positive integer", severity: "error" });
    }
    if (row.is_primary?.trim().toLowerCase() === "true") {
      const entry = row.entry_import_key?.trim();
      if (entry) {
        if (primaryByEntry.has(entry)) {
          push({
            file: "senses.csv",
            line,
            field: "is_primary",
            message: `Duplicate primary sense for entry "${entry}"`,
            severity: "error",
          });
        }
        primaryByEntry.set(entry, line);
      }
    }
  }
}

function validateSenseTranslations(
  files: Map<string, import("./csv-parse").ParsedCsv>,
  keys: KeyRegistry,
  push: (i: ValidationIssue) => void,
) {
  const parsed = files.get("sense_translations.csv");
  if (!parsed) return;
  checkImportKeyUnique("sense_translations.csv", parsed.rows, "import_key", push);

  const localeBySense = new Map<string, Set<string>>();
  for (let i = 0; i < parsed.rows.length; i++) {
    const row = parsed.rows[i]!;
    const line = rowNumber(i);
    checkLocale("sense_translations.csv", row, line, push);
    checkTranslationStatus("sense_translations.csv", row, line, push);
    resolveRef("sense_translations.csv", line, "sense_import_key", row.sense_import_key, keys.senses, "sense_import_key", push);

    const senseKey = row.sense_import_key?.trim();
    const locale = row.locale?.trim();
    if (senseKey && locale) {
      if (!localeBySense.has(senseKey)) localeBySense.set(senseKey, new Set());
      const set = localeBySense.get(senseKey)!;
      if (set.has(locale)) {
        push({
          file: "sense_translations.csv",
          line,
          message: `Duplicate locale "${locale}" for sense "${senseKey}"`,
          severity: "error",
        });
      }
      set.add(locale);
    }
  }
}

function validateEntryAliases(
  files: Map<string, import("./csv-parse").ParsedCsv>,
  keys: KeyRegistry,
  push: (i: ValidationIssue) => void,
) {
  const parsed = files.get("entry_aliases.csv");
  if (!parsed) return;
  checkImportKeyUnique("entry_aliases.csv", parsed.rows, "import_key", push);
  for (let i = 0; i < parsed.rows.length; i++) {
    const row = parsed.rows[i]!;
    const line = rowNumber(i);
    resolveRef("entry_aliases.csv", line, "entry_import_key", row.entry_import_key, keys.entries, "entry_import_key", push);
    checkEnum("entry_aliases.csv", row, line, "alias_type", ALIAS_TYPES, push, false);
    checkPublicationStatus("entry_aliases.csv", row, line, push, {});
    const loc = row.locale?.trim();
    if (loc && !LOCALES.includes(loc as (typeof LOCALES)[number])) {
      push({ file: "entry_aliases.csv", line, field: "locale", message: `Invalid locale "${loc}"`, severity: "error" });
    }
  }
}

function validateExamples(
  files: Map<string, import("./csv-parse").ParsedCsv>,
  keys: KeyRegistry,
  push: (i: ValidationIssue) => void,
  options: ValidateOptions,
) {
  const parsed = files.get("examples.csv");
  if (!parsed) return;
  checkImportKeyUnique("examples.csv", parsed.rows, "import_key", push);
  for (let i = 0; i < parsed.rows.length; i++) {
    const row = parsed.rows[i]!;
    const line = rowNumber(i);
    checkEnum("examples.csv", row, line, "provenance_type", PROVENANCE_TYPES, push, false);
    checkEnum("examples.csv", row, line, "register", REGISTERS, push);
    checkEnum("examples.csv", row, line, "difficulty_level", DIFFICULTY_LEVELS, push);
    checkPublicationStatus("examples.csv", row, line, push, options);
    validateProvenance("examples.csv", row, line, push);
  }
}

function validateProvenance(
  file: string,
  row: CsvRow,
  line: number,
  push: (i: ValidationIssue) => void,
) {
  const provenance = row.provenance_type?.trim();
  const status = (row.status?.trim() || "draft") as string;
  const sourceNote = row.source_note?.trim();
  const licenseNote = row.license_note?.trim();

  if (status === "published" && provenance === "unknown") {
    push({
      file,
      line,
      field: "provenance_type",
      message: "provenance_type=unknown cannot be published",
      severity: "error",
    });
  }
  if (
    provenance &&
    provenance !== "original" &&
    provenance !== "public_domain" &&
    !sourceNote
  ) {
    push({
      file,
      line,
      field: "source_note",
      message: `provenance_type=${provenance} requires source_note`,
      severity: "error",
    });
  }
  if (provenance === "licensed" && !licenseNote) {
    push({
      file,
      line,
      field: "license_note",
      message: "provenance_type=licensed requires license_note",
      severity: "error",
    });
  }
}

function validateExampleTranslations(
  files: Map<string, import("./csv-parse").ParsedCsv>,
  keys: KeyRegistry,
  push: (i: ValidationIssue) => void,
) {
  const parsed = files.get("example_translations.csv");
  if (!parsed) return;
  checkImportKeyUnique("example_translations.csv", parsed.rows, "import_key", push);
  for (let i = 0; i < parsed.rows.length; i++) {
    const row = parsed.rows[i]!;
    const line = rowNumber(i);
    checkLocale("example_translations.csv", row, line, push);
    checkTranslationStatus("example_translations.csv", row, line, push);
    resolveRef("example_translations.csv", line, "example_import_key", row.example_import_key, keys.examples, "example_import_key", push);
    if (!row.translation?.trim()) {
      push({ file: "example_translations.csv", line, field: "translation", message: "translation required", severity: "error" });
    }
  }
}

function validateEntryExamples(
  files: Map<string, import("./csv-parse").ParsedCsv>,
  keys: KeyRegistry,
  push: (i: ValidationIssue) => void,
) {
  const parsed = files.get("entry_examples.csv");
  if (!parsed) return;
  const seen = new Set<string>();
  for (let i = 0; i < parsed.rows.length; i++) {
    const row = parsed.rows[i]!;
    const line = rowNumber(i);
    resolveRef("entry_examples.csv", line, "entry_import_key", row.entry_import_key, keys.entries, "entry_import_key", push);
    resolveRef("entry_examples.csv", line, "example_import_key", row.example_import_key, keys.examples, "example_import_key", push);
    const senseKey = row.sense_import_key?.trim();
    if (senseKey) {
      resolveRef("entry_examples.csv", line, "sense_import_key", senseKey, keys.senses, "sense_import_key", push);
    }
    const dedupe = `${row.entry_import_key}|${row.example_import_key}|${senseKey ?? ""}`;
    if (seen.has(dedupe)) {
      push({ file: "entry_examples.csv", line, message: "Duplicate entry/example/sense link", severity: "error" });
    }
    seen.add(dedupe);
  }
}

function validateSoundChange(
  files: Map<string, import("./csv-parse").ParsedCsv>,
  keys: KeyRegistry,
  push: (i: ValidationIssue) => void,
  options: ValidateOptions,
) {
  const rules = files.get("sound_change_rules.csv");
  if (rules) {
    checkImportKeyUnique("sound_change_rules.csv", rules.rows, "import_key", push);
    for (let i = 0; i < rules.rows.length; i++) {
      const row = rules.rows[i]!;
      const line = rowNumber(i);
      checkSlug("sound_change_rules.csv", row, line, push);
      checkEnum("sound_change_rules.csv", row, line, "category", SOUND_CHANGE_CATEGORIES, push, false);
      checkRange("sound_change_rules.csv", row, line, "difficulty", 1, 5, push);
      checkRange("sound_change_rules.csv", row, line, "frequency", 1, 5, push);
      checkPublicationStatus("sound_change_rules.csv", row, line, push, options);
    }
  }

  const trans = files.get("sound_change_translations.csv");
  if (trans) {
    checkImportKeyUnique("sound_change_translations.csv", trans.rows, "import_key", push);
    for (let i = 0; i < trans.rows.length; i++) {
      const row = trans.rows[i]!;
      const line = rowNumber(i);
      checkLocale("sound_change_translations.csv", row, line, push);
      checkTranslationStatus("sound_change_translations.csv", row, line, push);
      resolveRef("sound_change_translations.csv", line, "rule_import_key", row.rule_import_key, keys.soundChangeRules, "rule_import_key", push);
    }
  }

  const steps = files.get("sound_change_steps.csv");
  if (steps) {
    checkImportKeyUnique("sound_change_steps.csv", steps.rows, "import_key", push);
    for (let i = 0; i < steps.rows.length; i++) {
      const row = steps.rows[i]!;
      const line = rowNumber(i);
      resolveRef("sound_change_steps.csv", line, "rule_import_key", row.rule_import_key, keys.soundChangeRules, "rule_import_key", push);
    }
  }

  const stepTrans = files.get("sound_change_step_translations.csv");
  if (stepTrans) {
    checkImportKeyUnique("sound_change_step_translations.csv", stepTrans.rows, "import_key", push);
    for (let i = 0; i < stepTrans.rows.length; i++) {
      const row = stepTrans.rows[i]!;
      const line = rowNumber(i);
      checkLocale("sound_change_step_translations.csv", row, line, push);
      resolveRef("sound_change_step_translations.csv", line, "step_import_key", row.step_import_key, keys.soundChangeSteps, "step_import_key", push);
    }
  }

  const links = files.get("entry_sound_changes.csv");
  if (links) {
    const seen = new Set<string>();
    for (let i = 0; i < links.rows.length; i++) {
      const row = links.rows[i]!;
      const line = rowNumber(i);
      resolveRef("entry_sound_changes.csv", line, "entry_import_key", row.entry_import_key, keys.entries, "entry_import_key", push);
      resolveRef("entry_sound_changes.csv", line, "rule_import_key", row.rule_import_key, keys.soundChangeRules, "rule_import_key", push);
      checkEnum("entry_sound_changes.csv", row, line, "relation_type", SOUND_CHANGE_ENTRY_RELATION_TYPES, push, false);
      const dedupe = `${row.entry_import_key}|${row.rule_import_key}|${row.relation_type}`;
      if (seen.has(dedupe)) {
        push({ file: "entry_sound_changes.csv", line, message: "Duplicate entry/rule relation", severity: "error" });
      }
      seen.add(dedupe);
    }
  }
}

function validateConjugation(
  files: Map<string, import("./csv-parse").ParsedCsv>,
  keys: KeyRegistry,
  push: (i: ValidationIssue) => void,
  options: ValidateOptions,
) {
  const rules = files.get("conjugation_rules.csv");
  if (rules) {
    checkImportKeyUnique("conjugation_rules.csv", rules.rows, "import_key", push);
    for (let i = 0; i < rules.rows.length; i++) {
      const row = rules.rows[i]!;
      const line = rowNumber(i);
      checkSlug("conjugation_rules.csv", row, line, push);
      checkPublicationStatus("conjugation_rules.csv", row, line, push, options);
      const isIrreg = row.is_irregular?.trim().toLowerCase();
      const irrType = row.irregular_type?.trim();
      if (isIrreg === "true" && !irrType) {
        push({ file: "conjugation_rules.csv", line, field: "irregular_type", message: "irregular_type required when is_irregular=true", severity: "error" });
      }
      if (isIrreg === "false" && irrType) {
        push({ file: "conjugation_rules.csv", line, field: "irregular_type", message: "irregular_type must be empty when is_irregular=false", severity: "error" });
      }
      if (irrType) checkEnum("conjugation_rules.csv", row, line, "irregular_type", IRREGULAR_TYPES, push);
    }
  }

  const results = files.get("conjugation_results.csv");
  if (results) {
    checkImportKeyUnique("conjugation_results.csv", results.rows, "import_key", push);
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows[i]!;
      const line = rowNumber(i);
      resolveRef("conjugation_results.csv", line, "entry_import_key", row.entry_import_key, keys.entries, "entry_import_key", push);
      checkEnum("conjugation_results.csv", row, line, "form_code", CONJUGATION_FORM_CODES, push, false);
      checkPublicationStatus("conjugation_results.csv", row, line, push, options);
      const ruleKey = row.rule_import_key?.trim();
      if (ruleKey) {
        resolveRef("conjugation_results.csv", line, "rule_import_key", ruleKey, keys.conjugationRules, "rule_import_key", push);
      }
    }
  }

  const resultSteps = files.get("conjugation_result_steps.csv");
  if (resultSteps) {
    checkImportKeyUnique("conjugation_result_steps.csv", resultSteps.rows, "import_key", push);
    for (let i = 0; i < resultSteps.rows.length; i++) {
      const row = resultSteps.rows[i]!;
      const line = rowNumber(i);
      resolveRef("conjugation_result_steps.csv", line, "result_import_key", row.result_import_key, keys.conjugationResults, "result_import_key", push);
    }
  }
}

function validateHanja(
  files: Map<string, import("./csv-parse").ParsedCsv>,
  keys: KeyRegistry,
  push: (i: ValidationIssue) => void,
  options: ValidateOptions,
) {
  const chars = files.get("hanja_characters.csv");
  if (chars) {
    checkImportKeyUnique("hanja_characters.csv", chars.rows, "import_key", push);
    for (let i = 0; i < chars.rows.length; i++) {
      const row = chars.rows[i]!;
      checkPublicationStatus("hanja_characters.csv", row, rowNumber(i), push, options);
    }
  }

  const readings = files.get("hanja_readings.csv");
  if (readings) {
    checkImportKeyUnique("hanja_readings.csv", readings.rows, "import_key", push);
    for (let i = 0; i < readings.rows.length; i++) {
      const row = readings.rows[i]!;
      resolveRef("hanja_readings.csv", rowNumber(i), "character_import_key", row.character_import_key, keys.hanjaCharacters, "character_import_key", push);
    }
  }

  const terms = files.get("hanja_terms.csv");
  if (terms) {
    checkImportKeyUnique("hanja_terms.csv", terms.rows, "import_key", push);
    for (let i = 0; i < terms.rows.length; i++) {
      const row = terms.rows[i]!;
      const line = rowNumber(i);
      checkSlug("hanja_terms.csv", row, line, push);
      resolveRef("hanja_terms.csv", line, "entry_import_key", row.entry_import_key, keys.entries, "entry_import_key", push);
      checkPublicationStatus("hanja_terms.csv", row, line, push, options);
    }
  }

  const termChars = files.get("hanja_term_characters.csv");
  if (termChars) {
    const positionsByTerm = new Map<string, number[]>();
    for (let i = 0; i < termChars.rows.length; i++) {
      const row = termChars.rows[i]!;
      const line = rowNumber(i);
      const termKey = row.term_import_key?.trim();
      resolveRef("hanja_term_characters.csv", line, "term_import_key", termKey, keys.hanjaTerms, "term_import_key", push);
      resolveRef("hanja_term_characters.csv", line, "character_import_key", row.character_import_key, keys.hanjaCharacters, "character_import_key", push);
      const readingKey = row.reading_import_key?.trim();
      if (readingKey) {
        resolveRef("hanja_term_characters.csv", line, "reading_import_key", readingKey, keys.hanjaReadings, "reading_import_key", push);
      }
      const pos = Number(row.position);
      if (!Number.isInteger(pos) || pos < 1) {
        push({ file: "hanja_term_characters.csv", line, field: "position", message: "position must be positive integer", severity: "error" });
      } else if (termKey) {
        if (!positionsByTerm.has(termKey)) positionsByTerm.set(termKey, []);
        positionsByTerm.get(termKey)!.push(pos);
      }
    }

    for (const [termKey, positions] of positionsByTerm) {
      const sorted = [...positions].sort((a, b) => a - b);
      const unique = [...new Set(sorted)];
      if (unique.length !== positions.length) {
        push({
          file: "hanja_term_characters.csv",
          message: `Duplicate positions for term "${termKey}"`,
          severity: "error",
        });
        continue;
      }
      for (let p = 0; p < unique.length; p++) {
        if (unique[p] !== p + 1) {
          push({
            file: "hanja_term_characters.csv",
            message: `Hanja positions for term "${termKey}" must be consecutive from 1 (got ${unique.join(",")})`,
            severity: "error",
          });
          break;
        }
      }
    }
  }
}

function validateIdioms(
  files: Map<string, import("./csv-parse").ParsedCsv>,
  keys: KeyRegistry,
  push: (i: ValidationIssue) => void,
  options: ValidateOptions,
) {
  const idioms = files.get("idioms.csv");
  if (idioms) {
    checkImportKeyUnique("idioms.csv", idioms.rows, "import_key", push);
    for (let i = 0; i < idioms.rows.length; i++) {
      const row = idioms.rows[i]!;
      const line = rowNumber(i);
      checkSlug("idioms.csv", row, line, push);
      checkEnum("idioms.csv", row, line, "register", REGISTERS, push);
      checkPublicationStatus("idioms.csv", row, line, push, options);
    }
  }

  const trans = files.get("idiom_translations.csv");
  if (trans) {
    checkImportKeyUnique("idiom_translations.csv", trans.rows, "import_key", push);
    for (let i = 0; i < trans.rows.length; i++) {
      const row = trans.rows[i]!;
      const line = rowNumber(i);
      checkLocale("idiom_translations.csv", row, line, push);
      checkTranslationStatus("idiom_translations.csv", row, line, push);
      resolveRef("idiom_translations.csv", line, "idiom_import_key", row.idiom_import_key, keys.idioms, "idiom_import_key", push);
    }
  }

  const cats = files.get("idiom_category_links.csv");
  if (cats) {
    const seen = new Set<string>();
    for (let i = 0; i < cats.rows.length; i++) {
      const row = cats.rows[i]!;
      const line = rowNumber(i);
      resolveRef("idiom_category_links.csv", line, "idiom_import_key", row.idiom_import_key, keys.idioms, "idiom_import_key", push);
      checkEnum("idiom_category_links.csv", row, line, "category", IDIOM_CATEGORIES, push, false);
      const dedupe = `${row.idiom_import_key}|${row.category}`;
      if (seen.has(dedupe)) {
        push({ file: "idiom_category_links.csv", line, message: "Duplicate idiom/category link", severity: "error" });
      }
      seen.add(dedupe);
    }
  }

  const relations = files.get("idiom_relations.csv");
  if (relations) {
    const seen = new Set<string>();
    for (let i = 0; i < relations.rows.length; i++) {
      const row = relations.rows[i]!;
      const line = rowNumber(i);
      resolveRef("idiom_relations.csv", line, "source_idiom_import_key", row.source_idiom_import_key, keys.idioms, "source_idiom_import_key", push);
      resolveRef("idiom_relations.csv", line, "target_idiom_import_key", row.target_idiom_import_key, keys.idioms, "target_idiom_import_key", push);
      checkEnum("idiom_relations.csv", row, line, "relation_type", IDIOM_RELATION_TYPES, push, false);
      if (row.source_idiom_import_key?.trim() === row.target_idiom_import_key?.trim()) {
        push({ file: "idiom_relations.csv", line, message: "Idiom cannot relate to itself", severity: "error" });
      }
      const dedupe = `${row.source_idiom_import_key}|${row.target_idiom_import_key}|${row.relation_type}`;
      if (seen.has(dedupe)) {
        push({ file: "idiom_relations.csv", line, message: "Duplicate idiom relation", severity: "error" });
      }
      seen.add(dedupe);
    }
  }
}

function validateSources(
  files: Map<string, import("./csv-parse").ParsedCsv>,
  keys: KeyRegistry,
  push: (i: ValidationIssue) => void,
) {
  const sources = files.get("sources.csv");
  if (sources) {
    checkImportKeyUnique("sources.csv", sources.rows, "import_key", push);
    for (let i = 0; i < sources.rows.length; i++) {
      const row = sources.rows[i]!;
      const line = rowNumber(i);
      checkEnum("sources.csv", row, line, "source_type", SOURCE_TYPES, push, false);
      const vs = row.verification_status?.trim() || "unverified";
      if (!VERIFICATION_STATUSES.includes(vs as (typeof VERIFICATION_STATUSES)[number])) {
        push({ file: "sources.csv", line, field: "verification_status", message: `Invalid verification_status "${vs}"`, severity: "error" });
      }
    }
  }

  const contentSources = files.get("content_sources.csv");
  if (contentSources) {
    for (let i = 0; i < contentSources.rows.length; i++) {
      const row = contentSources.rows[i]!;
      const line = rowNumber(i);
      resolveRef("content_sources.csv", line, "source_import_key", row.source_import_key, keys.sources, "source_import_key", push);

      const targets = CONTENT_TARGET_COLUMNS.filter((col) => row[col]?.trim());
      if (targets.length !== 1) {
        push({
          file: "content_sources.csv",
          line,
          message: "Exactly one target *_import_key column must be set",
          severity: "error",
        });
        continue;
      }
      const col = targets[0]!;
      const val = row[col]!.trim();
      const registryMap: Record<string, Set<string>> = {
        entry_import_key: keys.entries,
        sense_import_key: keys.senses,
        example_import_key: keys.examples,
        sound_change_rule_import_key: keys.soundChangeRules,
        conjugation_rule_import_key: keys.conjugationRules,
        conjugation_result_import_key: keys.conjugationResults,
        hanja_character_import_key: keys.hanjaCharacters,
        hanja_term_import_key: keys.hanjaTerms,
        idiom_import_key: keys.idioms,
      };
      resolveRef("content_sources.csv", line, col, val, registryMap[col]!, col, push);
    }
  }
}

function validateEnglishCore(
  files: Map<string, import("./csv-parse").ParsedCsv>,
  keys: KeyRegistry,
  push: (i: ValidationIssue) => void,
  options: ValidateOptions,
) {
  const entries = files.get("entries.csv");
  if (!entries || entries.rows.length === 0) return;

  const senseByEntry = new Map<string, string[]>();
  const senses = files.get("senses.csv");
  if (senses) {
    for (const row of senses.rows) {
      const entryKey = row.entry_import_key?.trim();
      const senseKey = row.import_key?.trim();
      if (entryKey && senseKey) {
        if (!senseByEntry.has(entryKey)) senseByEntry.set(entryKey, []);
        senseByEntry.get(entryKey)!.push(senseKey);
      }
    }
  }

  const enBySense = new Map<string, { short?: string; def?: string }>();
  const senseTrans = files.get("sense_translations.csv");
  if (senseTrans) {
    for (const row of senseTrans.rows) {
      if (row.locale?.trim() !== "en") continue;
      const senseKey = row.sense_import_key?.trim();
      if (!senseKey) continue;
      enBySense.set(senseKey, {
        short: row.short_definition?.trim(),
        def: row.definition?.trim(),
      });
    }
  }

  for (let i = 0; i < entries.rows.length; i++) {
    const entryKey = entries.rows[i]!.import_key?.trim();
    if (!entryKey) continue;

    const senseKeys = senseByEntry.get(entryKey) ?? [];
    let hasEnCore = false;
    for (const sk of senseKeys) {
      const en = enBySense.get(sk);
      if (en && ((en.short && en.short.length > 0) || (en.def && en.def.length > 0))) {
        hasEnCore = true;
        break;
      }
    }

    if (!hasEnCore && !options.templatesMode) {
      push({
        file: "entries.csv",
        line: rowNumber(i),
        message: `Entry "${entryKey}" missing English core content (en sense_translation with short_definition or definition)`,
        severity: "error",
      });
    }
  }
}

export function formatValidationReport(result: ValidationResult): string {
  const lines: string[] = [];
  if (result.ok) {
    lines.push("Validation PASSED");
  } else {
    lines.push("Validation FAILED");
  }
  lines.push(`Errors: ${result.errors.length}, Warnings: ${result.warnings.length}`);
  for (const e of result.errors) {
    lines.push(`  ERROR ${e.file}${e.line ? `:${e.line}` : ""}${e.field ? ` [${e.field}]` : ""} — ${e.message}`);
  }
  for (const w of result.warnings) {
    lines.push(`  WARN  ${w.file}${w.line ? `:${w.line}` : ""}${w.field ? ` [${w.field}]` : ""} — ${w.message}`);
  }
  return lines.join("\n");
}
