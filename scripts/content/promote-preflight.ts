import { PILOT_EXPECTED_COUNTS } from "./import-config";
import type { DbClient } from "./import-db";
import type { ContentPackage } from "./import-package";
import { getPackageRows } from "./import-package";
import {
  collectPilotImportKeys,
  type PilotImportKeys,
} from "./import-preflight";
import {
  resolvePromoteTransition,
  type PromoteTargetStatus,
} from "./promote-config";

const REQUIRED_LOCALES = ["en", "ja", "zh"] as const;

export type PromoteDbEntryRow = {
  id: string;
  import_key: string;
  status: string;
};

export type PromoteDbSenseRow = {
  id: string;
  import_key: string;
  entry_id: string;
  is_primary: boolean;
  status: string;
};

export type PromoteDbSenseTranslationRow = {
  id: string;
  import_key: string;
  sense_id: string;
  locale: string;
  short_definition: string | null;
  definition: string | null;
  status: string;
};

export type PromoteDbEntryAliasRow = {
  id: string;
  import_key: string;
  status: string;
};

export type PromoteDbExampleRow = {
  id: string;
  import_key: string;
  korean_text: string;
  provenance_type: string;
  status: string;
};

export type PromoteDbExampleTranslationRow = {
  id: string;
  import_key: string;
  example_id: string;
  locale: string;
  status: string;
};

export type PromoteDbEntryExampleLink = {
  entry_import_key: string;
  example_import_key: string;
  sense_import_key: string | null;
};

export type PromoteDbState = {
  entries: PromoteDbEntryRow[];
  senses: PromoteDbSenseRow[];
  sense_translations: PromoteDbSenseTranslationRow[];
  entry_aliases: PromoteDbEntryAliasRow[];
  examples: PromoteDbExampleRow[];
  example_translations: PromoteDbExampleTranslationRow[];
  entry_examples: PromoteDbEntryExampleLink[];
};

export type PromoteIssue = {
  kind:
    | "count_mismatch"
    | "missing_key"
    | "status_mismatch"
    | "translation_incomplete"
    | "link_missing"
    | "link_orphan"
    | "publish_not_ready";
  message: string;
  entity?: string;
};

export type PromotePreflightInput = {
  pkg: ContentPackage;
  targetStatus: PromoteTargetStatus;
  pilotImportKeys: PilotImportKeys;
  transition: ReturnType<typeof resolvePromoteTransition>;
  db: PromoteDbState;
};

export const PROMOTE_READONLY_SQL = {
  entries: `SELECT id::text, import_key, status FROM public.entries WHERE import_key = ANY($1::text[])`,
  senses: `SELECT id::text, import_key, entry_id::text, is_primary, status FROM public.senses WHERE import_key = ANY($1::text[])`,
  senseTranslations: `SELECT id::text, import_key, sense_id::text, locale, short_definition, definition, status FROM public.sense_translations WHERE import_key = ANY($1::text[])`,
  entryAliases: `SELECT id::text, import_key, status FROM public.entry_aliases WHERE import_key = ANY($1::text[])`,
  examples: `SELECT id::text, import_key, korean_text, provenance_type, status FROM public.examples WHERE import_key = ANY($1::text[])`,
  exampleTranslations: `SELECT id::text, import_key, example_id::text, locale, status FROM public.example_translations WHERE import_key = ANY($1::text[])`,
  entryExamples: `
    SELECT e.import_key AS entry_import_key,
           ex.import_key AS example_import_key,
           s.import_key AS sense_import_key
    FROM public.entry_examples ee
    JOIN public.entries e ON e.id = ee.entry_id
    JOIN public.examples ex ON ex.id = ee.example_id
    LEFT JOIN public.senses s ON s.id = ee.sense_id
    WHERE e.import_key = ANY($1::text[])
      AND ex.import_key = ANY($2::text[])
  `,
} as const;

function keysArray(keys: Set<string>): string[] {
  return [...keys].sort();
}

/** Load Pilot-scoped rows sequentially (one pg client must not query concurrently). */
export async function loadPromoteDbState(
  db: DbClient,
  pilotImportKeys: PilotImportKeys,
): Promise<PromoteDbState> {
  const entryKeys = keysArray(pilotImportKeys.entries);
  const senseKeys = keysArray(pilotImportKeys.senses);
  const senseTranslationKeys = keysArray(pilotImportKeys.sense_translations);
  const entryAliasKeys = keysArray(pilotImportKeys.entry_aliases);
  const exampleKeys = keysArray(pilotImportKeys.examples);
  const exampleTranslationKeys = keysArray(pilotImportKeys.example_translations);

  const entriesRes = await db.query<PromoteDbEntryRow>(PROMOTE_READONLY_SQL.entries, [
    entryKeys,
  ]);
  const sensesRes = await db.query<PromoteDbSenseRow>(PROMOTE_READONLY_SQL.senses, [
    senseKeys,
  ]);
  const senseTranslationsRes = await db.query<PromoteDbSenseTranslationRow>(
    PROMOTE_READONLY_SQL.senseTranslations,
    [senseTranslationKeys],
  );
  const entryAliasesRes = await db.query<PromoteDbEntryAliasRow>(
    PROMOTE_READONLY_SQL.entryAliases,
    [entryAliasKeys],
  );
  const examplesRes = await db.query<PromoteDbExampleRow>(PROMOTE_READONLY_SQL.examples, [
    exampleKeys,
  ]);
  const exampleTranslationsRes = await db.query<PromoteDbExampleTranslationRow>(
    PROMOTE_READONLY_SQL.exampleTranslations,
    [exampleTranslationKeys],
  );
  const entryExamplesRes = await db.query<PromoteDbEntryExampleLink>(
    PROMOTE_READONLY_SQL.entryExamples,
    [entryKeys, exampleKeys],
  );

  return {
    entries: entriesRes.rows,
    senses: sensesRes.rows,
    sense_translations: senseTranslationsRes.rows,
    entry_aliases: entryAliasesRes.rows,
    examples: examplesRes.rows,
    example_translations: exampleTranslationsRes.rows,
    entry_examples: entryExamplesRes.rows,
  };
}

function checkKeyedEntity(
  entity: string,
  expectedKeys: Set<string>,
  dbRows: { import_key: string; status: string }[],
  expectedStatus: string,
  issues: PromoteIssue[],
): void {
  const expectedCount = expectedKeys.size;

  if (dbRows.length !== expectedCount) {
    issues.push({
      kind: "count_mismatch",
      entity,
      message: `${entity}: expected ${expectedCount} Pilot rows in database, found ${dbRows.length}.`,
    });
  }

  const dbByKey = new Map(dbRows.map((row) => [row.import_key, row]));

  for (const key of expectedKeys) {
    const row = dbByKey.get(key);
    if (!row) {
      issues.push({
        kind: "missing_key",
        entity,
        message: `${entity}: missing import_key "${key}" in database.`,
      });
      continue;
    }
    if (row.status !== expectedStatus) {
      issues.push({
        kind: "status_mismatch",
        entity,
        message: `${entity} "${key}": expected status "${expectedStatus}", found "${row.status}".`,
      });
    }
  }

  for (const row of dbRows) {
    if (!expectedKeys.has(row.import_key)) {
      issues.push({
        kind: "missing_key",
        entity,
        message: `${entity}: unexpected import_key "${row.import_key}" in database (not in Pilot CSV).`,
      });
    }
  }
}

function checkTranslationCompleteness(
  entity: "sense_translations" | "example_translations",
  parentLabel: "sense" | "example",
  expectedTranslationKeys: Set<string>,
  dbRows: Array<{ import_key: string; locale: string; status: string; sense_id?: string; example_id?: string }>,
  parentKeys: Set<string>,
  parentIdField: "sense_id" | "example_id",
  dbParentRows: Array<{ id: string; import_key: string }>,
  issues: PromoteIssue[],
): void {
  const parentIdToKey = new Map(dbParentRows.map((row) => [row.id, row.import_key]));

  for (const parentKey of parentKeys) {
    const localesFound = new Set<string>();
    for (const row of dbRows) {
      const rowParentKey = parentIdToKey.get(row[parentIdField] as string);
      if (rowParentKey !== parentKey) continue;
      localesFound.add(row.locale);
    }

    for (const locale of REQUIRED_LOCALES) {
      if (!localesFound.has(locale)) {
        issues.push({
          kind: "translation_incomplete",
          entity,
          message: `${parentLabel} "${parentKey}" missing "${locale}" translation in database.`,
        });
      }
    }
  }

  if (dbRows.length !== expectedTranslationKeys.size) {
    issues.push({
      kind: "count_mismatch",
      entity,
      message: `${entity}: expected ${expectedTranslationKeys.size} Pilot rows, found ${dbRows.length}.`,
    });
  }
}

function linkKey(
  entryKey: string,
  exampleKey: string,
  senseKey: string | null | undefined,
): string {
  return `${entryKey}|${exampleKey}|${senseKey?.trim() || ""}`;
}

function checkEntryExampleLinks(input: PromotePreflightInput, issues: PromoteIssue[]): void {
  const csvLinks = getPackageRows(input.pkg, "entry_examples.csv");

  const dbLinkSet = new Set(
    input.db.entry_examples.map((link) =>
      linkKey(link.entry_import_key, link.example_import_key, link.sense_import_key),
    ),
  );

  const entryKeys = input.pilotImportKeys.entries;
  const exampleKeys = input.pilotImportKeys.examples;
  const senseKeys = input.pilotImportKeys.senses;

  for (let i = 0; i < csvLinks.length; i++) {
    const row = csvLinks[i]!;
    const entryImportKey = row.entry_import_key?.trim();
    const exampleImportKey = row.example_import_key?.trim();
    const senseImportKey = row.sense_import_key?.trim() || null;

    if (!entryImportKey || !exampleImportKey) {
      issues.push({
        kind: "link_missing",
        entity: "entry_examples",
        message: `entry_examples.csv row ${i + 2}: missing entry_import_key or example_import_key.`,
      });
      continue;
    }

    if (!entryKeys.has(entryImportKey)) {
      issues.push({
        kind: "link_orphan",
        entity: "entry_examples",
        message: `entry_examples.csv row ${i + 2}: entry_import_key "${entryImportKey}" is not in Pilot entries.`,
      });
    }
    if (!exampleKeys.has(exampleImportKey)) {
      issues.push({
        kind: "link_orphan",
        entity: "entry_examples",
        message: `entry_examples.csv row ${i + 2}: example_import_key "${exampleImportKey}" is not in Pilot examples.`,
      });
    }
    if (senseImportKey && !senseKeys.has(senseImportKey)) {
      issues.push({
        kind: "link_orphan",
        entity: "entry_examples",
        message: `entry_examples.csv row ${i + 2}: sense_import_key "${senseImportKey}" is not in Pilot senses.`,
      });
    }

    const key = linkKey(entryImportKey, exampleImportKey, senseImportKey);
    if (!dbLinkSet.has(key)) {
      issues.push({
        kind: "link_missing",
        entity: "entry_examples",
        message: `entry_examples link missing in database: entry="${entryImportKey}", example="${exampleImportKey}", sense="${senseImportKey ?? ""}".`,
      });
    }
  }

  if (input.db.entry_examples.length !== csvLinks.length) {
    issues.push({
      kind: "count_mismatch",
      entity: "entry_examples",
      message: `entry_examples: expected ${csvLinks.length} database links for Pilot scope, found ${input.db.entry_examples.length}.`,
    });
  }
}

function checkSenseEntryResolution(input: PromotePreflightInput, issues: PromoteIssue[]): void {
  const entryIdByKey = new Map(input.db.entries.map((row) => [row.import_key, row.id]));
  const pilotSenses = getPackageRows(input.pkg, "senses.csv");

  for (const row of pilotSenses) {
    const senseKey = row.import_key?.trim();
    const entryKey = row.entry_import_key?.trim();
    if (!senseKey || !entryKey) continue;

    const dbSense = input.db.senses.find((s) => s.import_key === senseKey);
    const entryId = entryIdByKey.get(entryKey);
    if (!dbSense || !entryId) continue;

    if (dbSense.entry_id !== entryId) {
      issues.push({
        kind: "link_orphan",
        entity: "senses",
        message: `Sense "${senseKey}" is linked to entry_id ${dbSense.entry_id}, expected entry "${entryKey}" (${entryId}).`,
      });
    }
  }
}

function checkPublishReadiness(input: PromotePreflightInput, issues: PromoteIssue[]): void {
  if (input.targetStatus !== "published") return;

  const primarySenseByEntry = new Map<string, string>();
  for (const row of getPackageRows(input.pkg, "senses.csv")) {
    if (row.is_primary?.trim().toLowerCase() === "true") {
      const entryKey = row.entry_import_key?.trim();
      const senseKey = row.import_key?.trim();
      if (entryKey && senseKey) primarySenseByEntry.set(entryKey, senseKey);
    }
  }

  for (const entryKey of input.pilotImportKeys.entries) {
    if (!primarySenseByEntry.has(entryKey)) {
      issues.push({
        kind: "publish_not_ready",
        entity: "entries",
        message: `Entry "${entryKey}" has no primary sense declared in Pilot CSV.`,
      });
    }
  }

  const senseIdByKey = new Map(input.db.senses.map((row) => [row.import_key, row.id]));
  const translationsBySenseId = new Map<string, PromoteDbSenseTranslationRow[]>();
  for (const row of input.db.sense_translations) {
    const bucket = translationsBySenseId.get(row.sense_id) ?? [];
    bucket.push(row);
    translationsBySenseId.set(row.sense_id, bucket);
  }

  for (const senseKey of input.pilotImportKeys.senses) {
    const senseId = senseIdByKey.get(senseKey);
    if (!senseId) continue;

    const translations = translationsBySenseId.get(senseId) ?? [];
    const en = translations.find((t) => t.locale === "en");
    const enContent = en?.short_definition?.trim() || en?.definition?.trim() || "";
    if (!enContent) {
      issues.push({
        kind: "publish_not_ready",
        entity: "sense_translations",
        message: `Sense "${senseKey}" lacks non-empty English definition required for publication.`,
      });
    }
  }

  for (const example of input.db.examples) {
    if (!example.korean_text?.trim()) {
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
    }
  }
}

export function buildPromotePreflightInput(
  pkg: ContentPackage,
  targetStatus: PromoteTargetStatus,
  db: PromoteDbState,
): PromotePreflightInput {
  return {
    pkg,
    targetStatus,
    pilotImportKeys: collectPilotImportKeys(pkg),
    transition: resolvePromoteTransition(targetStatus),
    db,
  };
}

export function detectPromoteIssues(input: PromotePreflightInput): PromoteIssue[] {
  const issues: PromoteIssue[] = [];
  const { sourceStatus } = input.transition;
  const keys = input.pilotImportKeys;

  checkKeyedEntity("entries", keys.entries, input.db.entries, sourceStatus, issues);
  checkKeyedEntity("senses", keys.senses, input.db.senses, sourceStatus, issues);
  checkKeyedEntity(
    "sense_translations",
    keys.sense_translations,
    input.db.sense_translations,
    sourceStatus,
    issues,
  );
  checkKeyedEntity(
    "entry_aliases",
    keys.entry_aliases,
    input.db.entry_aliases,
    sourceStatus,
    issues,
  );
  checkKeyedEntity("examples", keys.examples, input.db.examples, sourceStatus, issues);
  checkKeyedEntity(
    "example_translations",
    keys.example_translations,
    input.db.example_translations,
    sourceStatus,
    issues,
  );

  checkTranslationCompleteness(
    "sense_translations",
    "sense",
    keys.sense_translations,
    input.db.sense_translations,
    keys.senses,
    "sense_id",
    input.db.senses,
    issues,
  );
  checkTranslationCompleteness(
    "example_translations",
    "example",
    keys.example_translations,
    input.db.example_translations,
    keys.examples,
    "example_id",
    input.db.examples,
    issues,
  );

  checkSenseEntryResolution(input, issues);
  checkEntryExampleLinks(input, issues);
  checkPublishReadiness(input, issues);

  return issues;
}

export function formatPromotePreflightReport(
  projectRef: string,
  input: PromotePreflightInput,
  issues: PromoteIssue[],
): string {
  const lines = [
    "--- Formal Pilot promotion preflight ---",
    `Target project ref: ${projectRef}`,
    `Transition: ${input.transition.label}`,
    "",
    "Pilot scope:",
    `  entries: ${PILOT_EXPECTED_COUNTS.entries}`,
    `  senses: ${PILOT_EXPECTED_COUNTS.senses}`,
    `  sense_translations: ${PILOT_EXPECTED_COUNTS.sense_translations}`,
    `  entry_aliases: ${PILOT_EXPECTED_COUNTS.entry_aliases}`,
    `  examples: ${PILOT_EXPECTED_COUNTS.examples}`,
    `  example_translations: ${PILOT_EXPECTED_COUNTS.example_translations}`,
    `  entry_examples: ${PILOT_EXPECTED_COUNTS.entry_examples}`,
    "",
    `Blocking issues: ${issues.length}`,
  ];

  if (issues.length === 0) {
    lines.push("", "PREFLIGHT PASSED", "Database writes: NONE");
  } else {
    lines.push("", `PREFLIGHT BLOCKED (${issues.length} issue(s))`);
    for (const issue of issues) {
      lines.push(`  ${issue.kind}: ${issue.message}`);
    }
  }

  return lines.join("\n");
}

export type PromotePreflightResult = {
  ok: boolean;
  issues: PromoteIssue[];
  input: PromotePreflightInput;
  report: string;
};

export async function runPromotePreflight(
  db: DbClient,
  pkg: ContentPackage,
  targetStatus: PromoteTargetStatus,
  projectRef: string,
): Promise<PromotePreflightResult> {
  const pilotImportKeys = collectPilotImportKeys(pkg);
  const dbState = await loadPromoteDbState(db, pilotImportKeys);
  const input = buildPromotePreflightInput(pkg, targetStatus, dbState);
  const issues = detectPromoteIssues(input);
  return {
    ok: issues.length === 0,
    issues,
    input,
    report: formatPromotePreflightReport(projectRef, input, issues),
  };
}

/** All SQL reachable during read-only promotion preflight (SELECT-only). */
export const PROMOTE_PREFLIGHT_READONLY_SQL = Object.values(PROMOTE_READONLY_SQL);

export class PromoteTransactionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PromoteTransactionError";
  }
}
