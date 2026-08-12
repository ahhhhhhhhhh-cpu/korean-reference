#!/usr/bin/env node
/**
 * Formal Pilot live draft import CLI (direct PostgreSQL).
 * Dev: --confirm-dev + DATABASE_URL + Dev project ref.
 * Production: --confirm-production + PRODUCTION_DATABASE_URL + Production project ref.
 * --confirm-dev never authorizes Production. No silent URL fallback.
 */
import {
  parseLiveImportArgs,
  printLiveImportUsage,
  validateLiveImportGuards,
} from "./import-args";
import { createPgPool } from "./import-db";
import { loadImportEnvironment } from "./import-env";
import {
  executeLivePilotImport,
  formatLiveImportResult,
  runPreflightOnlyImport,
} from "./import-live";
import { validateProjectRefTarget } from "./import-project-ref";
import { formatExecuteWriteBanner } from "./import-target";
import {
  assertDraftOnlyPackage,
  loadPilotWritePackage,
  resolvePackageDir,
  verifyPilotPackageCounts,
} from "./import-package";
import {
  formatValidationReport,
  validateContentDirectory,
} from "./validate-content";

async function main(): Promise<void> {
  const cli = parseLiveImportArgs(process.argv);
  const env = loadImportEnvironment();

  const guard = validateLiveImportGuards(cli, env);
  if (!guard.ok) {
    console.error(guard.reason);
    if (!cli.preflightOnly && !cli.execute) {
      printLiveImportUsage();
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

  const draftGuard = assertDraftOnlyPackage(pkg);
  if (!draftGuard.ok) {
    console.error("Live import rejected non-draft incoming content:");
    for (const v of draftGuard.violations) console.error(`  ${v}`);
    process.exit(1);
  }

  if (guard.mode === "execute") {
    console.log(
      formatExecuteWriteBanner({
        target: guard.target,
        projectRef: guard.options.projectRef!,
        operation: "import",
        confirmProduction: guard.options.confirmProduction,
        confirmPublish: false,
      }),
    );
  }

  const db = createPgPool({ connectionString: guard.connectionString, connect: true });

  try {
    if (guard.mode === "preflight") {
      const result = await runPreflightOnlyImport(db, pkg, guard.options.projectRef!);
      console.log(result.report);
      if (!result.ok) process.exit(1);
      return;
    }

    const result = await executeLivePilotImport(db, pkg);
    console.log(formatLiveImportResult(result));
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
