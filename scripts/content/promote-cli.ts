#!/usr/bin/env node
/**
 * Formal Pilot status-transition CLI (direct PostgreSQL).
 * Dev: --confirm-dev + DATABASE_URL + Dev project ref.
 * Production: --confirm-production + PRODUCTION_DATABASE_URL + Production project ref.
 * Published execute additionally requires --confirm-publish.
 * --confirm-dev never authorizes Production. No silent URL fallback.
 */
import {
  parsePromoteArgs,
  printPromoteUsage,
  validatePromoteGuards,
} from "./promote-args";
import { createPgPool } from "./import-db";
import { loadImportEnvironment } from "./import-env";
import {
  loadPilotWritePackage,
  resolvePackageDir,
  verifyPilotPackageCounts,
} from "./import-package";
import { validateProjectRefTarget } from "./import-project-ref";
import {
  executePromotePilot,
  formatPromoteExecuteResult,
  formatWriteConfirmation,
} from "./promote-execute";
import { runPromotePreflight } from "./promote-preflight";
import {
  formatValidationReport,
  validateContentDirectory,
} from "./validate-content";

async function main(): Promise<void> {
  let cli;
  try {
    cli = parsePromoteArgs(process.argv);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    printPromoteUsage();
    process.exit(1);
  }

  const env = loadImportEnvironment();

  const guard = validatePromoteGuards(cli, env);
  if (!guard.ok) {
    console.error(guard.reason);
    if (!cli.preflightOnly && !cli.execute) {
      printPromoteUsage();
    }
    process.exit(1);
  }

  const projectCheck = validateProjectRefTarget({
    databaseUrl: guard.connectionString,
    expectedProjectRef: guard.options.projectRef!,
    supabaseUrl: guard.target === "dev" ? env.supabaseUrl : undefined,
    target: guard.target,
    connectionLabel:
      guard.target === "production" ? "PRODUCTION_DATABASE_URL" : "DATABASE_URL",
  });
  if (!projectCheck.ok) {
    console.error(projectCheck.reason);
    process.exit(1);
  }

  const dir = resolvePackageDir(cli.dir);
  const validation = validateContentDirectory(dir, { allowPublish: false });
  console.log(formatValidationReport(validation));
  if (!validation.ok) process.exit(1);

  const pkg = loadPilotWritePackage(dir);
  const counts = verifyPilotPackageCounts(pkg);
  if (!counts.ok) {
    console.error("Pilot package row counts do not match expected formal totals:");
    for (const m of counts.mismatches) console.error(`  ${m}`);
    process.exit(1);
  }

  if (guard.mode === "execute") {
    console.log(
      formatWriteConfirmation({
        projectRef: guard.options.projectRef!,
        targetStatus: guard.options.targetStatus,
        confirmPublish: guard.options.confirmPublish,
        target: guard.target,
        confirmProduction: guard.options.confirmProduction,
      }),
    );
  }

  const db = createPgPool({ connectionString: guard.connectionString, connect: true });

  try {
    if (guard.mode === "preflight") {
      const result = await runPromotePreflight(
        db,
        pkg,
        guard.options.targetStatus,
        guard.options.projectRef!,
      );
      console.log(result.report);
      if (!result.ok) process.exit(1);
      return;
    }

    const result = await executePromotePilot(
      db,
      pkg,
      guard.options.targetStatus,
      guard.options.projectRef!,
    );
    console.log(formatPromoteExecuteResult(result));
    if (!result.preflight.ok || !result.summary) {
      process.exit(1);
    }
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await db.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
