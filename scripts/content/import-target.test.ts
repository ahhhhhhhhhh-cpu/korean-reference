import { describe, expect, it } from "vitest";

import {
  DOCUMENTED_DEV_PROJECT_REF,
  DOCUMENTED_PRODUCTION_PROJECT_REF,
  PILOT_EXPECTED_COUNTS,
} from "./import-config";
import { validateProjectRefTarget } from "./import-project-ref";
import {
  expectedRefForTarget,
  formatExecuteWriteBanner,
  resolveReleaseTarget,
  selectConnectionForTarget,
} from "./import-target";

const DEV_REF = DOCUMENTED_DEV_PROJECT_REF;
const PROD_REF = DOCUMENTED_PRODUCTION_PROJECT_REF;
const THIRD_REF = "abcdefghijklmnopqr";

function supabaseDbUrl(ref: string): string {
  return `postgresql://postgres.${ref}@db.${ref}.supabase.co:5432/postgres`;
}

describe("release target classification", () => {
  it("fixed expected refs are Dev and Production only", () => {
    expect(expectedRefForTarget("dev")).toBe(DEV_REF);
    expect(expectedRefForTarget("production")).toBe(PROD_REF);
  });

  it("Dev confirmation selects Dev", () => {
    const result = resolveReleaseTarget({ confirmDev: true, confirmProduction: false });
    expect(result).toEqual({ ok: true, target: "dev" });
  });

  it("Production confirmation selects Production", () => {
    const result = resolveReleaseTarget({ confirmDev: false, confirmProduction: true });
    expect(result).toEqual({ ok: true, target: "production" });
  });

  it("missing confirmation is rejected (Production is not the default)", () => {
    const result = resolveReleaseTarget({ confirmDev: false, confirmProduction: false });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("--confirm-dev");
      expect(result.reason).toContain("--confirm-production");
      expect(result.reason).toContain("No database connection was attempted");
    }
  });

  it("cannot combine --confirm-dev with --confirm-production", () => {
    const result = resolveReleaseTarget({ confirmDev: true, confirmProduction: true });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("Cannot combine");
    }
  });
});

describe("connection selection (no silent fallback)", () => {
  const devUrl = supabaseDbUrl(DEV_REF);
  const prodUrl = supabaseDbUrl(PROD_REF);

  it("Dev mode uses DATABASE_URL only", () => {
    const result = selectConnectionForTarget("dev", {
      databaseUrl: devUrl,
      productionDatabaseUrl: prodUrl,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.connectionString).toBe(devUrl);
  });

  it("Production mode uses PRODUCTION_DATABASE_URL only", () => {
    const result = selectConnectionForTarget("production", {
      databaseUrl: devUrl,
      productionDatabaseUrl: prodUrl,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.connectionString).toBe(prodUrl);
  });

  it("Dev mode does not fall back to PRODUCTION_DATABASE_URL", () => {
    const result = selectConnectionForTarget("dev", {
      productionDatabaseUrl: prodUrl,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("DATABASE_URL");
  });

  it("Production mode does not fall back to DATABASE_URL", () => {
    const result = selectConnectionForTarget("production", {
      databaseUrl: prodUrl,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("PRODUCTION_DATABASE_URL");
      expect(result.reason).toContain("not used as a fallback");
    }
  });
});

describe("project identity vs selected target", () => {
  it("Dev mode + Dev ref is accepted", () => {
    const result = validateProjectRefTarget({
      target: "dev",
      databaseUrl: supabaseDbUrl(DEV_REF),
      expectedProjectRef: DEV_REF,
      supabaseUrl: `https://${DEV_REF}.supabase.co`,
    });
    expect(result.ok).toBe(true);
  });

  it("Dev mode + Production ref is rejected", () => {
    const result = validateProjectRefTarget({
      target: "dev",
      databaseUrl: supabaseDbUrl(PROD_REF),
      expectedProjectRef: PROD_REF,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/Production/);
  });

  it("Production mode + Production ref is accepted", () => {
    const result = validateProjectRefTarget({
      target: "production",
      databaseUrl: supabaseDbUrl(PROD_REF),
      expectedProjectRef: PROD_REF,
    });
    expect(result.ok).toBe(true);
  });

  it("Production mode + Dev ref is rejected", () => {
    const result = validateProjectRefTarget({
      target: "production",
      databaseUrl: supabaseDbUrl(DEV_REF),
      expectedProjectRef: DEV_REF,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/Dev/);
  });

  it("unknown ref is rejected in Dev mode", () => {
    const result = validateProjectRefTarget({
      target: "dev",
      databaseUrl: supabaseDbUrl(THIRD_REF),
      expectedProjectRef: THIRD_REF,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("allowlist");
  });

  it("unknown ref is rejected in Production mode", () => {
    const result = validateProjectRefTarget({
      target: "production",
      databaseUrl: supabaseDbUrl(THIRD_REF),
      expectedProjectRef: THIRD_REF,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("allowlist");
  });

  it("Production connection derived as Dev is rejected", () => {
    const result = validateProjectRefTarget({
      target: "production",
      databaseUrl: supabaseDbUrl(DEV_REF),
      expectedProjectRef: PROD_REF,
      connectionLabel: "PRODUCTION_DATABASE_URL",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/Dev|does not match|PRODUCTION_DATABASE_URL/);
    }
  });

  it("Dev connection derived as Production is rejected", () => {
    const result = validateProjectRefTarget({
      target: "dev",
      databaseUrl: supabaseDbUrl(PROD_REF),
      expectedProjectRef: DEV_REF,
      connectionLabel: "DATABASE_URL",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/Production|does not match/);
  });

  it("Production mode ignores NEXT_PUBLIC_SUPABASE_URL (local app env is Dev)", () => {
    const result = validateProjectRefTarget({
      target: "production",
      databaseUrl: supabaseDbUrl(PROD_REF),
      expectedProjectRef: PROD_REF,
      supabaseUrl: `https://${DEV_REF}.supabase.co`,
    });
    expect(result.ok).toBe(true);
  });

  it("default target remains Dev (Production ref still blocked)", () => {
    const result = validateProjectRefTarget({
      databaseUrl: supabaseDbUrl(PROD_REF),
      expectedProjectRef: PROD_REF,
    });
    expect(result.ok).toBe(false);
  });
});

describe("execute write confirmation banner", () => {
  it("prints Production import banner without secrets", () => {
    const output = formatExecuteWriteBanner({
      target: "production",
      projectRef: PROD_REF,
      operation: "import",
      confirmProduction: true,
      confirmPublish: false,
    });
    expect(output).toContain("TARGET: PRODUCTION");
    expect(output).toContain(`Project ref: ${PROD_REF}`);
    expect(output).toContain("Operation: import");
    expect(output).toContain(`Pilot entries: ${PILOT_EXPECTED_COUNTS.entries}`);
    expect(output).toContain(`Pilot senses: ${PILOT_EXPECTED_COUNTS.senses}`);
    expect(output).toContain(`Pilot examples: ${PILOT_EXPECTED_COUNTS.examples}`);
    expect(output).toContain(`Pilot entry_examples: ${PILOT_EXPECTED_COUNTS.entry_examples}`);
    expect(output).toContain("Explicit Production confirmation: YES");
    expect(output).toContain("Explicit publish confirmation: NOT REQUIRED");
    expect(output).not.toMatch(/DATABASE_URL|password|postgresql|service.role|publishable|token/i);
  });

  it("prints Production publish banner with publish confirmation", () => {
    const output = formatExecuteWriteBanner({
      target: "production",
      projectRef: PROD_REF,
      operation: "in_review→published",
      confirmProduction: true,
      confirmPublish: true,
    });
    expect(output).toContain("TARGET: PRODUCTION");
    expect(output).toContain("Operation: in_review→published");
    expect(output).toContain("Explicit Production confirmation: YES");
    expect(output).toContain("Explicit publish confirmation: YES");
    expect(output).not.toMatch(/DATABASE_URL|password|postgresql/i);
  });
});
