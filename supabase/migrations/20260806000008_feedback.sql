-- Phase 6A: feedback table, target-consistency helper, target-deletion markers

CREATE OR REPLACE FUNCTION public.feedback_targets_are_consistent(
  p_target_kind text,
  p_target_was_deleted boolean,
  p_entry_id uuid,
  p_sense_id uuid,
  p_sense_translation_id uuid,
  p_example_id uuid,
  p_example_translation_id uuid,
  p_sound_change_rule_id uuid,
  p_conjugation_result_id uuid,
  p_hanja_character_id uuid,
  p_hanja_term_id uuid,
  p_idiom_id uuid
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_target_was_deleted AND pg_catalog.num_nonnulls(
      p_entry_id, p_sense_id, p_sense_translation_id, p_example_id, p_example_translation_id,
      p_sound_change_rule_id, p_conjugation_result_id, p_hanja_character_id, p_hanja_term_id, p_idiom_id
    ) <> 0 THEN false
    WHEN p_target_kind = 'page' THEN
      NOT p_target_was_deleted
      AND pg_catalog.num_nonnulls(
        p_entry_id, p_sense_id, p_sense_translation_id, p_example_id, p_example_translation_id,
        p_sound_change_rule_id, p_conjugation_result_id, p_hanja_character_id, p_hanja_term_id, p_idiom_id
      ) = 0
    WHEN p_target_kind = 'entry' THEN (
      NOT p_target_was_deleted
      AND p_entry_id IS NOT NULL
      AND pg_catalog.num_nonnulls(
        p_sense_id, p_sense_translation_id, p_example_id, p_example_translation_id,
        p_sound_change_rule_id, p_conjugation_result_id, p_hanja_character_id, p_hanja_term_id, p_idiom_id
      ) = 0
    ) OR (
      p_target_was_deleted
      AND pg_catalog.num_nonnulls(
        p_entry_id, p_sense_id, p_sense_translation_id, p_example_id, p_example_translation_id,
        p_sound_change_rule_id, p_conjugation_result_id, p_hanja_character_id, p_hanja_term_id, p_idiom_id
      ) = 0
    )
    WHEN p_target_kind = 'sense' THEN (
      NOT p_target_was_deleted AND p_sense_id IS NOT NULL
      AND pg_catalog.num_nonnulls(
        p_entry_id, p_sense_translation_id, p_example_id, p_example_translation_id,
        p_sound_change_rule_id, p_conjugation_result_id, p_hanja_character_id, p_hanja_term_id, p_idiom_id
      ) = 0
    ) OR (
      p_target_was_deleted
      AND pg_catalog.num_nonnulls(
        p_entry_id, p_sense_id, p_sense_translation_id, p_example_id, p_example_translation_id,
        p_sound_change_rule_id, p_conjugation_result_id, p_hanja_character_id, p_hanja_term_id, p_idiom_id
      ) = 0
    )
    WHEN p_target_kind = 'sense_translation' THEN (
      NOT p_target_was_deleted AND p_sense_translation_id IS NOT NULL
      AND pg_catalog.num_nonnulls(
        p_entry_id, p_sense_id, p_example_id, p_example_translation_id,
        p_sound_change_rule_id, p_conjugation_result_id, p_hanja_character_id, p_hanja_term_id, p_idiom_id
      ) = 0
    ) OR (
      p_target_was_deleted
      AND pg_catalog.num_nonnulls(
        p_entry_id, p_sense_id, p_sense_translation_id, p_example_id, p_example_translation_id,
        p_sound_change_rule_id, p_conjugation_result_id, p_hanja_character_id, p_hanja_term_id, p_idiom_id
      ) = 0
    )
    WHEN p_target_kind = 'example' THEN (
      NOT p_target_was_deleted AND p_example_id IS NOT NULL
      AND pg_catalog.num_nonnulls(
        p_entry_id, p_sense_id, p_sense_translation_id, p_example_translation_id,
        p_sound_change_rule_id, p_conjugation_result_id, p_hanja_character_id, p_hanja_term_id, p_idiom_id
      ) = 0
    ) OR (
      p_target_was_deleted
      AND pg_catalog.num_nonnulls(
        p_entry_id, p_sense_id, p_sense_translation_id, p_example_id, p_example_translation_id,
        p_sound_change_rule_id, p_conjugation_result_id, p_hanja_character_id, p_hanja_term_id, p_idiom_id
      ) = 0
    )
    WHEN p_target_kind = 'example_translation' THEN (
      NOT p_target_was_deleted AND p_example_translation_id IS NOT NULL
      AND pg_catalog.num_nonnulls(
        p_entry_id, p_sense_id, p_sense_translation_id, p_example_id,
        p_sound_change_rule_id, p_conjugation_result_id, p_hanja_character_id, p_hanja_term_id, p_idiom_id
      ) = 0
    ) OR (
      p_target_was_deleted
      AND pg_catalog.num_nonnulls(
        p_entry_id, p_sense_id, p_sense_translation_id, p_example_id, p_example_translation_id,
        p_sound_change_rule_id, p_conjugation_result_id, p_hanja_character_id, p_hanja_term_id, p_idiom_id
      ) = 0
    )
    WHEN p_target_kind = 'sound_change_rule' THEN (
      NOT p_target_was_deleted AND p_sound_change_rule_id IS NOT NULL
      AND pg_catalog.num_nonnulls(
        p_entry_id, p_sense_id, p_sense_translation_id, p_example_id, p_example_translation_id,
        p_conjugation_result_id, p_hanja_character_id, p_hanja_term_id, p_idiom_id
      ) = 0
    ) OR (
      p_target_was_deleted
      AND pg_catalog.num_nonnulls(
        p_entry_id, p_sense_id, p_sense_translation_id, p_example_id, p_example_translation_id,
        p_sound_change_rule_id, p_conjugation_result_id, p_hanja_character_id, p_hanja_term_id, p_idiom_id
      ) = 0
    )
    WHEN p_target_kind = 'conjugation_result' THEN (
      NOT p_target_was_deleted AND p_conjugation_result_id IS NOT NULL
      AND pg_catalog.num_nonnulls(
        p_entry_id, p_sense_id, p_sense_translation_id, p_example_id, p_example_translation_id,
        p_sound_change_rule_id, p_hanja_character_id, p_hanja_term_id, p_idiom_id
      ) = 0
    ) OR (
      p_target_was_deleted
      AND pg_catalog.num_nonnulls(
        p_entry_id, p_sense_id, p_sense_translation_id, p_example_id, p_example_translation_id,
        p_sound_change_rule_id, p_conjugation_result_id, p_hanja_character_id, p_hanja_term_id, p_idiom_id
      ) = 0
    )
    WHEN p_target_kind = 'hanja_character' THEN (
      NOT p_target_was_deleted AND p_hanja_character_id IS NOT NULL
      AND pg_catalog.num_nonnulls(
        p_entry_id, p_sense_id, p_sense_translation_id, p_example_id, p_example_translation_id,
        p_sound_change_rule_id, p_conjugation_result_id, p_hanja_term_id, p_idiom_id
      ) = 0
    ) OR (
      p_target_was_deleted
      AND pg_catalog.num_nonnulls(
        p_entry_id, p_sense_id, p_sense_translation_id, p_example_id, p_example_translation_id,
        p_sound_change_rule_id, p_conjugation_result_id, p_hanja_character_id, p_hanja_term_id, p_idiom_id
      ) = 0
    )
    WHEN p_target_kind = 'hanja_term' THEN (
      NOT p_target_was_deleted AND p_hanja_term_id IS NOT NULL
      AND pg_catalog.num_nonnulls(
        p_entry_id, p_sense_id, p_sense_translation_id, p_example_id, p_example_translation_id,
        p_sound_change_rule_id, p_conjugation_result_id, p_hanja_character_id, p_idiom_id
      ) = 0
    ) OR (
      p_target_was_deleted
      AND pg_catalog.num_nonnulls(
        p_entry_id, p_sense_id, p_sense_translation_id, p_example_id, p_example_translation_id,
        p_sound_change_rule_id, p_conjugation_result_id, p_hanja_character_id, p_hanja_term_id, p_idiom_id
      ) = 0
    )
    WHEN p_target_kind = 'idiom' THEN (
      NOT p_target_was_deleted AND p_idiom_id IS NOT NULL
      AND pg_catalog.num_nonnulls(
        p_entry_id, p_sense_id, p_sense_translation_id, p_example_id, p_example_translation_id,
        p_sound_change_rule_id, p_conjugation_result_id, p_hanja_character_id, p_hanja_term_id
      ) = 0
    ) OR (
      p_target_was_deleted
      AND pg_catalog.num_nonnulls(
        p_entry_id, p_sense_id, p_sense_translation_id, p_example_id, p_example_translation_id,
        p_sound_change_rule_id, p_conjugation_result_id, p_hanja_character_id, p_hanja_term_id, p_idiom_id
      ) = 0
    )
    ELSE false
  END;
$$;

CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_kind text NOT NULL,
  category text NOT NULL,
  message text NOT NULL,
  contact_email text,
  reported_path text,
  target_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  client_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'new',
  target_was_deleted boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  entry_id uuid REFERENCES public.entries (id) ON DELETE SET NULL,
  sense_id uuid REFERENCES public.senses (id) ON DELETE SET NULL,
  sense_translation_id uuid REFERENCES public.sense_translations (id) ON DELETE SET NULL,
  example_id uuid REFERENCES public.examples (id) ON DELETE SET NULL,
  example_translation_id uuid REFERENCES public.example_translations (id) ON DELETE SET NULL,
  sound_change_rule_id uuid REFERENCES public.sound_change_rules (id) ON DELETE SET NULL,
  conjugation_result_id uuid REFERENCES public.conjugation_results (id) ON DELETE SET NULL,
  hanja_character_id uuid REFERENCES public.hanja_characters (id) ON DELETE SET NULL,
  hanja_term_id uuid REFERENCES public.hanja_terms (id) ON DELETE SET NULL,
  idiom_id uuid REFERENCES public.idioms (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feedback_target_kind_check CHECK (
    target_kind IN (
      'page', 'entry', 'sense', 'sense_translation', 'example',
      'example_translation', 'sound_change_rule', 'conjugation_result',
      'hanja_character', 'hanja_term', 'idiom'
    )
  ),
  CONSTRAINT feedback_category_check CHECK (
    category IN (
      'incorrect_content', 'translation_issue', 'pronunciation_issue',
      'sound_change_issue', 'conjugation_issue', 'hanja_issue',
      'example_issue', 'broken_link', 'display_issue', 'technical_issue',
      'copyright_issue', 'other'
    )
  ),
  CONSTRAINT feedback_status_check CHECK (
    status IN ('new', 'reviewing', 'resolved', 'rejected', 'duplicate', 'spam')
  ),
  CONSTRAINT feedback_message_length CHECK (
    pg_catalog.char_length(pg_catalog.btrim(message)) >= 10 AND pg_catalog.char_length(message) <= 5000
  ),
  CONSTRAINT feedback_contact_email_length CHECK (
    contact_email IS NULL OR pg_catalog.char_length(contact_email) <= 320
  ),
  CONSTRAINT feedback_deleted_requires_null_targets CHECK (
    NOT target_was_deleted OR pg_catalog.num_nonnulls(
      entry_id, sense_id, sense_translation_id, example_id, example_translation_id,
      sound_change_rule_id, conjugation_result_id, hanja_character_id, hanja_term_id, idiom_id
    ) = 0
  ),
  CONSTRAINT feedback_target_consistency CHECK (
    public.feedback_targets_are_consistent(
      target_kind,
      target_was_deleted,
      entry_id,
      sense_id,
      sense_translation_id,
      example_id,
      example_translation_id,
      sound_change_rule_id,
      conjugation_result_id,
      hanja_character_id,
      hanja_term_id,
      idiom_id
    )
  ),
  CONSTRAINT feedback_resolved_requires_timestamp CHECK (
    status <> 'resolved' OR resolved_at IS NOT NULL
  ),
  CONSTRAINT feedback_target_snapshot_object CHECK (pg_catalog.jsonb_typeof(target_snapshot) = 'object'),
  CONSTRAINT feedback_client_context_object CHECK (pg_catalog.jsonb_typeof(client_context) = 'object')
);

CREATE INDEX feedback_status_idx ON public.feedback (status);
CREATE INDEX feedback_target_kind_idx ON public.feedback (target_kind);
CREATE INDEX feedback_category_idx ON public.feedback (category);
CREATE INDEX feedback_created_at_idx ON public.feedback (created_at);
CREATE INDEX feedback_target_was_deleted_idx ON public.feedback (target_was_deleted)
  WHERE target_was_deleted = true;

CREATE TRIGGER feedback_set_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Mark feedback rows before ON DELETE SET NULL clears the FK (target_kind preserved).
CREATE OR REPLACE FUNCTION public.trg_mark_feedback_entry_target_deleted()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  UPDATE public.feedback
  SET target_was_deleted = true, entry_id = NULL
  WHERE entry_id = OLD.id AND target_kind = 'entry';
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_mark_feedback_sense_target_deleted()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  UPDATE public.feedback
  SET target_was_deleted = true, sense_id = NULL
  WHERE sense_id = OLD.id AND target_kind = 'sense';
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_mark_feedback_sense_translation_target_deleted()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  UPDATE public.feedback
  SET target_was_deleted = true, sense_translation_id = NULL
  WHERE sense_translation_id = OLD.id AND target_kind = 'sense_translation';
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_mark_feedback_example_target_deleted()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  UPDATE public.feedback
  SET target_was_deleted = true, example_id = NULL
  WHERE example_id = OLD.id AND target_kind = 'example';
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_mark_feedback_example_translation_target_deleted()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  UPDATE public.feedback
  SET target_was_deleted = true, example_translation_id = NULL
  WHERE example_translation_id = OLD.id AND target_kind = 'example_translation';
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_mark_feedback_sound_change_rule_target_deleted()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  UPDATE public.feedback
  SET target_was_deleted = true, sound_change_rule_id = NULL
  WHERE sound_change_rule_id = OLD.id AND target_kind = 'sound_change_rule';
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_mark_feedback_conjugation_result_target_deleted()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  UPDATE public.feedback
  SET target_was_deleted = true, conjugation_result_id = NULL
  WHERE conjugation_result_id = OLD.id AND target_kind = 'conjugation_result';
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_mark_feedback_hanja_character_target_deleted()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  UPDATE public.feedback
  SET target_was_deleted = true, hanja_character_id = NULL
  WHERE hanja_character_id = OLD.id AND target_kind = 'hanja_character';
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_mark_feedback_hanja_term_target_deleted()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  UPDATE public.feedback
  SET target_was_deleted = true, hanja_term_id = NULL
  WHERE hanja_term_id = OLD.id AND target_kind = 'hanja_term';
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_mark_feedback_idiom_target_deleted()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  UPDATE public.feedback
  SET target_was_deleted = true, idiom_id = NULL
  WHERE idiom_id = OLD.id AND target_kind = 'idiom';
  RETURN OLD;
END;
$$;

CREATE TRIGGER entries_mark_feedback_target_deleted
  BEFORE DELETE ON public.entries
  FOR EACH ROW EXECUTE FUNCTION public.trg_mark_feedback_entry_target_deleted();

CREATE TRIGGER senses_mark_feedback_target_deleted
  BEFORE DELETE ON public.senses
  FOR EACH ROW EXECUTE FUNCTION public.trg_mark_feedback_sense_target_deleted();

CREATE TRIGGER sense_translations_mark_feedback_target_deleted
  BEFORE DELETE ON public.sense_translations
  FOR EACH ROW EXECUTE FUNCTION public.trg_mark_feedback_sense_translation_target_deleted();

CREATE TRIGGER examples_mark_feedback_target_deleted
  BEFORE DELETE ON public.examples
  FOR EACH ROW EXECUTE FUNCTION public.trg_mark_feedback_example_target_deleted();

CREATE TRIGGER example_translations_mark_feedback_target_deleted
  BEFORE DELETE ON public.example_translations
  FOR EACH ROW EXECUTE FUNCTION public.trg_mark_feedback_example_translation_target_deleted();

CREATE TRIGGER sound_change_rules_mark_feedback_target_deleted
  BEFORE DELETE ON public.sound_change_rules
  FOR EACH ROW EXECUTE FUNCTION public.trg_mark_feedback_sound_change_rule_target_deleted();

CREATE TRIGGER conjugation_results_mark_feedback_target_deleted
  BEFORE DELETE ON public.conjugation_results
  FOR EACH ROW EXECUTE FUNCTION public.trg_mark_feedback_conjugation_result_target_deleted();

CREATE TRIGGER hanja_characters_mark_feedback_target_deleted
  BEFORE DELETE ON public.hanja_characters
  FOR EACH ROW EXECUTE FUNCTION public.trg_mark_feedback_hanja_character_target_deleted();

CREATE TRIGGER hanja_terms_mark_feedback_target_deleted
  BEFORE DELETE ON public.hanja_terms
  FOR EACH ROW EXECUTE FUNCTION public.trg_mark_feedback_hanja_term_target_deleted();

CREATE TRIGGER idioms_mark_feedback_target_deleted
  BEFORE DELETE ON public.idioms
  FOR EACH ROW EXECUTE FUNCTION public.trg_mark_feedback_idiom_target_deleted();
