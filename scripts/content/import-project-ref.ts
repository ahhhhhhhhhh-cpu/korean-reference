import {
  ALLOWED_DEV_PROJECT_REFS,
  BLOCKED_PRODUCTION_PROJECT_REFS,
} from "./import-config";

/** Extract Supabase project ref from a direct Postgres connection URL. */
export function extractProjectRefFromDatabaseUrl(databaseUrl: string): string | null {
  try {
    const url = new URL(databaseUrl);
    const host = url.hostname.toLowerCase();

    const dbHost = host.match(/^db\.([a-z0-9]+)\.supabase\.co$/);
    if (dbHost?.[1]) return dbHost[1];

    const poolerHost = host.match(/^.+\.pooler\.supabase\.com$/);
    if (poolerHost) {
      const userMatch = url.username.match(/^postgres\.([a-z0-9]+)$/);
      if (userMatch?.[1]) return userMatch[1];
      return null;
    }

    const userRef = url.username.match(/^postgres\.([a-z0-9]+)$/);
    if (userRef?.[1]) return userRef[1];

    return null;
  } catch {
    return null;
  }
}

/** Extract Supabase project ref from the public project URL. */
export function extractProjectRefFromSupabaseUrl(supabaseUrl: string): string | null {
  try {
    const url = new URL(supabaseUrl);
    const host = url.hostname.toLowerCase();
    const match = host.match(/^([a-z0-9]+)\.supabase\.co$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function isBlockedProductionProjectRef(projectRef: string): boolean {
  return BLOCKED_PRODUCTION_PROJECT_REFS.has(projectRef.toLowerCase());
}

export function isAllowedDevProjectRef(projectRef: string): boolean {
  return ALLOWED_DEV_PROJECT_REFS.has(projectRef.toLowerCase());
}

export type ProjectRefValidationInput = {
  databaseUrl: string;
  expectedProjectRef: string;
  supabaseUrl?: string;
};

export type ProjectRefValidationResult =
  | { ok: true; derivedRef: string }
  | { ok: false; reason: string };

function rejectIfNotAllowlisted(ref: string, label: string): ProjectRefValidationResult | null {
  if (isBlockedProductionProjectRef(ref)) {
    return {
      ok: false,
      reason: `${label} targets a blocked Production Supabase project.`,
    };
  }
  if (!isAllowedDevProjectRef(ref)) {
    return {
      ok: false,
      reason: `${label} project ref "${ref}" is not in the Dev allowlist (korean-reference-dev only).`,
    };
  }
  return null;
}

/** Validate Dev target identity before any database write. */
export function validateProjectRefTarget(
  input: ProjectRefValidationInput,
): ProjectRefValidationResult {
  const expected = input.expectedProjectRef.trim().toLowerCase();
  if (!expected) {
    return { ok: false, reason: "Expected project ref must not be empty." };
  }

  const expectedCheck = rejectIfNotAllowlisted(expected, "--project-ref");
  if (expectedCheck) return expectedCheck;

  const derived = extractProjectRefFromDatabaseUrl(input.databaseUrl);
  if (!derived) {
    return {
      ok: false,
      reason:
        "Could not derive Supabase project ref from DATABASE_URL host/username.",
    };
  }

  const derivedCheck = rejectIfNotAllowlisted(derived, "DATABASE_URL");
  if (derivedCheck) return derivedCheck;

  if (derived.toLowerCase() !== expected) {
    return {
      ok: false,
      reason: `DATABASE_URL project ref "${derived}" does not match --project-ref "${expected}".`,
    };
  }

  if (input.supabaseUrl) {
    const urlRef = extractProjectRefFromSupabaseUrl(input.supabaseUrl);
    if (!urlRef) {
      return {
        ok: false,
        reason:
          "Could not derive project ref from NEXT_PUBLIC_SUPABASE_URL for consistency check.",
      };
    }
    const urlRefCheck = rejectIfNotAllowlisted(urlRef, "NEXT_PUBLIC_SUPABASE_URL");
    if (urlRefCheck) return urlRefCheck;

    if (urlRef.toLowerCase() !== expected) {
      return {
        ok: false,
        reason: `NEXT_PUBLIC_SUPABASE_URL project ref "${urlRef}" does not match --project-ref "${expected}".`,
      };
    }
  }

  return { ok: true, derivedRef: derived };
}
