-- Phase 6A: RLS policies, grants, submit_feedback RPC

-- Enable RLS on all business tables
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.senses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sense_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.example_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sound_change_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sound_change_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sound_change_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sound_change_step_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_sound_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sound_change_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sound_change_rule_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conjugation_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conjugation_form_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conjugation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conjugation_rule_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conjugation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conjugation_result_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conjugation_result_step_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conjugation_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hanja_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hanja_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hanja_character_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hanja_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hanja_term_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hanja_term_character_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idioms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idiom_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idiom_category_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idiom_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idiom_entry_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idiom_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Published entity tables (direct status column)
CREATE POLICY entries_public_read ON public.entries
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY entry_aliases_public_read ON public.entry_aliases
  FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.entries e
      WHERE e.id = entry_id AND e.status = 'published'
    )
  );

CREATE POLICY senses_public_read ON public.senses
  FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.entries e
      WHERE e.id = entry_id AND e.status = 'published'
    )
  );

CREATE POLICY examples_public_read ON public.examples
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY sound_change_rules_public_read ON public.sound_change_rules
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY sound_change_steps_public_read ON public.sound_change_steps
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sound_change_rules r
      WHERE r.id = rule_id AND r.status = 'published'
    )
  );

CREATE POLICY conjugation_forms_public_read ON public.conjugation_forms
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY conjugation_rules_public_read ON public.conjugation_rules
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY conjugation_results_public_read ON public.conjugation_results
  FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.entries e
      WHERE e.id = entry_id AND e.status = 'published'
    )
    AND EXISTS (
      SELECT 1 FROM public.conjugation_forms f
      WHERE f.id = form_id AND f.status = 'published'
    )
    AND (
      rule_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.conjugation_rules r
        WHERE r.id = rule_id AND r.status = 'published'
      )
    )
  );

CREATE POLICY conjugation_result_steps_public_read ON public.conjugation_result_steps
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conjugation_results cr
      JOIN public.entries e ON e.id = cr.entry_id
      JOIN public.conjugation_forms f ON f.id = cr.form_id
      WHERE cr.id = result_id
        AND cr.status = 'published'
        AND e.status = 'published'
        AND f.status = 'published'
        AND (
          cr.rule_id IS NULL
          OR EXISTS (
            SELECT 1 FROM public.conjugation_rules r
            WHERE r.id = cr.rule_id AND r.status = 'published'
          )
        )
    )
  );

CREATE POLICY hanja_characters_public_read ON public.hanja_characters
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY hanja_readings_public_read ON public.hanja_readings
  FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.hanja_characters c
      WHERE c.id = character_id AND c.status = 'published'
    )
  );

CREATE POLICY hanja_terms_public_read ON public.hanja_terms
  FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.entries e
      WHERE e.id = entry_id AND e.status = 'published'
    )
  );

CREATE POLICY idioms_public_read ON public.idioms
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

-- Translation tables: translation + parent published
CREATE POLICY entry_translations_public_read ON public.entry_translations
  FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.entries e
      WHERE e.id = entry_id AND e.status = 'published'
    )
  );

CREATE POLICY sense_translations_public_read ON public.sense_translations
  FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.senses s
      JOIN public.entries e ON e.id = s.entry_id
      WHERE s.id = sense_id AND s.status = 'published' AND e.status = 'published'
    )
  );

CREATE POLICY example_translations_public_read ON public.example_translations
  FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.examples ex
      WHERE ex.id = example_id AND ex.status = 'published'
    )
  );

CREATE POLICY sound_change_translations_public_read ON public.sound_change_translations
  FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.sound_change_rules r
      WHERE r.id = rule_id AND r.status = 'published'
    )
  );

CREATE POLICY sound_change_step_translations_public_read ON public.sound_change_step_translations
  FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.sound_change_steps st
      JOIN public.sound_change_rules r ON r.id = st.rule_id
      WHERE st.id = step_id AND r.status = 'published'
    )
  );

CREATE POLICY conjugation_form_translations_public_read ON public.conjugation_form_translations
  FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.conjugation_forms f
      WHERE f.id = form_id AND f.status = 'published'
    )
  );

CREATE POLICY conjugation_rule_translations_public_read ON public.conjugation_rule_translations
  FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.conjugation_rules r
      WHERE r.id = rule_id AND r.status = 'published'
    )
  );

CREATE POLICY conjugation_result_step_translations_public_read
  ON public.conjugation_result_step_translations
  FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.conjugation_result_steps crs
      JOIN public.conjugation_results cr ON cr.id = crs.result_id
      JOIN public.entries e ON e.id = cr.entry_id
      JOIN public.conjugation_forms f ON f.id = cr.form_id
      WHERE crs.id = step_id
        AND cr.status = 'published'
        AND e.status = 'published'
        AND f.status = 'published'
        AND (
          cr.rule_id IS NULL
          OR EXISTS (
            SELECT 1 FROM public.conjugation_rules r
            WHERE r.id = cr.rule_id AND r.status = 'published'
          )
        )
    )
  );

CREATE POLICY hanja_character_translations_public_read ON public.hanja_character_translations
  FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.hanja_characters c
      WHERE c.id = character_id AND c.status = 'published'
    )
  );

CREATE POLICY hanja_term_character_translations_public_read
  ON public.hanja_term_character_translations
  FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.hanja_term_characters htc
      JOIN public.hanja_terms ht ON ht.id = htc.term_id
      JOIN public.entries e ON e.id = ht.entry_id
      WHERE htc.id = term_character_id
        AND ht.status = 'published'
        AND e.status = 'published'
    )
  );

CREATE POLICY idiom_translations_public_read ON public.idiom_translations
  FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.idioms i
      WHERE i.id = idiom_id AND i.status = 'published'
    )
  );

-- Junction / relation tables: all referenced parents published
CREATE POLICY entry_examples_public_read ON public.entry_examples
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.entries e WHERE e.id = entry_id AND e.status = 'published')
    AND EXISTS (SELECT 1 FROM public.examples ex WHERE ex.id = example_id AND ex.status = 'published')
    AND (
      sense_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.senses s
        JOIN public.entries e ON e.id = s.entry_id
        WHERE s.id = sense_id AND s.status = 'published' AND e.status = 'published'
      )
    )
  );

CREATE POLICY entry_relations_public_read ON public.entry_relations
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.entries e WHERE e.id = source_entry_id AND e.status = 'published')
    AND EXISTS (SELECT 1 FROM public.entries e WHERE e.id = target_entry_id AND e.status = 'published')
  );

CREATE POLICY entry_sound_changes_public_read ON public.entry_sound_changes
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.entries e WHERE e.id = entry_id AND e.status = 'published')
    AND EXISTS (SELECT 1 FROM public.sound_change_rules r WHERE r.id = rule_id AND r.status = 'published')
  );

CREATE POLICY sound_change_examples_public_read ON public.sound_change_examples
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.sound_change_rules r WHERE r.id = rule_id AND r.status = 'published')
    AND EXISTS (SELECT 1 FROM public.examples ex WHERE ex.id = example_id AND ex.status = 'published')
  );

CREATE POLICY sound_change_rule_relations_public_read ON public.sound_change_rule_relations
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.sound_change_rules r WHERE r.id = source_rule_id AND r.status = 'published')
    AND EXISTS (SELECT 1 FROM public.sound_change_rules r WHERE r.id = target_rule_id AND r.status = 'published')
  );

CREATE POLICY conjugation_examples_public_read ON public.conjugation_examples
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conjugation_results cr
      JOIN public.entries e ON e.id = cr.entry_id
      JOIN public.conjugation_forms f ON f.id = cr.form_id
      WHERE cr.id = result_id
        AND cr.status = 'published'
        AND e.status = 'published'
        AND f.status = 'published'
        AND (
          cr.rule_id IS NULL
          OR EXISTS (
            SELECT 1 FROM public.conjugation_rules r
            WHERE r.id = cr.rule_id AND r.status = 'published'
          )
        )
    )
    AND EXISTS (SELECT 1 FROM public.examples ex WHERE ex.id = example_id AND ex.status = 'published')
  );

CREATE POLICY hanja_term_characters_public_read ON public.hanja_term_characters
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.hanja_terms ht
      JOIN public.entries e ON e.id = ht.entry_id
      WHERE ht.id = term_id AND ht.status = 'published' AND e.status = 'published'
    )
    AND EXISTS (
      SELECT 1 FROM public.hanja_characters c
      WHERE c.id = character_id AND c.status = 'published'
    )
  );

CREATE POLICY idiom_category_links_public_read ON public.idiom_category_links
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.idioms i WHERE i.id = idiom_id AND i.status = 'published')
  );

CREATE POLICY idiom_examples_public_read ON public.idiom_examples
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.idioms i WHERE i.id = idiom_id AND i.status = 'published')
    AND EXISTS (SELECT 1 FROM public.examples ex WHERE ex.id = example_id AND ex.status = 'published')
  );

CREATE POLICY idiom_entry_links_public_read ON public.idiom_entry_links
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.idioms i WHERE i.id = idiom_id AND i.status = 'published')
    AND EXISTS (SELECT 1 FROM public.entries e WHERE e.id = entry_id AND e.status = 'published')
  );

CREATE POLICY idiom_relations_public_read ON public.idiom_relations
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.idioms i WHERE i.id = source_idiom_id AND i.status = 'published')
    AND EXISTS (SELECT 1 FROM public.idioms i WHERE i.id = target_idiom_id AND i.status = 'published')
  );

-- Sources: verified + displayed + linked published content (non-recursive via app_private helpers)
CREATE SCHEMA IF NOT EXISTS app_private;

REVOKE ALL ON SCHEMA app_private FROM PUBLIC;
GRANT USAGE ON SCHEMA app_private TO anon, authenticated;

CREATE OR REPLACE FUNCTION app_private.source_is_publicly_readable(p_source_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.sources s
    WHERE s.id = p_source_id
      AND s.verification_status = 'verified'
      AND s.is_publicly_displayed = true
  );
$$;

CREATE OR REPLACE FUNCTION app_private.content_source_links_published_target(
  p_entry_id uuid,
  p_sense_id uuid,
  p_example_id uuid,
  p_sound_change_rule_id uuid,
  p_conjugation_rule_id uuid,
  p_conjugation_result_id uuid,
  p_hanja_character_id uuid,
  p_hanja_term_id uuid,
  p_idiom_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_entry_id IS NOT NULL THEN EXISTS (
      SELECT 1 FROM public.entries e
      WHERE e.id = p_entry_id AND e.status = 'published'
    )
    WHEN p_sense_id IS NOT NULL THEN EXISTS (
      SELECT 1 FROM public.senses s
      JOIN public.entries e ON e.id = s.entry_id
      WHERE s.id = p_sense_id AND s.status = 'published' AND e.status = 'published'
    )
    WHEN p_example_id IS NOT NULL THEN EXISTS (
      SELECT 1 FROM public.examples ex
      WHERE ex.id = p_example_id AND ex.status = 'published'
    )
    WHEN p_sound_change_rule_id IS NOT NULL THEN EXISTS (
      SELECT 1 FROM public.sound_change_rules r
      WHERE r.id = p_sound_change_rule_id AND r.status = 'published'
    )
    WHEN p_conjugation_rule_id IS NOT NULL THEN EXISTS (
      SELECT 1 FROM public.conjugation_rules r
      WHERE r.id = p_conjugation_rule_id AND r.status = 'published'
    )
    WHEN p_conjugation_result_id IS NOT NULL THEN EXISTS (
      SELECT 1 FROM public.conjugation_results cr
      WHERE cr.id = p_conjugation_result_id AND cr.status = 'published'
    )
    WHEN p_hanja_character_id IS NOT NULL THEN EXISTS (
      SELECT 1 FROM public.hanja_characters c
      WHERE c.id = p_hanja_character_id AND c.status = 'published'
    )
    WHEN p_hanja_term_id IS NOT NULL THEN EXISTS (
      SELECT 1 FROM public.hanja_terms ht
      WHERE ht.id = p_hanja_term_id AND ht.status = 'published'
    )
    WHEN p_idiom_id IS NOT NULL THEN EXISTS (
      SELECT 1 FROM public.idioms i
      WHERE i.id = p_idiom_id AND i.status = 'published'
    )
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION app_private.source_has_published_content_link(p_source_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.content_sources cs
    WHERE cs.source_id = p_source_id
      AND app_private.content_source_links_published_target(
        cs.entry_id,
        cs.sense_id,
        cs.example_id,
        cs.sound_change_rule_id,
        cs.conjugation_rule_id,
        cs.conjugation_result_id,
        cs.hanja_character_id,
        cs.hanja_term_id,
        cs.idiom_id
      )
  );
$$;

REVOKE ALL ON FUNCTION app_private.source_is_publicly_readable(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.content_source_links_published_target(
  uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid
) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.source_has_published_content_link(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION app_private.source_is_publicly_readable(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app_private.content_source_links_published_target(
  uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid
) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app_private.source_has_published_content_link(uuid) TO anon, authenticated;

CREATE POLICY sources_public_read ON public.sources
  FOR SELECT TO anon, authenticated
  USING (
    app_private.source_is_publicly_readable(id)
    AND app_private.source_has_published_content_link(id)
  );

CREATE POLICY content_sources_public_read ON public.content_sources
  FOR SELECT TO anon, authenticated
  USING (
    app_private.source_is_publicly_readable(source_id)
    AND app_private.content_source_links_published_target(
      entry_id,
      sense_id,
      example_id,
      sound_change_rule_id,
      conjugation_rule_id,
      conjugation_result_id,
      hanja_character_id,
      hanja_term_id,
      idiom_id
    )
  );

-- Feedback: no direct table access for anon/authenticated
CREATE POLICY feedback_no_select ON public.feedback
  FOR SELECT TO anon, authenticated
  USING (false);

CREATE POLICY feedback_no_insert ON public.feedback
  FOR INSERT TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY feedback_no_update ON public.feedback
  FOR UPDATE TO anon, authenticated
  USING (false);

CREATE POLICY feedback_no_delete ON public.feedback
  FOR DELETE TO anon, authenticated
  USING (false);

-- Phase 6B: explicit read-only Data API grants (RLS filters rows; no table-wide blanket GRANT).
-- feedback is intentionally excluded — no SELECT/INSERT/UPDATE/DELETE for anon/authenticated.
GRANT SELECT ON TABLE public.entries TO anon, authenticated;
GRANT SELECT ON TABLE public.entry_translations TO anon, authenticated;
GRANT SELECT ON TABLE public.entry_aliases TO anon, authenticated;
GRANT SELECT ON TABLE public.senses TO anon, authenticated;
GRANT SELECT ON TABLE public.sense_translations TO anon, authenticated;
GRANT SELECT ON TABLE public.examples TO anon, authenticated;
GRANT SELECT ON TABLE public.example_translations TO anon, authenticated;
GRANT SELECT ON TABLE public.entry_examples TO anon, authenticated;
GRANT SELECT ON TABLE public.entry_relations TO anon, authenticated;
GRANT SELECT ON TABLE public.sound_change_rules TO anon, authenticated;
GRANT SELECT ON TABLE public.sound_change_translations TO anon, authenticated;
GRANT SELECT ON TABLE public.sound_change_steps TO anon, authenticated;
GRANT SELECT ON TABLE public.sound_change_step_translations TO anon, authenticated;
GRANT SELECT ON TABLE public.entry_sound_changes TO anon, authenticated;
GRANT SELECT ON TABLE public.sound_change_examples TO anon, authenticated;
GRANT SELECT ON TABLE public.sound_change_rule_relations TO anon, authenticated;
GRANT SELECT ON TABLE public.conjugation_forms TO anon, authenticated;
GRANT SELECT ON TABLE public.conjugation_form_translations TO anon, authenticated;
GRANT SELECT ON TABLE public.conjugation_rules TO anon, authenticated;
GRANT SELECT ON TABLE public.conjugation_rule_translations TO anon, authenticated;
GRANT SELECT ON TABLE public.conjugation_results TO anon, authenticated;
GRANT SELECT ON TABLE public.conjugation_result_steps TO anon, authenticated;
GRANT SELECT ON TABLE public.conjugation_result_step_translations TO anon, authenticated;
GRANT SELECT ON TABLE public.conjugation_examples TO anon, authenticated;
GRANT SELECT ON TABLE public.hanja_characters TO anon, authenticated;
GRANT SELECT ON TABLE public.hanja_readings TO anon, authenticated;
GRANT SELECT ON TABLE public.hanja_character_translations TO anon, authenticated;
GRANT SELECT ON TABLE public.hanja_terms TO anon, authenticated;
GRANT SELECT ON TABLE public.hanja_term_characters TO anon, authenticated;
GRANT SELECT ON TABLE public.hanja_term_character_translations TO anon, authenticated;
GRANT SELECT ON TABLE public.idioms TO anon, authenticated;
GRANT SELECT ON TABLE public.idiom_translations TO anon, authenticated;
GRANT SELECT ON TABLE public.idiom_category_links TO anon, authenticated;
GRANT SELECT ON TABLE public.idiom_examples TO anon, authenticated;
GRANT SELECT ON TABLE public.idiom_entry_links TO anon, authenticated;
GRANT SELECT ON TABLE public.idiom_relations TO anon, authenticated;
GRANT SELECT ON TABLE public.sources TO anon, authenticated;
GRANT SELECT ON TABLE public.content_sources TO anon, authenticated;

-- submit_feedback RPC (search_path hardened; shared target rules from migration 08)
CREATE OR REPLACE FUNCTION public.submit_feedback(
  p_target_kind text,
  p_category text,
  p_message text,
  p_reported_path text DEFAULT NULL,
  p_contact_email text DEFAULT NULL,
  p_target_snapshot jsonb DEFAULT '{}'::jsonb,
  p_client_context jsonb DEFAULT '{}'::jsonb,
  p_entry_id uuid DEFAULT NULL,
  p_sense_id uuid DEFAULT NULL,
  p_sense_translation_id uuid DEFAULT NULL,
  p_example_id uuid DEFAULT NULL,
  p_example_translation_id uuid DEFAULT NULL,
  p_sound_change_rule_id uuid DEFAULT NULL,
  p_conjugation_result_id uuid DEFAULT NULL,
  p_hanja_character_id uuid DEFAULT NULL,
  p_hanja_term_id uuid DEFAULT NULL,
  p_idiom_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id uuid;
  v_allowed_snapshot_keys text[] := ARRAY['title', 'slug', 'locale', 'module', 'excerpt'];
  v_allowed_context_keys text[] := ARRAY['user_agent', 'viewport', 'locale', 'referrer'];
  v_key text;
BEGIN
  IF p_target_kind NOT IN (
    'page', 'entry', 'sense', 'sense_translation', 'example',
    'example_translation', 'sound_change_rule', 'conjugation_result',
    'hanja_character', 'hanja_term', 'idiom'
  ) THEN
    RAISE EXCEPTION 'invalid target_kind';
  END IF;

  IF p_category NOT IN (
    'incorrect_content', 'translation_issue', 'pronunciation_issue',
    'sound_change_issue', 'conjugation_issue', 'hanja_issue',
    'example_issue', 'broken_link', 'display_issue', 'technical_issue',
    'copyright_issue', 'other'
  ) THEN
    RAISE EXCEPTION 'invalid category';
  END IF;

  IF pg_catalog.char_length(pg_catalog.btrim(p_message)) < 10
    OR pg_catalog.char_length(p_message) > 5000 THEN
    RAISE EXCEPTION 'message length must be between 10 and 5000';
  END IF;

  IF p_contact_email IS NOT NULL AND pg_catalog.char_length(p_contact_email) > 320 THEN
    RAISE EXCEPTION 'contact_email too long';
  END IF;

  IF pg_catalog.jsonb_typeof(p_target_snapshot) IS DISTINCT FROM 'object'
    OR pg_catalog.jsonb_typeof(p_client_context) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'snapshot and context must be JSON objects';
  END IF;

  FOR v_key IN SELECT pg_catalog.jsonb_object_keys(p_target_snapshot) LOOP
    IF NOT v_key = ANY (v_allowed_snapshot_keys) THEN
      RAISE EXCEPTION 'disallowed target_snapshot key: %', v_key;
    END IF;
  END LOOP;

  FOR v_key IN SELECT pg_catalog.jsonb_object_keys(p_client_context) LOOP
    IF NOT v_key = ANY (v_allowed_context_keys) THEN
      RAISE EXCEPTION 'disallowed client_context key: %', v_key;
    END IF;
  END LOOP;

  IF NOT public.feedback_targets_are_consistent(
    p_target_kind,
    false,
    p_entry_id,
    p_sense_id,
    p_sense_translation_id,
    p_example_id,
    p_example_translation_id,
    p_sound_change_rule_id,
    p_conjugation_result_id,
    p_hanja_character_id,
    p_hanja_term_id,
    p_idiom_id
  ) THEN
    RAISE EXCEPTION 'target_kind does not match supplied target foreign keys';
  END IF;

  IF p_target_kind = 'entry' AND p_entry_id IS NULL THEN RAISE EXCEPTION 'missing entry target'; END IF;
  IF p_target_kind = 'sense' AND p_sense_id IS NULL THEN RAISE EXCEPTION 'missing sense target'; END IF;
  IF p_target_kind = 'sense_translation' AND p_sense_translation_id IS NULL THEN
    RAISE EXCEPTION 'missing sense_translation target';
  END IF;
  IF p_target_kind = 'example' AND p_example_id IS NULL THEN RAISE EXCEPTION 'missing example target'; END IF;
  IF p_target_kind = 'example_translation' AND p_example_translation_id IS NULL THEN
    RAISE EXCEPTION 'missing example_translation target';
  END IF;
  IF p_target_kind = 'sound_change_rule' AND p_sound_change_rule_id IS NULL THEN
    RAISE EXCEPTION 'missing sound_change_rule target';
  END IF;
  IF p_target_kind = 'conjugation_result' AND p_conjugation_result_id IS NULL THEN
    RAISE EXCEPTION 'missing conjugation_result target';
  END IF;
  IF p_target_kind = 'hanja_character' AND p_hanja_character_id IS NULL THEN
    RAISE EXCEPTION 'missing hanja_character target';
  END IF;
  IF p_target_kind = 'hanja_term' AND p_hanja_term_id IS NULL THEN RAISE EXCEPTION 'missing hanja_term target'; END IF;
  IF p_target_kind = 'idiom' AND p_idiom_id IS NULL THEN RAISE EXCEPTION 'missing idiom target'; END IF;

  IF p_entry_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.entries WHERE id = p_entry_id) THEN
    RAISE EXCEPTION 'entry target not found';
  END IF;
  IF p_sense_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.senses WHERE id = p_sense_id) THEN
    RAISE EXCEPTION 'sense target not found';
  END IF;
  IF p_sense_translation_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.sense_translations WHERE id = p_sense_translation_id
  ) THEN
    RAISE EXCEPTION 'sense_translation target not found';
  END IF;
  IF p_example_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.examples WHERE id = p_example_id) THEN
    RAISE EXCEPTION 'example target not found';
  END IF;
  IF p_example_translation_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.example_translations WHERE id = p_example_translation_id
  ) THEN
    RAISE EXCEPTION 'example_translation target not found';
  END IF;
  IF p_sound_change_rule_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.sound_change_rules WHERE id = p_sound_change_rule_id
  ) THEN
    RAISE EXCEPTION 'sound_change_rule target not found';
  END IF;
  IF p_conjugation_result_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.conjugation_results WHERE id = p_conjugation_result_id
  ) THEN
    RAISE EXCEPTION 'conjugation_result target not found';
  END IF;
  IF p_hanja_character_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.hanja_characters WHERE id = p_hanja_character_id
  ) THEN
    RAISE EXCEPTION 'hanja_character target not found';
  END IF;
  IF p_hanja_term_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.hanja_terms WHERE id = p_hanja_term_id
  ) THEN
    RAISE EXCEPTION 'hanja_term target not found';
  END IF;
  IF p_idiom_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.idioms WHERE id = p_idiom_id) THEN
    RAISE EXCEPTION 'idiom target not found';
  END IF;

  INSERT INTO public.feedback (
    target_kind,
    category,
    message,
    contact_email,
    reported_path,
    target_snapshot,
    client_context,
    status,
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
  ) VALUES (
    p_target_kind,
    p_category,
    pg_catalog.btrim(p_message),
    p_contact_email,
    p_reported_path,
    p_target_snapshot,
    p_client_context,
    'new',
    p_entry_id,
    p_sense_id,
    p_sense_translation_id,
    p_example_id,
    p_example_translation_id,
    p_sound_change_rule_id,
    p_conjugation_result_id,
    p_hanja_character_id,
    p_hanja_term_id,
    p_idiom_id
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_feedback(
  text, text, text, text, text, jsonb, jsonb,
  uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid
) FROM PUBLIC, anon, authenticated;

-- Phase 6B: re-grant submit_feedback only after Route Handler + abuse controls exist.
-- Prefer service_role from server-side handler, or database rate limits before anon/authenticated EXECUTE.

-- Lock down public schema functions: not callable as RPC by anon/authenticated.
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
