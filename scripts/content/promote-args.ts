import {
  parsePromoteTargetStatus,
  type PromoteTargetStatus,
} from "./promote-config";
import {
  parseLiveImportArgs,
  resolveDbConnectionMode,
  validateLiveImportGuards,
  type DbConnectionMode,
  type LiveImportCliOptions,
} from "./import-args";

export type PromoteCliOptions = LiveImportCliOptions & {
  targetStatus: PromoteTargetStatus;
};

export type PromoteGuardResult =
  | { ok: true; options: PromoteCliOptions; mode: DbConnectionMode }
  | { ok: false; reason: string };

export function parsePromoteArgs(argv: string[]): PromoteCliOptions {
  const base = parseLiveImportArgs(argv);
  let targetStatus: PromoteTargetStatus | undefined;

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--target-status" && argv[i + 1]) {
      const parsed = parsePromoteTargetStatus(argv[++i]!);
      if (parsed) targetStatus = parsed;
    }
  }

  if (!targetStatus) {
    throw new Error(
      "Missing or invalid --target-status. Supported values: in_review, published.",
    );
  }

  return { ...base, targetStatus };
}

export function printPromoteUsage(): void {
  console.log(`Usage:
  Read-only Dev promotion preflight:
    content:promote --dir <path> --target-status in_review|published \\
      --preflight-only --confirm-dev --project-ref <DEV_REF>

  Dev Formal Pilot status transition:
    content:promote --dir <path> --target-status in_review|published \\
      --execute --confirm-dev --project-ref <DEV_REF>

Dev-only (direct PostgreSQL via DATABASE_URL).

Supported transitions:
  draft -> in_review       (--target-status in_review)
  in_review -> published   (--target-status published)

Required for any database connection:
  --confirm-dev     Confirm Dev-only intent
  --project-ref     Expected Supabase project ref (must match DATABASE_URL)
  --target-status   Promotion target (in_review or published)
  DATABASE_URL      Direct Postgres connection string (env or .env.local)

Exactly one DB mode is required:
  --preflight-only  Read-only SELECT preflight (no writes)
  --execute         Opt in to transactional status updates

Production promotion is not supported in this phase.`);
}

export function validatePromoteGuards(
  options: PromoteCliOptions,
  env: { databaseUrl?: string },
): PromoteGuardResult {
  const base = validateLiveImportGuards(options, env);
  if (!base.ok) return base;
  return { ok: true, options, mode: base.mode };
}

export { resolveDbConnectionMode };
