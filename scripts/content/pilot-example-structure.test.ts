import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { parseCsvContent } from "./csv-parse";

const pilotDir = path.resolve(__dirname, "../../data/pilot/entry");

function readPilotCsv(filename: string) {
  const content = fs.readFileSync(path.join(pilotDir, filename), "utf8");
  return parseCsvContent(content, filename);
}

function exNum(id: string): number {
  return parseInt(id.replace("v2-ex-", ""), 10);
}

const EXPECTED_EXAMPLE_IDS = Array.from({ length: 48 }, (_, i) =>
  `v2-ex-${String(i + 1).padStart(3, "0")}`,
);

const FORBIDDEN_LINKS = [
  { example: "v2-ex-004", entry: "entry-jota", sense: "sense-jota-01" },
  { example: "v2-ex-024", entry: "entry-boda" },
  { example: "v2-ex-029", entry: "entry-sseuda-write" },
];

const MULTI_LINK_COUNTS: Record<string, number> = {
  "v2-ex-001": 3,
  "v2-ex-025": 4,
  "v2-ex-030": 2,
  "v2-ex-034": 2,
  "v2-ex-040": 2,
  "v2-ex-042": 2,
  "v2-ex-045": 2,
  "v2-ex-047": 2,
  "v2-ex-048": 3,
};

describe("Pilot example structure (Formal Examples v2)", () => {
  const examples = readPilotCsv("examples.csv");
  const translations = readPilotCsv("example_translations.csv");
  const entryExamples = readPilotCsv("entry_examples.csv");
  const senses = readPilotCsv("senses.csv");
  const entries = readPilotCsv("entries.csv");

  const senseToEntry = new Map(
    senses.rows.map((row) => [row.import_key, row.entry_import_key]),
  );

  it("examples.csv has exactly 48 data rows", () => {
    expect(examples.rows).toHaveLength(48);
  });

  it("example keys are exactly v2-ex-001 through v2-ex-048", () => {
    const keys = examples.rows.map((row) => row.import_key).sort();
    expect(keys).toEqual(EXPECTED_EXAMPLE_IDS);
  });

  it("example_translations.csv has exactly 144 data rows", () => {
    expect(translations.rows).toHaveLength(144);
  });

  it("every example has exactly 3 translations", () => {
    for (const id of EXPECTED_EXAMPLE_IDS) {
      const count = translations.rows.filter(
        (row) => row.example_import_key === id,
      ).length;
      expect(count).toBe(3);
    }
  });

  it("locale set for every example is exactly en, zh, ja", () => {
    for (const id of EXPECTED_EXAMPLE_IDS) {
      const locales = translations.rows
        .filter((row) => row.example_import_key === id)
        .map((row) => row.locale)
        .sort();
      expect(locales).toEqual(["en", "ja", "zh"]);
    }
  });

  it("entry_examples.csv has exactly 61 rows", () => {
    expect(entryExamples.rows).toHaveLength(61);
  });

  it("every example has at least one entry link", () => {
    for (const id of EXPECTED_EXAMPLE_IDS) {
      const count = entryExamples.rows.filter(
        (row) => row.example_import_key === id,
      ).length;
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  it("all 32 pilot entries appear in entry_examples.csv", () => {
    const linkedEntries = new Set(
      entryExamples.rows.map((row) => row.entry_import_key),
    );
    const pilotEntries = entries.rows.map((row) => row.import_key);
    for (const entry of pilotEntries) {
      expect(linkedEntries.has(entry)).toBe(true);
    }
    expect(linkedEntries.size).toBe(32);
  });

  it("all 50 pilot senses appear in entry_examples.csv", () => {
    const linkedSenses = new Set(
      entryExamples.rows.map((row) => row.sense_import_key),
    );
    const pilotSenses = senses.rows.map((row) => row.import_key);
    for (const sense of pilotSenses) {
      expect(linkedSenses.has(sense)).toBe(true);
    }
    expect(linkedSenses.size).toBe(50);
  });

  it("every sense_import_key belongs to the linked entry_import_key", () => {
    for (const row of entryExamples.rows) {
      const owner = senseToEntry.get(row.sense_import_key ?? "");
      expect(owner).toBe(row.entry_import_key);
    }
  });

  it("every display_order is a positive integer", () => {
    for (const row of entryExamples.rows) {
      const order = Number(row.display_order);
      expect(Number.isInteger(order)).toBe(true);
      expect(order).toBeGreaterThan(0);
    }
  });

  it("display_order values are deterministic per entry", () => {
    const byEntry = new Map<string, { exId: string; order: number }[]>();
    for (const row of entryExamples.rows) {
      const entry = row.entry_import_key ?? "";
      if (!byEntry.has(entry)) byEntry.set(entry, []);
      byEntry.get(entry)!.push({
        exId: row.example_import_key ?? "",
        order: Number(row.display_order),
      });
    }

    for (const [, rows] of byEntry) {
      const sorted = [...rows].sort((a, b) => exNum(a.exId) - exNum(b.exId));
      const orders = sorted.map((r) => r.order);
      expect(orders).toEqual(Array.from({ length: orders.length }, (_, i) => i + 1));
    }
  });

  it("forbidden links are absent", () => {
    for (const forbidden of FORBIDDEN_LINKS) {
      const matches = entryExamples.rows.filter((row) => {
        if (row.example_import_key !== forbidden.example) return false;
        if (forbidden.entry && row.entry_import_key !== forbidden.entry) return false;
        if ("sense" in forbidden && forbidden.sense && row.sense_import_key !== forbidden.sense)
          return false;
        return true;
      });
      expect(matches).toHaveLength(0);
    }
  });

  it("required multi-link counts match the approved manifest", () => {
    for (const [exId, expected] of Object.entries(MULTI_LINK_COUNTS)) {
      const count = entryExamples.rows.filter(
        (row) => row.example_import_key === exId,
      ).length;
      expect(count).toBe(expected);
    }
  });

  it("every example has register = neutral", () => {
    expect(examples.rows.every((row) => row.register === "neutral")).toBe(true);
  });

  it("every example has provenance_type = original", () => {
    expect(examples.rows.every((row) => row.provenance_type === "original")).toBe(
      true,
    );
  });

  it("every example has status = draft", () => {
    expect(examples.rows.every((row) => row.status === "draft")).toBe(true);
  });

  it("every translation has status = draft", () => {
    expect(translations.rows.every((row) => row.status === "draft")).toBe(true);
  });

  it("every example has empty romanization", () => {
    expect(examples.rows.every((row) => !row.romanization?.trim())).toBe(true);
  });

  it("every example has empty source_note", () => {
    expect(examples.rows.every((row) => !row.source_note?.trim())).toBe(true);
  });

  it("every example has empty license_note", () => {
    expect(examples.rows.every((row) => !row.license_note?.trim())).toBe(true);
  });

  it("every example has korean_text_normalized identical to korean_text", () => {
    expect(
      examples.rows.every(
        (row) => row.korean_text_normalized === row.korean_text,
      ),
    ).toBe(true);
  });

  it("every translation import_key matches et-{example_import_key}-{locale}", () => {
    for (const row of translations.rows) {
      expect(row.import_key).toBe(
        `et-${row.example_import_key}-${row.locale}`,
      );
    }
  });

  it("has no duplicate example import_key", () => {
    const keys = examples.rows.map((row) => row.import_key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("has no duplicate translation import_key", () => {
    const keys = translations.rows.map((row) => row.import_key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("has no duplicate example_import_key + locale", () => {
    const pairs = translations.rows.map(
      (row) => `${row.example_import_key}|${row.locale}`,
    );
    expect(new Set(pairs).size).toBe(pairs.length);
  });

  it("has no duplicate entry_import_key + example_import_key + sense_import_key", () => {
    const triples = entryExamples.rows.map(
      (row) =>
        `${row.entry_import_key}|${row.example_import_key}|${row.sense_import_key}`,
    );
    expect(new Set(triples).size).toBe(triples.length);
  });
});
