import { afterEach, describe, expect, it } from "vitest";

import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/config";

const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

function clearSupabaseEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
}

describe("getSupabaseUrl", () => {
  afterEach(clearSupabaseEnv);

  it("returns trimmed URL", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "  https://example.supabase.co  ";
    expect(getSupabaseUrl()).toBe("https://example.supabase.co");
  });

  it("throws when URL is missing", () => {
    expect(() => getSupabaseUrl()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });
});

describe("getSupabasePublishableKey", () => {
  afterEach(clearSupabaseEnv);

  it("prefers publishable key over anon key", () => {
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "legacy-anon";
    expect(getSupabasePublishableKey()).toBe("sb_publishable_test");
  });

  it("falls back to anon key for local CLI stack", () => {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJ-local-anon";
    expect(getSupabasePublishableKey()).toBe("eyJ-local-anon");
  });

  it("throws when neither key is set", () => {
    expect(() => getSupabasePublishableKey()).toThrow(
      /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/
    );
  });
});
