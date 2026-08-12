import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import path from "node:path";

import {
  ALLOWED_DEV_PROJECT_REFS,
  BLOCKED_PRODUCTION_PROJECT_REFS,
  DOCUMENTED_DEV_PROJECT_REF,
  DOCUMENTED_PRODUCTION_PROJECT_REF,
  PILOT_EXPECTED_COUNTS,
} from "./import-config";
import { loadImportEnvironment } from "./import-env";
import { loadPilotWritePackage } from "./import-package";
import { validateProjectRefTarget } from "./import-project-ref";
import { createMockDbClient, createPgPool } from "./import-db";
import {
  parsePromoteArgs,
  resolveDbConnectionMode,
  validatePromoteGuards,
} from "./promote-args";
import {
  PROMOTE_TRANSITIONS,
  PROMOTE_UPDATE_ORDER,
  parsePromoteTargetStatus,
  resolvePromoteTransition,
} from "./promote-config";
import {
  executePromotePilot,
  formatPromoteExecuteResult,
  formatWriteConfirmation,
} from "./promote-execute";
import {
  buildPromotePreflightInput,
  detectPromoteIssues,
  loadPromoteDbState,
  PROMOTE_PREFLIGHT_READONLY_SQL,
  PromoteTransactionError,
  runPromotePreflight,
  type PromoteDbState,
} from "./promote-preflight";
import { collectPilotImportKeys } from "./import-preflight";
import { getPackageRows } from "./import-package";
import type { ContentPackage } from "./import-package";

const DEV_REF = DOCUMENTED_DEV_PROJECT_REF;
const PROD_REF = DOCUMENTED_PRODUCTION_PROJECT_REF;
const THIRD_REF = "abcdefghijklmnopqr";
const ENV_ISOLATED_CWD = path.join(process.cwd(), "data/fixtures/valid/minimal");

function envWithoutDatabaseCredentials(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  delete env.DATABASE_URL;
  delete env.PRODUCTION_DATABASE_URL;
  delete env.NEXT_PUBLIC_SUPABASE_URL;
  return env;
}

function promoteScriptArgs(extraArgs: string[]): string[] {
  return [
    path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs"),
    path.join(process.cwd(), "scripts/content/promote-cli.ts"),
    ...extraArgs,
  ];
}

function minimalPilotPackage(): ContentPackage {
  return {
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
              import_key: "sense-hakgyo-01",
              entry_import_key: "entry-hakgyo",
              sense_order: "1",
              is_primary: "true",
              status: "draft",
            },
          ],
        },
      ],
      [
        "sense_translations.csv",
        {
          rows: [
            {
              import_key: "st-sense-hakgyo-01-en",
              sense_import_key: "sense-hakgyo-01",
              locale: "en",
              short_definition: "school",
              status: "draft",
            },
            {
              import_key: "st-sense-hakgyo-01-zh",
              sense_import_key: "sense-hakgyo-01",
              locale: "zh",
              short_definition: "学校",
              status: "draft",
            },
            {
              import_key: "st-sense-hakgyo-01-ja",
              sense_import_key: "sense-hakgyo-01",
              locale: "ja",
              short_definition: "学校",
              status: "draft",
            },
          ],
        },
      ],
      ["entry_aliases.csv", { rows: [] }],
      [
        "examples.csv",
        {
          rows: [
            {
              import_key: "v2-ex-001",
              korean_text: "그 학생은 학교에서 한국어를 배워요.",
              korean_text_normalized: "그 학생은 학교에서 한국어를 배워요.",
              provenance_type: "original",
              status: "draft",
            },
          ],
        },
      ],
      [
        "example_translations.csv",
        {
          rows: [
            {
              import_key: "et-v2-ex-001-en",
              example_import_key: "v2-ex-001",
              locale: "en",
              translation: "That student is learning Korean at school.",
              status: "draft",
            },
            {
              import_key: "et-v2-ex-001-zh",
              example_import_key: "v2-ex-001",
              locale: "zh",
              translation: "那个学生在学校学韩语。",
              status: "draft",
            },
            {
              import_key: "et-v2-ex-001-ja",
              example_import_key: "v2-ex-001",
              locale: "ja",
              translation: "その学生は学校で韓国語を学んでいます。",
              status: "draft",
            },
          ],
        },
      ],
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
}

function buildMockDbState(status: string): PromoteDbState {
  return {
    entries: [
      {
        id: "e1",
        import_key: "entry-hakgyo",
        headword: "학교",
        headword_normalized: "학교",
        status,
      },
    ],
    senses: [
      {
        id: "s1",
        import_key: "sense-hakgyo-01",
        entry_id: "e1",
        is_primary: true,
        status,
      },
    ],
    sense_translations: [
      {
        id: "st1",
        import_key: "st-sense-hakgyo-01-en",
        sense_id: "s1",
        locale: "en",
        short_definition: "school",
        definition: "school definition",
        status,
      },
      {
        id: "st2",
        import_key: "st-sense-hakgyo-01-zh",
        sense_id: "s1",
        locale: "zh",
        short_definition: "学校",
        definition: null,
        status,
      },
      {
        id: "st3",
        import_key: "st-sense-hakgyo-01-ja",
        sense_id: "s1",
        locale: "ja",
        short_definition: "学校",
        definition: null,
        status,
      },
    ],
    entry_aliases: [],
    examples: [
      {
        id: "x1",
        import_key: "v2-ex-001",
        korean_text: "그 학생은 학교에서 한국어를 배워요.",
        provenance_type: "original",
        source_note: null,
        license_note: null,
        status,
      },
    ],
    example_translations: [
      {
        id: "et1",
        import_key: "et-v2-ex-001-en",
        example_id: "x1",
        locale: "en",
        translation: "That student is learning Korean at school.",
        status,
      },
      {
        id: "et2",
        import_key: "et-v2-ex-001-zh",
        example_id: "x1",
        locale: "zh",
        translation: "那个学生在学校学韩语。",
        status,
      },
      {
        id: "et3",
        import_key: "et-v2-ex-001-ja",
        example_id: "x1",
        locale: "ja",
        translation: "その学生は学校で韓国語を学んでいます。",
        status,
      },
    ],
    entry_examples: [
      {
        entry_import_key: "entry-hakgyo",
        example_import_key: "v2-ex-001",
        sense_import_key: "sense-hakgyo-01",
      },
    ],
  };
}

function mockPromoteQueryHandler(state: PromoteDbState, options?: { failPublishGuard?: boolean }) {
  const countRows = (
    rows: Array<{ import_key: string; status: string }>,
    keys: string[],
    status: string,
  ) => {
    const count = rows.filter(
      (row) => keys.includes(row.import_key) && row.status === status,
    ).length;
    return { rows: [{ count: String(count) }], rowCount: 1 };
  };

  return async (sql: string, params?: unknown[]) => {
    const normalized = sql.trim().toUpperCase();

    if (normalized.startsWith("SELECT") && sql.includes("count(*)")) {
      const keys = (params?.[0] as string[]) ?? [];
      const status = params?.[1] as string;
      if (sql.includes("public.entries")) return countRows(state.entries, keys, status);
      if (sql.includes("public.senses")) return countRows(state.senses, keys, status);
      if (sql.includes("public.sense_translations")) {
        return countRows(state.sense_translations, keys, status);
      }
      if (sql.includes("public.entry_aliases")) {
        return countRows(state.entry_aliases, keys, status);
      }
      if (sql.includes("public.examples")) return countRows(state.examples, keys, status);
      if (sql.includes("public.example_translations")) {
        return countRows(state.example_translations, keys, status);
      }
    }

    if (normalized.startsWith("SELECT") && sql.includes("FROM public.entries")) {
      return { rows: state.entries, rowCount: state.entries.length };
    }
    if (normalized.startsWith("SELECT") && sql.includes("FROM public.senses")) {
      return { rows: state.senses, rowCount: state.senses.length };
    }
    if (normalized.startsWith("SELECT") && sql.includes("FROM public.sense_translations")) {
      return { rows: state.sense_translations, rowCount: state.sense_translations.length };
    }
    if (normalized.startsWith("SELECT") && sql.includes("FROM public.entry_aliases")) {
      return { rows: state.entry_aliases, rowCount: state.entry_aliases.length };
    }
    if (normalized.startsWith("SELECT") && sql.includes("FROM public.examples")) {
      return { rows: state.examples, rowCount: state.examples.length };
    }
    if (normalized.startsWith("SELECT") && sql.includes("FROM public.example_translations")) {
      return {
        rows: state.example_translations,
        rowCount: state.example_translations.length,
      };
    }
    if (normalized.startsWith("SELECT") && sql.includes("FROM public.entry_examples")) {
      return { rows: state.entry_examples, rowCount: state.entry_examples.length };
    }

    if (normalized.startsWith("UPDATE")) {
      if (options?.failPublishGuard && sql.includes("public.entries")) {
        throw new Error("entry requires a published primary sense");
      }

      const targetStatus = params?.[0] as string;
      const keys = params?.[1] as string[];
      const sourceStatus = params?.[2] as string;

      const updateRows = (
        rows: Array<{ import_key: string; status: string }>,
      ): number => {
        let affected = 0;
        for (const row of rows) {
          if (keys.includes(row.import_key) && row.status === sourceStatus) {
            row.status = targetStatus;
            affected++;
          }
        }
        return affected;
      };

      let affected = 0;
      if (sql.includes("public.sense_translations")) {
        affected = updateRows(state.sense_translations);
      } else if (sql.includes("public.senses")) {
        affected = updateRows(state.senses);
      } else if (sql.includes("public.entries")) {
        affected = updateRows(state.entries);
      } else if (sql.includes("public.example_translations")) {
        affected = updateRows(state.example_translations);
      } else if (sql.includes("public.examples")) {
        affected = updateRows(state.examples);
      } else if (sql.includes("public.entry_aliases")) {
        affected = updateRows(state.entry_aliases);
      }

      return { rows: [], rowCount: affected };
    }

    return { rows: [], rowCount: 0 };
  };
}

describe("promote CLI guards", () => {
  it("accepts --preflight-only", () => {
    const options = parsePromoteArgs([
      "node",
      "promote-cli.ts",
      "--dir",
      "data/pilot/entry",
      "--target-status",
      "in_review",
      "--preflight-only",
      "--confirm-dev",
      "--project-ref",
      DEV_REF,
    ]);
    expect(resolveDbConnectionMode(options)).toBe("preflight");
    const result = validatePromoteGuards(options, {
      databaseUrl: `postgresql://postgres.${DEV_REF}@db.${DEV_REF}.supabase.co:5432/postgres`,
    });
    expect(result.ok).toBe(true);
  });

  it("accepts --execute", () => {
    const options = parsePromoteArgs([
      "node",
      "promote-cli.ts",
      "--dir",
      "data/pilot/entry",
      "--target-status",
      "in_review",
      "--execute",
      "--confirm-dev",
      "--project-ref",
      DEV_REF,
    ]);
    expect(resolveDbConnectionMode(options)).toBe("execute");
  });

  it("rejects both --preflight-only and --execute", () => {
    const options = parsePromoteArgs([
      "node",
      "promote-cli.ts",
      "--target-status",
      "in_review",
      "--preflight-only",
      "--execute",
      "--confirm-dev",
      "--project-ref",
      DEV_REF,
    ]);
    const result = validatePromoteGuards(options, {
      databaseUrl: `postgresql://postgres.${DEV_REF}@db.${DEV_REF}.supabase.co:5432/postgres`,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("Cannot combine");
  });

  it("rejects neither mode", () => {
    const options = parsePromoteArgs([
      "node",
      "promote-cli.ts",
      "--target-status",
      "in_review",
      "--confirm-dev",
      "--project-ref",
      DEV_REF,
    ]);
    const result = validatePromoteGuards(options, {
      databaseUrl: `postgresql://postgres.${DEV_REF}@db.${DEV_REF}.supabase.co:5432/postgres`,
    });
    expect(result.ok).toBe(false);
  });

  it("requires --confirm-dev", () => {
    const options = parsePromoteArgs([
      "node",
      "promote-cli.ts",
      "--target-status",
      "in_review",
      "--execute",
      "--project-ref",
      DEV_REF,
    ]);
    const result = validatePromoteGuards(options, {
      databaseUrl: `postgresql://postgres.${DEV_REF}@db.${DEV_REF}.supabase.co:5432/postgres`,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("--confirm-dev");
  });

  it("requires --project-ref", () => {
    const options = parsePromoteArgs([
      "node",
      "promote-cli.ts",
      "--target-status",
      "in_review",
      "--execute",
      "--confirm-dev",
    ]);
    const result = validatePromoteGuards(options, {
      databaseUrl: `postgresql://postgres.${DEV_REF}@db.${DEV_REF}.supabase.co:5432/postgres`,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("--project-ref");
  });

  it("requires DATABASE_URL", () => {
    const options = parsePromoteArgs([
      "node",
      "promote-cli.ts",
      "--target-status",
      "in_review",
      "--execute",
      "--confirm-dev",
      "--project-ref",
      DEV_REF,
    ]);
    const result = validatePromoteGuards(options, {});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("DATABASE_URL");
  });

  it("rejects Production project ref", () => {
    expect(BLOCKED_PRODUCTION_PROJECT_REFS.has(PROD_REF)).toBe(true);
    const databaseUrl = `postgresql://postgres.${PROD_REF}@db.${PROD_REF}.supabase.co:5432/postgres`;
    const result = validateProjectRefTarget({
      databaseUrl,
      expectedProjectRef: PROD_REF,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects random third project ref", () => {
    expect(ALLOWED_DEV_PROJECT_REFS.has(THIRD_REF)).toBe(false);
    const databaseUrl = `postgresql://postgres.${THIRD_REF}@db.${THIRD_REF}.supabase.co:5432/postgres`;
    const result = validateProjectRefTarget({
      databaseUrl,
      expectedProjectRef: THIRD_REF,
    });
    expect(result.ok).toBe(false);
  });
});

describe("promote Production guards (pre-connection)", () => {
  const prodUrl = `postgresql://postgres.${PROD_REF}@db.${PROD_REF}.supabase.co:5432/postgres`;
  const devUrl = `postgresql://postgres.${DEV_REF}@db.${DEV_REF}.supabase.co:5432/postgres`;

  it("accepts Production preflight with Production confirmation", () => {
    const options = parsePromoteArgs([
      "node",
      "promote-cli.ts",
      "--dir",
      "data/pilot/entry",
      "--target-status",
      "in_review",
      "--preflight-only",
      "--confirm-production",
      "--project-ref",
      PROD_REF,
    ]);
    const result = validatePromoteGuards(options, { productionDatabaseUrl: prodUrl });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.target).toBe("production");
      expect(result.connectionString).toBe(prodUrl);
    }
  });

  it("Production preflight without Production confirmation is rejected", () => {
    const options = parsePromoteArgs([
      "node",
      "promote-cli.ts",
      "--target-status",
      "in_review",
      "--preflight-only",
      "--project-ref",
      PROD_REF,
    ]);
    const result = validatePromoteGuards(options, { productionDatabaseUrl: prodUrl });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("--confirm-production");
  });

  it("Production execute without Production confirmation is rejected", () => {
    const options = parsePromoteArgs([
      "node",
      "promote-cli.ts",
      "--target-status",
      "in_review",
      "--execute",
      "--project-ref",
      PROD_REF,
    ]);
    const result = validatePromoteGuards(options, { productionDatabaseUrl: prodUrl });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("--confirm-production");
  });

  it("--confirm-dev does not authorize Production promotion", () => {
    const options = parsePromoteArgs([
      "node",
      "promote-cli.ts",
      "--target-status",
      "in_review",
      "--execute",
      "--confirm-dev",
      "--project-ref",
      PROD_REF,
    ]);
    const guard = validatePromoteGuards(options, {
      databaseUrl: prodUrl,
      productionDatabaseUrl: prodUrl,
    });
    expect(guard.ok).toBe(true);
    if (!guard.ok) return;
    expect(guard.target).toBe("dev");
    const identity = validateProjectRefTarget({
      databaseUrl: guard.connectionString,
      expectedProjectRef: PROD_REF,
      target: guard.target,
    });
    expect(identity.ok).toBe(false);
  });

  it("Production publish execute without --confirm-publish is rejected", () => {
    const options = parsePromoteArgs([
      "node",
      "promote-cli.ts",
      "--target-status",
      "published",
      "--execute",
      "--confirm-production",
      "--project-ref",
      PROD_REF,
    ]);
    const result = validatePromoteGuards(options, { productionDatabaseUrl: prodUrl });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("--confirm-publish");
  });

  it("Production publish execute requires Production confirmation, project ref, and --confirm-publish", () => {
    const options = parsePromoteArgs([
      "node",
      "promote-cli.ts",
      "--target-status",
      "published",
      "--execute",
      "--confirm-production",
      "--confirm-publish",
      "--project-ref",
      PROD_REF,
    ]);
    const result = validatePromoteGuards(options, {
      databaseUrl: devUrl,
      productionDatabaseUrl: prodUrl,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.target).toBe("production");
      expect(result.connectionString).toBe(prodUrl);
    }
  });

  it("missing PRODUCTION_DATABASE_URL is rejected even when DATABASE_URL is set", () => {
    const options = parsePromoteArgs([
      "node",
      "promote-cli.ts",
      "--target-status",
      "in_review",
      "--preflight-only",
      "--confirm-production",
      "--project-ref",
      PROD_REF,
    ]);
    const result = validatePromoteGuards(options, { databaseUrl: prodUrl });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("PRODUCTION_DATABASE_URL");
  });
});

describe("promote transition rules", () => {
  it("allows draft -> in_review", () => {
    expect(PROMOTE_TRANSITIONS.in_review).toEqual({
      targetStatus: "in_review",
      sourceStatus: "draft",
      label: "draft -> in_review",
    });
  });

  it("allows in_review -> published", () => {
    expect(PROMOTE_TRANSITIONS.published).toEqual({
      targetStatus: "published",
      sourceStatus: "in_review",
      label: "in_review -> published",
    });
  });

  it("blocks draft -> published via status mismatch", () => {
    const pkg = minimalPilotPackage();
    const input = buildPromotePreflightInput(pkg, "published", buildMockDbState("draft"));
    const issues = detectPromoteIssues(input);
    expect(issues.some((i) => i.kind === "status_mismatch")).toBe(true);
  });

  it("blocks published -> anything via status mismatch", () => {
    const pkg = minimalPilotPackage();
    const input = buildPromotePreflightInput(pkg, "in_review", buildMockDbState("published"));
    const issues = detectPromoteIssues(input);
    expect(issues.some((i) => i.kind === "status_mismatch")).toBe(true);
  });

  it("blocks unexpected current status", () => {
    const pkg = minimalPilotPackage();
    const db = buildMockDbState("draft");
    db.entries[0]!.status = "archived";
    const input = buildPromotePreflightInput(pkg, "in_review", db);
    const issues = detectPromoteIssues(input);
    expect(
      issues.some(
        (i) => i.kind === "status_mismatch" && i.message.includes("entry-hakgyo"),
      ),
    ).toBe(true);
  });

  it("rejects invalid target status values", () => {
    expect(parsePromoteTargetStatus("draft")).toBeNull();
    expect(parsePromoteTargetStatus("archived")).toBeNull();
    expect(parsePromoteTargetStatus(undefined)).toBeNull();
  });
});

describe("promote Pilot scope", () => {
  it("targets exact Pilot import keys from CSV", () => {
    const pkg = loadPilotWritePackage("data/pilot/entry");
    const keys = collectPilotImportKeys(pkg);
    expect(keys.entries.size).toBe(PILOT_EXPECTED_COUNTS.entries);
    expect(keys.senses.size).toBe(PILOT_EXPECTED_COUNTS.senses);
    expect(keys.sense_translations.size).toBe(PILOT_EXPECTED_COUNTS.sense_translations);
    expect(keys.entry_aliases.size).toBe(PILOT_EXPECTED_COUNTS.entry_aliases);
    expect(keys.examples.size).toBe(PILOT_EXPECTED_COUNTS.examples);
    expect(keys.example_translations.size).toBe(PILOT_EXPECTED_COUNTS.example_translations);
  });

  it("blocks missing Pilot keys", () => {
    const pkg = minimalPilotPackage();
    const db = buildMockDbState("draft");
    db.entries = [];
    const issues = detectPromoteIssues(buildPromotePreflightInput(pkg, "in_review", db));
    expect(issues.some((i) => i.kind === "missing_key")).toBe(true);
  });

  it("blocks extra unexpected Pilot keys in database", () => {
    const pkg = minimalPilotPackage();
    const db = buildMockDbState("draft");
    db.entries.push({ id: "e2", import_key: "entry-extra", status: "draft" });
    const issues = detectPromoteIssues(buildPromotePreflightInput(pkg, "in_review", db));
    expect(issues.some((i) => i.message.includes("entry-extra"))).toBe(true);
  });

  it("never updates entry_examples", async () => {
    const state = buildMockDbState("draft");
    const updateSql: string[] = [];
    const db = createMockDbClient({
      query: async (sql, params) => {
        if (/^\s*UPDATE/i.test(sql)) updateSql.push(sql);
        return mockPromoteQueryHandler(state)(sql, params);
      },
    });

    const pkg = minimalPilotPackage();
    const result = await executePromotePilot(db, pkg, "in_review", DEV_REF);
    expect(result.summary).toBeDefined();
    expect(updateSql.every((sql) => !sql.includes("entry_examples"))).toBe(true);
  });
});

describe("promote preflight read-only behavior", () => {
  it("preflight-only performs SELECT only", () => {
    for (const sql of PROMOTE_PREFLIGHT_READONLY_SQL) {
      expect(sql.trim().toUpperCase()).toMatch(/^SELECT/);
      expect(sql.toUpperCase()).not.toMatch(/\b(INSERT|UPDATE|DELETE|BEGIN|COMMIT|ROLLBACK)\b/);
    }
  });

  it("preflight-only never opens transaction", async () => {
    let beginCount = 0;
    let updateSeen = false;
    const state = buildMockDbState("draft");

    const db = createMockDbClient({
      onBegin: () => {
        beginCount++;
      },
      query: async (sql, params) => {
        if (/^\s*UPDATE/i.test(sql)) updateSeen = true;
        return mockPromoteQueryHandler(state)(sql, params);
      },
    });

    const pkg = minimalPilotPackage();
    const result = await runPromotePreflight(db, pkg, "in_review", DEV_REF);
    expect(result.ok).toBe(true);
    expect(beginCount).toBe(0);
    expect(updateSeen).toBe(false);
    expect(result.report).toContain("PREFLIGHT PASSED");
    expect(result.report).toContain("draft -> in_review");
  });

  it("preflight failure performs no writes", async () => {
    let updateSeen = false;
    const state = buildMockDbState("in_review");

    const db = createMockDbClient({
      query: async (sql, params) => {
        if (/^\s*UPDATE/i.test(sql)) updateSeen = true;
        return mockPromoteQueryHandler(state)(sql, params);
      },
    });

    const pkg = minimalPilotPackage();
    const result = await runPromotePreflight(db, pkg, "in_review", DEV_REF);
    expect(result.ok).toBe(false);
    expect(updateSeen).toBe(false);
    expect(result.report).toContain("PREFLIGHT BLOCKED");
  });
});

describe("promote transaction execution", () => {
  it("execute repeats critical checks inside transaction", async () => {
    let selectInsideTx = 0;
    const state = buildMockDbState("draft");

    const db = createMockDbClient({
      onBegin: () => {
        /* tx started */
      },
      query: async (sql, params) => {
        if (/^\s*SELECT/i.test(sql)) selectInsideTx++;
        return mockPromoteQueryHandler(state)(sql, params);
      },
    });

    const pkg = minimalPilotPackage();
    const result = await executePromotePilot(db, pkg, "in_review", DEV_REF);
    expect(result.summary).toBeDefined();
    expect(selectInsideTx).toBeGreaterThan(1);
  });

  it("affected-row mismatch rolls back", async () => {
    const state = buildMockDbState("draft");
    let rollbackCount = 0;

    const db = createMockDbClient({
      onRollback: () => {
        rollbackCount++;
      },
      query: async (sql, params) => {
        if (sql.includes("UPDATE public.senses")) {
          return { rows: [], rowCount: 0 };
        }
        return mockPromoteQueryHandler(state)(sql, params);
      },
    });

    const pkg = minimalPilotPackage();
    await expect(executePromotePilot(db, pkg, "in_review", DEV_REF)).rejects.toThrow(
      PromoteTransactionError,
    );
    expect(rollbackCount).toBe(1);
  });

  it("query/update failure rolls back", async () => {
    let rollbackCount = 0;
    const state = buildMockDbState("draft");

    const db = createMockDbClient({
      onRollback: () => {
        rollbackCount++;
      },
      query: async (sql, params) => {
        if (sql.includes("UPDATE public.entries")) {
          throw new Error("simulated DB failure");
        }
        return mockPromoteQueryHandler(state)(sql, params);
      },
    });

    const pkg = minimalPilotPackage();
    await expect(executePromotePilot(db, pkg, "in_review", DEV_REF)).rejects.toThrow(
      "simulated DB failure",
    );
    expect(rollbackCount).toBe(1);
  });

  it("successful transition commits once", async () => {
    let commitCount = 0;
    const state = buildMockDbState("draft");

    const db = createMockDbClient({
      onCommit: () => {
        commitCount++;
      },
      query: mockPromoteQueryHandler(state),
    });

    const pkg = minimalPilotPackage();
    const result = await executePromotePilot(db, pkg, "in_review", DEV_REF);
    expect(result.summary?.targetStatus).toBe("in_review");
    expect(commitCount).toBe(1);
    expect(formatPromoteExecuteResult(result)).toContain("PROMOTION COMMITTED");
  });
});

describe("promote publish order", () => {
  it("updates sense_translations before senses before entries", async () => {
    const state = buildMockDbState("in_review");
    const updateOrder: string[] = [];

    const db = createMockDbClient({
      query: async (sql, params) => {
        if (/^\s*UPDATE/i.test(sql)) {
          if (sql.includes("sense_translations")) updateOrder.push("sense_translations");
          if (sql.includes("public.senses")) updateOrder.push("senses");
          if (sql.includes("public.entries")) updateOrder.push("entries");
          if (sql.includes("example_translations")) updateOrder.push("example_translations");
          if (sql.includes("public.examples")) updateOrder.push("examples");
          if (sql.includes("entry_aliases")) updateOrder.push("entry_aliases");
        }
        return mockPromoteQueryHandler(state)(sql, params);
      },
    });

    const pkg = minimalPilotPackage();
    await executePromotePilot(db, pkg, "published", DEV_REF);

    expect(updateOrder.indexOf("sense_translations")).toBeLessThan(updateOrder.indexOf("senses"));
    expect(updateOrder.indexOf("senses")).toBeLessThan(updateOrder.indexOf("entries"));
    expect(updateOrder.indexOf("example_translations")).toBeLessThan(
      updateOrder.indexOf("examples"),
    );
    expect(PROMOTE_UPDATE_ORDER).toEqual([
      "sense_translations",
      "senses",
      "entries",
      "example_translations",
      "examples",
      "entry_aliases",
    ]);
  });

  it("propagates DB guard errors and rolls back", async () => {
    let rollbackCount = 0;
    const state = buildMockDbState("in_review");

    const db = createMockDbClient({
      onRollback: () => {
        rollbackCount++;
      },
      query: mockPromoteQueryHandler(state, { failPublishGuard: true }),
    });

    const pkg = minimalPilotPackage();
    await expect(executePromotePilot(db, pkg, "published", DEV_REF)).rejects.toThrow(
      "published primary sense",
    );
    expect(rollbackCount).toBe(1);
  });
});

describe("promote sequential pg usage", () => {
  it("loadPromoteDbState awaits queries sequentially", async () => {
    const order: string[] = [];
    const pkg = minimalPilotPackage();
    const keys = collectPilotImportKeys(pkg);

    const db = createMockDbClient({
      query: async (sql) => {
        if (sql.includes("FROM public.entries")) order.push("entries");
        if (sql.includes("FROM public.senses")) order.push("senses");
        if (sql.includes("FROM public.sense_translations")) order.push("sense_translations");
        if (sql.includes("FROM public.entry_aliases")) order.push("entry_aliases");
        if (sql.includes("FROM public.examples")) order.push("examples");
        if (sql.includes("FROM public.example_translations")) order.push("example_translations");
        if (sql.includes("FROM public.entry_examples")) order.push("entry_examples");
        return { rows: [], rowCount: 0 };
      },
    });

    await loadPromoteDbState(db, keys);
    expect(order).toEqual([
      "entries",
      "senses",
      "sense_translations",
      "entry_aliases",
      "examples",
      "example_translations",
      "entry_examples",
    ]);
  });

  it("does not use Promise.all on same pg client in loadPromoteDbState", () => {
    const source = loadPromoteDbState.toString();
    expect(source).not.toContain("Promise.all");
  });
});

describe("promote environment isolation", () => {
  it("tests cannot inherit real DATABASE_URL accidentally from isolated cwd", () => {
    const env = loadImportEnvironment(ENV_ISOLATED_CWD, {});
    expect(env.databaseUrl).toBeUndefined();
    expect(env.productionDatabaseUrl).toBeUndefined();
  });

  it("createPgPool without connect=true throws (no real connection in tests)", () => {
    expect(() =>
      createPgPool({ connectionString: "postgresql://x", connect: false }),
    ).toThrow("connect=true");
  });
});

describe("promote-cli safety (no credentials)", () => {
  it("exits without DATABASE_URL for preflight-only", () => {
    const result = spawnSync(
      process.execPath,
      promoteScriptArgs([
        "--dir",
        path.join(process.cwd(), "data/pilot/entry"),
        "--target-status",
        "in_review",
        "--preflight-only",
        "--confirm-dev",
        "--project-ref",
        DEV_REF,
      ]),
      {
        cwd: ENV_ISOLATED_CWD,
        env: envWithoutDatabaseCredentials(),
        encoding: "utf8",
      },
    );
    expect(result.status).not.toBe(0);
    expect(`${result.stderr}${result.stdout}`).toContain("DATABASE_URL");
  });

  it("exits without DATABASE_URL for execute", () => {
    const result = spawnSync(
      process.execPath,
      promoteScriptArgs([
        "--dir",
        path.join(process.cwd(), "data/pilot/entry"),
        "--target-status",
        "in_review",
        "--execute",
        "--confirm-dev",
        "--project-ref",
        DEV_REF,
      ]),
      {
        cwd: ENV_ISOLATED_CWD,
        env: envWithoutDatabaseCredentials(),
        encoding: "utf8",
      },
    );
    expect(result.status).not.toBe(0);
    expect(`${result.stderr}${result.stdout}`).toContain("DATABASE_URL");
  });

  it("rejects missing --target-status", () => {
    const result = spawnSync(
      process.execPath,
      promoteScriptArgs([
        "--dir",
        path.join(process.cwd(), "data/pilot/entry"),
        "--preflight-only",
        "--confirm-dev",
        "--project-ref",
        DEV_REF,
      ]),
      {
        cwd: ENV_ISOLATED_CWD,
        env: envWithoutDatabaseCredentials(),
        encoding: "utf8",
      },
    );
    expect(result.status).not.toBe(0);
    expect(`${result.stderr}${result.stdout}`).toMatch(/target-status/i);
  });

  it("rejects Production project ref", () => {
    const databaseUrl = `postgresql://postgres.${PROD_REF}@db.${PROD_REF}.supabase.co:5432/postgres`;
    const result = spawnSync(
      process.execPath,
      promoteScriptArgs([
        "--dir",
        path.join(process.cwd(), "data/pilot/entry"),
        "--target-status",
        "in_review",
        "--preflight-only",
        "--confirm-dev",
        "--project-ref",
        PROD_REF,
      ]),
      {
        cwd: ENV_ISOLATED_CWD,
        env: { ...envWithoutDatabaseCredentials(), DATABASE_URL: databaseUrl },
        encoding: "utf8",
      },
    );
    expect(result.status).not.toBe(0);
    expect(`${result.stderr}${result.stdout}`).toMatch(/Production|allowlist/i);
  });

  it("Production preflight without --confirm-production fails before DB", () => {
    const result = spawnSync(
      process.execPath,
      promoteScriptArgs([
        "--dir",
        path.join(process.cwd(), "data/pilot/entry"),
        "--target-status",
        "in_review",
        "--preflight-only",
        "--project-ref",
        PROD_REF,
      ]),
      {
        cwd: ENV_ISOLATED_CWD,
        env: {
          ...envWithoutDatabaseCredentials(),
          PRODUCTION_DATABASE_URL: `postgresql://postgres.${PROD_REF}@db.${PROD_REF}.supabase.co:5432/postgres`,
        },
        encoding: "utf8",
      },
    );
    expect(result.status).not.toBe(0);
    const output = `${result.stderr}${result.stdout}`;
    expect(output).toContain("--confirm-production");
    expect(output).not.toContain("WRITE CONFIRMATION");
  });

  it("Production promotion with --confirm-dev only fails before DB", () => {
    const result = spawnSync(
      process.execPath,
      promoteScriptArgs([
        "--dir",
        path.join(process.cwd(), "data/pilot/entry"),
        "--target-status",
        "in_review",
        "--execute",
        "--confirm-dev",
        "--project-ref",
        PROD_REF,
      ]),
      {
        cwd: ENV_ISOLATED_CWD,
        env: {
          ...envWithoutDatabaseCredentials(),
          DATABASE_URL: `postgresql://postgres.${PROD_REF}@db.${PROD_REF}.supabase.co:5432/postgres`,
          PRODUCTION_DATABASE_URL: `postgresql://postgres.${PROD_REF}@db.${PROD_REF}.supabase.co:5432/postgres`,
        },
        encoding: "utf8",
      },
    );
    expect(result.status).not.toBe(0);
    const output = `${result.stderr}${result.stdout}`;
    expect(output).toMatch(/Production|blocked/i);
    expect(output).not.toContain("WRITE CONFIRMATION");
  });

  it("Production publish execute without --confirm-publish fails before DB", () => {
    const result = spawnSync(
      process.execPath,
      promoteScriptArgs([
        "--dir",
        path.join(process.cwd(), "data/pilot/entry"),
        "--target-status",
        "published",
        "--execute",
        "--confirm-production",
        "--project-ref",
        PROD_REF,
      ]),
      {
        cwd: ENV_ISOLATED_CWD,
        env: {
          ...envWithoutDatabaseCredentials(),
          PRODUCTION_DATABASE_URL: `postgresql://postgres.${PROD_REF}@db.${PROD_REF}.supabase.co:5432/postgres`,
        },
        encoding: "utf8",
      },
    );
    expect(result.status).not.toBe(0);
    const output = `${result.stderr}${result.stdout}`;
    expect(output).toContain("--confirm-publish");
    expect(output).not.toContain("WRITE CONFIRMATION");
  });
});

describe("promote transition labels", () => {
  it("shows in_review -> published in preflight report", async () => {
    const state = buildMockDbState("in_review");
    const db = createMockDbClient({ query: mockPromoteQueryHandler(state) });
    const pkg = minimalPilotPackage();
    const result = await runPromotePreflight(db, pkg, "published", DEV_REF);
    expect(result.report).toContain("in_review -> published");
  });

  it("resolvePromoteTransition returns expected source for published target", () => {
    expect(resolvePromoteTransition("published").sourceStatus).toBe("in_review");
  });
});

function buildPilotMockDbStateFromPackage(
  pkg: ContentPackage,
  status: string,
): PromoteDbState {
  const entryIdByKey = new Map<string, string>();
  const senseIdByKey = new Map<string, string>();
  const exampleIdByKey = new Map<string, string>();

  const entries = getPackageRows(pkg, "entries.csv").map((row, index) => {
    const importKey = row.import_key!.trim();
    const id = `entry-id-${index}`;
    entryIdByKey.set(importKey, id);
    return {
      id,
      import_key: importKey,
      headword: row.headword?.trim() || "placeholder",
      headword_normalized: row.headword_normalized?.trim() || row.headword?.trim() || "placeholder",
      status,
    };
  });

  const senses = getPackageRows(pkg, "senses.csv").map((row, index) => {
    const importKey = row.import_key!.trim();
    const entryKey = row.entry_import_key!.trim();
    const id = `sense-id-${index}`;
    senseIdByKey.set(importKey, id);
    return {
      id,
      import_key: importKey,
      entry_id: entryIdByKey.get(entryKey)!,
      is_primary: row.is_primary?.trim().toLowerCase() === "true",
      status,
    };
  });

  const sense_translations = getPackageRows(pkg, "sense_translations.csv").map((row, index) => {
    const senseKey = row.sense_import_key!.trim();
    return {
      id: `st-id-${index}`,
      import_key: row.import_key!.trim(),
      sense_id: senseIdByKey.get(senseKey)!,
      locale: row.locale!.trim(),
      short_definition: row.short_definition?.trim() || null,
      definition: row.definition?.trim() || null,
      status,
    };
  });

  const entry_aliases = getPackageRows(pkg, "entry_aliases.csv").map((row, index) => ({
    id: `alias-id-${index}`,
    import_key: row.import_key!.trim(),
    status,
  }));

  const examples = getPackageRows(pkg, "examples.csv").map((row, index) => {
    const importKey = row.import_key!.trim();
    const id = `example-id-${index}`;
    exampleIdByKey.set(importKey, id);
    return {
      id,
      import_key: importKey,
      korean_text: row.korean_text?.trim() || "example",
      provenance_type: row.provenance_type?.trim() || "original",
      source_note: row.source_note?.trim() || null,
      license_note: row.license_note?.trim() || null,
      status,
    };
  });

  const example_translations = getPackageRows(pkg, "example_translations.csv").map(
    (row, index) => {
      const exampleKey = row.example_import_key!.trim();
      return {
        id: `et-id-${index}`,
        import_key: row.import_key!.trim(),
        example_id: exampleIdByKey.get(exampleKey)!,
        locale: row.locale!.trim(),
        translation: row.translation?.trim() || "translation",
        status,
      };
    },
  );

  const entry_examples = getPackageRows(pkg, "entry_examples.csv").map((row) => ({
    entry_import_key: row.entry_import_key!.trim(),
    example_import_key: row.example_import_key!.trim(),
    sense_import_key: row.sense_import_key?.trim() || null,
  }));

  return {
    entries,
    senses,
    sense_translations,
    entry_aliases,
    examples,
    example_translations,
    entry_examples,
  };
}

describe("promote publish confirmation", () => {
  const devUrl = `postgresql://postgres.${DEV_REF}@db.${DEV_REF}.supabase.co:5432/postgres`;

  it("published + --execute requires --confirm-publish", () => {
    const options = parsePromoteArgs([
      "node",
      "promote-cli.ts",
      "--dir",
      "data/pilot/entry",
      "--target-status",
      "published",
      "--execute",
      "--confirm-dev",
      "--project-ref",
      DEV_REF,
    ]);
    const result = validatePromoteGuards(options, { databaseUrl: devUrl });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("--confirm-publish");
  });

  it("missing --confirm-publish fails before createPgPool (spawn)", () => {
    const databaseUrl = devUrl;
    const result = spawnSync(
      process.execPath,
      promoteScriptArgs([
        "--dir",
        path.join(process.cwd(), "data/pilot/entry"),
        "--target-status",
        "published",
        "--execute",
        "--confirm-dev",
        "--project-ref",
        DEV_REF,
      ]),
      {
        cwd: ENV_ISOLATED_CWD,
        env: { ...envWithoutDatabaseCredentials(), DATABASE_URL: databaseUrl },
        encoding: "utf8",
      },
    );
    expect(result.status).not.toBe(0);
    const output = `${result.stderr}${result.stdout}`;
    expect(output).toContain("--confirm-publish");
    expect(output).not.toContain("WRITE CONFIRMATION");
  });

  it("published + --preflight-only does NOT require --confirm-publish", () => {
    const options = parsePromoteArgs([
      "node",
      "promote-cli.ts",
      "--dir",
      "data/pilot/entry",
      "--target-status",
      "published",
      "--preflight-only",
      "--confirm-dev",
      "--project-ref",
      DEV_REF,
    ]);
    const result = validatePromoteGuards(options, { databaseUrl: devUrl });
    expect(result.ok).toBe(true);
  });

  it("in_review + --execute does NOT require --confirm-publish", () => {
    const options = parsePromoteArgs([
      "node",
      "promote-cli.ts",
      "--dir",
      "data/pilot/entry",
      "--target-status",
      "in_review",
      "--execute",
      "--confirm-dev",
      "--project-ref",
      DEV_REF,
    ]);
    const result = validatePromoteGuards(options, { databaseUrl: devUrl });
    expect(result.ok).toBe(true);
  });

  it("--confirm-publish alone does not bypass other guards", () => {
    const options = parsePromoteArgs([
      "node",
      "promote-cli.ts",
      "--dir",
      "data/pilot/entry",
      "--target-status",
      "published",
      "--execute",
      "--confirm-publish",
      "--project-ref",
      DEV_REF,
    ]);
    const result = validatePromoteGuards(options, { databaseUrl: devUrl });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("--confirm-dev");
  });

  it("formatWriteConfirmation shows explicit publish confirmation for published", () => {
    const output = formatWriteConfirmation({
      projectRef: DEV_REF,
      targetStatus: "published",
      confirmPublish: true,
    });
    expect(output).toContain("--- WRITE CONFIRMATION ---");
    expect(output).toContain("TARGET: DEV");
    expect(output).toContain(`Project ref: ${DEV_REF}`);
    expect(output).toContain("Operation: in_review→published");
    expect(output).toContain(`Pilot entries: ${PILOT_EXPECTED_COUNTS.entries}`);
    expect(output).toContain(`Pilot examples: ${PILOT_EXPECTED_COUNTS.examples}`);
    expect(output).toContain("Explicit Production confirmation: NO");
    expect(output).toContain("Explicit publish confirmation: YES");
    expect(output).not.toMatch(/DATABASE_URL|password|postgresql/i);
  });

  it("formatWriteConfirmation shows Production publish gates", () => {
    const output = formatWriteConfirmation({
      projectRef: PROD_REF,
      targetStatus: "published",
      confirmPublish: true,
      target: "production",
      confirmProduction: true,
    });
    expect(output).toContain("TARGET: PRODUCTION");
    expect(output).toContain(`Project ref: ${PROD_REF}`);
    expect(output).toContain("Operation: in_review→published");
    expect(output).toContain("Explicit Production confirmation: YES");
    expect(output).toContain("Explicit publish confirmation: YES");
    expect(output).not.toMatch(/DATABASE_URL|password|postgresql|service.role|publishable/i);
  });
});

describe("promote publish preflight checks", () => {
  it("entry empty headword blocks publish preflight", () => {
    const pkg = minimalPilotPackage();
    const db = buildMockDbState("in_review");
    db.entries[0]!.headword = "   ";
    const issues = detectPromoteIssues(buildPromotePreflightInput(pkg, "published", db));
    expect(issues.some((i) => i.kind === "publish_not_ready" && i.message.includes("headword"))).toBe(
      true,
    );
  });

  it("empty headword_normalized blocks publish preflight", () => {
    const pkg = minimalPilotPackage();
    const db = buildMockDbState("in_review");
    db.entries[0]!.headword_normalized = "";
    const issues = detectPromoteIssues(buildPromotePreflightInput(pkg, "published", db));
    expect(
      issues.some((i) => i.kind === "publish_not_ready" && i.message.includes("headword_normalized")),
    ).toBe(true);
  });

  it("missing DB is_primary blocks publish preflight", () => {
    const pkg = minimalPilotPackage();
    const db = buildMockDbState("in_review");
    db.senses[0]!.is_primary = false;
    const issues = detectPromoteIssues(buildPromotePreflightInput(pkg, "published", db));
    expect(
      issues.some((i) => i.kind === "publish_not_ready" && i.message.includes("no primary sense")),
    ).toBe(true);
  });

  it("incorrect DB is_primary vs CSV blocks publish preflight", () => {
    const pkg = minimalPilotPackage();
    const db = buildMockDbState("in_review");
    db.senses[0]!.import_key = "sense-other";
    const issues = detectPromoteIssues(buildPromotePreflightInput(pkg, "published", db));
    expect(
      issues.some((i) => i.kind === "publish_not_ready" && i.message.includes("primary sense mismatch")),
    ).toBe(true);
  });

  it("missing primary sense in CSV blocks publish preflight", () => {
    const pkg = minimalPilotPackage();
    pkg.files.get("senses.csv")!.rows[0]!.is_primary = "false";
    const db = buildMockDbState("in_review");
    const issues = detectPromoteIssues(buildPromotePreflightInput(pkg, "published", db));
    expect(
      issues.some(
        (i) =>
          i.kind === "publish_not_ready" &&
          i.message.includes("no primary sense declared in Pilot CSV"),
      ),
    ).toBe(true);
  });

  it("empty sense translation content blocks publish preflight", () => {
    const pkg = minimalPilotPackage();
    const db = buildMockDbState("in_review");
    db.sense_translations[0]!.short_definition = "  ";
    db.sense_translations[0]!.definition = null;
    const issues = detectPromoteIssues(buildPromotePreflightInput(pkg, "published", db));
    expect(
      issues.some(
        (i) => i.kind === "publish_not_ready" && i.entity === "sense_translations",
      ),
    ).toBe(true);
  });

  it("missing EN definition blocks publish preflight", () => {
    const pkg = minimalPilotPackage();
    const db = buildMockDbState("in_review");
    db.sense_translations[0]!.short_definition = "";
    db.sense_translations[0]!.definition = "";
    const issues = detectPromoteIssues(buildPromotePreflightInput(pkg, "published", db));
    expect(
      issues.some(
        (i) =>
          i.kind === "publish_not_ready" &&
          i.message.includes("English definition required for publication"),
      ),
    ).toBe(true);
  });

  it("empty example translation blocks publish preflight", () => {
    const pkg = minimalPilotPackage();
    const db = buildMockDbState("in_review");
    db.example_translations[0]!.translation = "   ";
    const issues = detectPromoteIssues(buildPromotePreflightInput(pkg, "published", db));
    expect(
      issues.some(
        (i) => i.kind === "publish_not_ready" && i.entity === "example_translations",
      ),
    ).toBe(true);
  });

  it("invalid example provenance blocks publish preflight", () => {
    const pkg = minimalPilotPackage();
    const db = buildMockDbState("in_review");
    db.examples[0]!.provenance_type = "unknown";
    const issues = detectPromoteIssues(buildPromotePreflightInput(pkg, "published", db));
    expect(
      issues.some(
        (i) => i.kind === "publish_not_ready" && i.message.includes("provenance_type \"unknown\""),
      ),
    ).toBe(true);
  });

  it("valid current Formal Pilot fixture passes publish preflight", () => {
    const pkg = loadPilotWritePackage("data/pilot/entry");
    const db = buildPilotMockDbStateFromPackage(pkg, "in_review");
    const issues = detectPromoteIssues(buildPromotePreflightInput(pkg, "published", db));
    expect(issues).toEqual([]);
  });
});

describe("promote execute audit output", () => {
  it("successful commit includes transition label", async () => {
    const state = buildMockDbState("draft");
    const db = createMockDbClient({ query: mockPromoteQueryHandler(state) });
    const pkg = minimalPilotPackage();
    const result = await executePromotePilot(db, pkg, "in_review", DEV_REF);
    expect(formatPromoteExecuteResult(result)).toContain("PROMOTION COMMITTED");
    expect(formatPromoteExecuteResult(result)).toContain("Transition: draft -> in_review");
  });
});
