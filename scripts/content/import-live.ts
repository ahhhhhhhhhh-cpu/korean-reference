import type { TransactionCapableClient } from "./import-db";
import type { ContentPackage } from "./import-package";
import {
  buildPreflightInput,
  detectPreflightConflicts,
  formatPreflightReport,
  PREFLIGHT_SQL,
  summarizePreflightSnapshot,
  type DbEntryRow,
  type DbExampleRow,
  type DbExampleTranslationRow,
  type DbKeyedRow,
  type DbSenseRow,
  type DbSenseTranslationRow,
  type PreflightConflict,
} from "./import-preflight";
import { runCriticalTransactionChecks } from "./import-transaction-guards";
import {
  formatWriteSummary,
  writePilotPackage,
  type ImportWriteSummary,
} from "./import-writer";

export type LivePreflightResult = {
  ok: boolean;
  conflicts: PreflightConflict[];
  report: string;
};

export async function runDatabasePreflight(
  db: TransactionCapableClient,
  pkg: ContentPackage,
): Promise<LivePreflightResult> {
  const [entriesRes, examplesRes, keyedRes, sensesRes, senseTranslationsRes, exampleTranslationsRes] =
    await Promise.all([
      db.query<DbEntryRow>(PREFLIGHT_SQL.entries),
      db.query<DbExampleRow>(PREFLIGHT_SQL.examples),
      db.query<DbKeyedRow>(PREFLIGHT_SQL.keyedStatuses),
      db.query<DbSenseRow>(PREFLIGHT_SQL.senses),
      db.query<DbSenseTranslationRow>(PREFLIGHT_SQL.senseTranslations),
      db.query<DbExampleTranslationRow>(PREFLIGHT_SQL.exampleTranslations),
    ]);

  const input = buildPreflightInput(pkg, {
    entries: entriesRes.rows,
    examples: examplesRes.rows,
    keyed: keyedRes.rows,
    senses: sensesRes.rows,
    senseTranslations: senseTranslationsRes.rows,
    exampleTranslations: exampleTranslationsRes.rows,
  });

  const conflicts = detectPreflightConflicts(input);
  const snapshot = summarizePreflightSnapshot(input);

  return {
    ok: conflicts.length === 0,
    conflicts,
    report: formatPreflightReport(snapshot, conflicts),
  };
}

export type LiveImportExecuteResult = {
  preflight: LivePreflightResult;
  summary?: ImportWriteSummary;
};

export async function executeLivePilotImport(
  db: TransactionCapableClient,
  pkg: ContentPackage,
): Promise<LiveImportExecuteResult> {
  const preflight = await runDatabasePreflight(db, pkg);
  if (!preflight.ok) {
    return { preflight };
  }

  const { summary } = await db.transaction(async (tx) => {
    await runCriticalTransactionChecks(tx, pkg);
    return writePilotPackage(tx, pkg);
  });

  return { preflight, summary };
}

export function formatLiveImportResult(result: LiveImportExecuteResult): string {
  const parts = [result.preflight.report];
  if (result.summary) {
    parts.push(formatWriteSummary(result.summary));
  }
  return parts.join("\n\n");
}
