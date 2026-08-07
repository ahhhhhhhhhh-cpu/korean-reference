-- Phase 6A: conjugation forms, rules, results, steps

CREATE TABLE public.conjugation_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_key text,
  code text NOT NULL,
  sort_order integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  archived_at timestamptz,
  CONSTRAINT conjugation_forms_code_check CHECK (
    code IN (
      'present_polite', 'past_polite', 'present_formal', 'past_formal',
      'present_informal', 'propositive'
    )
  ),
  CONSTRAINT conjugation_forms_sort_order_positive CHECK (sort_order > 0),
  CONSTRAINT conjugation_forms_status_check CHECK (
    status IN ('draft', 'in_review', 'published', 'archived')
  )
);

CREATE UNIQUE INDEX conjugation_forms_code_unique ON public.conjugation_forms (code);
CREATE UNIQUE INDEX conjugation_forms_import_key_unique ON public.conjugation_forms (import_key)
  WHERE import_key IS NOT NULL;
CREATE INDEX conjugation_forms_status_idx ON public.conjugation_forms (status);

CREATE TABLE public.conjugation_form_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_key text,
  form_id uuid NOT NULL REFERENCES public.conjugation_forms (id) ON DELETE CASCADE,
  locale text NOT NULL,
  name text NOT NULL,
  short_description text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  CONSTRAINT conjugation_form_translations_locale_check CHECK (locale IN ('en', 'zh', 'ja')),
  CONSTRAINT conjugation_form_translations_status_check CHECK (
    status IN ('draft', 'in_review', 'published', 'needs_revision')
  ),
  CONSTRAINT conjugation_form_translations_name_nonempty CHECK (btrim(name) <> ''),
  CONSTRAINT conjugation_form_translations_unique_locale UNIQUE (form_id, locale)
);

CREATE UNIQUE INDEX conjugation_form_translations_import_key_unique
  ON public.conjugation_form_translations (import_key) WHERE import_key IS NOT NULL;
CREATE INDEX conjugation_form_translations_form_id_idx
  ON public.conjugation_form_translations (form_id);

CREATE TABLE public.conjugation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_key text,
  slug text NOT NULL,
  rule_code text NOT NULL,
  is_irregular boolean NOT NULL DEFAULT false,
  irregular_type text,
  rule_category text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  archived_at timestamptz,
  CONSTRAINT conjugation_rules_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT conjugation_rules_rule_code_nonempty CHECK (btrim(rule_code) <> ''),
  CONSTRAINT conjugation_rules_irregular_type_check CHECK (
    irregular_type IS NULL
    OR irregular_type IN ('ㄷ', 'ㅂ', '르', 'ㅎ', 'ㅅ', 'ㅡ', 'ㄹ')
  ),
  CONSTRAINT conjugation_rules_irregular_consistency CHECK (
    (is_irregular = false AND irregular_type IS NULL)
    OR (is_irregular = true AND irregular_type IS NOT NULL)
  ),
  CONSTRAINT conjugation_rules_status_check CHECK (
    status IN ('draft', 'in_review', 'published', 'archived')
  )
);

CREATE UNIQUE INDEX conjugation_rules_slug_unique ON public.conjugation_rules (slug);
CREATE UNIQUE INDEX conjugation_rules_rule_code_unique ON public.conjugation_rules (rule_code);
CREATE UNIQUE INDEX conjugation_rules_import_key_unique ON public.conjugation_rules (import_key)
  WHERE import_key IS NOT NULL;
CREATE INDEX conjugation_rules_status_idx ON public.conjugation_rules (status);

CREATE TABLE public.conjugation_rule_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_key text,
  rule_id uuid NOT NULL REFERENCES public.conjugation_rules (id) ON DELETE CASCADE,
  locale text NOT NULL,
  title text NOT NULL,
  explanation text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  CONSTRAINT conjugation_rule_translations_locale_check CHECK (locale IN ('en', 'zh', 'ja')),
  CONSTRAINT conjugation_rule_translations_status_check CHECK (
    status IN ('draft', 'in_review', 'published', 'needs_revision')
  ),
  CONSTRAINT conjugation_rule_translations_title_nonempty CHECK (btrim(title) <> ''),
  CONSTRAINT conjugation_rule_translations_unique_locale UNIQUE (rule_id, locale)
);

CREATE UNIQUE INDEX conjugation_rule_translations_import_key_unique
  ON public.conjugation_rule_translations (import_key) WHERE import_key IS NOT NULL;
CREATE INDEX conjugation_rule_translations_rule_id_idx
  ON public.conjugation_rule_translations (rule_id);

CREATE TABLE public.conjugation_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_key text,
  entry_id uuid NOT NULL REFERENCES public.entries (id) ON DELETE CASCADE,
  form_id uuid NOT NULL REFERENCES public.conjugation_forms (id) ON DELETE RESTRICT,
  rule_id uuid REFERENCES public.conjugation_rules (id) ON DELETE SET NULL,
  result text NOT NULL,
  result_normalized text NOT NULL,
  stem_used text,
  is_irregular boolean NOT NULL DEFAULT false,
  irregular_type text,
  variant_order integer NOT NULL DEFAULT 1,
  is_preferred boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  archived_at timestamptz,
  CONSTRAINT conjugation_results_result_nonempty CHECK (btrim(result) <> ''),
  CONSTRAINT conjugation_results_result_normalized_nonempty CHECK (btrim(result_normalized) <> ''),
  CONSTRAINT conjugation_results_irregular_type_check CHECK (
    irregular_type IS NULL
    OR irregular_type IN ('ㄷ', 'ㅂ', '르', 'ㅎ', 'ㅅ', 'ㅡ', 'ㄹ')
  ),
  CONSTRAINT conjugation_results_irregular_consistency CHECK (
    (is_irregular = false AND irregular_type IS NULL)
    OR (is_irregular = true AND irregular_type IS NOT NULL)
  ),
  CONSTRAINT conjugation_results_variant_order_positive CHECK (variant_order > 0),
  CONSTRAINT conjugation_results_status_check CHECK (
    status IN ('draft', 'in_review', 'published', 'archived')
  ),
  CONSTRAINT conjugation_results_unique_variant UNIQUE (entry_id, form_id, result_normalized)
);

CREATE UNIQUE INDEX conjugation_results_one_preferred_per_entry_form
  ON public.conjugation_results (entry_id, form_id) WHERE is_preferred = true;
CREATE UNIQUE INDEX conjugation_results_import_key_unique ON public.conjugation_results (import_key)
  WHERE import_key IS NOT NULL;
CREATE INDEX conjugation_results_entry_id_idx ON public.conjugation_results (entry_id);
CREATE INDEX conjugation_results_form_id_idx ON public.conjugation_results (form_id);
CREATE INDEX conjugation_results_rule_id_idx ON public.conjugation_results (rule_id);
CREATE INDEX conjugation_results_status_idx ON public.conjugation_results (status);
CREATE INDEX conjugation_results_result_normalized_idx ON public.conjugation_results (result_normalized);
CREATE INDEX conjugation_results_result_normalized_trgm_idx ON public.conjugation_results
  USING gin (result_normalized extensions.gin_trgm_ops);

CREATE TABLE public.conjugation_result_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_key text,
  result_id uuid NOT NULL REFERENCES public.conjugation_results (id) ON DELETE CASCADE,
  step_order integer NOT NULL,
  before_form text NOT NULL,
  after_form text NOT NULL,
  operation_code text,
  applied_rule_id uuid REFERENCES public.conjugation_rules (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conjugation_result_steps_order_positive CHECK (step_order > 0),
  CONSTRAINT conjugation_result_steps_before_form_nonempty CHECK (pg_catalog.btrim(before_form) <> ''),
  CONSTRAINT conjugation_result_steps_after_form_nonempty CHECK (pg_catalog.btrim(after_form) <> ''),
  CONSTRAINT conjugation_result_steps_unique_order UNIQUE (result_id, step_order)
);

CREATE UNIQUE INDEX conjugation_result_steps_import_key_unique
  ON public.conjugation_result_steps (import_key) WHERE import_key IS NOT NULL;
CREATE INDEX conjugation_result_steps_result_id_idx ON public.conjugation_result_steps (result_id);
CREATE INDEX conjugation_result_steps_applied_rule_id_idx ON public.conjugation_result_steps (applied_rule_id);

CREATE TABLE public.conjugation_result_step_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_key text,
  step_id uuid NOT NULL REFERENCES public.conjugation_result_steps (id) ON DELETE CASCADE,
  locale text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  CONSTRAINT conjugation_result_step_translations_locale_check CHECK (locale IN ('en', 'zh', 'ja')),
  CONSTRAINT conjugation_result_step_translations_status_check CHECK (
    status IN ('draft', 'in_review', 'published', 'needs_revision')
  ),
  CONSTRAINT conjugation_result_step_translations_description_nonempty CHECK (btrim(description) <> ''),
  CONSTRAINT conjugation_result_step_translations_unique_locale UNIQUE (step_id, locale)
);

CREATE UNIQUE INDEX conjugation_result_step_translations_import_key_unique
  ON public.conjugation_result_step_translations (import_key) WHERE import_key IS NOT NULL;
CREATE INDEX conjugation_result_step_translations_step_id_idx
  ON public.conjugation_result_step_translations (step_id);

CREATE TABLE public.conjugation_examples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id uuid NOT NULL REFERENCES public.conjugation_results (id) ON DELETE CASCADE,
  example_id uuid NOT NULL REFERENCES public.examples (id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conjugation_examples_unique UNIQUE (result_id, example_id),
  CONSTRAINT conjugation_examples_display_order_positive CHECK (display_order > 0)
);

CREATE INDEX conjugation_examples_result_id_idx ON public.conjugation_examples (result_id);
CREATE INDEX conjugation_examples_example_id_idx ON public.conjugation_examples (example_id);

CREATE TRIGGER conjugation_forms_set_updated_at
  BEFORE UPDATE ON public.conjugation_forms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER conjugation_forms_01_sync_publication
  BEFORE INSERT OR UPDATE OF status ON public.conjugation_forms
  FOR EACH ROW EXECUTE FUNCTION public.sync_publication_timestamps();

CREATE TRIGGER conjugation_form_translations_set_updated_at
  BEFORE UPDATE ON public.conjugation_form_translations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER conjugation_form_translations_sync_publication
  BEFORE INSERT OR UPDATE OF status ON public.conjugation_form_translations
  FOR EACH ROW EXECUTE FUNCTION public.sync_publication_timestamps();

CREATE TRIGGER conjugation_rules_set_updated_at
  BEFORE UPDATE ON public.conjugation_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER conjugation_rules_01_sync_publication
  BEFORE INSERT OR UPDATE OF status ON public.conjugation_rules
  FOR EACH ROW EXECUTE FUNCTION public.sync_publication_timestamps();

CREATE TRIGGER conjugation_rule_translations_set_updated_at
  BEFORE UPDATE ON public.conjugation_rule_translations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER conjugation_rule_translations_sync_publication
  BEFORE INSERT OR UPDATE OF status ON public.conjugation_rule_translations
  FOR EACH ROW EXECUTE FUNCTION public.sync_publication_timestamps();

CREATE TRIGGER conjugation_results_set_updated_at
  BEFORE UPDATE ON public.conjugation_results
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER conjugation_results_01_sync_publication
  BEFORE INSERT OR UPDATE OF status ON public.conjugation_results
  FOR EACH ROW EXECUTE FUNCTION public.sync_publication_timestamps();

CREATE TRIGGER conjugation_result_steps_set_updated_at
  BEFORE UPDATE ON public.conjugation_result_steps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER conjugation_result_step_translations_set_updated_at
  BEFORE UPDATE ON public.conjugation_result_step_translations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER conjugation_result_step_translations_sync_publication
  BEFORE INSERT OR UPDATE OF status ON public.conjugation_result_step_translations
  FOR EACH ROW EXECUTE FUNCTION public.sync_publication_timestamps();
