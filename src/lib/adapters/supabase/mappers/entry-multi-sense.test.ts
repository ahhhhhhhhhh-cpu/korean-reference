import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  mapEntryDetail,
  type EntryBundle,
  type EntryExampleLink,
  type EntrySenseBundle,
} from "@/lib/adapters/supabase/mappers/entries";
import { parseCsvContent } from "../../../../../scripts/content/csv-parse";

const pilotDir = path.resolve(__dirname, "../../../../../data/pilot/entry");

type CsvRow = Record<string, string | undefined>;

function readPilotCsv(filename: string): CsvRow[] {
  const content = fs.readFileSync(path.join(pilotDir, filename), "utf8");
  return parseCsvContent(content, filename).rows;
}

function publishedSense(
  id: string,
  entryId: string,
  senseOrder: number,
  isPrimary: boolean,
): EntrySenseBundle["sense"] {
  return {
    id,
    entry_id: entryId,
    sense_order: senseOrder,
    is_primary: isPrimary,
    register: "neutral",
    status: "published",
    import_key: null,
    archived_at: null,
    published_at: "2026-01-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

function publishedSenseTranslation(
  id: string,
  senseId: string,
  locale: string,
  shortDefinition: string,
  definition: string | null = null,
): EntrySenseBundle["translations"][number] {
  return {
    id,
    sense_id: senseId,
    locale,
    short_definition: shortDefinition,
    definition,
    usage_note: null,
    nuance_note: null,
    status: "published",
    import_key: null,
    published_at: "2026-01-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

function publishedExample(
  id: string,
  koreanText: string,
): EntryExampleLink["example"] {
  return {
    id,
    import_key: null,
    korean_text: koreanText,
    korean_text_normalized: koreanText,
    romanization: null,
    register: "neutral",
    difficulty_level: "beginner",
    provenance_type: "original",
    source_note: null,
    license_note: null,
    status: "published",
    archived_at: null,
    published_at: "2026-01-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

function publishedExampleTranslation(
  id: string,
  exampleId: string,
  locale: string,
  translation: string,
): EntryExampleLink["exampleTranslations"][number] {
  return {
    id,
    example_id: exampleId,
    locale,
    translation,
    status: "published",
    import_key: null,
    published_at: "2026-01-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

function buildPilotEntryBundle(entryImportKey: string): EntryBundle {
  const entries = readPilotCsv("entries.csv");
  const senses = readPilotCsv("senses.csv");
  const senseTranslations = readPilotCsv("sense_translations.csv");
  const entryExamples = readPilotCsv("entry_examples.csv");
  const examples = readPilotCsv("examples.csv");
  const exampleTranslations = readPilotCsv("example_translations.csv");

  const entryRow = entries.find((row) => row.import_key === entryImportKey);
  if (!entryRow) {
    throw new Error(`Missing pilot entry ${entryImportKey}`);
  }

  const entryId = `entry-${entryImportKey}`;
  const entrySenses = senses.filter((row) => row.entry_import_key === entryImportKey);
  const senseIdByImportKey = new Map<string, string>();
  for (const sense of entrySenses) {
    senseIdByImportKey.set(sense.import_key!.trim(), `sense-${sense.import_key!.trim()}`);
  }

  const senseBundles: EntrySenseBundle[] = entrySenses
    .sort((a, b) => Number(a.sense_order) - Number(b.sense_order))
    .map((sense) => {
      const senseImportKey = sense.import_key!.trim();
      const senseId = senseIdByImportKey.get(senseImportKey)!;
      const translations = senseTranslations
        .filter((row) => row.sense_import_key === senseImportKey)
        .map((row, index) =>
          publishedSenseTranslation(
            `st-${senseImportKey}-${row.locale}-${index}`,
            senseId,
            row.locale!.trim(),
            row.short_definition?.trim() ?? "",
            row.definition?.trim() || null,
          ),
        );

      return {
        sense: publishedSense(
          senseId,
          entryId,
          Number(sense.sense_order),
          sense.is_primary?.trim().toLowerCase() === "true",
        ),
        translations,
      };
    });

  const exampleIdByImportKey = new Map<string, string>();
  for (const row of examples) {
    exampleIdByImportKey.set(row.import_key!.trim(), `example-${row.import_key!.trim()}`);
  }

  const links: EntryExampleLink[] = entryExamples
    .filter((row) => row.entry_import_key === entryImportKey)
    .map((row, index) => {
      const exampleImportKey = row.example_import_key!.trim();
      const exampleId = exampleIdByImportKey.get(exampleImportKey)!;
      const exampleRow = examples.find((item) => item.import_key === exampleImportKey);
      const senseImportKey = row.sense_import_key?.trim();
      const senseId = senseImportKey ? senseIdByImportKey.get(senseImportKey) ?? null : null;

      return {
        entryId,
        senseId,
        displayOrder: Number(row.display_order ?? index + 1),
        example: publishedExample(exampleId, exampleRow!.korean_text!.trim()),
        exampleTranslations: exampleTranslations
          .filter((item) => item.example_import_key === exampleImportKey)
          .map((item, trIndex) =>
            publishedExampleTranslation(
              `et-${exampleImportKey}-${item.locale}-${trIndex}`,
              exampleId,
              item.locale!.trim(),
              item.translation!.trim(),
            ),
          ),
      };
    });

  return {
    entry: {
      id: entryId,
      slug: entryRow.slug!.trim(),
      headword: entryRow.headword!.trim(),
      headword_normalized: entryRow.headword_normalized!.trim(),
      romanization: entryRow.romanization?.trim() ?? null,
      romanization_normalized: entryRow.romanization_normalized?.trim() ?? null,
      pronunciation_hangul: entryRow.pronunciation_hangul?.trim() ?? null,
      pronunciation_romanization: null,
      part_of_speech: entryRow.part_of_speech!.trim(),
      etymology_type: entryRow.etymology_type?.trim() ?? null,
      stem: null,
      irregular_type: null,
      difficulty_level: entryRow.difficulty_level?.trim() ?? null,
      frequency_level: entryRow.frequency_level?.trim() ?? null,
      topik_level: null,
      status: "published",
      import_key: entryImportKey,
      archived_at: null,
      published_at: "2026-01-01T00:00:00Z",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    senses: senseBundles,
    entryTranslations: [],
    examples: links,
    hanjaText: null,
    soundChangeRuleIds: [],
    relatedEntrySlugs: [],
  };
}

describe("entry multi-sense mapper", () => {
  it("returns all published senses sorted by sense_order", () => {
    const bundle = buildPilotEntryBundle("entry-saram");
    const detail = mapEntryDetail(bundle, "en");

    expect(detail.senses).toHaveLength(4);
    expect(detail.senses.map((sense) => sense.senseOrder)).toEqual([1, 2, 3, 4]);
  });

  it("selects locale translation per sense", () => {
    const bundle = buildPilotEntryBundle("entry-saram");
    const detail = mapEntryDetail(bundle, "ja");

    expect(detail.senses[0]?.definition.value).toContain("人");
    expect(detail.senses[1]?.definition.value).toContain("出身");
    expect(detail.senses[0]?.definition.resolvedLocale).toBe("ja");
  });

  it("maps 사람 to four senses with distinct definitions", () => {
    const detail = mapEntryDetail(buildPilotEntryBundle("entry-saram"), "en");

    expect(detail.senses).toHaveLength(4);
    expect(detail.senses[0]?.definition.value).toContain("person");
    expect(detail.senses[1]?.definition.value).toContain("from/of");
    expect(detail.senses[2]?.definition.value).toContain("character");
    expect(detail.senses[3]?.definition.value).toContain("numbers");
  });

  it("groups 사람 examples by sense_id", () => {
    const detail = mapEntryDetail(buildPilotEntryBundle("entry-saram"), "en");

    expect(detail.senses[0]?.examples).toHaveLength(4);
    expect(detail.senses[1]?.examples).toHaveLength(1);
    expect(detail.senses[2]?.examples).toHaveLength(1);
    expect(detail.senses[3]?.examples).toHaveLength(1);
    expect(detail.examples).toHaveLength(0);
  });

  it("preserves example display_order within a sense", () => {
    const detail = mapEntryDetail(buildPilotEntryBundle("entry-saram"), "en");
    const firstSenseExamples = detail.senses[0]!.examples;

    expect(firstSenseExamples.map((example) => example.sortOrder)).toEqual([1, 5, 6, 7]);
    expect(firstSenseExamples[0]?.sentenceKo).toContain("로봇");
    expect(firstSenseExamples.at(-1)?.sentenceKo).toContain("질렸어요");
  });

  it("maps 보다 to five lexical senses only", () => {
    const detail = mapEntryDetail(buildPilotEntryBundle("entry-boda"), "en");

    expect(detail.senses).toHaveLength(5);
    expect(detail.senses.map((sense) => sense.definition.value)).toEqual([
      expect.stringContaining("see"),
      expect.stringContaining("watch"),
      expect.stringContaining("read"),
      expect.stringContaining("check"),
      expect.stringContaining("exam"),
    ]);
  });

  it("maps 마음 to four senses", () => {
    const detail = mapEntryDetail(buildPilotEntryBundle("entry-maeum"), "en");

    expect(detail.senses).toHaveLength(4);
    expect(detail.senses[0]?.definition.value).toContain("mind");
    expect(detail.senses[3]?.definition.value).toContain("character");
  });

  it("keeps 학교 as one sense with one example", () => {
    const detail = mapEntryDetail(buildPilotEntryBundle("entry-hakgyo"), "en");

    expect(detail.senses).toHaveLength(1);
    expect(detail.senses[0]?.isPrimary).toBe(true);
    expect(detail.senses[0]?.definition.value).toBe("school");
    expect(detail.senses[0]?.examples).toHaveLength(1);
    expect(detail.examples).toHaveLength(0);
  });

  it("excludes draft senses from mapped detail", () => {
    const bundle = buildPilotEntryBundle("entry-saram");
    bundle.senses.push({
      sense: {
        ...publishedSense("sense-draft", bundle.entry.id, 99, false),
        status: "draft",
      },
      translations: [
        publishedSenseTranslation("st-draft-en", "sense-draft", "en", "draft only"),
      ],
    });

    const detail = mapEntryDetail(bundle, "en");
    expect(detail.senses).toHaveLength(4);
  });

  it("uses English fallback when locale translation is missing", () => {
    const bundle = buildPilotEntryBundle("entry-saram");
    for (const sense of bundle.senses) {
      sense.translations = sense.translations.filter((row) => row.locale !== "ja");
    }

    const detail = mapEntryDetail(bundle, "ja");
    expect(detail.senses[0]?.definition.usedFallback).toBe(true);
    expect(detail.senses[0]?.definition.resolvedLocale).toBe("en");
  });

  it("keeps entry-level examples separate when sense_id is null", () => {
    const bundle = buildPilotEntryBundle("entry-hakgyo");
    const generalExample = bundle.examples[0]!;
    bundle.examples.push({
      ...generalExample,
      senseId: null,
      displayOrder: 2,
      example: publishedExample("example-general", "일반 예문입니다."),
    });

    const detail = mapEntryDetail(bundle, "en");
    expect(detail.senses[0]?.examples).toHaveLength(1);
    expect(detail.examples).toHaveLength(1);
    expect(detail.examples[0]?.sentenceKo).toBe("일반 예문입니다.");
  });

  it("does not duplicate examples across senses unless multi-linked", () => {
    const detail = mapEntryDetail(buildPilotEntryBundle("entry-saram"), "en");
    const allExampleIds = detail.senses.flatMap((sense) =>
      sense.examples.map((example) => example.id),
    );

    expect(new Set(allExampleIds).size).toBe(allExampleIds.length);
  });
});
