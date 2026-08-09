import type { DbClient } from "./import-db";
import type { ContentPackage } from "./import-package";
import {
  assertNoPreflightConflicts,
  buildPreflightInput,
  detectPreflightConflicts,
  loadPreflightDbRows,
} from "./import-preflight";

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
