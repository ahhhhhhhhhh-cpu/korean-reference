import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { parseCsvContent } from "./csv-parse";

const pilotDir = path.resolve(__dirname, "../../data/pilot/entry");

function readPilotCsv(filename: string) {
  const content = fs.readFileSync(path.join(pilotDir, filename), "utf8");
  return parseCsvContent(content, filename);
}

describe("Pilot entry structure (Phase 7C-4B-1R-A2)", () => {
  const entries = readPilotCsv("entries.csv");
  const senses = readPilotCsv("senses.csv");

  it("has 32 lexical entries", () => {
    expect(entries.rows).toHaveLength(32);
  });

  it("has 50 senses total", () => {
    expect(senses.rows).toHaveLength(50);
  });

  it("does not retain the unsplit entry-sigan row", () => {
    expect(entries.rows.some((row) => row.import_key === "entry-sigan")).toBe(false);
  });

  it("splits 시간 into noun time and bound_noun hour entries", () => {
    const time = entries.rows.find((row) => row.import_key === "entry-sigan-time");
    const hour = entries.rows.find((row) => row.import_key === "entry-sigan-hour");

    expect(time?.part_of_speech).toBe("noun");
    expect(hour?.part_of_speech).toBe("bound_noun");
    expect(time?.pronunciation_hangul).toBe("[시간]");
    expect(hour?.pronunciation_hangul).toBe("[시간]");
    expect(time?.etymology_type).toBe("sino_korean");
    expect(hour?.etymology_type).toBe("sino_korean");
  });

  it("assigns one sense each to the split 시간 entries", () => {
    const timeSense = senses.rows.find((row) => row.import_key === "sense-sigan-time-01");
    const hourSense = senses.rows.find((row) => row.import_key === "sense-sigan-hour-01");

    expect(timeSense?.entry_import_key).toBe("entry-sigan-time");
    expect(hourSense?.entry_import_key).toBe("entry-sigan-hour");
    expect(
      senses.rows.filter((row) => row.entry_import_key?.startsWith("entry-sigan")),
    ).toHaveLength(2);
  });

  it("matches expected POS distribution", () => {
    const counts = entries.rows.reduce<Record<string, number>>((acc, row) => {
      const pos = row.part_of_speech ?? "";
      acc[pos] = (acc[pos] ?? 0) + 1;
      return acc;
    }, {});

    expect(counts.noun).toBe(9);
    expect(counts.bound_noun).toBe(1);
    expect(counts.verb).toBe(14);
    expect(counts.adjective).toBe(8);
  });

  it("has complete pronunciation and etymology coverage (Phase 7C-4B-1R-B)", () => {
    expect(entries.rows.every((row) => row.pronunciation_hangul?.trim())).toBe(true);
    expect(entries.rows.every((row) => row.etymology_type?.trim())).toBe(true);

    const etymology = entries.rows.reduce<Record<string, number>>((acc, row) => {
      const type = row.etymology_type ?? "";
      acc[type] = (acc[type] ?? 0) + 1;
      return acc;
    }, {});

    expect(etymology.native).toBe(24);
    expect(etymology.sino_korean).toBe(7);
    expect(etymology.hybrid).toBe(1);
    expect(etymology.loanword ?? 0).toBe(0);
    expect(etymology.unknown ?? 0).toBe(0);
  });
});
