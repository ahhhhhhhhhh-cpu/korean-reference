#!/usr/bin/env node
/**
 * Formal content validator CLI — parse CSV, validate, report. No database access.
 */
import path from "node:path";
import {
  formatValidationReport,
  validateContentDirectory,
} from "./validate-content";

function parseArgs(argv: string[]) {
  let dir = "data/templates";
  let allowPublish = false;
  let templatesMode = false;

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--dir" && argv[i + 1]) {
      dir = argv[++i]!;
    } else if (arg === "--allow-publish") {
      allowPublish = true;
    } else if (arg === "--templates") {
      templatesMode = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: validate-content [--dir <path>] [--allow-publish] [--templates]
  --dir         Content directory (default: data/templates)
  --templates   Header-only mode (skip English-core requirement)
  --allow-publish  Allow status=published in CSV`);
      process.exit(0);
    }
  }

  return {
    dir: path.resolve(process.cwd(), dir),
    allowPublish,
    templatesMode,
  };
}

const opts = parseArgs(process.argv);

try {
  const result = validateContentDirectory(opts.dir, {
    allowPublish: opts.allowPublish,
    templatesMode: opts.templatesMode,
  });
  console.log(formatValidationReport(result));
  process.exit(result.ok ? 0 : 1);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
