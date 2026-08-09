import path from "node:path";

import { loadContentDirectory, type CsvRow } from "./csv-parse";
import {
  KEYED_PILOT_FILES,
  PILOT_EXPECTED_COUNTS,
  PILOT_WRITE_FILES,
} from "./import-config";

export type ContentPackage = {
  dir: string;
  files: Map<string, { rows: CsvRow[] }>;
};

export function loadPilotWritePackage(dir: string): ContentPackage {
  const parsed = loadContentDirectory(dir);
  const files = new Map<string, { rows: CsvRow[] }>();
  for (const name of PILOT_WRITE_FILES) {
    const csv = parsed.get(name);
    files.set(name, { rows: csv?.rows ?? [] });
  }
  return { dir, files };
}

export function getPackageRows(pkg: ContentPackage, file: string): CsvRow[] {
  return pkg.files.get(file)?.rows ?? [];
}

export type PackageCountCheck = {
  ok: boolean;
  mismatches: string[];
};

export function verifyPilotPackageCounts(pkg: ContentPackage): PackageCountCheck {
  const mismatches: string[] = [];
  const counts: Record<string, number> = {
    entries: getPackageRows(pkg, "entries.csv").length,
    senses: getPackageRows(pkg, "senses.csv").length,
    sense_translations: getPackageRows(pkg, "sense_translations.csv").length,
    entry_aliases: getPackageRows(pkg, "entry_aliases.csv").length,
    examples: getPackageRows(pkg, "examples.csv").length,
    example_translations: getPackageRows(pkg, "example_translations.csv").length,
    entry_examples: getPackageRows(pkg, "entry_examples.csv").length,
  };

  for (const [key, expected] of Object.entries(PILOT_EXPECTED_COUNTS)) {
    const actual = counts[key];
    if (actual !== expected) {
      mismatches.push(`${key}: expected ${expected}, got ${actual ?? 0}`);
    }
  }

  return { ok: mismatches.length === 0, mismatches };
}

/** Incoming statuses rejected for live draft import. */
const PUBLICLY_VISIBLE_STATUSES = new Set([
  "published",
  "in_review",
  "archived",
  "needs_revision",
]);

export type DraftGuardResult = { ok: true } | { ok: false; violations: string[] };

export function assertDraftOnlyPackage(pkg: ContentPackage): DraftGuardResult {
  const violations: string[] = [];

  for (const file of KEYED_PILOT_FILES) {
    for (let i = 0; i < getPackageRows(pkg, file).length; i++) {
      const row = getPackageRows(pkg, file)[i]!;
      const status = (row.status?.trim() || "draft").toLowerCase();
      if (status !== "draft") {
        violations.push(
          `${file} row ${i + 2}: status "${status}" is not allowed for live draft import`,
        );
      }
      if (PUBLICLY_VISIBLE_STATUSES.has(status)) {
        violations.push(
          `${file} row ${i + 2}: status "${status}" would affect public visibility`,
        );
      }
    }
  }

  return violations.length === 0
    ? { ok: true }
    : { ok: false, violations };
}

export function resolvePackageDir(dir: string): string {
  return path.resolve(process.cwd(), dir);
}
