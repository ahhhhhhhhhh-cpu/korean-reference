import type { TransactionCapableClient } from "./import-db";
import type { ContentPackage } from "./import-package";
import {
  buildPreflightInput,
  detectPreflightConflicts,
  formatPreflightOnlyReport,
  formatPreflightReport,
  loadPreflightDbRows,
  PREFLIGHT_SQL,
  summarizePreflightSnapshot,
  type PreflightConflict,
  type PreflightSnapshot,
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
  snapshot: PreflightSnapshot;
  report: string;
};

export async function runDatabasePreflight(
  db: TransactionCapableClient,
  pkg: ContentPackage,
): Promise<LivePreflightResult> {
  const rows = await loadPreflightDbRows(db);
  const input = buildPreflightInput(pkg, rows);

  const conflicts = detectPreflightConflicts(input);
  const snapshot = summarizePreflightSnapshot(input);

  return {
    ok: conflicts.length === 0,
    conflicts,
    snapshot,
    report: formatPreflightReport(snapshot, conflicts),
  };
}

/**
 * Read-only Dev preflight — SELECT queries only; never opens a write transaction.
 */
export async function runPreflightOnlyImport(
  db: TransactionCapableClient,
  pkg: ContentPackage,
  projectRef: string,
): Promise<LivePreflightResult> {
  const preflight = await runDatabasePreflight(db, pkg);
  return {
    ...preflight,
    report: formatPreflightOnlyReport(projectRef, preflight.snapshot, preflight.conflicts),
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

/** All SQL reachable during read-only preflight (SELECT-only). */
export const PREFLIGHT_READONLY_SQL = Object.values(PREFLIGHT_SQL);
