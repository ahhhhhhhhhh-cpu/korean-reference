import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import path from "node:path";

import {
  parseLiveImportArgs,
  resolveDbConnectionMode,
  validateLiveImportGuards,
} from "./import-args";
import { createMockDbClient, createPgPool } from "./import-db";
import {
  ALLOWED_DEV_PROJECT_REFS,
  BLOCKED_PRODUCTION_PROJECT_REFS,
  DOCUMENTED_DEV_PROJECT_REF,
  PILOT_EXPECTED_COUNTS,
} from "./import-config";
import { loadImportEnvironment } from "./import-env";
import { executeLivePilotImport, PREFLIGHT_READONLY_SQL, runPreflightOnlyImport } from "./import-live";
import {
  assertDraftOnlyPackage,
  loadPilotWritePackage,
  verifyPilotPackageCounts,
} from "./import-package";
import {
  buildPreflightInputFromRows,
  detectPreflightConflicts,
  formatPreflightOnlyReport,
  TransactionSafetyError,
} from "./import-preflight";
import {
  extractProjectRefFromDatabaseUrl,
  extractProjectRefFromSupabaseUrl,
  isAllowedDevProjectRef,
  isBlockedProductionProjectRef,
  validateProjectRefTarget,
} from "./import-project-ref";
import { isSupabasePostgresHost, resolvePgSslConfig } from "./import-ssl";
import { runCriticalTransactionChecks } from "./import-transaction-guards";
import {
  classifyKeyedRowWrite,
  preserveUuidOnUpsert,
  resolveSenseEntryOwnership,
} from "./import-writer";

const DEV_REF = DOCUMENTED_DEV_PROJECT_REF;
const PROD_REF = "rpykfrvcynpwmbkogiou";
const THIRD_REF = "abcdefghijklmnopqr";

/** Mock preflight queries return empty unless overridden. */
function emptyPreflightHandler(sql: string) {
  if (sql.includes("FROM public.entries")) return { rows: [], rowCount: 0 };
  if (sql.includes("FROM public.examples")) return { rows: [], rowCount: 0 };
  if (sql.includes("FROM public.senses")) return { rows: [], rowCount: 0 };
  if (sql.includes("FROM public.sense_translations")) return { rows: [], rowCount: 0 };
  if (sql.includes("FROM public.example_translations")) return { rows: [], rowCount: 0 };
  return null;
}

describe("live import guards", () => {
  it("rejects database access without --preflight-only or --execute", () => {
    const options = parseLiveImportArgs([
      "node",
      "import-live-cli.ts",
      "--dir",
      "data/pilot/entry",
      "--confirm-dev",
      "--project-ref",
      DEV_REF,
    ]);
    expect(resolveDbConnectionMode(options)).toBeNull();
    const result = validateLiveImportGuards(options, {
      databaseUrl: `postgresql://postgres.${DEV_REF}@db.${DEV_REF}.supabase.co:5432/postgres`,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/preflight-only|execute/i);
    }
  });

  it("rejects missing --confirm-dev", () => {
    const options = parseLiveImportArgs([
      "node",
      "import-live-cli.ts",
      "--execute",
      "--project-ref",
      DEV_REF,
    ]);
    const result = validateLiveImportGuards(options, {
      databaseUrl: `postgresql://postgres.${DEV_REF}@db.${DEV_REF}.supabase.co:5432/postgres`,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("--confirm-dev");
  });

  it("rejects missing --project-ref", () => {
    const options = parseLiveImportArgs([
      "node",
      "import-live-cli.ts",
      "--execute",
      "--confirm-dev",
    ]);
    const result = validateLiveImportGuards(options, { databaseUrl: "postgresql://x" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("--project-ref");
  });

  it("rejects missing DATABASE_URL for live execution", () => {
    const options = parseLiveImportArgs([
      "node",
      "import-live-cli.ts",
      "--execute",
      "--confirm-dev",
      "--project-ref",
      DEV_REF,
    ]);
    const result = validateLiveImportGuards(options, {});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("DATABASE_URL");
  });

  it("accepts documented Dev project ref in allowlist", () => {
    expect(ALLOWED_DEV_PROJECT_REFS.has(DEV_REF)).toBe(true);
    expect(isAllowedDevProjectRef(DEV_REF)).toBe(true);
  });

  it("rejects random third Supabase project even when all URLs agree", () => {
    const databaseUrl = `postgresql://postgres.${THIRD_REF}@db.${THIRD_REF}.supabase.co:5432/postgres`;
    const supabaseUrl = `https://${THIRD_REF}.supabase.co`;
    const result = validateProjectRefTarget({
      databaseUrl,
      expectedProjectRef: THIRD_REF,
      supabaseUrl,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("allowlist");
    }
  });

  it("rejects target project-ref mismatch", () => {
    const databaseUrl = `postgresql://postgres.${DEV_REF}@db.${DEV_REF}.supabase.co:5432/postgres`;
    const result = validateProjectRefTarget({
      databaseUrl,
      expectedProjectRef: "wrongref123456789012",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects inability to verify target project ref", () => {
    const result = validateProjectRefTarget({
      databaseUrl: "postgresql://user:pass@localhost:5432/postgres",
      expectedProjectRef: DEV_REF,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("Could not derive");
    }
  });

  it("rejects production-like target ref", () => {
    expect(BLOCKED_PRODUCTION_PROJECT_REFS.has(PROD_REF)).toBe(true);
    expect(isBlockedProductionProjectRef(PROD_REF)).toBe(true);

    const databaseUrl = `postgresql://postgres.${PROD_REF}@db.${PROD_REF}.supabase.co:5432/postgres`;
    const result = validateProjectRefTarget({
      databaseUrl,
      expectedProjectRef: PROD_REF,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("Production");
    }
  });

  it("accepts matching dev DATABASE_URL and project ref", () => {
    const databaseUrl = `postgresql://postgres.${DEV_REF}@db.${DEV_REF}.supabase.co:5432/postgres`;
    const supabaseUrl = `https://${DEV_REF}.supabase.co`;
    expect(extractProjectRefFromDatabaseUrl(databaseUrl)).toBe(DEV_REF);
    expect(extractProjectRefFromSupabaseUrl(supabaseUrl)).toBe(DEV_REF);

    const result = validateProjectRefTarget({
      databaseUrl,
      expectedProjectRef: DEV_REF,
      supabaseUrl,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects NEXT_PUBLIC_SUPABASE_URL mismatch", () => {
    const databaseUrl = `postgresql://postgres.${DEV_REF}@db.${DEV_REF}.supabase.co:5432/postgres`;
    const result = validateProjectRefTarget({
      databaseUrl,
      expectedProjectRef: DEV_REF,
      supabaseUrl: `https://${THIRD_REF}.supabase.co`,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("NEXT_PUBLIC_SUPABASE_URL");
    }
  });
});

describe("Supabase URL derivation and SSL", () => {
  it("derives project ref from direct Supabase DATABASE_URL", () => {
    const url = `postgresql://postgres.${DEV_REF}@db.${DEV_REF}.supabase.co:5432/postgres`;
    expect(extractProjectRefFromDatabaseUrl(url)).toBe(DEV_REF);
    expect(isSupabasePostgresHost(`db.${DEV_REF}.supabase.co`)).toBe(true);
    expect(resolvePgSslConfig(url)).toEqual({ rejectUnauthorized: false });
  });

  it("derives project ref from pooler/Supavisor DATABASE_URL", () => {
    const url = `postgresql://postgres.${DEV_REF}@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres`;
    expect(extractProjectRefFromDatabaseUrl(url)).toBe(DEV_REF);
    expect(isSupabasePostgresHost("aws-0-ap-southeast-2.pooler.supabase.com")).toBe(true);
    expect(resolvePgSslConfig(url)).toEqual({ rejectUnauthorized: false });
  });

  it("respects sslmode=require in DATABASE_URL", () => {
    const url = `postgresql://user:pass@localhost:5432/postgres?sslmode=require`;
    expect(resolvePgSslConfig(url)).toEqual({ rejectUnauthorized: false });
  });

  it("respects sslmode=disable", () => {
    const url = `postgresql://postgres.${DEV_REF}@db.${DEV_REF}.supabase.co:5432/postgres?sslmode=disable`;
    expect(resolvePgSslConfig(url)).toBeUndefined();
  });
});

describe("import environment precedence", () => {
  it("process.env wins over .env.local for DATABASE_URL", () => {
    const env = loadImportEnvironment(process.cwd(), {
      DATABASE_URL: "postgresql://from-process-env",
      NEXT_PUBLIC_SUPABASE_URL: "https://from-process-env.supabase.co",
    });
    expect(env.databaseUrl).toBe("postgresql://from-process-env");
    expect(env.supabaseUrl).toBe("https://from-process-env.supabase.co");
  });
});

describe("draft-only incoming package guard", () => {
  it("rejects published incoming content", () => {
    const pkg = {
      dir: "test",
      files: new Map([
        [
          "examples.csv",
          {
            rows: [
              {
                import_key: "v2-ex-001",
                korean_text: "x",
                korean_text_normalized: "x",
                provenance_type: "original",
                status: "published",
              },
            ],
          },
        ],
      ]),
    };
    const result = assertDraftOnlyPackage(pkg);
    expect(result.ok).toBe(false);
  });
});

describe("preflight conflict detection", () => {
  it("blocks seed-style slug collision with null import_key", () => {
    const input = buildPreflightInputFromRows(
      [{ import_key: "entry-hakgyo", slug: "hakgyo" }],
      [],
      [{ id: "1", import_key: null, slug: "hakgyo", status: "draft" }],
      [],
      [],
    );
    const conflicts = detectPreflightConflicts(input);
    expect(conflicts.some((c) => c.kind === "seed_slug_collision")).toBe(true);
  });

  it("recognizes existing keyed row by import_key", () => {
    const input = buildPreflightInputFromRows(
      [{ import_key: "entry-hakgyo", slug: "hakgyo" }],
      [],
      [{ id: "1", import_key: "entry-hakgyo", slug: "hakgyo", status: "draft" }],
      [],
      [{ id: "1", import_key: "entry-hakgyo", status: "draft" }],
    );
    const conflicts = detectPreflightConflicts(input);
    expect(conflicts).toHaveLength(0);
  });

  it("blocks in_review/published existing entry and example keyed rows", () => {
    const input = buildPreflightInputFromRows(
      [{ import_key: "entry-hakgyo", slug: "hakgyo" }],
      [{ import_key: "v2-ex-001" }],
      [{ id: "1", import_key: "entry-hakgyo", slug: "hakgyo", status: "published" }],
      [{ id: "2", import_key: "v2-ex-001", status: "in_review" }],
      [],
    );
    const conflicts = detectPreflightConflicts(input);
    expect(conflicts.length).toBeGreaterThanOrEqual(2);
  });

  it("blocks unsafe existing sense status during preflight", () => {
    const input = buildPreflightInputFromRows(
      [],
      [],
      [],
      [],
      [{ id: "s1", import_key: "sense-hakgyo-01", status: "published", entity: "senses" }],
      [{ import_key: "sense-hakgyo-01", entry_import_key: "entry-hakgyo", sense_order: "1" }],
    );
    const conflicts = detectPreflightConflicts(input);
    expect(conflicts.some((c) => c.kind === "import_key_unsafe_status")).toBe(true);
    expect(conflicts.some((c) => c.message.includes("sense-hakgyo-01"))).toBe(true);
  });

  it("blocks unsafe existing sense_translation status during preflight", () => {
    const input = buildPreflightInputFromRows(
      [],
      [],
      [],
      [],
      [{ id: "st1", import_key: "st-hakgyo-en", status: "in_review", entity: "sense_translations" }],
      [],
      [{ import_key: "st-hakgyo-en", sense_import_key: "sense-hakgyo-01", locale: "en" }],
    );
    const conflicts = detectPreflightConflicts(input);
    expect(conflicts.some((c) => c.message.includes("st-hakgyo-en"))).toBe(true);
  });

  it("blocks unsafe existing entry_alias status during preflight", () => {
    const input = buildPreflightInputFromRows(
      [],
      [],
      [],
      [],
      [{ id: "a1", import_key: "alias-hakgyo", status: "archived", entity: "entry_aliases" }],
      [],
      [],
      [{ import_key: "alias-hakgyo", entry_import_key: "entry-hakgyo" }],
    );
    const conflicts = detectPreflightConflicts(input);
    expect(conflicts.some((c) => c.message.includes("alias-hakgyo"))).toBe(true);
  });

  it("blocks unsafe existing example_translation status during preflight", () => {
    const input = buildPreflightInputFromRows(
      [],
      [{ import_key: "v2-ex-001" }],
      [],
      [],
      [{ id: "et1", import_key: "et-v2-ex-001-en", status: "needs_revision", entity: "example_translations" }],
      [],
      [],
      [],
      [{ import_key: "et-v2-ex-001-en", example_import_key: "v2-ex-001", locale: "en" }],
    );
    const conflicts = detectPreflightConflicts(input);
    expect(conflicts.some((c) => c.message.includes("et-v2-ex-001-en"))).toBe(true);
  });
});

describe("keyed entity idempotency helpers", () => {
  it("classifies insert vs update vs blocked", () => {
    expect(classifyKeyedRowWrite(null)).toBe("insert");
    expect(classifyKeyedRowWrite({ id: "uuid-1", status: "draft" })).toBe("update");
    expect(classifyKeyedRowWrite({ id: "uuid-1", status: "published" })).toBe("blocked");
  });

  it("preserves UUID on upsert", () => {
    expect(preserveUuidOnUpsert("uuid-1", "update")).toBe("uuid-1");
    expect(preserveUuidOnUpsert("uuid-1", "unchanged")).toBe("uuid-1");
    expect(preserveUuidOnUpsert("uuid-1", "insert")).toBe("new-uuid");
  });
});

describe("relation resolution guards", () => {
  it("fails when sense belongs to wrong entry", () => {
    const senseRows = [
      { import_key: "sense-hakgyo-01", entry_import_key: "entry-hakgyo" },
    ];
    expect(
      resolveSenseEntryOwnership("sense-hakgyo-01", "entry-hakgyo", senseRows),
    ).toBe(true);
    expect(
      resolveSenseEntryOwnership("sense-hakgyo-01", "entry-saram", senseRows),
    ).toBe(false);
  });

  it("fails before commit when entry_import_key is missing from maps", async () => {
    const db = createMockDbClient({
      query: async (sql) => {
        const empty = emptyPreflightHandler(sql);
        if (empty) return empty;
        if (sql.startsWith("INSERT INTO public.entries")) {
          return { rows: [{ id: "entry-id" }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      },
    });

    const pkg = {
      dir: "mock",
      files: new Map([
        [
          "entries.csv",
          {
            rows: [
              {
                import_key: "entry-hakgyo",
                slug: "hakgyo",
                headword: "학교",
                headword_normalized: "학교",
                part_of_speech: "noun",
                status: "draft",
              },
            ],
          },
        ],
        [
          "senses.csv",
          {
            rows: [
              {
                import_key: "sense-missing-parent",
                entry_import_key: "entry-not-in-package",
                sense_order: "1",
                is_primary: "true",
                status: "draft",
              },
            ],
          },
        ],
        ["sense_translations.csv", { rows: [] }],
        ["entry_aliases.csv", { rows: [] }],
        ["examples.csv", { rows: [] }],
        ["example_translations.csv", { rows: [] }],
        ["entry_examples.csv", { rows: [] }],
      ]),
    };

    await expect(executeLivePilotImport(db, pkg)).rejects.toThrow(
      "Unresolved entry_import_key",
    );
  });
});

describe("live import transaction behavior (mock db)", () => {
  it("does not create duplicate junction rows on rerun", async () => {
    const junction = new Set<string>();
    let commits = 0;

    const db = createMockDbClient({
      onCommit: () => {
        commits++;
      },
      query: async (sql, params) => {
        const empty = emptyPreflightHandler(sql);
        if (empty) return empty;
        if (sql.includes("FROM public.entry_examples")) {
          const key = `${params?.[0]}|${params?.[1]}|${params?.[2]}`;
          if (junction.has(key)) {
            return { rows: [{ id: "link-1", display_order: 1 }], rowCount: 1 };
          }
          return { rows: [], rowCount: 0 };
        }
        if (sql.startsWith("INSERT INTO public.entry_examples")) {
          const key = `${params?.[0]}|${params?.[1]}|${params?.[2]}`;
          junction.add(key);
        }
        if (sql.includes("WHERE import_key")) {
          return { rows: [], rowCount: 0 };
        }
        if (sql.startsWith("INSERT INTO public.")) {
          return { rows: [{ id: "new-id" }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      },
    });

    const pkg = {
      dir: "mock",
      files: new Map([
        ["entries.csv", { rows: [{ import_key: "entry-hakgyo", slug: "hakgyo", headword: "학교", headword_normalized: "학교", part_of_speech: "noun", status: "draft" }] }],
        ["senses.csv", { rows: [{ import_key: "sense-hakgyo-01", entry_import_key: "entry-hakgyo", sense_order: "1", is_primary: "true", status: "draft" }] }],
        ["sense_translations.csv", { rows: [] }],
        ["entry_aliases.csv", { rows: [] }],
        ["examples.csv", { rows: [{ import_key: "v2-ex-001", korean_text: "a", korean_text_normalized: "a", provenance_type: "original", status: "draft" }] }],
        ["example_translations.csv", { rows: [] }],
        [
          "entry_examples.csv",
          {
            rows: [
              {
                entry_import_key: "entry-hakgyo",
                example_import_key: "v2-ex-001",
                sense_import_key: "sense-hakgyo-01",
                display_order: "1",
              },
            ],
          },
        ],
      ]),
    };

    const first = await executeLivePilotImport(db, pkg);
    expect(first.summary).toBeDefined();
    const second = await executeLivePilotImport(db, pkg);
    expect(second.summary?.entry_examples.unchanged).toBeGreaterThanOrEqual(1);
    expect(junction.size).toBe(1);
    expect(commits).toBeGreaterThanOrEqual(2);
  });

  it("commits once on successful transaction", async () => {
    let commits = 0;
    let rollbacks = 0;

    const db = createMockDbClient({
      onCommit: () => {
        commits++;
      },
      onRollback: () => {
        rollbacks++;
      },
      query: async (sql) => {
        const empty = emptyPreflightHandler(sql);
        if (empty) return empty;
        if (sql.includes("WHERE import_key")) return { rows: [], rowCount: 0 };
        if (sql.startsWith("INSERT INTO public.")) {
          return { rows: [{ id: "new-id" }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      },
    });

    const pkg = {
      dir: "mock",
      files: new Map([
        ["entries.csv", { rows: [{ import_key: "entry-hakgyo", slug: "hakgyo", headword: "학교", headword_normalized: "학교", part_of_speech: "noun", status: "draft" }] }],
        ["senses.csv", { rows: [] }],
        ["sense_translations.csv", { rows: [] }],
        ["entry_aliases.csv", { rows: [] }],
        ["examples.csv", { rows: [] }],
        ["example_translations.csv", { rows: [] }],
        ["entry_examples.csv", { rows: [] }],
      ]),
    };

    await executeLivePilotImport(db, pkg);
    expect(commits).toBe(1);
    expect(rollbacks).toBe(0);
  });

  it("rolls back entire transaction on write failure", async () => {
    let rolledBack = false;
    let committed = false;

    const db = createMockDbClient({
      onCommit: () => {
        committed = true;
      },
      onRollback: () => {
        rolledBack = true;
      },
      query: async (sql) => {
        const empty = emptyPreflightHandler(sql);
        if (empty) return empty;
        if (sql.startsWith("INSERT INTO public.entries")) {
          throw new Error("simulated write failure");
        }
        return { rows: [], rowCount: 0 };
      },
    });

    const pkg = loadPilotWritePackage("data/pilot/entry");
    await expect(executeLivePilotImport(db, pkg)).rejects.toThrow("simulated write failure");
    expect(rolledBack).toBe(true);
    expect(committed).toBe(false);
  });

  it("rolls back when critical slug conflict appears inside transaction", async () => {
    let rolledBack = false;
    let committed = false;
    let entryQueryCount = 0;

    const db = createMockDbClient({
      onCommit: () => {
        committed = true;
      },
      onRollback: () => {
        rolledBack = true;
      },
      query: async (sql) => {
        if (sql.includes("FROM public.entries")) {
          entryQueryCount++;
          if (entryQueryCount > 1) {
            return {
              rows: [
                {
                  id: "seed-1",
                  import_key: null,
                  slug: "hakgyo",
                  status: "draft",
                },
              ],
              rowCount: 1,
            };
          }
          return { rows: [], rowCount: 0 };
        }
        const empty = emptyPreflightHandler(sql);
        if (empty) return empty;
        return { rows: [], rowCount: 0 };
      },
    });

    const pkg = {
      dir: "mock",
      files: new Map([
        ["entries.csv", { rows: [{ import_key: "entry-hakgyo", slug: "hakgyo", headword: "학교", headword_normalized: "학교", part_of_speech: "noun", status: "draft" }] }],
        ["senses.csv", { rows: [] }],
        ["sense_translations.csv", { rows: [] }],
        ["entry_aliases.csv", { rows: [] }],
        ["examples.csv", { rows: [] }],
        ["example_translations.csv", { rows: [] }],
        ["entry_examples.csv", { rows: [] }],
      ]),
    };

    await expect(executeLivePilotImport(db, pkg)).rejects.toThrow(TransactionSafetyError);
    expect(rolledBack).toBe(true);
    expect(committed).toBe(false);
  });

  it("rolls back when unsafe keyed status appears inside transaction", async () => {
    let rolledBack = false;
    let committed = false;
    let entryQueryCount = 0;

    const db = createMockDbClient({
      onCommit: () => {
        committed = true;
      },
      onRollback: () => {
        rolledBack = true;
      },
      query: async (sql) => {
        if (sql.includes("FROM public.entries")) {
          entryQueryCount++;
          if (entryQueryCount > 1) {
            return {
              rows: [
                {
                  id: "e1",
                  import_key: "entry-hakgyo",
                  slug: "hakgyo",
                  status: "published",
                },
              ],
              rowCount: 1,
            };
          }
          return { rows: [], rowCount: 0 };
        }
        const empty = emptyPreflightHandler(sql);
        if (empty) return empty;
        return { rows: [], rowCount: 0 };
      },
    });

    const pkg = {
      dir: "mock",
      files: new Map([
        ["entries.csv", { rows: [{ import_key: "entry-hakgyo", slug: "hakgyo", headword: "학교", headword_normalized: "학교", part_of_speech: "noun", status: "draft" }] }],
        ["senses.csv", { rows: [] }],
        ["sense_translations.csv", { rows: [] }],
        ["entry_aliases.csv", { rows: [] }],
        ["examples.csv", { rows: [] }],
        ["example_translations.csv", { rows: [] }],
        ["entry_examples.csv", { rows: [] }],
      ]),
    };

    await expect(executeLivePilotImport(db, pkg)).rejects.toThrow(TransactionSafetyError);
    expect(rolledBack).toBe(true);
    expect(committed).toBe(false);
  });

  it("runCriticalTransactionChecks throws before writes on slug conflict", async () => {
    const db = createMockDbClient({
      query: async (sql) => {
        if (sql.includes("FROM public.entries")) {
          return {
            rows: [
              { id: "1", import_key: null, slug: "hakgyo", status: "draft" },
            ],
            rowCount: 1,
          };
        }
        const empty = emptyPreflightHandler(sql);
        if (empty) return empty;
        return { rows: [], rowCount: 0 };
      },
    });

    const pkg = {
      dir: "mock",
      files: new Map([
        ["entries.csv", { rows: [{ import_key: "entry-hakgyo", slug: "hakgyo" }] }],
        ["senses.csv", { rows: [] }],
        ["sense_translations.csv", { rows: [] }],
        ["entry_aliases.csv", { rows: [] }],
        ["examples.csv", { rows: [] }],
        ["example_translations.csv", { rows: [] }],
        ["entry_examples.csv", { rows: [] }],
      ]),
    };

    await expect(
      db.transaction(async (tx) => runCriticalTransactionChecks(tx, pkg)),
    ).rejects.toThrow(TransactionSafetyError);
  });
});

describe("preflight-only mode", () => {
  const devDatabaseUrl = `postgresql://postgres.${DEV_REF}@db.${DEV_REF}.supabase.co:5432/postgres`;

  it("accepts --preflight-only for allowed Dev target", () => {
    const options = parseLiveImportArgs([
      "node",
      "import-live-cli.ts",
      "--preflight-only",
      "--confirm-dev",
      "--project-ref",
      DEV_REF,
    ]);
    const result = validateLiveImportGuards(options, { databaseUrl: devDatabaseUrl });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.mode).toBe("preflight");
  });

  it("requires --confirm-dev for preflight-only", () => {
    const options = parseLiveImportArgs([
      "node",
      "import-live-cli.ts",
      "--preflight-only",
      "--project-ref",
      DEV_REF,
    ]);
    const result = validateLiveImportGuards(options, { databaseUrl: devDatabaseUrl });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("--confirm-dev");
  });

  it("requires --project-ref for preflight-only", () => {
    const options = parseLiveImportArgs([
      "node",
      "import-live-cli.ts",
      "--preflight-only",
      "--confirm-dev",
    ]);
    const result = validateLiveImportGuards(options, { databaseUrl: devDatabaseUrl });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("--project-ref");
  });

  it("requires DATABASE_URL for preflight-only", () => {
    const options = parseLiveImportArgs([
      "node",
      "import-live-cli.ts",
      "--preflight-only",
      "--confirm-dev",
      "--project-ref",
      DEV_REF,
    ]);
    const result = validateLiveImportGuards(options, {});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("DATABASE_URL");
  });

  it("rejects random third project for preflight-only", () => {
    const databaseUrl = `postgresql://postgres.${THIRD_REF}@db.${THIRD_REF}.supabase.co:5432/postgres`;
    const result = validateProjectRefTarget({
      databaseUrl,
      expectedProjectRef: THIRD_REF,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects Production for preflight-only", () => {
    const databaseUrl = `postgresql://postgres.${PROD_REF}@db.${PROD_REF}.supabase.co:5432/postgres`;
    const result = validateProjectRefTarget({
      databaseUrl,
      expectedProjectRef: PROD_REF,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects --preflight-only combined with --execute", () => {
    const options = parseLiveImportArgs([
      "node",
      "import-live-cli.ts",
      "--preflight-only",
      "--execute",
      "--confirm-dev",
      "--project-ref",
      DEV_REF,
    ]);
    const result = validateLiveImportGuards(options, { databaseUrl: devDatabaseUrl });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("Cannot combine");
    }
  });

  it("runs database preflight without transaction or writer", async () => {
    let beginCount = 0;
    let insertSeen = false;

    const db = createMockDbClient({
      onBegin: () => {
        beginCount++;
      },
      query: async (sql) => {
        if (/^\s*INSERT/i.test(sql.trim())) insertSeen = true;
        const empty = emptyPreflightHandler(sql);
        if (empty) return empty;
        return { rows: [], rowCount: 0 };
      },
    });

    const pkg = loadPilotWritePackage("data/pilot/entry");
    const result = await runPreflightOnlyImport(db, pkg, DEV_REF);

    expect(result.ok).toBe(true);
    expect(beginCount).toBe(0);
    expect(insertSeen).toBe(false);
    expect(result.report).toContain("PREFLIGHT PASSED");
    expect(result.report).toContain("Database writes: NONE");
    expect(result.report).toContain(DEV_REF);
  });

  it("fails preflight-only on conflicts without transaction", async () => {
    let beginCount = 0;

    const db = createMockDbClient({
      onBegin: () => {
        beginCount++;
      },
      query: async (sql) => {
        if (sql.includes("FROM public.entries")) {
          return {
            rows: [
              { id: "1", import_key: null, slug: "hakgyo", status: "draft" },
            ],
            rowCount: 1,
          };
        }
        const empty = emptyPreflightHandler(sql);
        if (empty) return empty;
        return { rows: [], rowCount: 0 };
      },
    });

    const pkg = loadPilotWritePackage("data/pilot/entry");
    const result = await runPreflightOnlyImport(db, pkg, DEV_REF);

    expect(result.ok).toBe(false);
    expect(beginCount).toBe(0);
    expect(result.report).toContain("PREFLIGHT BLOCKED");
    expect(result.report).toContain("seed slug conflicts: 1");
  });

  it("preflight-only report includes incoming Pilot counts", () => {
    const report = formatPreflightOnlyReport(
      DEV_REF,
      {
        entryCount: 0,
        senseCount: 0,
        exampleCount: 0,
        pilotSlugOverlaps: 0,
        pilotImportKeyMatches: 0,
      },
      [],
    );
    expect(report).toContain("entries: 32");
    expect(report).toContain("entry_examples: 61");
    expect(report).toContain("PREFLIGHT PASSED");
  });

  it("preflight SQL path is SELECT-only", () => {
    for (const sql of PREFLIGHT_READONLY_SQL) {
      expect(sql.trim().toUpperCase()).toMatch(/^SELECT/);
      expect(sql.toUpperCase()).not.toMatch(/\b(INSERT|UPDATE|DELETE|BEGIN|COMMIT|ROLLBACK)\b/);
    }
  });

  it("execute path still reaches transaction after successful preflight", async () => {
    let beginCount = 0;

    const db = createMockDbClient({
      onBegin: () => {
        beginCount++;
      },
      query: async (sql) => {
        const empty = emptyPreflightHandler(sql);
        if (empty) return empty;
        if (sql.includes("WHERE import_key")) return { rows: [], rowCount: 0 };
        if (sql.startsWith("INSERT INTO public.")) {
          return { rows: [{ id: "new-id" }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      },
    });

    const pkg = {
      dir: "mock",
      files: new Map([
        ["entries.csv", { rows: [{ import_key: "entry-hakgyo", slug: "hakgyo", headword: "학교", headword_normalized: "학교", part_of_speech: "noun", status: "draft" }] }],
        ["senses.csv", { rows: [] }],
        ["sense_translations.csv", { rows: [] }],
        ["entry_aliases.csv", { rows: [] }],
        ["examples.csv", { rows: [] }],
        ["example_translations.csv", { rows: [] }],
        ["entry_examples.csv", { rows: [] }],
      ]),
    };

    await executeLivePilotImport(db, pkg);
    expect(beginCount).toBe(1);
  });
});

describe("import-live-cli safety (no credentials)", () => {
  it("fails before DB when run without a DB mode flag", () => {
    const result = spawnSync(
      process.execPath,
      [
        path.join("node_modules", "tsx", "dist", "cli.mjs"),
        "scripts/content/import-live-cli.ts",
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    );
    expect(result.status).not.toBe(0);
    expect(`${result.stderr}${result.stdout}`).toMatch(/preflight-only|execute/i);
  });

  it("preflight-only without DATABASE_URL fails before DB initialization", () => {
    const result = spawnSync(
      process.execPath,
      [
        path.join("node_modules", "tsx", "dist", "cli.mjs"),
        "scripts/content/import-live-cli.ts",
        "--preflight-only",
        "--confirm-dev",
        "--project-ref",
        DEV_REF,
        "--dir",
        "data/pilot/entry",
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env: { ...process.env, DATABASE_URL: "" },
      },
    );
    expect(result.status).not.toBe(0);
    expect(`${result.stderr}${result.stdout}`).toContain("DATABASE_URL");
  });

  it("rejects preflight-only combined with execute before DB initialization", () => {
    const result = spawnSync(
      process.execPath,
      [
        path.join("node_modules", "tsx", "dist", "cli.mjs"),
        "scripts/content/import-live-cli.ts",
        "--preflight-only",
        "--execute",
        "--confirm-dev",
        "--project-ref",
        DEV_REF,
        "--dir",
        "data/pilot/entry",
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env: {
          ...process.env,
          DATABASE_URL: `postgresql://postgres.${DEV_REF}@db.${DEV_REF}.supabase.co:5432/postgres`,
        },
      },
    );
    expect(result.status).not.toBe(0);
    expect(`${result.stderr}${result.stdout}`).toContain("Cannot combine");
  });

  it("rejects production ref for preflight-only before DB initialization", () => {
    const result = spawnSync(
      process.execPath,
      [
        path.join("node_modules", "tsx", "dist", "cli.mjs"),
        "scripts/content/import-live-cli.ts",
        "--preflight-only",
        "--confirm-dev",
        "--project-ref",
        PROD_REF,
        "--dir",
        "data/pilot/entry",
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env: {
          ...process.env,
          DATABASE_URL: `postgresql://postgres.${PROD_REF}@db.${PROD_REF}.supabase.co:5432/postgres`,
        },
      },
    );
    expect(result.status).not.toBe(0);
    expect(`${result.stderr}${result.stdout}`).toMatch(/Production|blocked/i);
  });

  it("rejects random third project ref for preflight-only before DB initialization", () => {
    const result = spawnSync(
      process.execPath,
      [
        path.join("node_modules", "tsx", "dist", "cli.mjs"),
        "scripts/content/import-live-cli.ts",
        "--preflight-only",
        "--confirm-dev",
        "--project-ref",
        THIRD_REF,
        "--dir",
        "data/pilot/entry",
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env: {
          ...process.env,
          DATABASE_URL: `postgresql://postgres.${THIRD_REF}@db.${THIRD_REF}.supabase.co:5432/postgres`,
        },
      },
    );
    expect(result.status).not.toBe(0);
    expect(`${result.stderr}${result.stdout}`).toContain("allowlist");
  });
});

describe("import-live-cli execute safety (no credentials)", () => {
  it("rejects production ref before DB initialization", () => {
    const result = spawnSync(
      process.execPath,
      [
        path.join("node_modules", "tsx", "dist", "cli.mjs"),
        "scripts/content/import-live-cli.ts",
        "--execute",
        "--confirm-dev",
        "--project-ref",
        PROD_REF,
        "--dir",
        "data/pilot/entry",
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env: {
          ...process.env,
          DATABASE_URL: `postgresql://postgres.${PROD_REF}@db.${PROD_REF}.supabase.co:5432/postgres`,
        },
      },
    );
    expect(result.status).not.toBe(0);
    expect(`${result.stderr}${result.stdout}`).toMatch(/Production|blocked/i);
  });

  it("rejects random third project ref before DB initialization", () => {
    const result = spawnSync(
      process.execPath,
      [
        path.join("node_modules", "tsx", "dist", "cli.mjs"),
        "scripts/content/import-live-cli.ts",
        "--execute",
        "--confirm-dev",
        "--project-ref",
        THIRD_REF,
        "--dir",
        "data/pilot/entry",
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env: {
          ...process.env,
          DATABASE_URL: `postgresql://postgres.${THIRD_REF}@db.${THIRD_REF}.supabase.co:5432/postgres`,
          NEXT_PUBLIC_SUPABASE_URL: `https://${THIRD_REF}.supabase.co`,
        },
      },
    );
    expect(result.status).not.toBe(0);
    expect(`${result.stderr}${result.stdout}`).toContain("allowlist");
  });
});

describe("pilot package counts", () => {
  it("has expected full Pilot source counts", () => {
    const pkg = loadPilotWritePackage("data/pilot/entry");
    const check = verifyPilotPackageCounts(pkg);
    expect(check.ok).toBe(true);
    expect(PILOT_EXPECTED_COUNTS.entries).toBe(32);
    expect(PILOT_EXPECTED_COUNTS.senses).toBe(50);
    expect(PILOT_EXPECTED_COUNTS.sense_translations).toBe(150);
    expect(PILOT_EXPECTED_COUNTS.entry_aliases).toBe(1);
    expect(PILOT_EXPECTED_COUNTS.examples).toBe(48);
    expect(PILOT_EXPECTED_COUNTS.example_translations).toBe(144);
    expect(PILOT_EXPECTED_COUNTS.entry_examples).toBe(61);
  });
});

describe("dry-run path remains database-free", () => {
  it("loadImportEnvironment does not require DATABASE_URL for validation-only workflows", () => {
    const env = loadImportEnvironment(process.cwd(), {});
    expect(env.databaseUrl).toBeUndefined();
  });

  it("createPgPool refuses connection unless connect=true", () => {
    expect(() =>
      createPgPool({ connectionString: "postgresql://x", connect: false }),
    ).toThrow();
  });
});
