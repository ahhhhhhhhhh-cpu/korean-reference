import {
  ALLOWED_DEV_PROJECT_REFS,
  ALLOWED_PRODUCTION_PROJECT_REFS,
  DOCUMENTED_DEV_PROJECT_REF,
  DOCUMENTED_PRODUCTION_PROJECT_REF,
  PILOT_EXPECTED_COUNTS,
} from "./import-config";

export type ReleaseTarget = "dev" | "production";

export type TargetResolution =
  | { ok: true; target: ReleaseTarget }
  | { ok: false; reason: string };

export type ConnectionSelection =
  | { ok: true; connectionString: string }
  | { ok: false; reason: string };

export function expectedRefForTarget(target: ReleaseTarget): string {
  return target === "production"
    ? DOCUMENTED_PRODUCTION_PROJECT_REF
    : DOCUMENTED_DEV_PROJECT_REF;
}

export function allowedRefsForTarget(target: ReleaseTarget): Set<string> {
  return target === "production"
    ? ALLOWED_PRODUCTION_PROJECT_REFS
    : ALLOWED_DEV_PROJECT_REFS;
}

/** Exactly one of --confirm-dev or --confirm-production. */
export function resolveReleaseTarget(options: {
  confirmDev: boolean;
  confirmProduction: boolean;
}): TargetResolution {
  if (options.confirmDev && options.confirmProduction) {
    return {
      ok: false,
      reason:
        "Cannot combine --confirm-dev with --confirm-production. No database connection was attempted.",
    };
  }

  if (options.confirmProduction) {
    return { ok: true, target: "production" };
  }

  if (options.confirmDev) {
    return { ok: true, target: "dev" };
  }

  return {
    ok: false,
    reason:
      "Database access requires --confirm-dev (Dev) or --confirm-production (Production). No database connection was attempted.",
  };
}

/**
 * Production uses PRODUCTION_DATABASE_URL only.
 * Dev uses DATABASE_URL only.
 * Neither target silently falls back to the other variable.
 */
export function selectConnectionForTarget(
  target: ReleaseTarget,
  env: { databaseUrl?: string; productionDatabaseUrl?: string },
): ConnectionSelection {
  if (target === "production") {
    const url = env.productionDatabaseUrl?.trim();
    if (!url) {
      return {
        ok: false,
        reason:
          "Production database access requires PRODUCTION_DATABASE_URL (environment or .env.local). DATABASE_URL is not used as a fallback.",
      };
    }
    return { ok: true, connectionString: url };
  }

  const url = env.databaseUrl?.trim();
  if (!url) {
    return {
      ok: false,
      reason: "Dev database access requires DATABASE_URL (environment or .env.local).",
    };
  }
  return { ok: true, connectionString: url };
}

export type ExecuteWriteBannerInput = {
  target: ReleaseTarget;
  projectRef: string;
  operation: "import" | "draft→in_review" | "in_review→published";
  confirmProduction: boolean;
  confirmPublish: boolean;
};

/** Non-secret execute banner. Never include connection strings or credentials. */
export function formatExecuteWriteBanner(input: ExecuteWriteBannerInput): string {
  const targetLabel = input.target === "production" ? "PRODUCTION" : "DEV";
  const publishLine =
    input.operation === "in_review→published"
      ? `Explicit publish confirmation: ${input.confirmPublish ? "YES" : "NO"}`
      : "Explicit publish confirmation: NOT REQUIRED";

  return [
    "--- WRITE CONFIRMATION ---",
    `TARGET: ${targetLabel}`,
    `Project ref: ${input.projectRef}`,
    `Operation: ${input.operation}`,
    `Pilot entries: ${PILOT_EXPECTED_COUNTS.entries}`,
    `Pilot senses: ${PILOT_EXPECTED_COUNTS.senses}`,
    `Pilot examples: ${PILOT_EXPECTED_COUNTS.examples}`,
    `Pilot entry_examples: ${PILOT_EXPECTED_COUNTS.entry_examples}`,
    `Explicit Production confirmation: ${input.confirmProduction ? "YES" : "NO"}`,
    publishLine,
  ].join("\n");
}
