import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import path from "node:path";

import {
  ALLOWED_DEV_PROJECT_REFS,
  BLOCKED_PRODUCTION_PROJECT_REFS,
  DOCUMENTED_DEV_PROJECT_REF,
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
import type { ContentPackage } from "./import-package";

const DEV_REF = DOCUMENTED_DEV_PROJECT_REF;
const PROD_REF = "rpykfrvcynpwmbkogiou";
const THIRD_REF = "abcdefghijklmnopqr";
const ENV_ISOLATED_CWD = path.join(process.cwd(), "data/fixtures/valid/minimal");

function envWithoutDatabaseCredentials(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  delete env.DATABASE_URL;
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
    entries: [{ id: "e1", import_key: "entry-hakgyo", status }],
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
        status,
      },
    ],
    example_translations: [
      {
        id: "et1",
        import_key: "et-v2-ex-001-en",
        example_id: "x1",
        locale: "en",
        status,
      },
      {
        id: "et2",
        import_key: "et-v2-ex-001-zh",
        example_id: "x1",
        locale: "zh",
        status,
      },
      {
        id: "et3",
        import_key: "et-v2-ex-001-ja",
        example_id: "x1",
        locale: "ja",
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
