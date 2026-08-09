/**
 * PostgreSQL SSL resolution for Supabase direct and pooler hosts.
 * Pure functions — no network access.
 */

export type PgSslConfig = { rejectUnauthorized: boolean } | undefined;

/** Whether the hostname is a known Supabase PostgreSQL endpoint. */
export function isSupabasePostgresHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host.endsWith(".supabase.co") || host.endsWith(".pooler.supabase.com");
}

/**
 * Resolve pg Pool SSL option from a connection string.
 * - Supabase direct (db.<ref>.supabase.co) → SSL enabled
 * - Supabase pooler (*.pooler.supabase.com) → SSL enabled
 * - sslmode=require|verify-* in URL → SSL enabled (respect verify strictness)
 * - sslmode=disable → no explicit SSL config (non-Supabase local dev)
 * - Other hosts → undefined (driver default)
 */
export function resolvePgSslConfig(connectionString: string): PgSslConfig {
  try {
    const url = new URL(connectionString);
    const sslmode = url.searchParams.get("sslmode")?.toLowerCase();

    if (sslmode === "disable") {
      return undefined;
    }

    if (
      sslmode === "require" ||
      sslmode === "verify-ca" ||
      sslmode === "verify-full" ||
      sslmode === "prefer"
    ) {
      return { rejectUnauthorized: sslmode === "verify-full" || sslmode === "verify-ca" };
    }

    if (isSupabasePostgresHost(url.hostname)) {
      return { rejectUnauthorized: false };
    }

    return undefined;
  } catch {
    return undefined;
  }
}
