import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateContentDirectory } from "./validate-content";

const fixturesRoot = path.resolve(__dirname, "../../data/fixtures");

describe("validateContentDirectory", () => {
  it("valid minimal synthetic package passes", () => {
    const result = validateContentDirectory(
      path.join(fixturesRoot, "valid/minimal"),
    );
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("duplicate import_key fails", () => {
    const result = validateContentDirectory(
      path.join(fixturesRoot, "invalid/duplicate-import-key"),
    );
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.message.includes("Duplicate import_key"))).toBe(
      true,
    );
  });

  it("invalid locale fails", () => {
    const result = validateContentDirectory(
      path.join(fixturesRoot, "invalid/invalid-locale"),
    );
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === "locale")).toBe(true);
  });

  it("missing English core content fails", () => {
    const result = validateContentDirectory(
      path.join(fixturesRoot, "invalid/missing-en-core"),
    );
    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.message.includes("missing English core content")),
    ).toBe(true);
  });

  it("invalid enum fails", () => {
    const result = validateContentDirectory(
      path.join(fixturesRoot, "invalid/invalid-enum"),
    );
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.message.includes("Invalid part_of_speech"))).toBe(
      true,
    );
  });

  it("accepts bound_noun as part_of_speech", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pos-bound-noun-"));
    fs.writeFileSync(
      path.join(dir, "entries.csv"),
      [
        "import_key,slug,headword,headword_normalized,part_of_speech,status",
        "entry-test-bound,test-bound,시,시,bound_noun,draft",
      ].join("\n"),
    );
    fs.writeFileSync(
      path.join(dir, "senses.csv"),
      [
        "import_key,entry_import_key,sense_order,is_primary,status",
        "sense-test-bound-01,entry-test-bound,1,true,draft",
      ].join("\n"),
    );
    fs.writeFileSync(
      path.join(dir, "sense_translations.csv"),
      [
        "import_key,sense_import_key,locale,short_definition,status",
        "st-test-bound-en,sense-test-bound-01,en,hour unit,draft",
      ].join("\n"),
    );

    const result = validateContentDirectory(dir);
    expect(result.errors.some((e) => e.message.includes("Invalid part_of_speech"))).toBe(
      false,
    );
    expect(result.ok).toBe(true);
  });

  it("unresolved relation fails", () => {
    const result = validateContentDirectory(
      path.join(fixturesRoot, "invalid/unresolved-relation"),
    );
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.message.includes("Unresolved"))).toBe(true);
  });

  it("invalid Hanja position fails", () => {
    const result = validateContentDirectory(
      path.join(fixturesRoot, "invalid/invalid-hanja-position"),
    );
    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.message.includes("consecutive")),
    ).toBe(true);
  });

  it("invalid provenance fails", () => {
    const result = validateContentDirectory(
      path.join(fixturesRoot, "invalid/invalid-provenance"),
    );
    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.message.includes("provenance_type=unknown")),
    ).toBe(true);
  });
});
