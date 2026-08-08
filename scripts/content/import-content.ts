#!/usr/bin/env node
/**
 * Formal content importer — dry-run only in Phase 7A.
 * Does not connect to Supabase or write to any database.
 */
import fs from "node:fs";
import path from "node:path";
import {
  formatValidationReport,
  validateContentDirectory,
} from "./validate-content";

const PRODUCTION_IMPORT_DISABLED =
  "Production import is not enabled yet. Use --dry-run to preview import plan only.";

function parseArgs(argv: string[]) {
  let dir = "data/templates";
  let dryRun = false;

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--dir" && argv[i + 1]) {
      dir = argv[++i]!;
    } else if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: import-content --dry-run [--dir <path>]
  --dry-run   Validate and print import plan (required in Phase 7A)
  --dir       Content directory (default: data/templates)

Live database import is disabled until a future phase.`);
      process.exit(0);
    }
  }

  return { dir: path.resolve(process.cwd(), dir), dryRun };
}

const opts = parseArgs(process.argv);

if (!opts.dryRun) {
  console.error(PRODUCTION_IMPORT_DISABLED);
  process.exit(1);
}

try {
  const result = validateContentDirectory(opts.dir, { allowPublish: false });
  console.log(formatValidationReport(result));

  if (!result.ok) {
    process.exit(1);
  }

  const files = fs.readdirSync(opts.dir).filter((f) => f.endsWith(".csv"));

  console.log("\n--- Dry-run import plan ---");
  console.log(`Directory: ${opts.dir}`);
  console.log(`CSV files: ${files.length}`);
  console.log("Default insert status: draft");
  console.log("UUID generation: PostgreSQL (not performed in dry-run)");
  console.log("Database writes: NONE (dry-run only)");
  console.log("\nImport phases (future live run):");
  console.log("  1. sources → entries → senses → examples");
  console.log("  2. translations and module entities");
  console.log("  3. relation/junction rows (importer-generated ids)");
  process.exit(0);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
