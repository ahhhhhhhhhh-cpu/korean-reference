import type { DbClient } from "./import-db";
import type { ContentPackage } from "./import-package";
import {
  assertNoPreflightConflicts,
  buildPreflightInput,
  detectPreflightConflicts,
  PREFLIGHT_SQL,
  type DbEntryRow,
  type DbExampleRow,
  type DbExampleTranslationRow,
  type DbKeyedRow,
  type DbSenseRow,
  type DbSenseTranslationRow,
  type PreflightDbRows,
} from "./import-preflight";

async function loadPreflightDbRows(db: DbClient): Promise<PreflightDbRows> {
  const [entriesRes, examplesRes, keyedRes, sensesRes, senseTranslationsRes, exampleTranslationsRes] =
    await Promise.all([
      db.query<DbEntryRow>(PREFLIGHT_SQL.entries),
      db.query<DbExampleRow>(PREFLIGHT_SQL.examples),
      db.query<DbKeyedRow>(PREFLIGHT_SQL.keyedStatuses),
      db.query<DbSenseRow>(PREFLIGHT_SQL.senses),
      db.query<DbSenseTranslationRow>(PREFLIGHT_SQL.senseTranslations),
      db.query<DbExampleTranslationRow>(PREFLIGHT_SQL.exampleTranslations),
    ]);

  return {
    entries: entriesRes.rows,
    examples: examplesRes.rows,
    keyed: keyedRes.rows,
    senses: sensesRes.rows,
    senseTranslations: senseTranslationsRes.rows,
    exampleTranslations: exampleTranslationsRes.rows,
  };
}

/**
 * Re-check critical safety invariants inside the open transaction, before any write.
 * Uses the same conflict detector as external preflight (TOCTOU protection).
 */
export async function runCriticalTransactionChecks(
  tx: DbClient,
  pkg: ContentPackage,
): Promise<void> {
  const rows = await loadPreflightDbRows(tx);
  const input = buildPreflightInput(pkg, rows);
  const conflicts = detectPreflightConflicts(input);
  assertNoPreflightConflicts(conflicts);
}
