-- Phase 6A / 6A.2: publication integrity, deferred child/reverse triggers, timestamp CHECKs

-- ---------------------------------------------------------------------------
-- Publication validators
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.validate_entry_publishable(p_entry_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_entry public.entries%ROWTYPE;
  v_has_primary_en boolean;
  v_missing_en_sense_count integer;
BEGIN
  SELECT * INTO v_entry FROM public.entries WHERE id = p_entry_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'entry % not found', p_entry_id;
  END IF;

  IF pg_catalog.btrim(v_entry.headword) = '' OR pg_catalog.btrim(v_entry.headword_normalized) = '' THEN
    RAISE EXCEPTION 'entry % missing headword fields', p_entry_id;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.senses s
    WHERE s.entry_id = p_entry_id
      AND s.is_primary = true
      AND s.status = 'published'
  ) INTO v_has_primary_en;

  IF NOT v_has_primary_en THEN
    RAISE EXCEPTION 'entry % requires a published primary sense', p_entry_id;
  END IF;

  SELECT count(*) INTO v_missing_en_sense_count
  FROM public.senses s
  WHERE s.entry_id = p_entry_id
    AND s.status = 'published'
    AND NOT EXISTS (
      SELECT 1
      FROM public.sense_translations st
      WHERE st.sense_id = s.id
        AND st.locale = 'en'
        AND st.status = 'published'
        AND (
          (st.short_definition IS NOT NULL AND pg_catalog.btrim(st.short_definition) <> '')
          OR (st.definition IS NOT NULL AND pg_catalog.btrim(st.definition) <> '')
        )
    );

  IF v_missing_en_sense_count > 0 THEN
    RAISE EXCEPTION 'entry % requires published English definition for every published sense', p_entry_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_example_publishable(p_example_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_example public.examples%ROWTYPE;
  v_has_translation boolean;
  v_has_source_attribution boolean;
BEGIN
  SELECT * INTO v_example FROM public.examples WHERE id = p_example_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'example % not found', p_example_id;
  END IF;

  IF pg_catalog.btrim(v_example.korean_text) = '' THEN
    RAISE EXCEPTION 'example % missing korean_text', p_example_id;
  END IF;

  IF v_example.provenance_type = 'unknown' THEN
    RAISE EXCEPTION 'example % with provenance_type unknown cannot be published', p_example_id;
  END IF;

  IF v_example.provenance_type IN ('adapted', 'quoted', 'licensed', 'public_domain') THEN
    SELECT (
      pg_catalog.btrim(COALESCE(v_example.source_note, '')) <> ''
      OR EXISTS (
        SELECT 1 FROM public.content_sources cs
        WHERE cs.example_id = p_example_id
      )
    ) INTO v_has_source_attribution;

    IF NOT v_has_source_attribution THEN
      RAISE EXCEPTION 'example % requires source_note or content_sources link for provenance_type %',
        p_example_id, v_example.provenance_type;
    END IF;
  END IF;

  IF v_example.provenance_type = 'licensed' THEN
    IF NOT (
      pg_catalog.btrim(COALESCE(v_example.license_note, '')) <> ''
      OR EXISTS (
        SELECT 1
        FROM public.content_sources cs
        JOIN public.sources s ON s.id = cs.source_id
        WHERE cs.example_id = p_example_id
          AND s.license IS NOT NULL
          AND pg_catalog.btrim(s.license) <> ''
      )
    ) THEN
      RAISE EXCEPTION 'example % with provenance_type licensed requires license_note or linked source license',
        p_example_id;
    END IF;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.example_translations et
    WHERE et.example_id = p_example_id AND et.status = 'published'
  ) INTO v_has_translation;

  IF NOT v_has_translation THEN
    RAISE EXCEPTION 'example % requires at least one published translation (any locale)', p_example_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_sound_change_rule_publishable(p_rule_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_rule public.sound_change_rules%ROWTYPE;
  v_has_en boolean;
  v_has_step boolean;
BEGIN
  SELECT * INTO v_rule FROM public.sound_change_rules WHERE id = p_rule_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'sound_change_rule % not found', p_rule_id;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.sound_change_translations t
    WHERE t.rule_id = p_rule_id AND t.locale = 'en' AND t.status = 'published'
      AND pg_catalog.btrim(t.name) <> ''
      AND t.description IS NOT NULL
      AND pg_catalog.btrim(t.description) <> ''
  ) INTO v_has_en;

  IF NOT v_has_en THEN
    RAISE EXCEPTION 'sound_change_rule % requires published English name and description', p_rule_id;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.sound_change_steps s WHERE s.rule_id = p_rule_id
  ) INTO v_has_step;

  IF NOT v_has_step THEN
    RAISE EXCEPTION 'sound_change_rule % requires at least one step', p_rule_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_conjugation_form_publishable(p_form_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_has_en boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.conjugation_form_translations t
    WHERE t.form_id = p_form_id AND t.locale = 'en' AND t.status = 'published'
      AND pg_catalog.btrim(t.name) <> ''
  ) INTO v_has_en;

  IF NOT v_has_en THEN
    RAISE EXCEPTION 'conjugation_form % requires published English name', p_form_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_conjugation_rule_publishable(p_rule_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_has_en boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.conjugation_rule_translations t
    WHERE t.rule_id = p_rule_id AND t.locale = 'en' AND t.status = 'published'
      AND pg_catalog.btrim(t.title) <> ''
      AND t.explanation IS NOT NULL
      AND pg_catalog.btrim(t.explanation) <> ''
  ) INTO v_has_en;

  IF NOT v_has_en THEN
    RAISE EXCEPTION 'conjugation_rule % requires published English title and explanation', p_rule_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_conjugation_result_publishable(p_result_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_result public.conjugation_results%ROWTYPE;
  v_entry_status text;
  v_form_status text;
  v_rule_status text;
  v_has_steps boolean;
BEGIN
  SELECT * INTO v_result FROM public.conjugation_results WHERE id = p_result_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'conjugation_result % not found', p_result_id;
  END IF;

  SELECT status INTO v_entry_status FROM public.entries WHERE id = v_result.entry_id;
  IF v_entry_status IS DISTINCT FROM 'published' THEN
    RAISE EXCEPTION 'conjugation_result % requires published entry', p_result_id;
  END IF;

  SELECT status INTO v_form_status FROM public.conjugation_forms WHERE id = v_result.form_id;
  IF v_form_status IS DISTINCT FROM 'published' THEN
    RAISE EXCEPTION 'conjugation_result % requires published conjugation form', p_result_id;
  END IF;

  IF v_result.rule_id IS NOT NULL THEN
    SELECT status INTO v_rule_status FROM public.conjugation_rules WHERE id = v_result.rule_id;
    IF v_rule_status IS DISTINCT FROM 'published' THEN
      RAISE EXCEPTION 'conjugation_result % requires published conjugation rule when rule_id is set', p_result_id;
    END IF;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.conjugation_result_steps crs
    JOIN public.conjugation_result_step_translations crst ON crst.step_id = crs.id
    WHERE crs.result_id = p_result_id
      AND crst.locale = 'en'
      AND crst.status = 'published'
  ) INTO v_has_steps;

  IF NOT v_has_steps THEN
    RAISE EXCEPTION 'conjugation_result % requires at least one step with published English description', p_result_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_hanja_character_publishable(p_character_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_character public.hanja_characters%ROWTYPE;
  v_has_reading boolean;
  v_has_en boolean;
BEGIN
  SELECT * INTO v_character FROM public.hanja_characters WHERE id = p_character_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'hanja_character % not found', p_character_id;
  END IF;

  IF pg_catalog.btrim(v_character.character) = '' THEN
    RAISE EXCEPTION 'hanja_character % missing character glyph', p_character_id;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.hanja_readings r
    WHERE r.character_id = p_character_id
      AND r.status = 'published'
      AND pg_catalog.btrim(r.reading_hangul) <> ''
  ) INTO v_has_reading;

  IF NOT v_has_reading THEN
    RAISE EXCEPTION 'hanja_character % requires at least one published reading with reading_hangul', p_character_id;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.hanja_character_translations t
    WHERE t.character_id = p_character_id AND t.locale = 'en' AND t.status = 'published'
      AND pg_catalog.btrim(t.meaning) <> ''
  ) INTO v_has_en;

  IF NOT v_has_en THEN
    RAISE EXCEPTION 'hanja_character % requires published English meaning', p_character_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_hanja_term_publishable(p_term_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_term public.hanja_terms%ROWTYPE;
  v_entry_status text;
  v_char_count integer;
  v_min_position integer;
  v_max_position integer;
  v_concat text;
  v_missing_en integer;
  v_unpublished_character_count integer;
  v_invalid_reading_count integer;
BEGIN
  SELECT * INTO v_term FROM public.hanja_terms WHERE id = p_term_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'hanja_term % not found', p_term_id;
  END IF;

  SELECT status INTO v_entry_status FROM public.entries WHERE id = v_term.entry_id;
  IF v_entry_status IS DISTINCT FROM 'published' THEN
    RAISE EXCEPTION 'hanja_term % requires published entry', p_term_id;
  END IF;

  SELECT count(*), min(htc.position), max(htc.position)
  INTO v_char_count, v_min_position, v_max_position
  FROM public.hanja_term_characters htc
  WHERE htc.term_id = p_term_id;

  IF v_char_count = 0 THEN
    RAISE EXCEPTION 'hanja_term % requires at least one character link', p_term_id;
  END IF;

  IF v_min_position <> 1 OR v_max_position <> v_char_count THEN
    RAISE EXCEPTION 'hanja_term % requires positions starting at 1 and contiguous through %', p_term_id, v_char_count;
  END IF;

  SELECT pg_catalog.string_agg(c.character, '' ORDER BY htc.position)
  INTO v_concat
  FROM public.hanja_term_characters htc
  JOIN public.hanja_characters c ON c.id = htc.character_id
  WHERE htc.term_id = p_term_id;

  IF v_concat IS DISTINCT FROM v_term.korean_hanja THEN
    RAISE EXCEPTION 'hanja_term % character sequence must match korean_hanja', p_term_id;
  END IF;

  SELECT count(*) INTO v_unpublished_character_count
  FROM public.hanja_term_characters htc
  JOIN public.hanja_characters c ON c.id = htc.character_id
  WHERE htc.term_id = p_term_id
    AND c.status IS DISTINCT FROM 'published';

  IF v_unpublished_character_count > 0 THEN
    RAISE EXCEPTION 'hanja_term % requires every linked hanja_character to be published', p_term_id;
  END IF;

  SELECT count(*) INTO v_invalid_reading_count
  FROM public.hanja_term_characters htc
  LEFT JOIN public.hanja_readings r ON r.id = htc.reading_id
  WHERE htc.term_id = p_term_id
    AND htc.reading_id IS NOT NULL
    AND (
      r.id IS NULL
      OR r.status IS DISTINCT FROM 'published'
      OR r.character_id IS DISTINCT FROM htc.character_id
    );

  IF v_invalid_reading_count > 0 THEN
    RAISE EXCEPTION 'hanja_term % requires published reading belonging to the same character when reading_id is set',
      p_term_id;
  END IF;

  SELECT count(*) INTO v_missing_en
  FROM public.hanja_term_characters htc
  WHERE htc.term_id = p_term_id
    AND NOT EXISTS (
      SELECT 1 FROM public.hanja_term_character_translations htct
      WHERE htct.term_character_id = htc.id
        AND htct.locale = 'en'
        AND htct.status = 'published'
        AND pg_catalog.btrim(htct.meaning_in_term) <> ''
    );

  IF v_missing_en > 0 THEN
    RAISE EXCEPTION 'hanja_term % requires published English meaning for each character slot', p_term_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_idiom_publishable(p_idiom_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_has_en boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.idiom_translations t
    WHERE t.idiom_id = p_idiom_id AND t.locale = 'en' AND t.status = 'published'
      AND pg_catalog.btrim(t.actual_meaning) <> ''
  ) INTO v_has_en;

  IF NOT v_has_en THEN
    RAISE EXCEPTION 'idiom % requires published English actual_meaning', p_idiom_id;
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- Publish guards (run after *_01_sync_publication via trigger name order)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_entry_publish()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'published') THEN
    PERFORM public.validate_entry_publishable(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_example_publish()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'published') THEN
    PERFORM public.validate_example_publishable(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_sound_change_rule_publish()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'published') THEN
    PERFORM public.validate_sound_change_rule_publishable(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_conjugation_form_publish()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'published') THEN
    PERFORM public.validate_conjugation_form_publishable(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_conjugation_rule_publish()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'published') THEN
    PERFORM public.validate_conjugation_rule_publishable(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_conjugation_result_publish()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'published') THEN
    PERFORM public.validate_conjugation_result_publishable(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_hanja_character_publish()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'published') THEN
    PERFORM public.validate_hanja_character_publishable(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_hanja_term_publish()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'published') THEN
    PERFORM public.validate_hanja_term_publishable(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_idiom_publish()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'published') THEN
    PERFORM public.validate_idiom_publishable(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER entries_02_guard_publish
  BEFORE INSERT OR UPDATE OF status ON public.entries
  FOR EACH ROW EXECUTE FUNCTION public.guard_entry_publish();

CREATE TRIGGER examples_02_guard_publish
  BEFORE INSERT OR UPDATE OF status ON public.examples
  FOR EACH ROW EXECUTE FUNCTION public.guard_example_publish();

CREATE TRIGGER sound_change_rules_02_guard_publish
  BEFORE INSERT OR UPDATE OF status ON public.sound_change_rules
  FOR EACH ROW EXECUTE FUNCTION public.guard_sound_change_rule_publish();

CREATE TRIGGER conjugation_forms_02_guard_publish
  BEFORE INSERT OR UPDATE OF status ON public.conjugation_forms
  FOR EACH ROW EXECUTE FUNCTION public.guard_conjugation_form_publish();

CREATE TRIGGER conjugation_rules_02_guard_publish
  BEFORE INSERT OR UPDATE OF status ON public.conjugation_rules
  FOR EACH ROW EXECUTE FUNCTION public.guard_conjugation_rule_publish();

CREATE TRIGGER conjugation_results_02_guard_publish
  BEFORE INSERT OR UPDATE OF status ON public.conjugation_results
  FOR EACH ROW EXECUTE FUNCTION public.guard_conjugation_result_publish();

CREATE TRIGGER hanja_characters_02_guard_publish
  BEFORE INSERT OR UPDATE OF status ON public.hanja_characters
  FOR EACH ROW EXECUTE FUNCTION public.guard_hanja_character_publish();

CREATE TRIGGER hanja_terms_02_guard_publish
  BEFORE INSERT OR UPDATE OF status ON public.hanja_terms
  FOR EACH ROW EXECUTE FUNCTION public.guard_hanja_term_publish();

CREATE TRIGGER idioms_02_guard_publish
  BEFORE INSERT OR UPDATE OF status ON public.idioms
  FOR EACH ROW EXECUTE FUNCTION public.guard_idiom_publish();

-- ---------------------------------------------------------------------------
-- Batch revalidation helpers (fixed validators; no dynamic SQL)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.distinct_uuid_pair(a uuid, b uuid)
RETURNS uuid[]
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT COALESCE(
    ARRAY(
      SELECT DISTINCT v
      FROM pg_catalog.unnest(ARRAY[a, b]) AS u(v)
      WHERE v IS NOT NULL
    ),
    ARRAY[]::uuid[]
  );
$$;

CREATE OR REPLACE FUNCTION public.revalidate_published_sound_change_rules(p_rule_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_rule_ids IS NULL THEN
    RETURN;
  END IF;

  FOREACH v_id IN ARRAY p_rule_ids LOOP
    IF v_id IS NULL THEN
      CONTINUE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.sound_change_rules r
      WHERE r.id = v_id AND r.status = 'published'
    ) THEN
      PERFORM public.validate_sound_change_rule_publishable(v_id);
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.revalidate_published_conjugation_forms(p_form_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_form_ids IS NULL THEN
    RETURN;
  END IF;

  FOREACH v_id IN ARRAY p_form_ids LOOP
    IF v_id IS NULL THEN
      CONTINUE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.conjugation_forms f
      WHERE f.id = v_id AND f.status = 'published'
    ) THEN
      PERFORM public.validate_conjugation_form_publishable(v_id);
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.revalidate_published_conjugation_rules(p_rule_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_rule_ids IS NULL THEN
    RETURN;
  END IF;

  FOREACH v_id IN ARRAY p_rule_ids LOOP
    IF v_id IS NULL THEN
      CONTINUE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.conjugation_rules r
      WHERE r.id = v_id AND r.status = 'published'
    ) THEN
      PERFORM public.validate_conjugation_rule_publishable(v_id);
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.revalidate_published_conjugation_results(p_result_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_result_ids IS NULL THEN
    RETURN;
  END IF;

  FOREACH v_id IN ARRAY p_result_ids LOOP
    IF v_id IS NULL THEN
      CONTINUE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.conjugation_results cr
      WHERE cr.id = v_id AND cr.status = 'published'
    ) THEN
      PERFORM public.validate_conjugation_result_publishable(v_id);
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.revalidate_published_hanja_characters(p_character_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_character_ids IS NULL THEN
    RETURN;
  END IF;

  FOREACH v_id IN ARRAY p_character_ids LOOP
    IF v_id IS NULL THEN
      CONTINUE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.hanja_characters c
      WHERE c.id = v_id AND c.status = 'published'
    ) THEN
      PERFORM public.validate_hanja_character_publishable(v_id);
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.revalidate_published_hanja_terms(p_term_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_term_ids IS NULL THEN
    RETURN;
  END IF;

  FOREACH v_id IN ARRAY p_term_ids LOOP
    IF v_id IS NULL THEN
      CONTINUE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.hanja_terms ht
      WHERE ht.id = v_id AND ht.status = 'published'
    ) THEN
      PERFORM public.validate_hanja_term_publishable(v_id);
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.revalidate_published_idioms(p_idiom_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_idiom_ids IS NULL THEN
    RETURN;
  END IF;

  FOREACH v_id IN ARRAY p_idiom_ids LOOP
    IF v_id IS NULL THEN
      CONTINUE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.idioms i
      WHERE i.id = v_id AND i.status = 'published'
    ) THEN
      PERFORM public.validate_idiom_publishable(v_id);
    END IF;
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- Deferred child triggers (downward: child change → revalidate published parent)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.trg_deferred_revalidate_published_entry_from_sense()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_entry_id uuid;
BEGIN
  FOREACH v_entry_id IN ARRAY public.distinct_uuid_pair(NEW.entry_id, OLD.entry_id) LOOP
    IF v_entry_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.entries e
      WHERE e.id = v_entry_id AND e.status = 'published'
    ) THEN
      PERFORM public.validate_entry_publishable(v_entry_id);
    END IF;
  END LOOP;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE CONSTRAINT TRIGGER senses_revalidate_published_entry
  AFTER INSERT OR UPDATE OR DELETE ON public.senses
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.trg_deferred_revalidate_published_entry_from_sense();

CREATE OR REPLACE FUNCTION public.trg_deferred_revalidate_published_entry_from_sense_translation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_entry_ids uuid[];
  v_entry_id uuid;
BEGIN
  SELECT COALESCE(
    ARRAY(
      SELECT DISTINCT s.entry_id
      FROM public.senses s
      WHERE s.id IN (NEW.sense_id, OLD.sense_id)
        AND s.entry_id IS NOT NULL
    ),
    ARRAY[]::uuid[]
  ) INTO v_entry_ids;

  FOREACH v_entry_id IN ARRAY v_entry_ids LOOP
    IF EXISTS (
      SELECT 1 FROM public.entries e
      WHERE e.id = v_entry_id AND e.status = 'published'
    ) THEN
      PERFORM public.validate_entry_publishable(v_entry_id);
    END IF;
  END LOOP;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE CONSTRAINT TRIGGER sense_translations_revalidate_published_entry
  AFTER INSERT OR UPDATE OR DELETE ON public.sense_translations
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.trg_deferred_revalidate_published_entry_from_sense_translation();

CREATE OR REPLACE FUNCTION public.trg_deferred_revalidate_published_example_from_translation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_example_id uuid;
BEGIN
  FOREACH v_example_id IN ARRAY public.distinct_uuid_pair(NEW.example_id, OLD.example_id) LOOP
    IF v_example_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.examples ex
      WHERE ex.id = v_example_id AND ex.status = 'published'
    ) THEN
      PERFORM public.validate_example_publishable(v_example_id);
    END IF;
  END LOOP;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE CONSTRAINT TRIGGER example_translations_revalidate_published_example
  AFTER INSERT OR UPDATE OR DELETE ON public.example_translations
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.trg_deferred_revalidate_published_example_from_translation();

CREATE OR REPLACE FUNCTION public.trg_deferred_revalidate_sound_change_rule_from_translation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  PERFORM public.revalidate_published_sound_change_rules(
    public.distinct_uuid_pair(NEW.rule_id, OLD.rule_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE CONSTRAINT TRIGGER sound_change_translations_revalidate_published_rule
  AFTER INSERT OR UPDATE OR DELETE ON public.sound_change_translations
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.trg_deferred_revalidate_sound_change_rule_from_translation();

CREATE OR REPLACE FUNCTION public.trg_deferred_revalidate_sound_change_rule_from_step()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  PERFORM public.revalidate_published_sound_change_rules(
    public.distinct_uuid_pair(NEW.rule_id, OLD.rule_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE CONSTRAINT TRIGGER sound_change_steps_revalidate_published_rule
  AFTER INSERT OR UPDATE OR DELETE ON public.sound_change_steps
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.trg_deferred_revalidate_sound_change_rule_from_step();

CREATE OR REPLACE FUNCTION public.trg_deferred_revalidate_sound_change_rule_from_step_translation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_rule_ids uuid[];
BEGIN
  SELECT COALESCE(
    ARRAY(
      SELECT DISTINCT s.rule_id
      FROM public.sound_change_steps s
      WHERE s.id IN (NEW.step_id, OLD.step_id)
    ),
    ARRAY[]::uuid[]
  ) INTO v_rule_ids;

  PERFORM public.revalidate_published_sound_change_rules(v_rule_ids);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE CONSTRAINT TRIGGER sound_change_step_translations_revalidate_published_rule
  AFTER INSERT OR UPDATE OR DELETE ON public.sound_change_step_translations
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.trg_deferred_revalidate_sound_change_rule_from_step_translation();

CREATE OR REPLACE FUNCTION public.trg_deferred_revalidate_conjugation_form_from_translation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  PERFORM public.revalidate_published_conjugation_forms(
    public.distinct_uuid_pair(NEW.form_id, OLD.form_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE CONSTRAINT TRIGGER conjugation_form_translations_revalidate_published_form
  AFTER INSERT OR UPDATE OR DELETE ON public.conjugation_form_translations
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.trg_deferred_revalidate_conjugation_form_from_translation();

CREATE OR REPLACE FUNCTION public.trg_deferred_revalidate_conjugation_rule_from_translation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  PERFORM public.revalidate_published_conjugation_rules(
    public.distinct_uuid_pair(NEW.rule_id, OLD.rule_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE CONSTRAINT TRIGGER conjugation_rule_translations_revalidate_published_rule
  AFTER INSERT OR UPDATE OR DELETE ON public.conjugation_rule_translations
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.trg_deferred_revalidate_conjugation_rule_from_translation();

CREATE OR REPLACE FUNCTION public.trg_deferred_revalidate_conjugation_result_from_steps()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_result_ids uuid[];
BEGIN
  SELECT COALESCE(
    ARRAY(
      SELECT DISTINCT cr.id
      FROM public.conjugation_results cr
      WHERE cr.id = COALESCE(NEW.result_id, OLD.result_id)
    ),
    ARRAY[]::uuid[]
  ) INTO v_result_ids;

  PERFORM public.revalidate_published_conjugation_results(v_result_ids);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE CONSTRAINT TRIGGER conjugation_result_steps_revalidate_published_result
  AFTER INSERT OR UPDATE OR DELETE ON public.conjugation_result_steps
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.trg_deferred_revalidate_conjugation_result_from_steps();

CREATE OR REPLACE FUNCTION public.trg_deferred_revalidate_conjugation_result_from_step_translation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_result_ids uuid[];
BEGIN
  SELECT COALESCE(
    ARRAY(
      SELECT DISTINCT crs.result_id
      FROM public.conjugation_result_steps crs
      WHERE crs.id IN (NEW.step_id, OLD.step_id)
    ),
    ARRAY[]::uuid[]
  ) INTO v_result_ids;

  PERFORM public.revalidate_published_conjugation_results(v_result_ids);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE CONSTRAINT TRIGGER conjugation_result_step_translations_revalidate_published_result
  AFTER INSERT OR UPDATE OR DELETE ON public.conjugation_result_step_translations
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.trg_deferred_revalidate_conjugation_result_from_step_translation();

CREATE OR REPLACE FUNCTION public.trg_deferred_revalidate_hanja_character_from_reading()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  PERFORM public.revalidate_published_hanja_characters(
    public.distinct_uuid_pair(NEW.character_id, OLD.character_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE CONSTRAINT TRIGGER hanja_readings_revalidate_published_character
  AFTER INSERT OR UPDATE OR DELETE ON public.hanja_readings
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.trg_deferred_revalidate_hanja_character_from_reading();

CREATE OR REPLACE FUNCTION public.trg_deferred_revalidate_hanja_character_from_translation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  PERFORM public.revalidate_published_hanja_characters(
    public.distinct_uuid_pair(NEW.character_id, OLD.character_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE CONSTRAINT TRIGGER hanja_character_translations_revalidate_published_character
  AFTER INSERT OR UPDATE OR DELETE ON public.hanja_character_translations
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.trg_deferred_revalidate_hanja_character_from_translation();

CREATE OR REPLACE FUNCTION public.trg_deferred_revalidate_hanja_term_from_term_character()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  PERFORM public.revalidate_published_hanja_terms(
    public.distinct_uuid_pair(NEW.term_id, OLD.term_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE CONSTRAINT TRIGGER hanja_term_characters_revalidate_published_term
  AFTER INSERT OR UPDATE OR DELETE ON public.hanja_term_characters
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.trg_deferred_revalidate_hanja_term_from_term_character();

CREATE OR REPLACE FUNCTION public.trg_deferred_revalidate_hanja_term_from_term_character_translation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_term_ids uuid[];
BEGIN
  SELECT COALESCE(
    ARRAY(
      SELECT DISTINCT htc.term_id
      FROM public.hanja_term_characters htc
      WHERE htc.id IN (NEW.term_character_id, OLD.term_character_id)
    ),
    ARRAY[]::uuid[]
  ) INTO v_term_ids;

  PERFORM public.revalidate_published_hanja_terms(v_term_ids);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE CONSTRAINT TRIGGER hanja_term_character_translations_revalidate_published_term
  AFTER INSERT OR UPDATE OR DELETE ON public.hanja_term_character_translations
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.trg_deferred_revalidate_hanja_term_from_term_character_translation();

CREATE OR REPLACE FUNCTION public.trg_deferred_revalidate_idiom_from_translation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  PERFORM public.revalidate_published_idioms(
    public.distinct_uuid_pair(NEW.idiom_id, OLD.idiom_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE CONSTRAINT TRIGGER idiom_translations_revalidate_published_idiom
  AFTER INSERT OR UPDATE OR DELETE ON public.idiom_translations
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.trg_deferred_revalidate_idiom_from_translation();

-- ---------------------------------------------------------------------------
-- Deferred reverse triggers (upward: parent change → revalidate published children)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.trg_deferred_revalidate_published_conjugation_results_for_entry()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_result_ids uuid[];
BEGIN
  SELECT COALESCE(
    ARRAY(
      SELECT cr.id
      FROM public.conjugation_results cr
      WHERE cr.entry_id = COALESCE(NEW.id, OLD.id) AND cr.status = 'published'
    ),
    ARRAY[]::uuid[]
  ) INTO v_result_ids;

  PERFORM public.revalidate_published_conjugation_results(v_result_ids);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE CONSTRAINT TRIGGER entries_revalidate_published_conjugation_results
  AFTER UPDATE OF status ON public.entries
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.trg_deferred_revalidate_published_conjugation_results_for_entry();

CREATE OR REPLACE FUNCTION public.trg_deferred_revalidate_published_hanja_terms_for_entry()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_term_ids uuid[];
BEGIN
  SELECT COALESCE(
    ARRAY(
      SELECT ht.id
      FROM public.hanja_terms ht
      WHERE ht.entry_id = COALESCE(NEW.id, OLD.id) AND ht.status = 'published'
    ),
    ARRAY[]::uuid[]
  ) INTO v_term_ids;

  PERFORM public.revalidate_published_hanja_terms(v_term_ids);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE CONSTRAINT TRIGGER entries_revalidate_published_hanja_terms
  AFTER UPDATE OF status ON public.entries
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.trg_deferred_revalidate_published_hanja_terms_for_entry();

CREATE OR REPLACE FUNCTION public.trg_deferred_revalidate_published_hanja_terms_for_character()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_term_ids uuid[];
BEGIN
  SELECT COALESCE(
    ARRAY(
      SELECT DISTINCT ht.id
      FROM public.hanja_term_characters htc
      JOIN public.hanja_terms ht ON ht.id = htc.term_id
      WHERE htc.character_id = COALESCE(NEW.id, OLD.id)
        AND ht.status = 'published'
    ),
    ARRAY[]::uuid[]
  ) INTO v_term_ids;

  PERFORM public.revalidate_published_hanja_terms(v_term_ids);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE CONSTRAINT TRIGGER hanja_characters_revalidate_published_hanja_terms
  AFTER UPDATE OF status ON public.hanja_characters
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.trg_deferred_revalidate_published_hanja_terms_for_character();

CREATE OR REPLACE FUNCTION public.trg_deferred_revalidate_published_hanja_terms_for_reading()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_term_ids uuid[];
BEGIN
  SELECT COALESCE(
    ARRAY(
      SELECT DISTINCT ht.id
      FROM public.hanja_term_characters htc
      JOIN public.hanja_terms ht ON ht.id = htc.term_id
      WHERE htc.reading_id IN (NEW.id, OLD.id)
        AND ht.status = 'published'
    ),
    ARRAY[]::uuid[]
  ) INTO v_term_ids;

  PERFORM public.revalidate_published_hanja_terms(v_term_ids);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE CONSTRAINT TRIGGER hanja_readings_revalidate_published_hanja_terms
  AFTER UPDATE OF status ON public.hanja_readings
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.trg_deferred_revalidate_published_hanja_terms_for_reading();

CREATE OR REPLACE FUNCTION public.trg_deferred_revalidate_published_conjugation_results_for_form()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_result_ids uuid[];
BEGIN
  SELECT COALESCE(
    ARRAY(
      SELECT cr.id
      FROM public.conjugation_results cr
      WHERE cr.form_id = COALESCE(NEW.id, OLD.id) AND cr.status = 'published'
    ),
    ARRAY[]::uuid[]
  ) INTO v_result_ids;

  PERFORM public.revalidate_published_conjugation_results(v_result_ids);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE CONSTRAINT TRIGGER conjugation_forms_revalidate_published_conjugation_results
  AFTER UPDATE OF status ON public.conjugation_forms
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.trg_deferred_revalidate_published_conjugation_results_for_form();

CREATE OR REPLACE FUNCTION public.trg_deferred_revalidate_published_conjugation_results_for_rule()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_result_ids uuid[];
BEGIN
  SELECT COALESCE(
    ARRAY(
      SELECT cr.id
      FROM public.conjugation_results cr
      WHERE cr.rule_id = COALESCE(NEW.id, OLD.id) AND cr.status = 'published'
    ),
    ARRAY[]::uuid[]
  ) INTO v_result_ids;

  PERFORM public.revalidate_published_conjugation_results(v_result_ids);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE CONSTRAINT TRIGGER conjugation_rules_revalidate_published_conjugation_results
  AFTER UPDATE OF status ON public.conjugation_rules
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.trg_deferred_revalidate_published_conjugation_results_for_rule();

CREATE OR REPLACE FUNCTION public.trg_deferred_revalidate_published_conjugation_result_self()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'published' THEN
    PERFORM public.validate_conjugation_result_publishable(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER conjugation_results_revalidate_on_dependency_change
  AFTER UPDATE OF entry_id, form_id, rule_id ON public.conjugation_results
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.trg_deferred_revalidate_published_conjugation_result_self();

CREATE OR REPLACE FUNCTION public.trg_deferred_revalidate_published_hanja_term_self()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'published' THEN
    PERFORM public.validate_hanja_term_publishable(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER hanja_terms_revalidate_on_entry_change
  AFTER UPDATE OF entry_id ON public.hanja_terms
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.trg_deferred_revalidate_published_hanja_term_self();

-- ---------------------------------------------------------------------------
-- Published rows must carry published_at (entity tables)
-- ---------------------------------------------------------------------------

ALTER TABLE public.entries
  ADD CONSTRAINT entries_published_requires_timestamp
  CHECK (status <> 'published' OR published_at IS NOT NULL);

ALTER TABLE public.examples
  ADD CONSTRAINT examples_published_requires_timestamp
  CHECK (status <> 'published' OR published_at IS NOT NULL);

ALTER TABLE public.sound_change_rules
  ADD CONSTRAINT sound_change_rules_published_requires_timestamp
  CHECK (status <> 'published' OR published_at IS NOT NULL);

ALTER TABLE public.conjugation_forms
  ADD CONSTRAINT conjugation_forms_published_requires_timestamp
  CHECK (status <> 'published' OR published_at IS NOT NULL);

ALTER TABLE public.conjugation_rules
  ADD CONSTRAINT conjugation_rules_published_requires_timestamp
  CHECK (status <> 'published' OR published_at IS NOT NULL);

ALTER TABLE public.conjugation_results
  ADD CONSTRAINT conjugation_results_published_requires_timestamp
  CHECK (status <> 'published' OR published_at IS NOT NULL);

ALTER TABLE public.hanja_characters
  ADD CONSTRAINT hanja_characters_published_requires_timestamp
  CHECK (status <> 'published' OR published_at IS NOT NULL);

ALTER TABLE public.hanja_terms
  ADD CONSTRAINT hanja_terms_published_requires_timestamp
  CHECK (status <> 'published' OR published_at IS NOT NULL);

ALTER TABLE public.idioms
  ADD CONSTRAINT idioms_published_requires_timestamp
  CHECK (status <> 'published' OR published_at IS NOT NULL);
