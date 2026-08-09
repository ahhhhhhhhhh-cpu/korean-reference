export type LiveImportCliOptions = {
  dir: string;
  execute: boolean;
  confirmDev: boolean;
  projectRef?: string;
};

export type LiveImportGuardResult =
  | { ok: true; options: LiveImportCliOptions }
  | { ok: false; reason: string };

export function parseLiveImportArgs(argv: string[]): LiveImportCliOptions {
  let dir = "data/templates";
  let execute = false;
  let confirmDev = false;
  let projectRef: string | undefined;

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--dir" && argv[i + 1]) {
      dir = argv[++i]!;
    } else if (arg === "--execute") {
      execute = true;
    } else if (arg === "--confirm-dev") {
      confirmDev = true;
    } else if (arg === "--project-ref" && argv[i + 1]) {
      projectRef = argv[++i]!;
    } else if (arg === "--help" || arg === "-h") {
      printLiveImportUsage();
      process.exit(0);
    }
  }

  return {
    dir: dir,
    execute,
    confirmDev,
    projectRef,
  };
}

export function printLiveImportUsage(): void {
  console.log(`Usage: content:import --dir <path> --execute --confirm-dev --project-ref <DEV_REF>

Dev-only live draft import (direct PostgreSQL via DATABASE_URL).

Required for writes:
  --execute         Opt in to database writes
  --confirm-dev     Confirm Dev-only intent
  --project-ref     Expected Supabase project ref (must match DATABASE_URL)
  DATABASE_URL      Direct Postgres connection string (env or .env.local)

Without --execute, no database connection is made.

Production import is not supported in this phase.`);
}

export function validateLiveImportGuards(
  options: LiveImportCliOptions,
  env: { databaseUrl?: string },
): LiveImportGuardResult {
  if (!options.execute) {
    return {
      ok: false,
      reason:
        "Live import requires --execute. No database connection was attempted.",
    };
  }

  if (!options.confirmDev) {
    return { ok: false, reason: "Live import requires --confirm-dev." };
  }

  if (!options.projectRef?.trim()) {
    return { ok: false, reason: "Live import requires --project-ref <DEV_REF>." };
  }

  if (!env.databaseUrl?.trim()) {
    return {
      ok: false,
      reason: "Live import requires DATABASE_URL (environment or .env.local).",
    };
  }

  return { ok: true, options };
}
