import type { DbClient, TransactionCapableClient } from "./import-db";
import type { ContentPackage } from "./import-package";
import {
  PROMOTE_TABLE_BY_ENTITY,
  PROMOTE_UPDATE_ORDER,
  type PromoteEntity,
  type PromoteTargetStatus,
} from "./promote-config";
import {
  detectPromoteIssues,
  loadPromoteDbState,
  PromoteTransactionError,
  runPromotePreflight,
  type PromotePreflightResult,
} from "./promote-preflight";
import { collectPilotImportKeys } from "./import-preflight";

export type PromoteExecuteSummary = {
  targetStatus: PromoteTargetStatus;
  updated: Record<PromoteEntity, number>;
};

function keysForEntity(
  entity: PromoteEntity,
  pilotImportKeys: ReturnType<typeof collectPilotImportKeys>,
): string[] {
  return [...pilotImportKeys[entity]].sort();
}

function expectedCount(entity: PromoteEntity, pilotImportKeys: ReturnType<typeof collectPilotImportKeys>): number {
  return pilotImportKeys[entity].size;
}

async function updatePilotEntityStatus(
  tx: DbClient,
  entity: PromoteEntity,
  keys: string[],
  targetStatus: string,
  sourceStatus: string,
): Promise<number> {
  const table = PROMOTE_TABLE_BY_ENTITY[entity];
  const result = await tx.query(
    `UPDATE ${table}
     SET status = $1
     WHERE import_key = ANY($2::text[])
       AND status = $3`,
    [targetStatus, keys, sourceStatus],
  );
  return result.rowCount ?? 0;
}

async function assertEntityTargetStatus(
  tx: DbClient,
  entity: PromoteEntity,
  keys: string[],
  targetStatus: string,
): Promise<void> {
  const table = PROMOTE_TABLE_BY_ENTITY[entity];
  const result = await tx.query<{ count: string }>(
    `SELECT count(*)::text AS count
     FROM ${table}
     WHERE import_key = ANY($1::text[])
       AND status = $2`,
    [keys, targetStatus],
  );
  const count = Number(result.rows[0]?.count ?? 0);
  if (count !== keys.length) {
    throw new PromoteTransactionError(
      `${entity}: post-update assertion failed — expected ${keys.length} rows at status "${targetStatus}", found ${count}.`,
    );
  }
}

async function runPromoteUpdatesInTransaction(
  tx: DbClient,
  pkg: ContentPackage,
  targetStatus: PromoteTargetStatus,
): Promise<PromoteExecuteSummary> {
  const pilotImportKeys = collectPilotImportKeys(pkg);
  const transition = targetStatus === "in_review"
    ? { sourceStatus: "draft", targetStatus: "in_review" as const }
    : { sourceStatus: "in_review", targetStatus: "published" as const };

  const dbState = await loadPromoteDbState(tx, pilotImportKeys);
  const input = {
    pkg,
    targetStatus,
    pilotImportKeys,
    transition: {
      targetStatus,
      sourceStatus: transition.sourceStatus,
      label:
        targetStatus === "in_review" ? "draft -> in_review" : "in_review -> published",
    },
    db: dbState,
  };

  const preTxIssues = detectPromoteIssues(input);
  if (preTxIssues.length > 0) {
    throw new PromoteTransactionError(
      `In-transaction preflight blocked promotion (${preTxIssues.length} issue(s)).`,
    );
  }

  const updated: Record<PromoteEntity, number> = {
    sense_translations: 0,
    senses: 0,
    entries: 0,
    example_translations: 0,
    examples: 0,
    entry_aliases: 0,
  };

  for (const entity of PROMOTE_UPDATE_ORDER) {
    const keys = keysForEntity(entity, pilotImportKeys);
    const affected = await updatePilotEntityStatus(
      tx,
      entity,
      keys,
      transition.targetStatus,
      transition.sourceStatus,
    );
    if (affected !== expectedCount(entity, pilotImportKeys)) {
      throw new PromoteTransactionError(
        `${entity}: expected to update ${expectedCount(entity, pilotImportKeys)} rows, affected ${affected}.`,
      );
    }
    updated[entity] = affected;
    await assertEntityTargetStatus(tx, entity, keys, transition.targetStatus);
  }

  const postDbState = await loadPromoteDbState(tx, pilotImportKeys);
  const expectedLinkCount = pkg.files.get("entry_examples.csv")?.rows.length ?? 0;
  if (postDbState.entry_examples.length !== expectedLinkCount) {
    throw new PromoteTransactionError(
      `entry_examples link count changed during promotion (expected ${expectedLinkCount}, found ${postDbState.entry_examples.length}).`,
    );
  }

  return { targetStatus, updated };
}

export type PromoteExecuteResult = {
  preflight: PromotePreflightResult;
  summary?: PromoteExecuteSummary;
};

export async function executePromotePilot(
  db: TransactionCapableClient,
  pkg: ContentPackage,
  targetStatus: PromoteTargetStatus,
  projectRef: string,
): Promise<PromoteExecuteResult> {
  const preflight = await runPromotePreflight(db, pkg, targetStatus, projectRef);
  if (!preflight.ok) {
    return { preflight };
  }

  const summary = await db.transaction(async (tx) =>
    runPromoteUpdatesInTransaction(tx, pkg, targetStatus),
  );

  return { preflight, summary };
}

export function formatPromoteExecuteResult(result: PromoteExecuteResult): string {
  const parts = [result.preflight.report];
  if (result.summary) {
    parts.push(
      "",
      "--- Formal Pilot promotion executed ---",
      `Target status: ${result.summary.targetStatus}`,
      "Updated rows:",
      ...PROMOTE_UPDATE_ORDER.map(
        (entity) => `  ${entity}: ${result.summary!.updated[entity]}`,
      ),
      "entry_examples: 0 (no status column — unchanged)",
      "",
      "PROMOTION COMMITTED",
    );
  }
  return parts.join("\n");
}
