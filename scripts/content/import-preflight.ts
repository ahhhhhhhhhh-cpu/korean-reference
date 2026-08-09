import { PILOT_EXPECTED_COUNTS, SAFE_IMPORT_STATUSES } from "./import-config";
import type { CsvRow } from "./csv-parse";
import type { DbClient } from "./import-db";
import type { ContentPackage } from "./import-package";
import { getPackageRows } from "./import-package";

export type DbEntryRow = {
  id: string;
  import_key: string | null;
  slug: string;
  status: string;
};

export type DbExampleRow = {
  id: string;
  import_key: string | null;
  status: string;
};

export type DbKeyedRow = {
  id: string;
  import_key: string;
  status: string;
  entity?: string;
};

export type DbSenseRow = {
  id: string;
  import_key: string | null;
  entry_id: string;
  sense_order: number;
  status: string;
};

export type DbSenseTranslationRow = {
  id: string;
  import_key: string | null;
  sense_id: string;
  locale: string;
  status: string;
};

export type DbExampleTranslationRow = {
  id: string;
  import_key: string | null;
  example_id: string;
  locale: string;
  status: string;
};

export type PilotImportKeys = {
  entries: Set<string>;
  senses: Set<string>;
  sense_translations: Set<string>;
  entry_aliases: Set<string>;
  examples: Set<string>;
  example_translations: Set<string>;
  all: Set<string>;
};

export type PreflightConflict = {
  kind:
    | "seed_slug_collision"
    | "import_key_unsafe_status"
    | "natural_key_collision";
  message: string;
  entity?: string;
};

export type PreflightInput = {
  pilotEntrySlugs: Map<string, string>;
  pilotImportKeys: PilotImportKeys;
  pilotSenses: CsvRow[];
  pilotSenseTranslations: CsvRow[];
  pilotExampleTranslations: CsvRow[];
  dbEntries: DbEntryRow[];
  dbExamples: DbExampleRow[];
  dbKeyedByImportKey: Map<string, DbKeyedRow>;
  dbSenses: DbSenseRow[];
  dbSenseTranslations: DbSenseTranslationRow[];
  dbExampleTranslations: DbExampleTranslationRow[];
};

function collectKeys(rows: CsvRow[]): Set<string> {
  return new Set(
    rows.map((r) => r.import_key?.trim()).filter(Boolean) as string[],
  );
}

export function collectPilotImportKeys(pkg: ContentPackage): PilotImportKeys {
  const entries = collectKeys(getPackageRows(pkg, "entries.csv"));
  const senses = collectKeys(getPackageRows(pkg, "senses.csv"));
  const sense_translations = collectKeys(getPackageRows(pkg, "sense_translations.csv"));
  const entry_aliases = collectKeys(getPackageRows(pkg, "entry_aliases.csv"));
  const examples = collectKeys(getPackageRows(pkg, "examples.csv"));
  const example_translations = collectKeys(getPackageRows(pkg, "example_translations.csv"));

  const all = new Set<string>([
    ...entries,
    ...senses,
    ...sense_translations,
    ...entry_aliases,
    ...examples,
    ...example_translations,
  ]);

  return {
    entries,
    senses,
    sense_translations,
    entry_aliases,
    examples,
    example_translations,
    all,
  };
}

export function buildPreflightInputFromPackage(
  pkg: ContentPackage,
  dbEntries: DbEntryRow[],
  dbExamples: DbExampleRow[],
  dbKeyedRows: DbKeyedRow[],
  dbSenses: DbSenseRow[],
  dbSenseTranslations: DbSenseTranslationRow[],
  dbExampleTranslations: DbExampleTranslationRow[],
): PreflightInput {
  const pilotEntries = getPackageRows(pkg, "entries.csv");
  const pilotEntrySlugs = new Map<string, string>();
  for (const row of pilotEntries) {
    const slug = row.slug?.trim();
    const importKey = row.import_key?.trim();
    if (slug && importKey) pilotEntrySlugs.set(slug, importKey);
  }

  return {
    pilotEntrySlugs,
    pilotImportKeys: collectPilotImportKeys(pkg),
    pilotSenses: getPackageRows(pkg, "senses.csv"),
    pilotSenseTranslations: getPackageRows(pkg, "sense_translations.csv"),
    pilotExampleTranslations: getPackageRows(pkg, "example_translations.csv"),
    dbEntries,
    dbExamples,
    dbKeyedByImportKey: new Map(dbKeyedRows.map((r) => [r.import_key, r])),
    dbSenses,
    dbSenseTranslations,
    dbExampleTranslations,
  };
}

/** @deprecated Use buildPreflightInputFromPackage — kept for focused unit tests. */
export function buildPreflightInputFromRows(
  pilotEntries: CsvRow[],
  pilotExamples: CsvRow[],
  dbEntries: DbEntryRow[],
  dbExamples: DbExampleRow[],
  dbKeyedRows: DbKeyedRow[],
  pilotSenses: CsvRow[] = [],
  pilotSenseTranslations: CsvRow[] = [],
  pilotEntryAliases: CsvRow[] = [],
  pilotExampleTranslations: CsvRow[] = [],
): PreflightInput {
  const pilotEntrySlugs = new Map<string, string>();
  for (const row of pilotEntries) {
    const slug = row.slug?.trim();
    const importKey = row.import_key?.trim();
    if (slug && importKey) pilotEntrySlugs.set(slug, importKey);
  }

  const entries = collectKeys(pilotEntries);
  const senses = collectKeys(pilotSenses);
  const sense_translations = collectKeys(pilotSenseTranslations);
  const entry_aliases = collectKeys(pilotEntryAliases);
  const examples = collectKeys(pilotExamples);
  const example_translations = collectKeys(pilotExampleTranslations);

  return {
    pilotEntrySlugs,
    pilotImportKeys: {
      entries,
      senses,
      sense_translations,
      entry_aliases,
      examples,
      example_translations,
      all: new Set([
        ...entries,
        ...senses,
        ...sense_translations,
        ...entry_aliases,
        ...examples,
        ...example_translations,
      ]),
    },
    pilotSenses,
    pilotSenseTranslations,
    pilotExampleTranslations,
    dbEntries,
    dbExamples,
    dbKeyedByImportKey: new Map(dbKeyedRows.map((r) => [r.import_key, r])),
    dbSenses: [],
    dbSenseTranslations: [],
    dbExampleTranslations: [],
  };
}

function entityLabelForImportKey(importKey: string, keys: PilotImportKeys): string {
  if (keys.entries.has(importKey)) return "Entry";
  if (keys.senses.has(importKey)) return "Sense";
  if (keys.sense_translations.has(importKey)) return "Sense translation";
  if (keys.entry_aliases.has(importKey)) return "Entry alias";
  if (keys.examples.has(importKey)) return "Example";
  if (keys.example_translations.has(importKey)) return "Example translation";
  return "Keyed row";
}

export function detectPreflightConflicts(input: PreflightInput): PreflightConflict[] {
  const conflicts: PreflightConflict[] = [];
  const entriesBySlug = new Map(input.dbEntries.map((e) => [e.slug, e]));
  const entriesByImportKey = new Map(
    input.dbEntries
      .filter((e) => e.import_key)
      .map((e) => [e.import_key as string, e]),
  );
  const examplesByImportKey = new Map(
    input.dbExamples
      .filter((e) => e.import_key)
      .map((e) => [e.import_key as string, e]),
  );
  const sensesByImportKey = new Map(
    input.dbSenses
      .filter((s) => s.import_key)
      .map((s) => [s.import_key as string, s]),
  );
  const entryIdByImportKey = new Map(
    input.dbEntries
      .filter((e) => e.import_key)
      .map((e) => [e.import_key as string, e.id]),
  );

  for (const [slug, pilotImportKey] of input.pilotEntrySlugs) {
    const existing = entriesBySlug.get(slug);
    if (!existing) continue;

    const existingKey = existing.import_key?.trim() || null;
    if (!existingKey || existingKey !== pilotImportKey) {
      conflicts.push({
        kind: "seed_slug_collision",
        message: `Entry slug "${slug}" already exists with import_key=${existingKey ?? "NULL"}; incoming Pilot import_key="${pilotImportKey}".`,
        entity: "entries",
      });
    }
  }

  for (const importKey of input.pilotImportKeys.all) {
    const existingEntry = entriesByImportKey.get(importKey);
    if (existingEntry && !SAFE_IMPORT_STATUSES.has(existingEntry.status)) {
      conflicts.push({
        kind: "import_key_unsafe_status",
        message: `${entityLabelForImportKey(importKey, input.pilotImportKeys)} import_key "${importKey}" exists with status "${existingEntry.status}" and cannot be auto-imported.`,
        entity: "entries",
      });
      continue;
    }

    const existingExample = examplesByImportKey.get(importKey);
    if (existingExample && !SAFE_IMPORT_STATUSES.has(existingExample.status)) {
      conflicts.push({
        kind: "import_key_unsafe_status",
        message: `${entityLabelForImportKey(importKey, input.pilotImportKeys)} import_key "${importKey}" exists with status "${existingExample.status}" and cannot be auto-imported.`,
        entity: "examples",
      });
      continue;
    }

    const keyed = input.dbKeyedByImportKey.get(importKey);
    if (keyed && !SAFE_IMPORT_STATUSES.has(keyed.status)) {
      conflicts.push({
        kind: "import_key_unsafe_status",
        message: `${entityLabelForImportKey(importKey, input.pilotImportKeys)} import_key "${importKey}" exists with status "${keyed.status}" and cannot be auto-imported.`,
        entity: keyed.entity,
      });
    }
  }

  for (const row of input.pilotSenses) {
    const importKey = row.import_key?.trim();
    const entryImportKey = row.entry_import_key?.trim();
    const senseOrder = Number(row.sense_order);
    if (!importKey || !entryImportKey || Number.isNaN(senseOrder)) continue;

    const entryId = entryIdByImportKey.get(entryImportKey);
    if (!entryId) continue;

    for (const existing of input.dbSenses) {
      if (existing.entry_id !== entryId || existing.sense_order !== senseOrder) continue;
      const existingKey = existing.import_key?.trim() || null;
      if (!existingKey || existingKey !== importKey) {
        conflicts.push({
          kind: "natural_key_collision",
          message: `Sense (entry_id=${entryId}, sense_order=${senseOrder}) already exists with import_key=${existingKey ?? "NULL"}; incoming import_key="${importKey}".`,
          entity: "senses",
        });
      }
    }
  }

  for (const row of input.pilotSenseTranslations) {
    const importKey = row.import_key?.trim();
    const senseImportKey = row.sense_import_key?.trim();
    const locale = row.locale?.trim();
    if (!importKey || !senseImportKey || !locale) continue;

    const senseId = sensesByImportKey.get(senseImportKey)?.id;
    if (!senseId) continue;

    for (const existing of input.dbSenseTranslations) {
      if (existing.sense_id !== senseId || existing.locale !== locale) continue;
      const existingKey = existing.import_key?.trim() || null;
      if (!existingKey || existingKey !== importKey) {
        conflicts.push({
          kind: "natural_key_collision",
          message: `Sense translation (sense_id=${senseId}, locale=${locale}) already exists with import_key=${existingKey ?? "NULL"}; incoming import_key="${importKey}".`,
          entity: "sense_translations",
        });
      }
    }
  }

  for (const row of input.pilotExampleTranslations) {
    const importKey = row.import_key?.trim();
    const exampleImportKey = row.example_import_key?.trim();
    const locale = row.locale?.trim();
    if (!importKey || !exampleImportKey || !locale) continue;

    const exampleId = examplesByImportKey.get(exampleImportKey)?.id;
    if (!exampleId) continue;

    for (const existing of input.dbExampleTranslations) {
      if (existing.example_id !== exampleId || existing.locale !== locale) continue;
      const existingKey = existing.import_key?.trim() || null;
      if (!existingKey || existingKey !== importKey) {
        conflicts.push({
          kind: "natural_key_collision",
          message: `Example translation (example_id=${exampleId}, locale=${locale}) already exists with import_key=${existingKey ?? "NULL"}; incoming import_key="${importKey}".`,
          entity: "example_translations",
        });
      }
    }
  }

  return conflicts;
}

export class TransactionSafetyError extends Error {
  constructor(
    message: string,
    readonly conflicts: PreflightConflict[],
  ) {
    super(message);
    this.name = "TransactionSafetyError";
  }
}

export function assertNoPreflightConflicts(conflicts: PreflightConflict[]): void {
  if (conflicts.length === 0) return;
  throw new TransactionSafetyError(
    `Transaction blocked: ${conflicts[0]!.message}`,
    conflicts,
  );
}

export type PreflightSnapshot = {
  entryCount: number;
  senseCount: number;
  exampleCount: number;
  pilotSlugOverlaps: number;
  pilotImportKeyMatches: number;
};

export function summarizePreflightSnapshot(input: PreflightInput): PreflightSnapshot {
  let pilotSlugOverlaps = 0;
  const entriesBySlug = new Map(input.dbEntries.map((e) => [e.slug, e]));
  for (const slug of input.pilotEntrySlugs.keys()) {
    if (entriesBySlug.has(slug)) pilotSlugOverlaps++;
  }

  let pilotImportKeyMatches = 0;
  for (const key of input.pilotImportKeys.all) {
    if (input.dbKeyedByImportKey.has(key)) pilotImportKeyMatches++;
  }

  return {
    entryCount: input.dbEntries.length,
    senseCount: input.dbSenses.length,
    exampleCount: input.dbExamples.length,
    pilotSlugOverlaps,
    pilotImportKeyMatches,
  };
}

export function countConflictsByKind(conflicts: PreflightConflict[]): {
  seedSlug: number;
  unsafeStatus: number;
  naturalKey: number;
  total: number;
} {
  let seedSlug = 0;
  let unsafeStatus = 0;
  let naturalKey = 0;
  for (const c of conflicts) {
    if (c.kind === "seed_slug_collision") seedSlug++;
    else if (c.kind === "import_key_unsafe_status") unsafeStatus++;
    else if (c.kind === "natural_key_collision") naturalKey++;
  }
  return { seedSlug, unsafeStatus, naturalKey, total: conflicts.length };
}

export function formatPreflightOnlyReport(
  projectRef: string,
  snapshot: PreflightSnapshot,
  conflicts: PreflightConflict[],
): string {
  const summary = countConflictsByKind(conflicts);
  const lines = [
    "--- Dev database preflight (read-only) ---",
    `Target project ref: ${projectRef}`,
    "",
    "Incoming Pilot counts:",
    `  entries: ${PILOT_EXPECTED_COUNTS.entries}`,
    `  senses: ${PILOT_EXPECTED_COUNTS.senses}`,
    `  sense_translations: ${PILOT_EXPECTED_COUNTS.sense_translations}`,
    `  entry_aliases: ${PILOT_EXPECTED_COUNTS.entry_aliases}`,
    `  examples: ${PILOT_EXPECTED_COUNTS.examples}`,
    `  example_translations: ${PILOT_EXPECTED_COUNTS.example_translations}`,
    `  entry_examples: ${PILOT_EXPECTED_COUNTS.entry_examples}`,
    "",
    "Database state:",
    `  existing entries: ${snapshot.entryCount}`,
    `  existing senses: ${snapshot.senseCount}`,
    `  existing examples: ${snapshot.exampleCount}`,
    "",
    "Conflict summary:",
    `  seed slug conflicts: ${summary.seedSlug}`,
    `  keyed unsafe-status conflicts: ${summary.unsafeStatus}`,
    `  natural-key conflicts: ${summary.naturalKey}`,
    `  total blocking conflicts: ${summary.total}`,
  ];

  if (conflicts.length === 0) {
    lines.push("", "PREFLIGHT PASSED", "Blocking conflicts: 0", "Database writes: NONE");
  } else {
    lines.push("", `PREFLIGHT BLOCKED (${conflicts.length} conflict(s))`);
    for (const c of conflicts) {
      lines.push(`  ${c.kind}: ${c.message}`);
    }
  }

  return lines.join("\n");
}

export function formatPreflightReport(
  snapshot: PreflightSnapshot,
  conflicts: PreflightConflict[],
): string {
  const lines = [
    "--- Database preflight ---",
    `Existing entries: ${snapshot.entryCount}`,
    `Existing senses: ${snapshot.senseCount}`,
    `Existing examples: ${snapshot.exampleCount}`,
    `Pilot slug overlaps: ${snapshot.pilotSlugOverlaps}`,
    `Pilot import_key matches (draft-safe review): ${snapshot.pilotImportKeyMatches}`,
  ];

  if (conflicts.length === 0) {
    lines.push("Preflight: PASS (no blocking conflicts)");
  } else {
    lines.push(`Preflight: BLOCKED (${conflicts.length} conflict(s))`);
    for (const c of conflicts) {
      lines.push(`  ${c.kind}: ${c.message}`);
    }
  }

  return lines.join("\n");
}

/** SQL fragments for read-only preflight (live path only). */
export const PREFLIGHT_SQL = {
  entries: `SELECT id::text, import_key, slug, status FROM public.entries`,
  examples: `SELECT id::text, import_key, status FROM public.examples`,
  senses: `SELECT id::text, import_key, entry_id::text, sense_order, status FROM public.senses`,
  senseTranslations: `SELECT id::text, import_key, sense_id::text, locale, status FROM public.sense_translations`,
  exampleTranslations: `SELECT id::text, import_key, example_id::text, locale, status FROM public.example_translations`,
  keyedStatuses: `
    SELECT id::text, import_key, status, 'senses' AS entity FROM public.senses WHERE import_key IS NOT NULL
    UNION ALL
    SELECT id::text, import_key, status, 'sense_translations' AS entity FROM public.sense_translations WHERE import_key IS NOT NULL
    UNION ALL
    SELECT id::text, import_key, status, 'entry_aliases' AS entity FROM public.entry_aliases WHERE import_key IS NOT NULL
    UNION ALL
    SELECT id::text, import_key, status, 'example_translations' AS entity FROM public.example_translations WHERE import_key IS NOT NULL
  `,
} as const;

export type PreflightDbRows = {
  entries: DbEntryRow[];
  examples: DbExampleRow[];
  keyed: DbKeyedRow[];
  senses: DbSenseRow[];
  senseTranslations: DbSenseTranslationRow[];
  exampleTranslations: DbExampleTranslationRow[];
};

/** Load preflight snapshot rows sequentially (one pg Client must not query concurrently). */
export async function loadPreflightDbRows(db: DbClient): Promise<PreflightDbRows> {
  const entriesRes = await db.query<DbEntryRow>(PREFLIGHT_SQL.entries);
  const examplesRes = await db.query<DbExampleRow>(PREFLIGHT_SQL.examples);
  const keyedRes = await db.query<DbKeyedRow>(PREFLIGHT_SQL.keyedStatuses);
  const sensesRes = await db.query<DbSenseRow>(PREFLIGHT_SQL.senses);
  const senseTranslationsRes = await db.query<DbSenseTranslationRow>(
    PREFLIGHT_SQL.senseTranslations,
  );
  const exampleTranslationsRes = await db.query<DbExampleTranslationRow>(
    PREFLIGHT_SQL.exampleTranslations,
  );

  return {
    entries: entriesRes.rows,
    examples: examplesRes.rows,
    keyed: keyedRes.rows,
    senses: sensesRes.rows,
    senseTranslations: senseTranslationsRes.rows,
    exampleTranslations: exampleTranslationsRes.rows,
  };
}

export function buildPreflightInput(
  pkg: ContentPackage,
  rows: PreflightDbRows,
): PreflightInput {
  return buildPreflightInputFromPackage(
    pkg,
    rows.entries,
    rows.examples,
    rows.keyed,
    rows.senses,
    rows.senseTranslations,
    rows.exampleTranslations,
  );
}
