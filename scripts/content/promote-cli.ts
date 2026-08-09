#!/usr/bin/env node
/**
 * Dev-only Formal Pilot status-transition CLI (direct PostgreSQL).
 * Requires explicit --preflight-only or --execute, --confirm-dev, --project-ref,
 * --target-status, and DATABASE_URL.
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
    databaseUrl: env.databaseUrl!,
    expectedProjectRef: guard.options.projectRef!,
    supabaseUrl: env.supabaseUrl,
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

  const db = createPgPool({ connectionString: env.databaseUrl!, connect: true });

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

    console.log(
      formatWriteConfirmation({
        projectRef: guard.options.projectRef!,
        targetStatus: guard.options.targetStatus,
        confirmPublish: guard.options.confirmPublish,
      }),
    );

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
