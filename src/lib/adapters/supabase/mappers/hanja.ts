import type { Locale } from "@/lib/constants/locales";
import type { PartOfSpeech } from "@/lib/constants/part-of-speech";
import type { PublicationStatus } from "@/lib/constants/publication-status";
import type { Database } from "@/lib/supabase/types";
import {
  filterPublishedTranslationRows,
  pickLocalized,
} from "@/lib/adapters/supabase/mappers/translations";
import type { HanjaCharacter, HanjaEntryDetail, HanjaEntrySummary } from "@/lib/types/hanja";

type TermRow = Database["public"]["Tables"]["hanja_terms"]["Row"];
type EntryRow = Database["public"]["Tables"]["entries"]["Row"];
type TermCharacterRow = Database["public"]["Tables"]["hanja_term_characters"]["Row"];
type CharacterRow = Database["public"]["Tables"]["hanja_characters"]["Row"];
type ReadingRow = Database["public"]["Tables"]["hanja_readings"]["Row"];
type CharacterTranslationRow =
  Database["public"]["Tables"]["hanja_character_translations"]["Row"];
type TermCharacterTranslationRow =
  Database["public"]["Tables"]["hanja_term_character_translations"]["Row"];
type SenseTranslationRow =
  Database["public"]["Tables"]["sense_translations"]["Row"];

export type HanjaTermBundle = {
  term: TermRow;
  entry: EntryRow | null;
  characters: Array<{
    slot: TermCharacterRow;
    character: CharacterRow;
    reading: ReadingRow | null;
    termMeaningTranslations: TermCharacterTranslationRow[];
    characterMeaningTranslations: CharacterTranslationRow[];
  }>;
  entrySenseTranslations: SenseTranslationRow[];
  entryGeneralNotes: Array<{ locale: string; status: string; general_note: string | null }>;
};

function definitionFromEntry(bundle: HanjaTermBundle, locale: Locale) {
  const published = filterPublishedTranslationRows(bundle.entrySenseTranslations);
  return pickLocalized(
    published,
    locale,
    (row) => row.short_definition ?? row.definition ?? ""
  );
}

export function mapHanjaCharacters(bundle: HanjaTermBundle): HanjaCharacter[] {
  return bundle.characters
    .sort((a, b) => a.slot.position - b.slot.position)
    .map(({ slot, character, reading, termMeaningTranslations }) => {
      const published = filterPublishedTranslationRows(termMeaningTranslations);
      const meaning =
        published.find((row) => row.locale === "en")?.meaning_in_term ??
        published[0]?.meaning_in_term ??
        "";

      return {
        id: slot.id,
        hanjaEntryId: bundle.term.id,
        character: character.character,
        readingKo: reading?.reading_hangul ?? "",
        meaning,
        sortOrder: slot.position,
      };
    });
}

export function mapHanjaEntrySummary(
  bundle: HanjaTermBundle,
  locale: Locale
): HanjaEntrySummary {
  const entry = bundle.entry;
  return {
    id: bundle.term.id,
    slug: bundle.term.slug,
    wordKo: entry?.headword ?? bundle.term.korean_hanja,
    hanjaText: bundle.term.korean_hanja,
    pronunciation: entry?.pronunciation_hangul ?? entry?.romanization ?? "",
    partOfSpeech: (entry?.part_of_speech as PartOfSpeech) ?? "noun",
    definition: definitionFromEntry(bundle, locale),
  };
}

export function mapHanjaEntryDetail(
  bundle: HanjaTermBundle,
  locale: Locale,
  relatedSummaries: HanjaEntrySummary[]
): HanjaEntryDetail {
  const entry = bundle.entry;
  const publishedNotes = filterPublishedTranslationRows(bundle.entryGeneralNotes);

  return {
    id: bundle.term.id,
    slug: bundle.term.slug,
    wordKo: entry?.headword ?? bundle.term.korean_hanja,
    hanjaText: bundle.term.korean_hanja,
    pronunciation: entry?.pronunciation_hangul ?? entry?.romanization ?? "",
    romanization: entry?.romanization ?? null,
    partOfSpeech: (entry?.part_of_speech as PartOfSpeech) ?? "noun",
    entryId: entry?.id ?? null,
    entrySlug: entry?.slug ?? null,
    status: bundle.term.status as PublicationStatus,
    createdAt: bundle.term.created_at,
    updatedAt: bundle.term.updated_at,
    publishedAt: bundle.term.published_at,
    definition: definitionFromEntry(bundle, locale),
    notes: pickLocalized(publishedNotes, locale, (row) => row.general_note ?? null),
    characters: mapHanjaCharacters(bundle),
    relatedByCharacter: relatedSummaries,
  };
}
