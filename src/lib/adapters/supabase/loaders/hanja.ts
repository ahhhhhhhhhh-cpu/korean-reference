import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { HanjaTermBundle } from "@/lib/adapters/supabase/mappers/hanja";

export async function loadHanjaTermBundles(): Promise<HanjaTermBundle[]> {
  const supabase = createSupabaseServerClient();

  const [
    { data: terms, error: termsError },
    { data: entries, error: entriesError },
    { data: termCharacters, error: termCharactersError },
    { data: characters, error: charactersError },
    { data: readings, error: readingsError },
    { data: characterTranslations, error: characterTranslationsError },
    { data: termCharacterTranslations, error: termCharacterTranslationsError },
    { data: senses, error: sensesError },
    { data: senseTranslations, error: senseTranslationsError },
    { data: entryTranslations, error: entryTranslationsError },
  ] = await Promise.all([
    supabase.from("hanja_terms").select("*").order("slug"),
    supabase.from("entries").select("*"),
    supabase.from("hanja_term_characters").select("*"),
    supabase.from("hanja_characters").select("*"),
    supabase.from("hanja_readings").select("*"),
    supabase.from("hanja_character_translations").select("*"),
    supabase.from("hanja_term_character_translations").select("*"),
    supabase.from("senses").select("*").eq("is_primary", true),
    supabase.from("sense_translations").select("*"),
    supabase.from("entry_translations").select("*"),
  ]);

  const error =
    termsError ??
    entriesError ??
    termCharactersError ??
    charactersError ??
    readingsError ??
    characterTranslationsError ??
    termCharacterTranslationsError ??
    sensesError ??
    senseTranslationsError ??
    entryTranslationsError;

  if (error) {
    throw new Error(`Failed to load hanja terms: ${error.message}`);
  }

  const entriesById = new Map((entries ?? []).map((row) => [row.id, row]));
  const charactersById = new Map((characters ?? []).map((row) => [row.id, row]));
  const readingsById = new Map((readings ?? []).map((row) => [row.id, row]));

  const characterTranslationsByCharacter = new Map<
    string,
    NonNullable<typeof characterTranslations>
  >();
  for (const row of characterTranslations ?? []) {
    const bucket = characterTranslationsByCharacter.get(row.character_id) ?? [];
    bucket.push(row);
    characterTranslationsByCharacter.set(row.character_id, bucket);
  }

  const termCharacterTranslationsBySlot = new Map<
    string,
    NonNullable<typeof termCharacterTranslations>
  >();
  for (const row of termCharacterTranslations ?? []) {
    const bucket = termCharacterTranslationsBySlot.get(row.term_character_id) ?? [];
    bucket.push(row);
    termCharacterTranslationsBySlot.set(row.term_character_id, bucket);
  }

  const slotsByTerm = new Map<string, NonNullable<typeof termCharacters>>();
  for (const row of termCharacters ?? []) {
    const bucket = slotsByTerm.get(row.term_id) ?? [];
    bucket.push(row);
    slotsByTerm.set(row.term_id, bucket);
  }

  const primarySenseByEntry = new Map(
    (senses ?? []).map((sense) => [sense.entry_id, sense])
  );
  const senseTranslationsBySense = new Map<
    string,
    NonNullable<typeof senseTranslations>
  >();
  for (const row of senseTranslations ?? []) {
    const bucket = senseTranslationsBySense.get(row.sense_id) ?? [];
    bucket.push(row);
    senseTranslationsBySense.set(row.sense_id, bucket);
  }

  const entryTranslationsByEntry = new Map<
    string,
    NonNullable<typeof entryTranslations>
  >();
  for (const row of entryTranslations ?? []) {
    const bucket = entryTranslationsByEntry.get(row.entry_id) ?? [];
    bucket.push(row);
    entryTranslationsByEntry.set(row.entry_id, bucket);
  }

  return (terms ?? []).map((term) => {
    const entry = entriesById.get(term.entry_id) ?? null;
    const primarySense = entry ? primarySenseByEntry.get(entry.id) ?? null : null;

    return {
      term,
      entry,
      characters: (slotsByTerm.get(term.id) ?? []).flatMap((slot) => {
        const character = charactersById.get(slot.character_id);
        if (!character) return [];
        return [
          {
            slot,
            character,
            reading: slot.reading_id ? readingsById.get(slot.reading_id) ?? null : null,
            termMeaningTranslations:
              termCharacterTranslationsBySlot.get(slot.id) ?? [],
            characterMeaningTranslations:
              characterTranslationsByCharacter.get(slot.character_id) ?? [],
          },
        ];
      }),
      entrySenseTranslations: primarySense
        ? senseTranslationsBySense.get(primarySense.id) ?? []
        : [],
      entryGeneralNotes: entry
        ? (entryTranslationsByEntry.get(entry.id) ?? []).map((row) => ({
            locale: row.locale,
            status: row.status,
            general_note: row.general_note,
          }))
        : [],
    };
  });
}

export async function loadHanjaTermBundleBySlug(
  slug: string
): Promise<HanjaTermBundle | null> {
  const bundles = await loadHanjaTermBundles();
  return bundles.find((bundle) => bundle.term.slug === slug) ?? null;
}

export async function loadHanjaTermBundlesByCharacter(
  character: string
): Promise<HanjaTermBundle[]> {
  const bundles = await loadHanjaTermBundles();
  return bundles.filter((bundle) =>
    bundle.characters.some((item) => item.character.character === character)
  );
}
