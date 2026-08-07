-- Phase 6A: sound change rules, steps, links

CREATE TABLE public.sound_change_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_key text,
  slug text NOT NULL,
  category text NOT NULL,
  difficulty smallint,
  frequency smallint,
  input_pattern text,
  output_pattern text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  archived_at timestamptz,
  CONSTRAINT sound_change_rules_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT sound_change_rules_category_check CHECK (
    category IN (
      'liaison', 'nasalization', 'liquidization', 'tensification',
      'aspiration', 'h_changes', 'batchim', 'other'
    )
  ),
  CONSTRAINT sound_change_rules_difficulty_range CHECK (
    difficulty IS NULL OR (difficulty >= 1 AND difficulty <= 5)
  ),
  CONSTRAINT sound_change_rules_frequency_range CHECK (
    frequency IS NULL OR (frequency >= 1 AND frequency <= 5)
  ),
  CONSTRAINT sound_change_rules_status_check CHECK (
    status IN ('draft', 'in_review', 'published', 'archived')
  )
);

CREATE UNIQUE INDEX sound_change_rules_slug_unique ON public.sound_change_rules (slug);
CREATE UNIQUE INDEX sound_change_rules_import_key_unique ON public.sound_change_rules (import_key)
  WHERE import_key IS NOT NULL;
CREATE INDEX sound_change_rules_status_idx ON public.sound_change_rules (status);
CREATE INDEX sound_change_rules_category_idx ON public.sound_change_rules (category);

CREATE TABLE public.sound_change_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_key text,
  rule_id uuid NOT NULL REFERENCES public.sound_change_rules (id) ON DELETE CASCADE,
  locale text NOT NULL,
  name text NOT NULL,
  short_summary text,
  description text,
  conditions text,
  exceptions text,
  cautions text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  CONSTRAINT sound_change_translations_locale_check CHECK (locale IN ('en', 'zh', 'ja')),
  CONSTRAINT sound_change_translations_status_check CHECK (
    status IN ('draft', 'in_review', 'published', 'needs_revision')
  ),
  CONSTRAINT sound_change_translations_name_nonempty CHECK (btrim(name) <> ''),
  CONSTRAINT sound_change_translations_unique_locale UNIQUE (rule_id, locale)
);

CREATE UNIQUE INDEX sound_change_translations_import_key_unique
  ON public.sound_change_translations (import_key) WHERE import_key IS NOT NULL;
CREATE INDEX sound_change_translations_rule_id_idx ON public.sound_change_translations (rule_id);
CREATE INDEX sound_change_translations_locale_idx ON public.sound_change_translations (locale);
CREATE INDEX sound_change_translations_status_idx ON public.sound_change_translations (status);

CREATE TABLE public.sound_change_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_key text,
  rule_id uuid NOT NULL REFERENCES public.sound_change_rules (id) ON DELETE CASCADE,
  step_order integer NOT NULL,
  before_form text NOT NULL,
  after_form text NOT NULL,
  environment_pattern text,
  is_optional boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sound_change_steps_order_positive CHECK (step_order > 0),
  CONSTRAINT sound_change_steps_before_nonempty CHECK (btrim(before_form) <> ''),
  CONSTRAINT sound_change_steps_after_nonempty CHECK (btrim(after_form) <> ''),
  CONSTRAINT sound_change_steps_unique_order UNIQUE (rule_id, step_order)
);

CREATE UNIQUE INDEX sound_change_steps_import_key_unique ON public.sound_change_steps (import_key)
  WHERE import_key IS NOT NULL;
CREATE INDEX sound_change_steps_rule_id_idx ON public.sound_change_steps (rule_id);

CREATE TABLE public.sound_change_step_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_key text,
  step_id uuid NOT NULL REFERENCES public.sound_change_steps (id) ON DELETE CASCADE,
  locale text NOT NULL,
  label text,
  explanation text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  CONSTRAINT sound_change_step_translations_locale_check CHECK (locale IN ('en', 'zh', 'ja')),
  CONSTRAINT sound_change_step_translations_status_check CHECK (
    status IN ('draft', 'in_review', 'published', 'needs_revision')
  ),
  CONSTRAINT sound_change_step_translations_unique_locale UNIQUE (step_id, locale)
);

CREATE UNIQUE INDEX sound_change_step_translations_import_key_unique
  ON public.sound_change_step_translations (import_key) WHERE import_key IS NOT NULL;
CREATE INDEX sound_change_step_translations_step_id_idx
  ON public.sound_change_step_translations (step_id);

CREATE TABLE public.entry_sound_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.entries (id) ON DELETE CASCADE,
  rule_id uuid NOT NULL REFERENCES public.sound_change_rules (id) ON DELETE CASCADE,
  relation_type text NOT NULL,
  context_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT entry_sound_changes_type_check CHECK (
    relation_type IN ('applies_to', 'demonstrates', 'exception_to')
  ),
  CONSTRAINT entry_sound_changes_unique UNIQUE (entry_id, rule_id, relation_type)
);

CREATE INDEX entry_sound_changes_entry_id_idx ON public.entry_sound_changes (entry_id);
CREATE INDEX entry_sound_changes_rule_id_idx ON public.entry_sound_changes (rule_id);

CREATE TABLE public.sound_change_examples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL REFERENCES public.sound_change_rules (id) ON DELETE CASCADE,
  example_id uuid NOT NULL REFERENCES public.examples (id) ON DELETE CASCADE,
  step_id uuid REFERENCES public.sound_change_steps (id) ON DELETE SET NULL,
  display_order integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sound_change_examples_unique UNIQUE (rule_id, example_id),
  CONSTRAINT sound_change_examples_display_order_positive CHECK (display_order > 0)
);

CREATE INDEX sound_change_examples_rule_id_idx ON public.sound_change_examples (rule_id);
CREATE INDEX sound_change_examples_example_id_idx ON public.sound_change_examples (example_id);
CREATE INDEX sound_change_examples_step_id_idx ON public.sound_change_examples (step_id);

CREATE TABLE public.sound_change_rule_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_rule_id uuid NOT NULL REFERENCES public.sound_change_rules (id) ON DELETE CASCADE,
  target_rule_id uuid NOT NULL REFERENCES public.sound_change_rules (id) ON DELETE CASCADE,
  relation_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sound_change_rule_relations_no_self CHECK (source_rule_id <> target_rule_id),
  CONSTRAINT sound_change_rule_relations_type_check CHECK (
    relation_type IN ('related', 'confusable', 'see_also')
  ),
  CONSTRAINT sound_change_rule_relations_unique UNIQUE (
    source_rule_id, target_rule_id, relation_type
  )
);

CREATE INDEX sound_change_rule_relations_source_idx
  ON public.sound_change_rule_relations (source_rule_id);
CREATE INDEX sound_change_rule_relations_target_idx
  ON public.sound_change_rule_relations (target_rule_id);

CREATE OR REPLACE FUNCTION public.validate_sound_change_example_step()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_step_rule_id uuid;
BEGIN
  IF NEW.step_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT rule_id INTO v_step_rule_id FROM public.sound_change_steps WHERE id = NEW.step_id;
  IF v_step_rule_id IS NULL OR v_step_rule_id <> NEW.rule_id THEN
    RAISE EXCEPTION 'step_id must belong to the same rule_id';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER sound_change_examples_validate_step
  BEFORE INSERT OR UPDATE ON public.sound_change_examples
  FOR EACH ROW EXECUTE FUNCTION public.validate_sound_change_example_step();

CREATE TRIGGER sound_change_rules_set_updated_at
  BEFORE UPDATE ON public.sound_change_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER sound_change_rules_01_sync_publication
  BEFORE INSERT OR UPDATE OF status ON public.sound_change_rules
  FOR EACH ROW EXECUTE FUNCTION public.sync_publication_timestamps();

CREATE TRIGGER sound_change_translations_set_updated_at
  BEFORE UPDATE ON public.sound_change_translations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER sound_change_translations_sync_publication
  BEFORE INSERT OR UPDATE OF status ON public.sound_change_translations
  FOR EACH ROW EXECUTE FUNCTION public.sync_publication_timestamps();

CREATE TRIGGER sound_change_steps_set_updated_at
  BEFORE UPDATE ON public.sound_change_steps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER sound_change_step_translations_set_updated_at
  BEFORE UPDATE ON public.sound_change_step_translations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER sound_change_step_translations_sync_publication
  BEFORE INSERT OR UPDATE OF status ON public.sound_change_step_translations
  FOR EACH ROW EXECUTE FUNCTION public.sync_publication_timestamps();
