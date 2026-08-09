import { SAFE_IMPORT_STATUSES } from "./import-config";
import type { CsvRow } from "./csv-parse";
import type { DbClient } from "./import-db";
import type { ContentPackage } from "./import-package";
import { getPackageRows } from "./import-package";

export type WriteCounts = {
  inserted: number;
  updated: number;
  unchanged: number;
};

export type ImportWriteSummary = {
  entries: WriteCounts;
  senses: WriteCounts;
  sense_translations: WriteCounts;
  entry_aliases: WriteCounts;
  examples: WriteCounts;
  example_translations: WriteCounts;
  entry_examples: WriteCounts;
};

export function emptyWriteCounts(): WriteCounts {
  return { inserted: 0, updated: 0, unchanged: 0 };
}

export function emptyImportWriteSummary(): ImportWriteSummary {
  return {
    entries: emptyWriteCounts(),
    senses: emptyWriteCounts(),
    sense_translations: emptyWriteCounts(),
    entry_aliases: emptyWriteCounts(),
    examples: emptyWriteCounts(),
    example_translations: emptyWriteCounts(),
    entry_examples: emptyWriteCounts(),
  };
}

export type ImportKeyMaps = {
  entries: Map<string, string>;
  senses: Map<string, string>;
  examples: Map<string, string>;
};

function n(value: string | undefined): string | null {
  const v = value?.trim();
  return v ? v : null;
}

function assertSafeStatus(status: string, importKey: string, entity: string): void {
  if (!SAFE_IMPORT_STATUSES.has(status)) {
    throw new Error(
      `${entity} import_key "${importKey}" has status "${status}" and cannot be modified by draft import.`,
    );
  }
}

async function fetchByImportKey(
  db: DbClient,
  table: string,
  importKey: string,
): Promise<{ id: string; status: string } | null> {
  const result = await db.query<{ id: string; status: string }>(
    `SELECT id::text AS id, status FROM public.${table} WHERE import_key = $1`,
    [importKey],
  );
  return result.rows[0] ?? null;
}

function bump(counts: WriteCounts, kind: keyof WriteCounts): void {
  counts[kind]++;
}

async function upsertKeyedRow(
  db: DbClient,
  table: string,
  importKey: string,
  insertSql: string,
  insertParams: unknown[],
  updateSql: string,
  updateParams: unknown[],
  isUnchanged: (existingId: string) => Promise<boolean>,
  counts: WriteCounts,
): Promise<string> {
  const existing = await fetchByImportKey(db, table, importKey);
  if (!existing) {
    const inserted = await db.query<{ id: string }>(insertSql, insertParams);
    const id = inserted.rows[0]?.id;
    if (!id) throw new Error(`Insert into ${table} did not return id.`);
    bump(counts, "inserted");
    return id;
  }

  assertSafeStatus(existing.status, importKey, table);

  if (await isUnchanged(existing.id)) {
    bump(counts, "unchanged");
    return existing.id;
  }

  await db.query(updateSql, updateParams);
  bump(counts, "updated");
  return existing.id;
}

async function alwaysChanged(): Promise<boolean> {
  return false;
}

export async function writePilotPackage(
  db: DbClient,
  pkg: ContentPackage,
): Promise<{ summary: ImportWriteSummary; maps: ImportKeyMaps }> {
  const summary = emptyImportWriteSummary();
  const maps: ImportKeyMaps = {
    entries: new Map(),
    senses: new Map(),
    examples: new Map(),
  };

  for (const row of getPackageRows(pkg, "entries.csv")) {
    const importKey = row.import_key!.trim();
    const payload = {
      slug: row.slug!.trim(),
      headword: row.headword!.trim(),
      headword_normalized: row.headword_normalized!.trim(),
      romanization: n(row.romanization),
      romanization_normalized: n(row.romanization_normalized),
      pronunciation_hangul: n(row.pronunciation_hangul),
      pronunciation_romanization: n(row.pronunciation_romanization),
      part_of_speech: row.part_of_speech!.trim(),
      etymology_type: n(row.etymology_type),
      stem: n(row.stem),
      irregular_type: n(row.irregular_type),
      difficulty_level: n(row.difficulty_level),
      frequency_level: n(row.frequency_level),
      topik_level: n(row.topik_level) ? Number(row.topik_level) : null,
      status: "draft",
    };

    const id = await upsertKeyedRow(
      db,
      "entries",
      importKey,
      `INSERT INTO public.entries (
        import_key, slug, headword, headword_normalized, romanization,
        romanization_normalized, pronunciation_hangul, pronunciation_romanization,
        part_of_speech, etymology_type, stem, irregular_type, difficulty_level,
        frequency_level, topik_level, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING id::text AS id`,
      [
        importKey,
        payload.slug,
        payload.headword,
        payload.headword_normalized,
        payload.romanization,
        payload.romanization_normalized,
        payload.pronunciation_hangul,
        payload.pronunciation_romanization,
        payload.part_of_speech,
        payload.etymology_type,
        payload.stem,
        payload.irregular_type,
        payload.difficulty_level,
        payload.frequency_level,
        payload.topik_level,
        payload.status,
      ],
      `UPDATE public.entries SET
        slug=$2, headword=$3, headword_normalized=$4, romanization=$5,
        romanization_normalized=$6, pronunciation_hangul=$7, pronunciation_romanization=$8,
        part_of_speech=$9, etymology_type=$10, stem=$11, irregular_type=$12,
        difficulty_level=$13, frequency_level=$14, topik_level=$15, status=$16
      WHERE import_key=$1`,
      [
        importKey,
        payload.slug,
        payload.headword,
        payload.headword_normalized,
        payload.romanization,
        payload.romanization_normalized,
        payload.pronunciation_hangul,
        payload.pronunciation_romanization,
        payload.part_of_speech,
        payload.etymology_type,
        payload.stem,
        payload.irregular_type,
        payload.difficulty_level,
        payload.frequency_level,
        payload.topik_level,
        payload.status,
      ],
      alwaysChanged,
      summary.entries,
    );
    maps.entries.set(importKey, id);
  }

  for (const row of getPackageRows(pkg, "senses.csv")) {
    const importKey = row.import_key!.trim();
    const entryImportKey = row.entry_import_key!.trim();
    const entryId = maps.entries.get(entryImportKey);
    if (!entryId) {
      throw new Error(`Unresolved entry_import_key "${entryImportKey}" for sense "${importKey}".`);
    }

    const payload = {
      entry_id: entryId,
      sense_order: Number(row.sense_order),
      is_primary: row.is_primary?.trim().toLowerCase() === "true",
      register: n(row.register),
      status: "draft",
    };

    const id = await upsertKeyedRow(
      db,
      "senses",
      importKey,
      `INSERT INTO public.senses (import_key, entry_id, sense_order, is_primary, register, status)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id::text AS id`,
      [
        importKey,
        payload.entry_id,
        payload.sense_order,
        payload.is_primary,
        payload.register,
        payload.status,
      ],
      `UPDATE public.senses SET entry_id=$2, sense_order=$3, is_primary=$4, register=$5, status=$6
       WHERE import_key=$1`,
      [
        importKey,
        payload.entry_id,
        payload.sense_order,
        payload.is_primary,
        payload.register,
        payload.status,
      ],
      alwaysChanged,
      summary.senses,
    );
    maps.senses.set(importKey, id);
  }

  for (const row of getPackageRows(pkg, "sense_translations.csv")) {
    const importKey = row.import_key!.trim();
    const senseImportKey = row.sense_import_key!.trim();
    const senseId = maps.senses.get(senseImportKey);
    if (!senseId) {
      throw new Error(
        `Unresolved sense_import_key "${senseImportKey}" for sense_translation "${importKey}".`,
      );
    }

    const payload = {
      sense_id: senseId,
      locale: row.locale!.trim(),
      short_definition: n(row.short_definition),
      definition: n(row.definition),
      usage_note: n(row.usage_note),
      nuance_note: n(row.nuance_note),
      status: "draft",
    };

    await upsertKeyedRow(
      db,
      "sense_translations",
      importKey,
      `INSERT INTO public.sense_translations (
        import_key, sense_id, locale, short_definition, definition, usage_note, nuance_note, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id::text AS id`,
      [
        importKey,
        payload.sense_id,
        payload.locale,
        payload.short_definition,
        payload.definition,
        payload.usage_note,
        payload.nuance_note,
        payload.status,
      ],
      `UPDATE public.sense_translations SET
        sense_id=$2, locale=$3, short_definition=$4, definition=$5, usage_note=$6, nuance_note=$7, status=$8
       WHERE import_key=$1`,
      [
        importKey,
        payload.sense_id,
        payload.locale,
        payload.short_definition,
        payload.definition,
        payload.usage_note,
        payload.nuance_note,
        payload.status,
      ],
      alwaysChanged,
      summary.sense_translations,
    );
  }

  for (const row of getPackageRows(pkg, "entry_aliases.csv")) {
    const importKey = row.import_key!.trim();
    const entryImportKey = row.entry_import_key!.trim();
    const entryId = maps.entries.get(entryImportKey);
    if (!entryId) {
      throw new Error(
        `Unresolved entry_import_key "${entryImportKey}" for alias "${importKey}".`,
      );
    }

    const payload = {
      entry_id: entryId,
      alias_type: row.alias_type!.trim(),
      alias: row.alias!.trim(),
      alias_normalized: row.alias_normalized!.trim(),
      script: n(row.script) ?? "hangul",
      locale: n(row.locale),
      is_searchable: row.is_searchable?.trim().toLowerCase() !== "false",
      status: "draft",
    };

    await upsertKeyedRow(
      db,
      "entry_aliases",
      importKey,
      `INSERT INTO public.entry_aliases (
        import_key, entry_id, alias_type, alias, alias_normalized, script, locale, is_searchable, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id::text AS id`,
      [
        importKey,
        payload.entry_id,
        payload.alias_type,
        payload.alias,
        payload.alias_normalized,
        payload.script,
        payload.locale,
        payload.is_searchable,
        payload.status,
      ],
      `UPDATE public.entry_aliases SET
        entry_id=$2, alias_type=$3, alias=$4, alias_normalized=$5, script=$6, locale=$7, is_searchable=$8, status=$9
       WHERE import_key=$1`,
      [
        importKey,
        payload.entry_id,
        payload.alias_type,
        payload.alias,
        payload.alias_normalized,
        payload.script,
        payload.locale,
        payload.is_searchable,
        payload.status,
      ],
      alwaysChanged,
      summary.entry_aliases,
    );
  }

  for (const row of getPackageRows(pkg, "examples.csv")) {
    const importKey = row.import_key!.trim();
    const payload = {
      korean_text: row.korean_text!.trim(),
      korean_text_normalized: row.korean_text_normalized!.trim(),
      romanization: n(row.romanization),
      register: n(row.register),
      difficulty_level: n(row.difficulty_level),
      provenance_type: row.provenance_type!.trim(),
      source_note: n(row.source_note),
      license_note: n(row.license_note),
      status: "draft",
    };

    const id = await upsertKeyedRow(
      db,
      "examples",
      importKey,
      `INSERT INTO public.examples (
        import_key, korean_text, korean_text_normalized, romanization, register,
        difficulty_level, provenance_type, source_note, license_note, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id::text AS id`,
      [
        importKey,
        payload.korean_text,
        payload.korean_text_normalized,
        payload.romanization,
        payload.register,
        payload.difficulty_level,
        payload.provenance_type,
        payload.source_note,
        payload.license_note,
        payload.status,
      ],
      `UPDATE public.examples SET
        korean_text=$2, korean_text_normalized=$3, romanization=$4, register=$5,
        difficulty_level=$6, provenance_type=$7, source_note=$8, license_note=$9, status=$10
       WHERE import_key=$1`,
      [
        importKey,
        payload.korean_text,
        payload.korean_text_normalized,
        payload.romanization,
        payload.register,
        payload.difficulty_level,
        payload.provenance_type,
        payload.source_note,
        payload.license_note,
        payload.status,
      ],
      alwaysChanged,
      summary.examples,
    );
    maps.examples.set(importKey, id);
  }

  for (const row of getPackageRows(pkg, "example_translations.csv")) {
    const importKey = row.import_key!.trim();
    const exampleImportKey = row.example_import_key!.trim();
    const exampleId = maps.examples.get(exampleImportKey);
    if (!exampleId) {
      throw new Error(
        `Unresolved example_import_key "${exampleImportKey}" for example_translation "${importKey}".`,
      );
    }

    const payload = {
      example_id: exampleId,
      locale: row.locale!.trim(),
      translation: row.translation!.trim(),
      status: "draft",
    };

    await upsertKeyedRow(
      db,
      "example_translations",
      importKey,
      `INSERT INTO public.example_translations (import_key, example_id, locale, translation, status)
       VALUES ($1,$2,$3,$4,$5) RETURNING id::text AS id`,
      [
        importKey,
        payload.example_id,
        payload.locale,
        payload.translation,
        payload.status,
      ],
      `UPDATE public.example_translations SET example_id=$2, locale=$3, translation=$4, status=$5
       WHERE import_key=$1`,
      [
        importKey,
        payload.example_id,
        payload.locale,
        payload.translation,
        payload.status,
      ],
      alwaysChanged,
      summary.example_translations,
    );
  }

  const senseEntryMap = new Map<string, string>();
  for (const row of getPackageRows(pkg, "senses.csv")) {
    const senseKey = row.import_key!.trim();
    const entryKey = row.entry_import_key!.trim();
    senseEntryMap.set(senseKey, entryKey);
  }

  for (const row of getPackageRows(pkg, "entry_examples.csv")) {
    const entryImportKey = row.entry_import_key!.trim();
    const exampleImportKey = row.example_import_key!.trim();
    const senseImportKey = row.sense_import_key?.trim();
    const displayOrder = Number(row.display_order);

    const entryId = maps.entries.get(entryImportKey);
    if (!entryId) {
      throw new Error(
        `Unresolved entry_import_key "${entryImportKey}" for entry_examples link.`,
      );
    }
    const exampleId = maps.examples.get(exampleImportKey);
    if (!exampleId) {
      throw new Error(
        `Unresolved example_import_key "${exampleImportKey}" for entry_examples link.`,
      );
    }
    if (!senseImportKey) {
      throw new Error(
        `entry_examples row requires sense_import_key for Pilot import (entry="${entryImportKey}", example="${exampleImportKey}").`,
      );
    }
    const senseId = maps.senses.get(senseImportKey);
    if (!senseId) {
      throw new Error(`Unresolved sense_import_key "${senseImportKey}" for entry_examples link.`);
    }

    const expectedEntryKey = senseEntryMap.get(senseImportKey);
    if (expectedEntryKey !== entryImportKey) {
      throw new Error(
        `sense_import_key "${senseImportKey}" belongs to entry "${expectedEntryKey}", not "${entryImportKey}".`,
      );
    }

    const existing = await db.query<{ id: string; display_order: number }>(
      `SELECT id::text AS id, display_order FROM public.entry_examples
       WHERE entry_id = $1 AND example_id = $2 AND sense_id = $3`,
      [entryId, exampleId, senseId],
    );

    if (existing.rows[0]) {
      if (existing.rows[0].display_order === displayOrder) {
        bump(summary.entry_examples, "unchanged");
      } else {
        await db.query(
          `UPDATE public.entry_examples SET display_order = $1
           WHERE entry_id = $2 AND example_id = $3 AND sense_id = $4`,
          [displayOrder, entryId, exampleId, senseId],
        );
        bump(summary.entry_examples, "updated");
      }
      continue;
    }

    await db.query(
      `INSERT INTO public.entry_examples (entry_id, example_id, sense_id, display_order)
       VALUES ($1,$2,$3,$4)`,
      [entryId, exampleId, senseId, displayOrder],
    );
    bump(summary.entry_examples, "inserted");
  }

  return { summary, maps };
}

export function formatWriteSummary(summary: ImportWriteSummary): string {
  const lines = ["--- Live import summary ---"];
  for (const [entity, counts] of Object.entries(summary)) {
    lines.push(
      `${entity}: inserted=${counts.inserted}, updated=${counts.updated}, unchanged=${counts.unchanged}`,
    );
  }
  return lines.join("\n");
}

/** Pure helper for tests: resolve maps without DB. */
export function resolveSenseEntryOwnership(
  senseImportKey: string,
  entryImportKey: string,
  senseRows: CsvRow[],
): boolean {
  const sense = senseRows.find((r) => r.import_key?.trim() === senseImportKey);
  return sense?.entry_import_key?.trim() === entryImportKey;
}

/** Pure keyed-row policy for tests. */
export function classifyKeyedRowWrite(
  existing: { id: string; status: string } | null,
): "insert" | "update" | "unchanged" | "blocked" {
  if (!existing) return "insert";
  if (!SAFE_IMPORT_STATUSES.has(existing.status)) return "blocked";
  return "update";
}

export function preserveUuidOnUpsert(
  existingId: string,
  operation: "insert" | "update" | "unchanged",
): string {
  if (operation === "insert") return "new-uuid";
  return existingId;
}
