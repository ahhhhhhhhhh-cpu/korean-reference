function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing ${name}. Set it in .env.local (see .env.example). Required for Supabase data source.`
    );
  }
  return value;
}

/** Supabase project URL (local or remote dev). */
export function getSupabaseUrl(): string {
  return requireEnv("NEXT_PUBLIC_SUPABASE_URL");
}

/**
 * Client key for Supabase Data API.
 * Prefer modern publishable key (`sb_publishable_...`); fall back to legacy anon key for local CLI stack.
 */
export function getSupabasePublishableKey(): string {
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (publishable) {
    return publishable;
  }

  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (anon) {
    return anon;
  }

  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY for local Supabase CLI)."
  );
}
