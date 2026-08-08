-- Phase 7C-4B-1R-A2: add bound_noun as canonical part_of_speech (schema only)

BEGIN;

ALTER TABLE public.entries
  DROP CONSTRAINT entries_part_of_speech_check;

ALTER TABLE public.entries
  ADD CONSTRAINT entries_part_of_speech_check CHECK (
    part_of_speech IN (
      'verb',
      'adjective',
      'noun',
      'adverb',
      'particle',
      'other',
      'bound_noun'
    )
  );

COMMIT;
