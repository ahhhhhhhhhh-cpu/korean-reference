export type LiveImportCliOptions = {
  dir: string;
  execute: boolean;
  preflightOnly: boolean;
  confirmDev: boolean;
  projectRef?: string;
};

export type LiveImportGuardResult =
  | { ok: true; options: LiveImportCliOptions; mode: DbConnectionMode }
  | { ok: false; reason: string };

export type DbConnectionMode = "preflight" | "execute";

export function parseLiveImportArgs(argv: string[]): LiveImportCliOptions {
  let dir = "data/templates";
  let execute = false;
  let preflightOnly = false;
  let confirmDev = false;
  let projectRef: string | undefined;

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--dir" && argv[i + 1]) {
      dir = argv[++i]!;
    } else if (arg === "--execute") {
      execute = true;
    } else if (arg === "--preflight-only") {
      preflightOnly = true;
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
    dir,
    execute,
    preflightOnly,
    confirmDev,
    projectRef,
  };
}

export function resolveDbConnectionMode(
  options: LiveImportCliOptions,
): DbConnectionMode | null {
  if (options.preflightOnly && options.execute) return null;
  if (options.preflightOnly) return "preflight";
  if (options.execute) return "execute";
  return null;
}

export function printLiveImportUsage(): void {
  console.log(`Usage:
  Read-only Dev preflight:
    content:import --dir <path> --preflight-only --confirm-dev --project-ref <DEV_REF>

  Dev live draft import:
    content:import --dir <path> --execute --confirm-dev --project-ref <DEV_REF>

Dev-only (direct PostgreSQL via DATABASE_URL).

Required for any database connection:
  --confirm-dev     Confirm Dev-only intent
  --project-ref     Expected Supabase project ref (must match DATABASE_URL)
  DATABASE_URL      Direct Postgres connection string (env or .env.local)

Exactly one DB mode is required:
  --preflight-only  Read-only SELECT preflight (no writes)
  --execute         Opt in to transactional database writes

Production import is not supported in this phase.`);
}

export function validateLiveImportGuards(
  options: LiveImportCliOptions,
  env: { databaseUrl?: string },
): LiveImportGuardResult {
  if (options.preflightOnly && options.execute) {
    return {
      ok: false,
      reason: "Cannot combine --preflight-only with --execute.",
    };
  }

  const mode = resolveDbConnectionMode(options);
  if (!mode) {
    return {
      ok: false,
      reason:
        "Requires --preflight-only or --execute. No database connection was attempted.",
    };
  }

  if (!options.confirmDev) {
    return {
      ok: false,
      reason: "Dev database access requires --confirm-dev.",
    };
  }

  if (!options.projectRef?.trim()) {
    return {
      ok: false,
      reason: "Dev database access requires --project-ref <DEV_REF>.",
    };
  }

  if (!env.databaseUrl?.trim()) {
    return {
      ok: false,
      reason: "Dev database access requires DATABASE_URL (environment or .env.local).",
    };
  }

  return { ok: true, options, mode };
}
