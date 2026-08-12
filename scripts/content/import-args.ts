import {
  resolveReleaseTarget,
  selectConnectionForTarget,
  type ReleaseTarget,
} from "./import-target";

export type LiveImportCliOptions = {
  dir: string;
  execute: boolean;
  preflightOnly: boolean;
  confirmDev: boolean;
  confirmProduction: boolean;
  projectRef?: string;
};

export type LiveImportGuardResult =
  | {
      ok: true;
      options: LiveImportCliOptions;
      mode: DbConnectionMode;
      target: ReleaseTarget;
      connectionString: string;
    }
  | { ok: false; reason: string };

export type DbConnectionMode = "preflight" | "execute";

export function parseLiveImportArgs(argv: string[]): LiveImportCliOptions {
  let dir = "data/templates";
  let execute = false;
  let preflightOnly = false;
  let confirmDev = false;
  let confirmProduction = false;
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
    } else if (arg === "--confirm-production") {
      confirmProduction = true;
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
    confirmProduction,
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

  Read-only Production preflight:
    content:import --dir <path> --preflight-only --confirm-production --project-ref <PRODUCTION_REF>

  Production live draft import:
    content:import --dir <path> --execute --confirm-production --project-ref <PRODUCTION_REF>

Dev and Production are separate explicit targets. Production is never the default.

Required for any database connection:
  --confirm-dev            Confirm Dev intent (Dev only; never authorizes Production)
  --confirm-production     Confirm Production intent (Production only; never reuse --confirm-dev)
  --project-ref            Expected Supabase project ref (must match the selected connection URL)

Connection environment (no silent fallback either way):
  DATABASE_URL               Dev Postgres URL (Dev mode only)
  PRODUCTION_DATABASE_URL    Production Postgres URL (Production mode only)

Exactly one DB mode is required:
  --preflight-only  Read-only SELECT preflight (no writes)
  --execute         Opt in to transactional database writes

Import remains draft-only. Direct publish is not supported.`);
}

export function validateLiveImportGuards(
  options: LiveImportCliOptions,
  env: { databaseUrl?: string; productionDatabaseUrl?: string },
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

  const targetResult = resolveReleaseTarget({
    confirmDev: options.confirmDev,
    confirmProduction: options.confirmProduction,
  });
  if (!targetResult.ok) return targetResult;

  if (!options.projectRef?.trim()) {
    const label = targetResult.target === "production" ? "Production" : "Dev";
    const refHint =
      targetResult.target === "production" ? "<PRODUCTION_REF>" : "<DEV_REF>";
    return {
      ok: false,
      reason: `${label} database access requires --project-ref ${refHint}.`,
    };
  }

  const connection = selectConnectionForTarget(targetResult.target, env);
  if (!connection.ok) return connection;

  return {
    ok: true,
    options,
    mode,
    target: targetResult.target,
    connectionString: connection.connectionString,
  };
}
