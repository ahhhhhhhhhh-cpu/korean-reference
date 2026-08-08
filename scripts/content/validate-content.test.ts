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
